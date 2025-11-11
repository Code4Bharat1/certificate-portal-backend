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

    // const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const payload = {
      instance_id: SIMPLYWHATSAPP_INSTANCE_ID,
      access_token: SIMPLYWHATSAPP_API_KEY,
      number: phoneNumber,
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
      batch,
      issueDate,
    } = certificateData;

    // 🔗 Determine correct base URL for verification/download
    let baseVerificationUrl = '';
    if (category?.toLowerCase().includes('code4bharat')) {
      baseVerificationUrl = 'https://education.code4bharat.com/verify-certificate';
    } else if (category?.toLowerCase().includes('marketing-junction')) {
      baseVerificationUrl = 'https://education.marketiqjunction.com/verify-certificate';
    } else if (
      category?.toLowerCase().includes('fsd') ||
      category?.toLowerCase().includes('bvoc') ||
      category?.toLowerCase().includes('bootchamp')
    ) {
      baseVerificationUrl = 'https://portal.nexcorealliance.com/verify-certificate';
    } else {
      // Default fallback if no match found
      baseVerificationUrl = `${process.env.FRONTEND_URL}/verify`;
    }

    // ✅ Final certificate links
    const verificationLink = `${baseVerificationUrl}`;
    const downloadLink = `${baseVerificationUrl}`;

    // Format category display
    let categoryDisplay = category?.toUpperCase() || 'N/A';
    // if (subCategory) {
    //   categoryDisplay = `${categoryDisplay} (${subCategory.toUpperCase()})`;
    // }

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
("+91 9892398976 ")
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
📈 Success Rate: ${((successful / total) * 100).toFixed(1)}%
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
 * Get professional message template based on letter type and subtype
 */
