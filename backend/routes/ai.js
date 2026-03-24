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
    let specificComplaint = '';
    if (specificComplaintId) {
      try {
        const complaint = await Complaint.findOne({ complaintId: specificComplaintId.toUpperCase() }).lean();
        if (complaint) {
          specificComplaint = `\nSPECIFIC COMPLAINT FOUND:\n- ID: ${complaint.complaintId}\n- Status: ${complaint.status}\n- Department: ${complaint.department}`;
        }
      } catch (e) { /* ignore */ }
    }

    const projectSummary = projects.map(p => `- ${p.name}: Status: ${p.status}`).join('\n');

    return `You are a trusted digital seva assistant for MLA Rahul Kul (Daund).
Identity: Calm, respectful, empathetic. Language: Marathi + Hinglish.
Mission: Help register complaints and guide citizens.
Data: ${complaintStats.total} complaints (${complaintStats.resolved} resolved).
Recent Projects: ${projectSummary || 'Available on portal.'}
${specificComplaint}
${location ? `Location: ${location.lat}, ${location.lng}` : ''}`;
  } catch (err) {
    return "You are a trusted digital seva assistant for MLA Rahul Kul. Please help the citizen politely in Marathi/Hinglish.";
  }
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

    // FINAL ATTEMPT: Zero-History Single-Turn Fallback (bypasses safety/length blocks)
    if (!text) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
        const result = await model.generateContent(`${systemPrompt}\n\nCitizen's Message: ${message}\n\nResponse:`);
        const response = await result.response;
        text = response.text();
      } catch (err) { /* silent fail to keyword assistant */ }
    }

    if (!text) {
      const stats = { total: await Complaint.countDocuments({}), resolved: await Complaint.countDocuments({ status: 'Resolved' }) };
      const projects = await Project.find().limit(5).lean();
      const fallback = getKeywordResponse(message, { stats, projects });
      return res.json({ success: true, reply: fallback || "नमस्कार, मी सध्या व्यस्त आहे. कृपया थोड्या वेळाने प्रयत्न करा.", isFallback: true });
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

module.exports = router;
