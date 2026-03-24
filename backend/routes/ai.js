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

router.post('/chat', upload.array('images', 5), async (req, res) => {
  try {
    const { message, history: historyStr, location: locationStr } = req.body;
    const location = locationStr ? JSON.parse(locationStr) : null;
    const history = historyStr ? JSON.parse(historyStr) : [];
    const files = req.files || []; // Multiple files
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI configuration error.' });
    }

    const [projects, total, pending, inProgress, resolved, rejected] = await Promise.all([
      Project.find().lean(),
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Rejected' })
    ]);

    const complaintStats = { total, pending, inProgress, resolved, rejected };

    let specificComplaint = '';
    const idMatch = message.match(/(GRV-[A-Z0-9-]+)/i);
    if (idMatch) {
      const complaint = await Complaint.findOne({ complaintId: idMatch[1].toUpperCase() }).lean();
      if (complaint) {
        specificComplaint = `\nSPECIFIC COMPLAINT FOUND:\n- ID: ${complaint.complaintId}\n- Status: ${complaint.status}\n- Department: ${complaint.department}\n- Filed on: ${new Date(complaint.createdAt).toLocaleDateString()}`;
      }
    }

    const projectSummary = projects.map(p => `- ${p.name}: Budget ₹${p.budget} Cr, Status: ${p.status}, Dept: ${p.department}`).join('\n');

    const systemPrompt = `You are not just a chatbot. You are a trusted digital seva assistant for MLA Rahul Kul (Daund), representing the office to help citizens with real-life problems.

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
   - Example: "मला समजतं तुमची अडचण आहे", "तुमची समस्या महत्वाची आहे", "मी तुमच्यासोबत आहे".
STEP 3: SMART ACTION
   A) COMPLAINT FLOW:
      1. Collect: Full Name, Mobile, Village, Problem Type (Water/Road/Electricity/Other), Description.
      2. Step-by-step: Don't ask all at once.
      3. Confirm: Ask "ही माहिती बरोबर आहे का?" (Is this info correct?).
      4. After confirmation: Generate ticket ID style: DK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}.
      5. Say: "तुमची तक्रार नोंद झाली आहे. तुमचा ID आहे: [ID]".
   B) INFORMATION: Give short, clear, structured answers. No over-explaining.
   C) ANGRY USER: Stay calm. Say: "मी समजतो तुम्ही त्रासात आहात, मी मदत करतो".
   D) STATUS CHECK: Ask for ticket ID; check stats context.

SAFETY RULES:
- Never give assumed or wrong info. If unsure: "मी तपासून योग्य माहिती देतो".
- Never answer unrelated topics like trading, crypto, or investment.
- Prioritize clarity over complexity.

DATA CONTEXT:
- Total Complaints: ${complaintStats.total} (${complaintStats.resolved} resolved).
- Active Projects:
${projectSummary || 'No specific projects listed.'}
${specificComplaint}
${location ? `- Current User Location: Lat ${location.lat}, Lng ${location.lng}` : ''}

Goal: Make user feel Heard, Respected, Supported, and Confident. 🇮🇳`;

    // AI Model Integration
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not defined in environment.");

    const genAI = new GoogleGenerativeAI(geminiKey);
    
    // ATOMIC SINGLE-TURN SDK BRIDGE (v70)
    // We flatten history and use the official SDK for a single-shot request.
    // This is the most reliable way to handle Gemini across regions.
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

    const contents = [{
      role: 'user',
      parts: [{ text: flattenedPrompt }]
    }];

    // Add files if any
    if (files.length > 0) {
      files.forEach(file => {
        contents[0].parts.push({
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString('base64'),
          }
        });
      });
    }

    // High-Availability Model Fallback Logic (SDK version)
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro"];
    let text = "";
    let modelErrors = {};

    for (const modelName of modelsToTry) {
      try {
        if (files.length > 0 && modelName === "gemini-pro") continue; 

        const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
        const result = await model.generateContent({ contents });
        const response = await result.response;
        text = response.text();
        
        if (text) break;
      } catch (err) {
        modelErrors[modelName] = err.message;
        continue;
      }
    }

    if (!text) {
      const fallbackReply = getKeywordResponse(message, { projects, stats: complaintStats });
      if (fallbackReply) return res.json({ success: true, reply: fallbackReply, isFallback: true });

      return res.status(500).json({
        success: false,
        message: 'AI Assistant Error.',
        debug: modelErrors,
        hint: 'Standard model availability issues or quota reached.'
      });
    }

    res.json({ success: true, reply: text });

  } catch (err) {
    console.error('Final AI Error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'AI Assistant Error.',
      debug: err.message,
      hint: 'The AI is currently experiencing high load or connectivity issues.'
    });
  }
});

module.exports = router;
