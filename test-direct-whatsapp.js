import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function testDirectWhatsApp() {
  
  // ✅ Check environment variables
  const apiKey = process.env.SIMPLYWHATSAPP_API_KEY;
  const instanceId = process.env.SIMPLYWHATSAPP_INSTANCE_ID;
  const apiUrl = process.env.SIMPLYWHATSAPP_API_URL;
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;

  // console.log('   API Key:', apiKey ? '✅ Present' : '❌ Missing');
  // console.log('   Instance ID:', instanceId ? '✅ Present' : '❌ Missing');
  // console.log('   Admin Phone:', adminPhone || '❌ Missing');


  // 2️⃣ Test API call
  
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

  } catch (error) {
    if (error.response) {
      
    } else {
      // console.log('Network Error:', error.message);
    }
  }
}

// Run the test
testDirectWhatsApp();
