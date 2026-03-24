const axios = require('axios');
const FormData = require('form-data');

async function runAudit() {
  const API_URL = 'https://www.rahulkulmla.com/api/ai/atomic-chat';
  
  console.log('--- AUDIT START: Live Production Stress Test ---');

  try {
    // Turn 1: Filter Plant Query
    const fd1 = new FormData();
    fd1.append('message', 'Filter plant band aahe.');
    fd1.append('history', '[]');
    
    console.log('[T1] Sending Filter Plant Query...');
    const r1 = await axios.post(API_URL, fd1, { headers: fd1.getHeaders() });
    console.log('[R1]:', r1.data.reply);

    // Turn 2: Complaint Start
    const history1 = [
      { type: 'user', text: 'नमस्कार, तुम्ही कोण आहात?' },
      { type: 'bot', text: r1.data.reply }
    ];
    const fd2 = new FormData();
    fd2.append('message', 'daund');
    fd2.append('history', JSON.stringify(history1));

    console.log('\n[T2] Reporting Water Problem...');
    const r2 = await axios.post(API_URL, fd2, { headers: fd2.getHeaders() });
    console.log('[R2]:', r2.data.reply);

    // Turn 3: Name Provded
    const history2 = [
      ...history1,
      { type: 'user', text: 'माझ्या गावात पाण्याची समस्या आहे.' },
      { type: 'bot', text: r2.data.reply }
    ];
    console.log('\n[T3] Providing Standalone GRV ID...');
    const fd3 = new FormData();
    fd3.append('message', 'GRV-MN4E92XR-D412');
    fd3.append('history', JSON.stringify(history2));
    const r3 = await axios.post(API_URL, fd3, { headers: fd3.getHeaders() });
    console.log('[R3]:', r3.data.reply);
    if (r3.data.debug) console.log('[D3] Debug:', r3.data.debug);

    console.log('\n--- AUDIT COMPLETE: SUCCESS ✅ ---');
  } catch (err) {
    console.log('\n--- AUDIT FAILED ❌ ---');
    console.log('Error:', err.response ? err.response.data : err.message);
    if (err.response && err.response.data && err.response.data.modelErrors) console.log('Model Errors:', err.response.data.modelErrors);
  }
}

runAudit();
