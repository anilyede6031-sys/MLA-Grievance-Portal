const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get('/config-check', async (req, res) => {
  let ping = 'pending';
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent("ping");
    ping = 'success: ' + result.response.text().substring(0, 10);
  } catch (err) {
    ping = 'error: ' + (err.message || 'Unknown error');
  }
  
  res.json({
    success: true,
    hasKey: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    ping
  });
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

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
        specificComplaint = `\nSPECIFIC COMPLAINT FOUND:
- ID: ${complaint.complaintId}
- Status: ${complaint.status}
- Department: ${complaint.department}
- Description: ${complaint.description}
- Filed on: ${new Date(complaint.createdAt).toLocaleDateString()}
`;
      } else {
        specificComplaint = `\nCOMPLAINT NOT FOUND: The user provided ID ${idMatch[1]} but it does not exist in our database.`;
      }
    }

    const complaintStats = stats[0] || { total: 0, pending: 0, resolved: 0 };
    const projectSummary = projects.map(p => `- ${p.name}: Budget ₹${p.budget} Cr, Status: ${p.status}`).join('\n');

    // 3. Construct System Prompt
    const systemPrompt = `
You are the "Daund MLA Digital Assistant", representing the office of MLA Rahul Kul. 
Your goal is to provide accurate, transparent, and helpful information to the citizens of Daund constituency.

DATA CONTEXT:
- Total Complaints received: ${complaintStats.total}
- Complaints Resolved: ${complaintStats.resolved}
- Active Complaints: ${complaintStats.pending}
- Current Projects In Daund:
${projectSummary || 'No active projects listed.'}
${specificComplaint}

INSTRUCTIONS:
1. Always respond in the language the user used (Marathi or English).
2. For complaints, encourage users to use the "File a Complaint" feature on the portal if they have new issues.
3. Be professional, patriotic (🇮🇳), and focused on Daund's development.
4. If asked about something outside Daund's development or grievances, politely redirect them.
5. Provide specific numbers (budgets, counts) from the DATA CONTEXT above when relevant.

User Message: ${message}
`;

    // 4. Call Gemini
    if (!process.env.GEMINI_API_KEY) {
      console.error('CRITICAL: GEMINI_API_KEY is missing from environment variables!');
      return res.status(500).json({ success: false, message: 'AI configuration error. Please check backend environment variables.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    res.json({
      success: true,
      reply: responseText
    });

  } catch (err) {
    console.error('Gemini AI Runtime Error:', err.message || err);
    res.status(500).json({ success: false, message: 'AI Assistant encountered an error. Please try again later.' });
  }
});

module.exports = router;