export const getLetterMessageTemplate = (letterType, subType, data) => {
  const {
    userName,
    category,
    batch,
    issueDate,
    letterId,
    organizationName = 'Nexcore Alliance',
  } = data;

  const formattedDate = new Date(issueDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Base verification URL based on category
  let baseUrl = '';
  if (category?.toLowerCase().includes('code4bharat')) {
    baseUrl = 'https://education.code4bharat.com';
  } else if (category?.toLowerCase().includes('marketing-junction')) {
    baseUrl = 'https://education.marketiqjunction.com';
  } else {
    baseUrl = 'https://portal.nexcorealliance.com';
  }

  const verificationLink = `${baseUrl}/verify-letter/${letterId}`;
  const downloadLink = `${baseUrl}/download-letter/${letterId}`;

  // Letter type specific messages
  const templates = {
    'Appreciation Letter': {
      'Appreciation for Best Performance': `
🌟 *Congratulations on Your Outstanding Achievement!*

Dear ${userName},

We are delighted to inform you that you have been recognized for your *exceptional performance*!

📜 *Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
🏆 Recognition: *Best Performance*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your dedication, hard work, and consistent excellence have set a benchmark for others. This achievement reflects your commitment to quality and professional growth.

🔗 *Verify Your Letter:*
${verificationLink}

⬇️ *Download Your Letter:*
${downloadLink}

Keep up the excellent work! We look forward to your continued success.

---
_With Pride & Best Wishes,_
*${organizationName} Team*
💼 Building Future Leaders
      `.trim(),

      'Appreciation for Consistent Performance': `
⭐ *Recognition for Your Consistent Excellence!*

Dear ${userName},

We are pleased to acknowledge your *consistent and reliable performance* throughout your tenure with us!

📜 *Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
🎯 Recognition: *Consistent Performance*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your steady commitment and reliable work ethic have been instrumental in maintaining high standards. Consistency is the key to greatness, and you have demonstrated this admirably.

🔗 *Verify Your Letter:*
${verificationLink}

⬇️ *Download Your Letter:*
${downloadLink}

Thank you for being a dependable team member!

---
_With Appreciation,_
*${organizationName} Team*
🌟 Excellence Through Consistency
      `.trim(),

      'Appreciation for Detecting Errors and Debugging': `
🔍 *Recognition for Your Technical Excellence!*

Dear ${userName},

We are impressed to recognize your *exceptional skills in error detection and debugging*!

📜 *Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
💻 Recognition: *Error Detection & Debugging*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your sharp analytical skills and attention to detail have saved countless hours and prevented potential issues. Your ability to identify and resolve complex problems is truly commendable.

🔗 *Verify Your Letter:*
${verificationLink}

⬇️ *Download Your Letter:*
${downloadLink}

Keep leveraging your problem-solving expertise!

---
_With Technical Admiration,_
*${organizationName} Team*
🐛 Making Code Better, One Bug at a Time
      `.trim(),

      'Appreciation for Outstanding Performance': `
🏆 *Congratulations on Your Exceptional Achievement!*

Dear ${userName},

We are thrilled to recognize your *outstanding performance* that has exceeded all expectations!

📜 *Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⭐ Recognition: *Outstanding Performance*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your exceptional contributions, innovative approach, and dedication have made a significant impact. You have consistently demonstrated excellence and set new standards of achievement.

🔗 *Verify Your Letter:*
${verificationLink}

⬇️ *Download Your Letter:*
${downloadLink}

We are proud to have you as part of our team!

---
_With Highest Regards,_
*${organizationName} Team*
🌟 Celebrating Excellence
      `.trim(),

      'Appreciation for Best Attendance': `
🎯 *Recognition for Your Exemplary Attendance!*

Dear ${userName},

We are pleased to acknowledge your *outstanding attendance record*!

📜 *Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
📅 Recognition: *Best Attendance*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your punctuality and regular presence demonstrate your commitment and professionalism. Consistency in attendance is a reflection of dedication, and you have set a wonderful example.

🔗 *Verify Your Letter:*
${verificationLink}

⬇️ *Download Your Letter:*
${downloadLink}

Thank you for your reliability and dedication!

---
_With Appreciation,_
*${organizationName} Team*
⏰ Punctuality is the Soul of Business
      `.trim(),
    },

    'Experience Certificate': {
      default: `
📄 *Your Experience Certificate is Ready!*

Dear ${userName},

We are pleased to provide you with your *Experience Certificate* acknowledging your valuable contribution to our organization.

📜 *Certificate Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
📋 Document: *Experience Certificate*
🆔 Certificate ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

This certificate validates your professional experience and contributions during your tenure with us. We wish you the very best in your future endeavors.

🔗 *Verify Your Certificate:*
${verificationLink}

⬇️ *Download Your Certificate:*
${downloadLink}

Best wishes for your career ahead!

---
_With Best Regards,_
*${organizationName} Team*
💼 Your Success is Our Pride
      `.trim(),
    },

    'Internship Joining Letter': {
      'Internship Joining Letter - Paid': `
🎉 *Welcome to Our Team - Paid Internship!*

Dear ${userName},

Congratulations! We are delighted to welcome you as a *Paid Intern* at ${organizationName}!

📜 *Joining Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
💼 Position: *Paid Intern*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

We are excited to have you on board! This internship will provide you with valuable industry experience, mentorship, and opportunities for professional growth.

🔗 *Verify Your Letter:*
${verificationLink}

⬇️ *Download Your Letter:*
${downloadLink}

📞 *Next Steps:*
Please review the terms and conditions in your joining letter and confirm your acceptance at your earliest convenience.

We look forward to working with you!

---
_Welcome Aboard!_
*${organizationName} Team*
🚀 Begin Your Journey to Success
      `.trim(),

      'Internship Joining Letter - Unpaid': `
🎉 *Welcome to Our Learning Community!*

Dear ${userName},

Congratulations! We are pleased to welcome you as an *Intern* at ${organizationName}!

📜 *Joining Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
📚 Position: *Intern*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

This internship offers you an excellent opportunity to gain practical experience, develop professional skills, and build your career foundation.

🔗 *Verify Your Letter:*
${verificationLink}

⬇️ *Download Your Letter:*
${downloadLink}

📞 *Next Steps:*
Please review the internship terms and confirm your acceptance. We're excited to support your learning journey!

---
_Welcome to the Team!_
*${organizationName} Team*
📖 Learn, Grow, Succeed
      `.trim(),
    },

    'Memo': {
      default: `
📋 *Important Official Memorandum*

Dear ${userName},

This is to inform you that an official memorandum has been issued regarding important organizational matters.

📜 *Memo Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
📄 Document: *Official Memo*
🆔 Memo ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Please review the memo carefully and take necessary actions as specified.

🔗 *View Memo:*
${verificationLink}

⬇️ *Download Memo:*
${downloadLink}

For any queries, please contact the administration.

---
_Official Communication,_
*${organizationName} Team*
📢 Stay Informed, Stay Connected
      `.trim(),
    },

    'Non-Disclosure Agreement': {
      default: `
🔒 *Non-Disclosure Agreement - Action Required*

Dear ${userName},

We are sending you an important *Non-Disclosure Agreement (NDA)* that requires your attention and acknowledgment.

📜 *NDA Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
📋 Document: *Non-Disclosure Agreement*
🆔 Document ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

This agreement ensures the protection of confidential information and intellectual property. Please review it carefully.

🔗 *View NDA:*
${verificationLink}

⬇️ *Download NDA:*
${downloadLink}

⚠️ *Action Required:*
Please review, sign, and return the acknowledgment copy at your earliest convenience.

---
_Confidentiality Matters,_
*${organizationName} Team*
🔐 Protecting What Matters
      `.trim(),
    },

    'Offer Letter': {
      default: `
🎊 *Congratulations - Job Offer Letter!*

Dear ${userName},

*Congratulations!* We are thrilled to extend you an offer to join ${organizationName}!

📜 *Offer Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
💼 Document: *Job Offer Letter*
🆔 Offer ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

We are excited to have you join our team! Your skills and experience make you an excellent fit for this role.

🔗 *View Offer Letter:*
${verificationLink}

⬇️ *Download Offer Letter:*
${downloadLink}

📞 *Next Steps:*
Please review the offer details and confirm your acceptance by the specified deadline. We look forward to welcoming you aboard!

---
_Excited to Have You!_
*${organizationName} Team*
🎯 Your Career, Our Commitment
      `.trim(),
    },

    'Promotion Letter': {
      default: `
🎉 *Congratulations on Your Well-Deserved Promotion!*

Dear ${userName},

We are delighted to inform you about your *promotion* in recognition of your outstanding contributions and dedication!

📜 *Promotion Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
🚀 Document: *Promotion Letter*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your hard work, leadership, and exceptional performance have earned you this advancement. We are confident you will excel in your new role!

🔗 *Verify Your Letter:*
${verificationLink}

⬇️ *Download Your Letter:*
${downloadLink}

Congratulations once again! We look forward to your continued success.

---
_With Pride & Congratulations,_
*${organizationName} Team*
📈 Growing Together, Succeeding Together
      `.trim(),
    },

    'Timeline Letter': {
      default: `
📅 *Important Timeline Information*

Dear ${userName},

We are sharing important timeline information regarding your program/project activities.

📜 *Timeline Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⏰ Document: *Timeline Letter*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Please review the timeline carefully and ensure you meet all scheduled deadlines and milestones.

🔗 *View Timeline:*
${verificationLink}

⬇️ *Download Timeline:*
${downloadLink}

⏰ Time management is key to success. Plan accordingly!

---
_Stay Organized,_
*${organizationName} Team*
📊 Plan. Execute. Succeed.
      `.trim(),
    },

    'Warning Letter': {
      'Warning for Incomplete Assignment/Project Submissions': `
⚠️ *Official Warning - Incomplete Submissions*

Dear ${userName},

This is an official warning regarding *incomplete assignment/project submissions*.

📜 *Warning Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⚠️ Subject: *Incomplete Submissions*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Timely completion and submission of assignments/projects is crucial for your learning and evaluation. Multiple instances of incomplete submissions have been noted.

🔗 *View Warning Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

🔴 *Action Required:*
Please ensure all pending work is completed immediately and maintain submission deadlines going forward. Continued non-compliance may result in further disciplinary action.

We believe in your potential and expect improvement.

---
_Academic/Professional Standards,_
*${organizationName} Team*
📝 Discipline Leads to Excellence
      `.trim(),

      'Warning for Low Attendance': `
⚠️ *Official Warning - Attendance Concern*

Dear ${userName},

This is an official warning regarding your *low attendance record*.

📜 *Warning Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⚠️ Subject: *Low Attendance*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Regular attendance is mandatory for successful completion of the program and your professional development. Your attendance has fallen below acceptable standards.

🔗 *View Warning Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

🔴 *Action Required:*
Immediate improvement in attendance is expected. Further absences without valid reasons may lead to serious consequences, including removal from the program.

Your presence matters for your own success.

---
_Attendance & Discipline,_
*${organizationName} Team*
⏰ Presence Builds Excellence
      `.trim(),

      'Warning for Misconduct or Disrespectful Behavior': `
⚠️ *Official Warning - Behavioral Concern*

Dear ${userName},

This is an official warning regarding *misconduct and disrespectful behavior*.

📜 *Warning Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⚠️ Subject: *Misconduct/Disrespectful Behavior*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Professional and respectful behavior is expected from all members at all times. Recent incidents of misconduct have been brought to our attention.

🔗 *View Warning Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

🔴 *Action Required:*
Any further instances of disrespectful behavior or misconduct will result in immediate disciplinary action, which may include termination/dismissal.

We expect professional conduct at all times.

---
_Code of Conduct,_
*${organizationName} Team*
🤝 Respect is Non-Negotiable
      `.trim(),

      'Warning for Unauthorized Absence from Training Sessions': `
⚠️ *Official Warning - Unauthorized Absence*

Dear ${userName},

This is an official warning regarding *unauthorized absence from training sessions*.

📜 *Warning Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⚠️ Subject: *Unauthorized Absence*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Attendance at all scheduled training sessions is mandatory. Unauthorized absences disrupt the learning process and show lack of commitment.

🔗 *View Warning Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

🔴 *Action Required:*
Ensure full attendance at all future sessions. Prior approval is required for any planned absence. Continued violations may lead to program termination.

Your commitment is essential for success.

---
_Training & Development,_
*${organizationName} Team*
📚 Learning Requires Presence
      `.trim(),

      'Warning Regarding Punctuality and Professional Discipline': `
⚠️ *Official Warning - Punctuality & Discipline*

Dear ${userName},

This is an official warning regarding *punctuality and professional discipline*.

📜 *Warning Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⚠️ Subject: *Punctuality & Discipline Issues*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Punctuality and professional discipline are fundamental expectations. Repeated instances of late arrivals and lack of discipline have been observed.

🔗 *View Warning Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

🔴 *Action Required:*
Immediate improvement in punctuality and adherence to professional standards is expected. Failure to comply will result in further disciplinary measures.

Time is respect. Discipline is success.

---
_Professional Standards,_
*${organizationName} Team*
⏱️ Punctuality Reflects Professionalism
      `.trim(),

      'Warning for Unauthorized Absence from Sessions': `
⚠️ *Official Warning - Unauthorized Absence*

Dear ${userName},

This is an official warning regarding *unauthorized absence from sessions*.

📜 *Warning Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⚠️ Subject: *Unauthorized Absence from Sessions*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Regular attendance at all scheduled sessions is mandatory. Your unauthorized absences affect your learning progress and overall performance.

🔗 *View Warning Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

🔴 *Action Required:*
Full attendance is required for all future sessions. Any absence must be pre-approved with valid reasons. Continued violations will lead to serious consequences.

Your dedication matters.

---
_Academic Integrity,_
*${organizationName} Team*
📖 Commitment to Learning
      `.trim(),

      'Warning for Punctuality and Discipline': `
⚠️ *Official Warning - Discipline Concern*

Dear ${userName},

This is an official warning regarding *punctuality and discipline issues*.

📜 *Warning Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⚠️ Subject: *Punctuality & Discipline*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Maintaining punctuality and discipline is essential for a productive learning environment. Your behavior has not met expected standards.

🔗 *View Warning Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

🔴 *Action Required:*
Immediate correction in behavior is expected. Adherence to time schedules and disciplinary norms is mandatory going forward.

Excellence begins with discipline.

---
_Standards of Excellence,_
*${organizationName} Team*
🎯 Discipline is the Bridge to Goals
      `.trim(),
    },

    'Committee Letter': {
      'Committee Member': `
🎖️ *Congratulations - Committee Member Appointment!*

Dear ${userName},

We are pleased to inform you that you have been appointed as a *Committee Member*!

📜 *Appointment Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
🏅 Position: *Committee Member*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your leadership qualities and dedication have been recognized. As a committee member, you will play a vital role in organizational activities and decision-making.

🔗 *View Appointment Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

We look forward to your valuable contributions!

---
_Leadership Team,_
*${organizationName} Team*
👥 Together We Lead
      `.trim(),

      'Committee President': `
👑 *Congratulations - Committee President Appointment!*

Dear ${userName},

We are honored to appoint you as the *Committee President*!

📜 *Appointment Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
🏆 Position: *Committee President*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your exceptional leadership skills, vision, and commitment have earned you this prestigious position. As President, you will lead the committee and represent the organization in key initiatives.

🔗 *View Appointment Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

We have full confidence in your leadership!

---
_Executive Leadership,_
*${organizationName} Team*
👑 Leading with Vision and Purpose
      `.trim(),

      'Committee Vice-President': `
🏅 *Congratulations - Committee Vice-President Appointment!*

Dear ${userName},

We are delighted to appoint you as the *Committee Vice-President*!

📜 *Appointment Letter Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
⭐ Position: *Committee Vice-President*
🆔 Letter ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Your proven leadership abilities and dedication make you an ideal choice for this important role. As Vice-President, you will support committee operations and lead key initiatives.

🔗 *View Appointment Letter:*
${verificationLink}

⬇️ *Download Letter:*
${downloadLink}

We look forward to your leadership!

---
_Senior Leadership,_
*${organizationName} Team*
🌟 Leading by Example
      `.trim(),
    },

    'Live Project Agreement': {
      default: `
🚀 *Live Project Agreement - Action Required*

Dear ${userName},

We are excited to inform you about the *Live Project Agreement* for your upcoming practical learning experience!

📜 *Agreement Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
💼 Document: *Live Project Agreement*
🆔 Agreement ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

This agreement outlines the terms, responsibilities, and expectations for your live project participation. Real-world experience awaits!

🔗 *View Agreement:*
${verificationLink}

⬇️ *Download Agreement:*
${downloadLink}

📞 *Next Steps:*
Please review the terms carefully and acknowledge your agreement. This is your opportunity to apply your learning in real scenarios!

---
_Practical Learning,_
*${organizationName} Team*
💡 Theory Meets Practice
      `.trim(),
    },

    'Other': {
      default: `
📄 *Official Document Ready*

Dear ${userName},

An official document has been generated for you.

📜 *Document Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
📋 Document Type: Official Letter
🆔 Document ID: ${letterId}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

Please review the document carefully.

🔗 *View Document:*
${verificationLink}

⬇️ *Download Document:*
${downloadLink}

For any queries, please contact administration.

---
_Official Communication,_
*${organizationName} Team*
📬 Your Documents, Our Priority
      `.trim(),
    },
  };

  // Get the template
  const typeTemplates = templates[letterType];
  if (!typeTemplates) {
    return templates['Other'].default;
  }

  // Get specific subtype or default
  return typeTemplates[subType] || typeTemplates.default || templates['Other'].default;
};

/**
 * Get parent notification template
 */
export const getParentNotificationTemplate = (letterType, subType, data) => {
  const {
    userName,
    parentName,
    category,
    batch,
    issueDate,
    letterId,
    organizationName = 'Nexcore Alliance',
  } = data;

  const formattedDate = new Date(issueDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Base verification URL based on category
  let baseUrl = '';
  if (category?.toLowerCase().includes('code4bharat')) {
    baseUrl = 'https://education.code4bharat.com';
  } else if (category?.toLowerCase().includes('marketing-junction')) {
    baseUrl = 'https://education.marketiqjunction.com';
  } else {
    baseUrl = 'https://portal.nexcorealliance.com';
  }

  const verificationLink = `${baseUrl}/verify-letter/${letterId}`;
  const downloadLink = `${baseUrl}/download-letter/${letterId}`;

  // Generic parent notification for all letter types
  const parentMessage = `
📢 *Important Update about ${userName}'s Academic Progress*

Dear ${parentName},

We are sending this notification regarding an official document issued to your ward, ${userName}.

📜 *Document Details:*
━━━━━━━━━━━━━━━━━━
👤 Student Name: ${userName}
📄 Document Type: ${letterType}${subType ? ` - ${subType}` : ''}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

As a parent/guardian of a BVOC student, we keep you informed about all official communications sent to your ward. Please review the document with your ward.

🔗 *View Document:*
${verificationLink}

⬇️ *Download Document:*
${downloadLink}

If you have any questions or concerns, please contact our administrative office.

---
_Parent Communication,_
*${organizationName} Team*
👨‍👩‍👧‍👦 Partners in Education
  `.trim();

  // Warning letters have a specific parent notification template
  if (letterType === 'Warning Letter') {
    return `
⚠️ *Important Notice: Academic/Behavioral Warning Issued*

Dear ${parentName},

This is to inform you that a warning letter has been issued to your ward, ${userName}, regarding ${subType?.replace('Warning for ', '') || 'academic/behavioral concerns'}.

📜 *Warning Details:*
━━━━━━━━━━━━━━━━━━
👤 Student Name: ${userName}
⚠️ Subject: ${subType?.replace('Warning for ', '') || 'Academic/Behavioral Warning'}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

We request your attention to this matter and your support in ensuring that your ward addresses these concerns promptly. Parental guidance is crucial at this stage.

🔗 *View Warning Letter:*
${verificationLink}

⬇️ *Download Warning Letter:*
${downloadLink}

Please discuss this matter with your ward and encourage improvement. Our team is available to provide any support needed.

---
_Parent Communication,_
*${organizationName} Team*
👨‍👩‍👧‍👦 Supporting Student Success Together
    `.trim();
  }

  // Appreciation letters have a positive parent notification template
  if (letterType === 'Appreciation Letter') {
    return `
🌟 *Good News: Your Ward Has Been Recognized!*

Dear ${parentName},

We are delighted to inform you that your ward, ${userName}, has received an appreciation letter for ${subType?.replace('Appreciation for ', '') || 'their outstanding efforts'}!

📜 *Recognition Details:*
━━━━━━━━━━━━━━━━━━
👤 Student Name: ${userName}
🏆 Recognition: ${subType?.replace('Appreciation for ', '') || 'Outstanding Achievement'}
🏷️ Category: ${category}
${batch ? `🎓 Batch: ${batch}` : ''}
📅 Issue Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━

We believe in recognizing and celebrating achievements of our students and sharing this proud moment with parents. Your support has contributed to your ward's success!

🔗 *View Appreciation Letter:*
${verificationLink}

⬇️ *Download Appreciation Letter:*
${downloadLink}

Congratulations to both you and your ward for this achievement!

---
_Parent Communication,_
*${organizationName} Team*
👨‍👩‍👧‍👦 Celebrating Student Success Together
    `.trim();
  }

  return parentMessage;
};

// Export as a single default object
export default {
  sendOTPViaWhatsApp,
  verifyOTP,
  sendCertificateNotification,
  sendBulkCertificateNotification,
  generateOTP,
  getLetterMessageTemplate,
  getParentNotificationTemplate,
  sendWhatsAppMessage,
};