const axios = require('axios');

const questions = [
  "Good morning!",
  "तुमचे नाव काय आहे?",
  "माझ्या गावात पाण्याचा टँकर कधी येईल?",
  "रस्त्यावर खूप खड्डे आहेत, कोणाला सांगू?",
  "Who is Rahul Kul?",
  "How can I register a complaint?",
  "This AI is very slow and useless!",
  "आमच्या प्रभागात कचरा उचलला जात नाहीये.",
  "व्हॉट्सॲप नंबर काय आहे ऑफिसचा?",
  "Ok thank you.",
  "मला एका नवीन विकास कामाबद्दल विचारायचे आहे.",
  "तुमच्या ऑफिसची वेळ काय आहे?",
  "माझा तिकीट आयडी हरवला आहे, आता काय करू?",
  "जिल्हा परिषद शाळेचे काम कधी पूर्ण होईल?",
  "वीज गेली आहे, तातडीने मदत करा!",
  "मी राहुल कुल साहेबांना प्रत्यक्ष भेटू शकतो का?",
  "तक्रार केल्यावर किती दिवसात काम होते?",
  "तुम्ही खरंच माणूस आहात की रोबोट?",
  "दौंडमधील नवीन पुलाचे काम कुठे पर्यंत आले?",
  "Goodbye, talk to you later."
];

async function runAudit() {
  console.log("🚀 Starting AI Persona Stress Test...\n");
  
  for (const q of questions) {
    try {
      const res = await axios.post('http://localhost:5000/api/ai/atomic-chat', { message: q });
      console.log(`Citizen: "${q}"`);
      console.log(`Assistant: "${res.data.reply}"`);
      console.log(`Status: ${res.data.isFallback ? '⚠️ FALLBACK' : '✅ AI'}`);
      console.log("----------------------------------\n");
    } catch (err) {
      console.error(`❌ Error for "${q}":`, err.message);
    }
  }
}

runAudit();
