const axios = require('axios');
const FormData = require('form-data');

async function testAI() {
  const formData = new FormData();
  formData.append('message', 'Road kharab aahe. Khup pani santhale aahe.');
  formData.append('history', '[]');

  try {
    const response = await axios.post('http://localhost:5000/api/ai/atomic-chat', formData, {
      headers: formData.getHeaders()
    });
    console.log('--- TURN 1 (Greeting) ---');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      const history = [
        { type: 'user', text: 'Road kharab aahe. Khup pani santhale aahe.' },
        { type: 'bot', text: response.data.reply }
      ];

      const formData2 = new FormData();
      formData2.append('message', 'Ramesh Kulkarni');
      formData2.append('history', JSON.stringify(history));

      const response2 = await axios.post('http://localhost:5000/api/ai/chat', formData2, {
        headers: formData2.getHeaders()
      });
      console.log('\n--- TURN 2 (Name Provided) ---');
      console.log(JSON.stringify(response2.data, null, 2));
    }
  } catch (err) {
    console.error('Test Failed:', err.response ? err.response.data : err.message);
  }
}

testAI();
