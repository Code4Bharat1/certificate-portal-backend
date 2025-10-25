// WhatsApp Service for Certificate Notifications
// File: server/services/whatsappService.js

import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

// SimplyWhatsApp Configuration
const SIMPLYWHATSAPP_API_URL = `${process.env.WHATSAPP_API_URL}`
const SIMPLYWHATSAPP_API_KEY = process.env.WHATSAPP_ACCESS_TOKEN;
const SIMPLYWHATSAPP_INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID;

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

/**
 * Generate 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send WhatsApp message using SimplyWhatsApp API
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    console.log('📱 Sending WhatsApp message...');
    
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const payload = {
      instance_id: SIMPLYWHATSAPP_INSTANCE_ID,
      access_token: SIMPLYWHATSAPP_API_KEY,
      number: formattedPhone,
      type: 'text',
      message
    };

    const response = await axios.post(SIMPLYWHATSAPP_API_URL, payload, {
      headers: {
        // 'Authorization': `Bearer 68822d48a7005`,
        // 'Authorization': `Bearer ${SIMPLYWHATSAPP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp API Response:', response.status);
    console.log('   Response data:', response.data);

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ WhatsApp Send Error:');
    if (error.response) console.error(error.response.data);
    else if (error.request) console.error('No response received', error.request);
    else console.error(error.message);

    return { success: false, error: error.message, details: error.response?.data || null };
  }
};


/**
 * Send OTP via WhatsApp
 */
export const sendOTPViaWhatsApp = async (phoneNumber, adminName = 'Admin') => {
  try {
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration (5 minutes)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(phoneNumber, { otp, expiresAt });

    // Create WhatsApp message
    const message = `
🔐 *OTP Verification*

Hello ${adminName},

Your OTP for certificate creation is:

*${otp}*

⏰ This OTP will expire in 5 minutes.

🔒 Do not share this OTP with anyone.

---
_Regards,_
*Nexcore Alliance & Code4Bharat*
    `.trim();

    // Send via WhatsApp
    const result = await sendWhatsAppMessage(phoneNumber, message);

    if (result.success) {
      // Auto-delete OTP after expiration
      setTimeout(() => {
        otpStore.delete(phoneNumber);
      }, 5 * 60 * 1000);

      return {
        success: true,
        message: 'OTP sent successfully via WhatsApp'
      };
    } else {
      return {
        success: false,
        message: result.error
      };
    }
  } catch (error) {
    console.error('Send OTP Error:', error);
    return {
      success: false,
      message: 'Failed to send OTP'
    };
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = (phoneNumber, otpCode) => {
  try {
    const storedData = otpStore.get(phoneNumber);
    
    if (!storedData) {
      return {
        success: false,
        message: 'OTP not found or expired'
      };
    }

    // Check expiration
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phoneNumber);
      return {
        success: false,
        message: 'OTP has expired'
      };
    }

    // Verify OTP
    if (storedData.otp !== otpCode) {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }

    // OTP verified successfully
    otpStore.delete(phoneNumber);
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return {
      success: false,
      message: 'Failed to verify OTP'
    };
  }
};

/**
 * Send Certificate Generation Success Message
 */
export const sendCertificateNotification = async (certificateData) => {
  try {
    const {
      userName,
      userPhone,
      certificateId,
      course,
      category,
      subCategory,
      batch,
      issueDate
    } = certificateData;

    // Certificate verification & download link
    const verificationLink = `${process.env.FRONTEND_URL}/verify/${certificateId}`;
    const downloadLink = `${process.env.FRONTEND_URL}/download/${certificateId}`;

    // Format category display
    let categoryDisplay = category.toUpperCase();
    if (subCategory) {
      categoryDisplay = `${categoryDisplay} (${subCategory.toUpperCase()})`;
    }

    // Create personalized WhatsApp message
    const message = `
🎉 *Congratulations!*

Hello ${userName},

Greetings from *Nexcore Alliance* & *Code4Bharat*! 🌟

We are pleased to inform you that your certificate has been successfully generated! 

📜 *Certificate Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
🆔 Certificate ID: *${certificateId}*
📚 Course: ${course}
🏷️ Category: ${categoryDisplay}
📅 Issue Date: ${new Date(issueDate).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}
${batch ? `🎓 Batch: ${batch}` : ''}

━━━━━━━━━━━━━━━━━━

🔗 *Verify Your Certificate:*
${verificationLink}

⬇️ *Download Your Certificate:*
${downloadLink}

✨ Keep this certificate safe as proof of your achievement!

📱 For any queries, feel free to reach out to us.

---
_With Best Wishes,_
*Nexcore Alliance Team*
*Code4Bharat Initiative*

💙 Keep Learning, Keep Growing!
    `.trim();

    // Send WhatsApp notification
    const result = await sendWhatsAppMessage(userPhone, message);
console.log(result);

    return result;
  } catch (error) {
    console.error('Certificate Notification Error:', error);
    return {
      success: false,
      error: 'Failed to send certificate notification'
    };
  }
};

/**
 * Send Bulk Certificate Completion Notification
 */
export const sendBulkCertificateNotification = async (adminPhone, adminName, stats) => {
  try {
    const { total, successful, failed } = stats;

    const message = `
📊 *Bulk Certificate Generation Complete*

Hello ${adminName},

Your bulk certificate generation process has been completed!

*Summary:*
━━━━━━━━━━━━━━━━━━
📁 Total Records: ${total}
✅ Successfully Created: ${successful}
❌ Failed: ${failed}
📈 Success Rate: ${((successful/total)*100).toFixed(1)}%
━━━━━━━━━━━━━━━━━━

${successful > 0 ? '🎉 Notifications have been sent to all recipients!' : ''}
${failed > 0 ? `⚠️ Please check the failed records and retry.` : ''}

---
_Nexcore Alliance & Code4Bharat_
    `.trim();

    const result = await sendWhatsAppMessage(adminPhone, message);
    return result;
  } catch (error) {
    console.error('Bulk Notification Error:', error);
    return {
      success: false,
      error: 'Failed to send bulk notification'
    };
  }
};

/**
 * Send Certificate Reminder
 */
export const sendCertificateReminder = async (userPhone, userName, certificateId) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/verify/${certificateId}`;

    const message = `
🔔 *Certificate Reminder*

Hello ${userName},

This is a reminder to download your certificate!

🆔 Certificate ID: *${certificateId}*

🔗 Verify & Download:
${verificationLink}

Don't forget to save it! 📥

---
_Nexcore Alliance & Code4Bharat_
    `.trim();

    const result = await sendWhatsAppMessage(userPhone, message);
    return result;
  } catch (error) {
    console.error('Reminder Error:', error);
    return {
      success: false,
      error: 'Failed to send reminder'
    };
  }
};

// Export all functions
export default {
  sendOTPViaWhatsApp,
  verifyOTP,
  sendCertificateNotification,
  sendBulkCertificateNotification,
  sendCertificateReminder,
  sendWhatsAppMessage,
  generateOTP
};