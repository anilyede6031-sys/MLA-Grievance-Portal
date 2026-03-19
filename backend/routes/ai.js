const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
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
4. No Hallucinations: If data is missing, NEVER say "I don't know." Instead say: "या विषयावर माझ्याकडे सध्या पूर्ण माहिती नाही, पण मी साहेबांच्या कानावर हा विषय नक्की घालतो. कृपया आपला संपर्क क्रमांक द्या जेणेकरून आम्ही आपल्याला कळवू शकू."
5. Professional & Patriotic: Be respectful to all. Use 🇮🇳. End with: "दौंडच्या विकासात आपला सहभाग महत्त्वाचा आहे. धन्यवाद!"

User Message: ${message}`;

    // AI Model Integration (Version: Daund-Vikas-Mitra-2.0-Final)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from AI engine.');
    }

    res.json({
      success: true,
      reply: text
    });

  } catch (err) {
    console.error('Gemini SDK Error:', err.message || err);
    res.status(500).json({ 
      success: false, 
      message: 'AI Assistant Error.',
      hint: 'Please check your API quota or safety settings.' 
    });
  }
});

module.exports = router;
