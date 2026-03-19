const express = require('express');
const router = express.Router();
const axios = require('axios');
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');

const GEMINI_REST_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

router.get('/config-check', async (req, res) => {
  let results = {};
  const endpoints = [
    { v: 'v1', m: 'gemini-1.5-flash' },
    { v: 'v1', m: 'gemini-1.5-flash-latest' },
    { v: 'v1beta', m: 'gemini-1.5-flash' },
    { v: 'v1', m: 'gemini-pro' }
  ];

  for (const ep of endpoints) {
    try {
      const url = `https://generativelanguage.googleapis.com/${ep.v}/models/${ep.m}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: "ping" }] }]
      });
      results[`${ep.v}-${ep.m}`] = 'Success: ' + response.data.candidates[0].content.parts[0].text.substring(0, 10);
    } catch (err) {
      results[`${ep.v}-${ep.m}`] = 'Error: ' + (err.response?.status || err.message);
    }
  }
  
  res.json({
    success: true,
    implementation: "Multi-Probe-REST",
    hasKey: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    results
  });
});

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'AI configuration error.' });
    }

    // 1. Fetch General Context
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

    // 2. Deterministic Complaint ID Tracking
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

    // 3. Call Gemini REST
    const response = await axios.post(`${GEMINI_REST_URL}?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error('Gemini REST Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'AI Assistant Error.' });
  }
});

module.exports = router;
