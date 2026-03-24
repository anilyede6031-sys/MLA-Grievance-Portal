const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');
const AIChat = require('../models/AIChat');
const { authenticate } = require('../middleware/auth');
const { getKeywordResponse } = require('../utils/keywordAssistant');

const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Global initialization removed for per-request reliability

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    },
  };
}

// Shared System Prompt Logic
async function getFullSystemPrompt(location = null, specificComplaintId = null) {
  try {
    const [projects, total, pending, inProgress, resolved, rejected] = await Promise.all([
      Project.find().lean().catch(() => []),
      Complaint.countDocuments({}).catch(() => 0),
      Complaint.countDocuments({ status: 'Pending' }).catch(() => 0),
      Complaint.countDocuments({ status: 'In Progress' }).catch(() => 0),
      Complaint.countDocuments({ status: 'Resolved' }).catch(() => 0),
      Complaint.countDocuments({ status: 'Rejected' }).catch(() => 0)
    ]);

    const complaintStats = { total, pending, inProgress, resolved, rejected };
    const projectSummary = projects.map(p => `- ${p.name}: Status: ${p.status}`).join('\n');

    let specificComplaint = '';
    if (specificComplaintId) {
      try {
        const complaint = await Complaint.findOne({ complaintId: specificComplaintId.toUpperCase() }).lean();
        if (complaint) {
          specificComplaint = `\nSPECIFIC COMPLAINT STATUS:\n- ID: ${complaint.complaintId}\n- Status: ${complaint.status}\n- Subject: ${complaint.subject}`;
        }
      } catch (e) { /* ignore */ }
    }

    const currentYear = new Date().getFullYear();

    return `YOUR IDENTITY:
- You are a caring, responsible, and emotionally aware digital assistant (Seva Representative) for MLA Rahul Kul's office.
- You are NOT a robot; you are a helpful local person.

TONE & LANGUAGE:
- Always speak in simple MARATHI + HINGLISH mix.
- Be respectful, calm, and supportive (e.g., "काळजी करू नका", "हो नक्की, मदत करतो").
- Always acknowledge the user's feelings/problem FIRST before giving a solution.

CORE MISSION:
1. Help citizens register complaints.
2. Guide users for local issues (water, road, electricity, etc.).
3. Provide correct information about MLA schemes and work.

COMPLAINT REGISTRATION FLOW:
If a user wants to file a complaint, follow these steps ONE BY ONE:
1. Ask for Full Name
2. Ask for Mobile Number
3. Ask for Area / Village
4. Ask for Problem Type (Water / Road / Electricity / Other)
5. Ask for Problem Description
6. Confirm all details with the user: "ही माहिती बरोबर आहे का?"
7. Once confirmed, GENERATE a ticket ID in the format: DK-${currentYear}-XXXXX (replace XXXXX with 5 random digits).
8. Tell the user: "तुमची तक्रार नोंद झाली आहे. तुमचा ID आहे: [ID]"

HIDDEN REGISTRATION SIGNAL (CRITICAL):
If you generated a ticket ID (Step 7/8), you MUST append this EXACT line at the very end of your response:
$$$COMPLAINT_DATA:{"name":"...","mobile":"...","village":"...","dept":"...","desc":"...","id":"DK-${currentYear}-XXXXX"}###
- Map "dept" to one of: Road, Water, Electricity, Revenue, Police, Health, Education, Agriculture, Other.
- This line will be hidden from the citizen.

RULES:
- If a user is angry, stay calm and say: "मी समजतो तुम्ही त्रासात आहात, मी मदत करतो."
- If you don't know something, say: "मी तपासून योग्य माहिती देतो."
- NEVER mention crypto, trading, or unrelated topics.
- Keep answers short, clear, and focused.

PORTAL DATA:
- Stats: ${complaintStats.total} total complaints, ${complaintStats.resolved} resolved.
- Recent Projects: ${projectSummary || 'Available on portal.'}
${specificComplaint}
${location ? `Citizen Location: lat ${location.lat}, lng ${location.lng}` : ''}`;
  } catch (err) {
    return "You are a caring digital assistant for MLA Rahul Kul. Please help the citizen politely in Marathi/Hinglish.";
  }
}

