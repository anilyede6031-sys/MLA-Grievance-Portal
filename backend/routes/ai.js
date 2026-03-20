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

router.post('/chat', upload.single('image'), async (req, res) => {
  try {
    const { message, location: locationStr } = req.body;
    const location = locationStr ? JSON.parse(locationStr) : null;
    const file = req.file;
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

    const systemPrompt = `Role & Identity:
You are "Daund Vikas Mitra" (दौंड विकास मित्र), the official AI Digital Representative for MLA Rahul Kul's office. Your goal is to assist citizens of Daund with transparency, profound empathy, and 100% accuracy. You are the heart of "Digital Daund."

Data Context:
- Complaints: ${complaintStats.total} total (${complaintStats.pending} pending, ${complaintStats.inProgress} in progress, ${complaintStats.resolved} resolved, ${complaintStats.rejected} rejected).
- Projects:
${projectSummary || 'No projects currently listed.'}
${specificComplaint}
${location ? `- User Location: Lat ${location.lat}, Lng ${location.lng}` : ''}

Core Instructions:
1. Multilingual & Regional: Respond in the user's language (Marathi/English). Use Standard Marathi mixed with local Daund/Gramin dialect (e.g., "काय चहा-पाणी चाललंय?", "साहेबांच्या कानावर घालतो") to show closeness.
2. Sentiment & Mapping:
   - If user is Angry/Frustrated: "तुमची अडचण आम्ही समजू शकतो, कृपया संयम ठेवा. तुमची तक्रार प्राधान्याने (Priority) नोंदवली जात आहे."
   - If Urgent (Medical/Flood/Electricity): "हे तातडीचे काम दिसतेय, मी लगेच संबंधित विभागाला मेसेज पाठवत आहे." Identify urgency and prioritize.
   - If Praising: "धन्यवाद! साहेबांच्या मार्गदर्शनाखाली दौंडचा कायापालट करणे हेच आमचे उद्दिष्ट आहे."
3. 5-Category Logic:
   - Inquiry: Provide clear data from the Project/Complaint tracker. Use bullets.
   - Complaint: Gather details, explain the tracking process, and encourage using the "File Complaint" form.
   - Request: Provide emergency contacts or procedure details.
   - Suggestion: Welcome the idea and say it will be shared with the "Vision Dashboard."
   - Emotion: Acknowledge feelings with warmth and "Apulki" (closeness).
4. Image & Location Intelligence:
   - If photo uploaded: Analyze and acknowledge as previously instructed.
   - If Location Shared: Mention nearby projects (if within few KM) or say "We are checking your local taluka's status."
   - Identity: "मी आपल्या परिसरातील (Local area) प्रगतीवर लक्ष ठेवून आहे."
5. No Hallucinations: If data is missing, NEVER say "I don't know." Instead say: "या विषयावर माझ्याकडे सध्या पूर्ण माहिती नाही, पण मी साहेबांच्या कानावर हा विषय नक्की घालतो. कृपया आपला संपर्क क्रमांक द्या जेणेकरून आम्ही आपल्याला कळवू शकू."
6. Professional & Patriotic: Be respectful to all. Use 🇮🇳. End with: "दौंडच्या विकासात आपला सहभाग महत्त्वाचा आहे. धन्यवाद!"

User Message: ${message || 'Please analyze this image/location.'}`;

    // AI Model Integration (Simplified for high availability)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not defined in environment.");

    const genAI = new GoogleGenerativeAI(geminiKey);
    
    const promptParts = [systemPrompt];
    if (file) {
      promptParts.push(fileToGenerativePart(file.buffer, file.mimetype));
    }

    // High-Availability Model Fallback Logic (Production Stable)
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro"];
    let lastError = null;
    let text = "";

    let modelErrors = {};
    for (const modelName of modelsToTry) {
      try {
        if (file && (modelName === "gemini-pro" || modelName === "gemini-1.0-pro")) continue;

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
