const axios = require('axios');
const FormData = require('form-data');

async function runMassiveAudit() {
  const API_URL = 'https://www.rahulkulmla.com/api/ai/atomic-chat';
  const queries = [
    "नमस्कार, तुम्ही कोण आहात?",
    "Filter plant band aahe, pani nahi yet.",
    "Road khup kharap aahe daund gavacha.",
    "आमदार राहुल कुल साहेबांचे संपर्क क्रमांक काय आहेत?",
    "माझ्या शेतात जाण्यासाठी रस्ता नाही.",
    "GRV-MN4E92XR-D412 show pending live stuts",
    "तक्रार कशी नोंदवायची?",
    "दौंडमधील चालू विकासकामे सांगा.",
    "विजेचा प्रश्न खूप गंभीर आहे.",
    "धन्यवाद, तुम्ही खूप मदत केली."
  ];

  console.log('--- MASSIVE PRODUCTION AUDIT START ---');
  let history = [];

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    console.log(`\n[T${i+1}] User: ${q}`);
    
    try {
      const fd = new FormData();
      fd.append('message', q);
      fd.append('history', JSON.stringify(history));
      
      const res = await axios.post(API_URL, fd, { 
        headers: fd.getHeaders(),
        timeout: 45000 
      });
      
      const reply = res.data.reply;
      console.log(`[R${i+1}] Bot: ${reply}`);
      
      history.push({ type: 'user', text: q });
      history.push({ type: 'bot', text: reply });
      
      // Limit history to keep prompts stable
      if (history.length > 6) history = history.slice(-6);

    } catch (err) {
      console.log(`[E${i+1}] Error: ${err.message}`);
    }
  }
  
  console.log('\n--- MASSIVE AUDIT COMPLETE ---');
}

runMassiveAudit();
