const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There isn't a direct listModels in the SDK for the genAI object usually, 
    // but we can try to hit the API or check common names.
    // Actually, usually we test a few known names.
    const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash-latest"];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Hi");
        console.log(`✅ Model ${m} is working!`);
      } catch (err) {
        console.log(`❌ Model ${m} failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

listModels();
