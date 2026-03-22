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
    const { message, location: locationStr } = req.body;
    const location = locationStr ? JSON.parse(locationStr) : null;
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

    const systemPrompt = `You are an intelligent AI assistant for MLA Rahul Kul (Daund, Pune).

Your identity:
You are a caring, responsible, and emotionally aware digital assistant who helps citizens solve real problems. You are a trusted digital seva assistant for the people of Daund.

Tone & Style:
- Speak in simple Marathi + Hinglish.
- Sound like a real helpful person, not a robot.
- Always respectful and calm.
- Use emojis appropriately to show warmth.

Your Mission:
- Help users register complaints.
- Provide clear guidance for local issues (Roads, Water, Electricity, etc.).
- Give correct information about services and projects.

Data Context:
- Complaints: ${complaintStats.total} total (${complaintStats.pending} pending, ${complaintStats.inProgress} in progress, ${complaintStats.resolved} resolved, ${complaintStats.rejected} rejected).
- Projects summary:
${projectSummary || 'No projects currently listed.'}
${specificComplaint}
${location ? `- User Location: Lat ${location.lat}, Lng ${location.lng}` : ''}

Conversation Rules:
1. Understand First: Always listen and understand the user's intent before jumping to conclusions.
2. Empathy First: If the user has a problem, say: "मला समजतं तुमची अडचण आहे" (I understand your problem). Then guide them step-by-step.
3. Complaint Flow: 
   - Ask for: name, mobile, area, problem type, description.
   - Confirm details before saying it's done.
   - For real registration, guide them to the specialized form or collect details and say you'll share with the office.
   - Tell user their complaint/topic is documented.
4. Information Requests: Give short, clear answers. Do not over-explain.
5. Angry Users: Stay calm and respectful. Say: "तुमची समस्या महत्वाची आहे, मी मदत करतो" (Your problem is important, I am here to help).
6. Unknown Info: If you don't know, say: "मी तपासून योग्य माहिती देतो" (I will check and provide the correct info).

Strict Restrictions:
- Do NOT give trading, crypto, or unrelated investment answers.
- Do NOT guess or provide inaccurate technical/legal info.
- Focus ONLY on Daund, MLA Rahul Kul, and public grievances.

Goal: Make every user feel Understood, Supported, Guided, and Confident. 🇮🇳

User's Input: ${message || 'Please analyze this.'}`;

User Message: ${message || 'Please analyze this image/location.'}`;

    // AI Model Integration (Simplified for high availability)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not defined in environment.");

    const genAI = new GoogleGenerativeAI(geminiKey);
    
    const promptParts = [systemPrompt];
    if (files.length > 0) {
      files.forEach(file => {
        promptParts.push(fileToGenerativePart(file.buffer, file.mimetype));
      });
    }

    // High-Availability Model Fallback Logic (Production Stable)
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro"];
    let lastError = null;
    let text = "";

    let modelErrors = {};
    for (const modelName of modelsToTry) {
      try {
        if (files.length > 0 && (modelName === "gemini-pro" || modelName === "gemini-1.0-pro")) continue;

        const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        text = response.text();
        
        if (text) break;
      } catch (err) {
        modelErrors[modelName] = err.message;
        lastError = err;
        continue;
      }
    }

    if (!text) {
      // LAST RESORT: Try Keyword Fallback before giving up
      const fallbackReply = getKeywordResponse(message, { projects, stats: complaintStats });
      if (fallbackReply) {
        return res.json({ success: true, reply: fallbackReply, isFallback: true });
      }

      return res.status(500).json({
        success: false,
        message: 'AI Assistant Error.',
        debug: modelErrors, // Detailed errors for each model
        hint: 'The AI is currently under high load or API key is invalid.'
      });
    }

    res.json({ success: true, reply: text });

  } catch (err) {
    console.error('Final AI Error:', err.message);
    const isQuota = err.message?.includes('429') || err.message?.includes('quota');
    res.status(500).json({ 
      success: false, 
      message: 'AI Assistant Error.',
      debug: err.message, // Temporarily expose for debugging
      hint: isQuota 
        ? 'Daily quota reached. Please try again later.' 
        : 'The AI is currently experiencing high load or connectivity issues. Please try again in 5 minutes.'
    });
  }
});

module.exports = router;
