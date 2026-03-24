const axios = require('axios');
const FormData = require('form-data');

async function runAudit() {
  const url = 'https://www.rahulkulmla.com/api/ai/chat';
  
  console.log('--- AUDIT START: Live Production Stress Test ---');

  try {
    // Turn 1: Greeting
    const fd1 = new FormData();
    fd1.append('message', 'नमस्कार, तुम्ही कोण आहात?');
    fd1.append('history', '[]');
    
    console.log('[T1] Sending Greeting...');
    const r1 = await axios.post(url, fd1, { headers: fd1.getHeaders() });
    console.log('[R1]:', r1.data.reply);

    // Turn 2: Complaint Start
    const history1 = [
      { type: 'user', text: 'नमस्कार, तुम्ही कोण आहात?' },
      { type: 'bot', text: r1.data.reply }
    ];
    const fd2 = new FormData();
    fd2.append('message', 'माझ्या गावात पाण्याची समस्या आहे.');
    fd2.append('history', JSON.stringify(history1));

    console.log('\n[T2] Reporting Water Problem...');
    const r2 = await axios.post(url, fd2, { headers: fd2.getHeaders() });
    console.log('[R2]:', r2.data.reply);

    // Turn 3: Name Provded
    const history2 = [
      ...history1,
      { type: 'user', text: 'माझ्या गावात पाण्याची समस्या आहे.' },
      { type: 'bot', text: r2.data.reply }
    ];
    const fd3 = new FormData();
    fd3.append('message', 'सुधीर मोरे');
    fd3.append('history', JSON.stringify(history2));

    console.log('\n[T3] Providing Name...');
    const r3 = await axios.post(url, fd3, { headers: fd3.getHeaders() });
    console.log('[R3]:', r3.data.reply);

    console.log('\n--- AUDIT COMPLETE: Flow Success ✅ ---');
  } catch (err) {
    console.error('\n--- AUDIT FAILED ❌ ---');
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

runAudit();
