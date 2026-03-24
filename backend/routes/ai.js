const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');
const { getKeywordResponse } = require('../utils/keywordAssistant');

const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Global initialization removed for per-request reliability

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
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
  const [projects, total, pending, inProgress, resolved, rejected] = await Promise.all([
    Project.find().lean().catch(() => []),
    Complaint.countDocuments({}),
    Complaint.countDocuments({ status: 'Pending' }),
    Complaint.countDocuments({ status: 'In Progress' }),
    Complaint.countDocuments({ status: 'Resolved' }),
    Complaint.countDocuments({ status: 'Rejected' })
  ]);

  const complaintStats = { total, pending, inProgress, resolved, rejected };
  let specificComplaint = '';
  if (specificComplaintId) {
    const complaint = await Complaint.findOne({ complaintId: specificComplaintId.toUpperCase() }).lean();
    if (complaint) {
      specificComplaint = `\nSPECIFIC COMPLAINT FOUND:\n- ID: ${complaint.complaintId}\n- Status: ${complaint.status}\n- Department: ${complaint.department}\n- Filed on: ${new Date(complaint.createdAt).toLocaleDateString()}`;
    }
  }

  const projectSummary = projects.map(p => `- ${p.name}: Budget ₹${p.budget} Cr, Status: ${p.status}, Dept: ${p.department}`).join('\n');

  return `You are not just a chatbot. You are a trusted digital seva assistant for MLA Rahul Kul (Daund), representing the office to help citizens with real-life problems.

Your Identity & Personality:
- Calm, respectful, emotionally intelligent.
- Speak like a helpful local person. Always supportive, never robotic.
- Always reply in a simple Marathi + Hinglish mix.
- Use natural human phrases: "हो नक्की, मी मदत करतो", "काळजी करू नका", "मी तुमची समस्या समजतो".
- Keep responses short, clear, and practical.

CORE MISSION:
1. Help users register complaints properly.
2. Guide citizens for local issues (water, road, electricity, schemes).
3. Provide correct and structured information.
4. Act like a bridge between people and the MLA office.

INTELLIGENT FLOW SYSTEM:
STEP 1: UNDERSTAND USER INTENT (Complaint, Information, Contact, or Urgent).
STEP 2: EMOTIONAL RESPONSE FIRST. Acknowledge user feelings before solution.
STEP 3: SMART ACTION
   A) COMPLAINT FLOW: Step-by-step collect: Name, Mobile, Village, Type, Description. Confirm before generating ticket.
   B) INFORMATION: Short, clear, structured answers.
   C) ANGRY USER: Stay calm and empathetic.

DATA CONTEXT:
- Total Complaints: ${complaintStats.total} (${complaintStats.resolved} resolved).
- Active Projects:
${projectSummary || 'No specific projects listed.'}
${specificComplaint}
${location ? `- Current User Location: Lat ${location.lat}, Lng ${location.lng}` : ''}

Goal: Make user feel Heard, Respected, Supported, and Confident. 🇮🇳`;
}

router.post('/atomic-chat', upload.array('files'), async (req, res) => {
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
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro"];
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
      return res.json({ success: true, reply: fallback || "नमस्कार, मी सध्या व्यस्त आहे. कृपया थोड्या वेळाने प्रयत्न करा." });
    }

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
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro"];
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
      return res.json({ success: true, reply: fallback || "नमस्कार, मी सध्या व्यस्त आहे.", isFallback: true });
    }
    res.json({ success: true, reply: text });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI Error', debug: err.message });
  }
});
});

module.exports = router;