// Helper to save chat turn
async function saveChatTurn(userId, userMsg, botMsg) {
  try {
    await AIChat.findOneAndUpdate(
      { userId },
      { 
        $push: { 
          messages: [
            { role: 'user', text: userMsg },
            { role: 'bot', text: botMsg }
          ] 
        },
        $set: { lastInteraction: new Date() }
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Error saving chat turn:', err);
  }
}

// GET history
router.get('/history', authenticate, async (req, res) => {
  try {
    const chat = await AIChat.findOne({ userId: req.user.id });
    res.json({ success: true, history: chat ? chat.messages : [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// Optional auth for atomic-chat to support both logged-in and guest users
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

router.post('/atomic-chat', upload.array('images'), optionalAuth, async (req, res) => {
  try {
    const { message, history: historyStr, location: locationStr } = req.body;
    const files = req.files || [];
    let history = [];
    if (historyStr) history = JSON.parse(historyStr);
    const location = locationStr ? JSON.parse(locationStr) : null;

    const idMatch = message.match(/(GRV-[A-Z0-9-]+)/i);
    const systemPrompt = await getFullSystemPrompt(location, idMatch ? idMatch[1] : null);

    // ATOMIC SINGLE-TURN SDK BRIDGE (v72)
    let flattenedPrompt = `${systemPrompt}\n\n`;
    if (history && history.length > 0) {
      flattenedPrompt += "--- PREVIOUS CONVERSATION ---\n";
      history.forEach(msg => {
        const roleName = (msg.type === 'user' || msg.role === 'user' || msg.type === 'Human') ? 'Citizen' : 'Seva Representative';
        if (msg.text) flattenedPrompt += `${roleName}: ${msg.text}\n`;
      });
      flattenedPrompt += "--- END HISTORY ---\n\n";
    }
    flattenedPrompt += `Citizen's Latest Message: ${message}\n\nSeva Representative's Response:`;

    const contents = [{ role: 'user', parts: [{ text: flattenedPrompt }] }];
    if (files.length > 0) {
      files.forEach(file => {
        contents[0].parts.push({
          inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') }
        });
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not defined.");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];
    let text = "";
    
    for (const modelName of modelsToTry) {
      try {
        if (files.length > 0 && modelName === "gemini-pro") continue;
        const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
        const result = await model.generateContent({ contents });
        const response = await result.response;
        text = response.text();
        if (text) break;
      } catch (err) { continue; }
    }

    // FINAL ATTEMPT: Zero-History Single-Turn Fallback (bypasses safety/length blocks)
    if (!text) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });
        const result = await model.generateContent(`${systemPrompt}\n\nCitizen's Message: ${message}\n\nResponse:`);
        const response = await result.response;
        text = response.text();
      } catch (err) { /* silent fail to keyword assistant */ }
    }

    if (!text) {
      const stats = { total: await Complaint.countDocuments({}), resolved: await Complaint.countDocuments({ status: 'Resolved' }) };
      const projects = await Project.find().limit(5).lean();
      
      let specificDetail = null;
      if (idMatch) {
         const comp = await Complaint.findOne({ complaintId: idMatch[1].toUpperCase() }).lean();
         if (comp) {
           specificDetail = `तक्रार क्रमांक ${comp.complaintId} सध्या '${comp.status}' स्थितीत आहे. (Status of ${comp.complaintId} is currently '${comp.status}')`;
         }
      }

      const fallback = getKeywordResponse(message, { stats, projects });
      const finalReply = specificDetail ? `${specificDetail}\n\n${fallback || ''}` : fallback;
      
      const replyText = finalReply || "नमस्कार! मी आपला डिजिटल सेवा प्रतिनिधी आहे. सध्या आमची एआय सिस्टिम (AI System) मेंटेनन्समध्ये आहे, पण काळजी करू नका, मी आपली मदत नक्कीच करेन. आपल्याला काय अडचण आहे ते कृपया सविस्तर सांगा. (AI is in maintenance, but I am here to help. Please describe your issue.)";
      if (req.user) await saveChatTurn(req.user.id, message, replyText);
      
      return res.json({ success: true, reply: replyText, isFallback: true });
    }

    if (text) {
      // POST-PROCESSING: Check for hidden registration signal
      const signalMatch = text.match(/\$\$\$COMPLAINT_DATA:(.*)###/s);
      if (signalMatch) {
        try {
          const rawJson = signalMatch[1].trim();
          const data = JSON.parse(rawJson);
          
          // Create real complaint record
          const newComplaint = new Complaint({
            complaintId: data.id || `DK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
            name: data.name || "AI Citizen",
            mobile: data.mobile || "0000000000",
            village: data.village || "Daund",
            taluka: "Daund", // Always Daund for this portal
            department: data.dept || "Other",
            description: data.desc || "Registered via AI Assistant",
            status: 'Pending'
          });
          
          await newComplaint.save();
          console.log(`[AI] Complaint registered automatically: ${newComplaint.complaintId}`);
          
          // Strip signal from final response
          text = text.replace(/\$\$\$COMPLAINT_DATA:.*###/s, '').trim();
        } catch (err) {
          console.error('[AI] Signal Parsing Error:', err.message);
        }
      }
    }

    if (req.user) await saveChatTurn(req.user.id, message, text);
    res.json({ success: true, reply: text });
  } catch (err) {
    console.error('Atomic AI Error:', err.message);
    res.status(500).json({ success: false, message: 'AI Error', debug: err.message });
  }
});

router.post('/chat', upload.array('files'), async (req, res) => {
  // Use same logic as atomic-chat for consistency
  const { message, history: historyStr, location: locationStr } = req.body;
  const files = req.files || [];
  let history = [];
  try {
    if (historyStr) history = JSON.parse(historyStr);
    const location = locationStr ? JSON.parse(locationStr) : null;
    const idMatch = message.match(/(GRV-[A-Z0-9-]+)/i);
    const systemPrompt = await getFullSystemPrompt(location, idMatch ? idMatch[1] : null);

    let flattenedPrompt = `${systemPrompt}\n\n`;
    if (history && history.length > 0) {
      flattenedPrompt += "--- PREVIOUS CONVERSATION ---\n";
      history.forEach(msg => {
        const roleName = (msg.type === 'user' || msg.role === 'user' || msg.type === 'Human') ? 'Citizen' : 'Seva Representative';
        if (msg.text) flattenedPrompt += `${roleName}: ${msg.text}\n`;
      });
      flattenedPrompt += "--- END HISTORY ---\n\n";
    }
    flattenedPrompt += `Citizen's Latest Message: ${message}\n\nSeva Representative's Response:`;

    const contents = [{ role: 'user', parts: [{ text: flattenedPrompt }] }];
    if (files.length > 0) {
      files.forEach(file => {
        contents[0].parts.push({
          inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') }
        });
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];
    let text = "";
    for (const modelName of modelsToTry) {
      try {
        if (files.length > 0 && modelName === "gemini-pro") continue;
        const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
        const result = await model.generateContent({ contents });
        const response = await result.response;
        text = response.text();
        if (text) break;
      } catch (err) { continue; }
    }
    if (!text) {
      const fallback = getKeywordResponse(message, {});
      const replyText = fallback || "नमस्कार! मी आपला डिजिटल सेवा प्रतिनिधी आहे. सध्या आमची एआय सिस्टिम (AI System) मेंटेनन्समध्ये आहे, पण काळजी करू नका, मी आपली मदत नक्कीच करेन. आपल्याला काय अडचण आहे ते कृपया सविस्तर सांगा. (AI is in maintenance, but I am here to help. Please describe your issue.)";
      return res.json({ success: true, reply: replyText, isFallback: true });
    }
    res.json({ success: true, reply: text });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI Error', debug: err.message });
  }
});

module.exports = router;
