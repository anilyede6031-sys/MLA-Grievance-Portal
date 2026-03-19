const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get('/config-check', async (req, res) => {
  let ping = 'pending';
  let authorizedModels = [];
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("Key missing");
    
    // 1. List Models to see what is actually available
    const listResponse = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
    authorizedModels = listResponse.data.models.map(m => m.name.replace('models/', ''));
    
    // 2. Try the first one that looks like Flash or Pro
    const bestModel = authorizedModels.find(m => m.includes('flash')) || authorizedModels[0];
    const pingResponse = await axios.post(`https://generativelanguage.googleapis.com/v1/models/${bestModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: "ping" }] }]
    });
    ping = `Success (${bestModel}): ` + pingResponse.data.candidates[0].content.parts[0].text.substring(0, 10);
  } catch (err) {
    ping = 'Error: ' + (err.response?.data?.error?.message || err.message);
  }
  
  res.json({
    success: true,
    implementation: "REST-Discovery-v1",
    hasKey: !!process.env.GEMINI_API_KEY,
    authorizedModels,
    ping
  });
});

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI configuration error.' });
    }

    const [projects, stats] = await Promise.all([
      Project.find().lean(),
      Complaint.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } }
          }
        }
      ])
    ]);

    let specificComplaint = '';
    const idMatch = message.match(/(GRV-[A-Z0-9-]+)/i);
    if (idMatch) {
      const complaint = await Complaint.findOne({ complaintId: idMatch[1].toUpperCase() }).lean();
      if (complaint) {
        specificComplaint = `\nSPECIFIC COMPLAINT FOUND:\n- ID: ${complaint.complaintId}\n- Status: ${complaint.status}\n- Department: ${complaint.department}\n- Filed on: ${new Date(complaint.createdAt).toLocaleDateString()}`;
      }
    }

    const complaintStats = stats[0] || { total: 0, pending: 0, resolved: 0 };
    const projectSummary = projects.map(p => `- ${p.name}: Budget ₹${p.budget} Cr, Status: ${p.status}`).join('\n');

    const systemPrompt = `You are the "Daund MLA Digital Assistant" (Rahul Kul's office). 
Data Context:
- Complaints: ${complaintStats.total} total, ${complaintStats.resolved} resolved.
- Projects:
${projectSummary || 'No projects.'}
${specificComplaint}

Instructions:
1. Respond in user's language (Marathi/English). 
2. Be professional and patriotic (🇮🇳).
3. Focus on Daund development/grievances.

User: ${message}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(systemPrompt);
    const reply = result.response.text();

    res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error('Gemini SDK Error:', err.message || err);
    res.status(500).json({ success: false, message: 'AI Assistant Error.' });
  }
});

module.exports = router;
