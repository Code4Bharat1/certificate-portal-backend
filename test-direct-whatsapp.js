import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function testDirectWhatsApp() {
  console.log('=== Testing Direct WhatsApp API ===\n');
  
  // ✅ Check environment variables
  const apiKey = process.env.SIMPLYWHATSAPP_API_KEY;
  const instanceId = process.env.SIMPLYWHATSAPP_INSTANCE_ID;
  const apiUrl = process.env.SIMPLYWHATSAPP_API_URL;
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;

  console.log('1. Environment Variables:');
  console.log('   API Key:', apiKey ? '✅ Present' : '❌ Missing');
  console.log('   Instance ID:', instanceId ? '✅ Present' : '❌ Missing');
  console.log('   Admin Phone:', adminPhone || '❌ Missing');
  console.log('');

  // 2️⃣ Test API call
  console.log('2. Sending Test Message...');
  
  try {
    const response = await axios.post(
      apiUrl,
      {
        instance_id: instanceId,
        number: adminPhone,
        type: 'text',
        access_token: apiKey,  
        message: '🧪 Test message from Node.js (ES6)! WhatsApp integration is working!'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Success!');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('\n✅ Check your WhatsApp for the test message!');
  } catch (error) {
    console.log('❌ Error!');
    if (error.response) {
      console.log('Status Code:', error.response.status);
      console.log('Error Message:', error.response.data?.message);
      console.log('Full Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

// Run the test
testDirectWhatsApp();
