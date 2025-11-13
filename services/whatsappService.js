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
    credentialId,
    letterId,
    organizationName = 'Nexcore Alliance',
  } = data;
  
  // Use credentialId if available, otherwise fallback to letterId
  const finalId = credentialId || letterId;

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

  const verificationLink = `${baseUrl}/verify-certificate/`;
  const downloadLink = `${baseUrl}/verify-certificate/`;

  // Get Terms & Conditions link based on category
  const getTermsLink = () => {
    if (category?.toLowerCase().includes('fsd') || 
        // category?.toLowerCase().includes('bvoc') || 
        category?.toLowerCase().includes('dm')) {
      return 'https://forms.gle/FSD_DM_FORM_LINK'; // Replace with actual FSD/DM form link
    } else if (category?.toLowerCase().includes('marketing') || 
               category?.toLowerCase().includes('mj') || 
               category?.toLowerCase().includes('code4bharat') || 
               category?.toLowerCase().includes('c4b')) {
      return '${baseUrl}/termsandconditions/C4B'; // Replace with actual MJ/C4B form link
    } else {
      return 'https://forms.gle/HR_OPS_FORM_LINK'; // Replace with actual HR/Operations form link
    }
  };

  // Letter type specific messages
  const templates = {
    'Appreciation Letter': {
      'Appreciation for Best Performance': `
╔═══════════════════════════╗
   🏆 *EXCELLENCE RECOGNIZED* 🏆
╚═══════════════════════════╝

Dear *${userName}*,

We are delighted to recognize your *exceptional performance* that has set new benchmarks of excellence!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *RECOGNITION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Recipient:* ${userName}
🎖️ *Achievement:* Best Performance
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
💡 *YOUR ACHIEVEMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your unwavering dedication, consistent excellence, and outstanding contributions have distinguished you among your peers. This recognition reflects your commitment to quality, innovation, and professional growth.

You have not only met expectations but exceeded them remarkably, setting a gold standard for others to aspire to.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Keep up the exceptional work! Your journey of excellence continues to inspire us all.

*With Pride & Highest Regards,*
_${organizationName} Team_
🌟 *Celebrating Excellence, Inspiring Greatness*

📞 *Support:* +91 9892398976
      `.trim(),

      'Appreciation for Consistent Performance': `
╔═══════════════════════════╗
   ⭐ *CONSISTENCY HONORED* ⭐
╚═══════════════════════════╝

Dear *${userName}*,

We are pleased to recognize your *exemplary consistency and reliability* throughout your journey with us!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *RECOGNITION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Recipient:* ${userName}
🎯 *Achievement:* Consistent Performance
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
💡 *YOUR ACHIEVEMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Consistency is the hallmark of true professionals, and you have demonstrated this quality admirably. Your steady commitment, reliable work ethic, and unwavering dedication have been instrumental in maintaining high standards.

While many shine momentarily, you have proven that sustained excellence is the true measure of capability. Your consistent contributions create a foundation of trust and reliability.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for being a dependable pillar of excellence!

*With Sincere Appreciation,*
_${organizationName} Team_
🌟 *Excellence Through Consistency*

📞 *Support:* +91 9892398976
      `.trim(),

      'Appreciation for Detecting Errors and Debugging': `
╔═══════════════════════════╗
   🔍 *TECHNICAL EXCELLENCE* 🔍
╚═══════════════════════════╝

Dear *${userName}*,

We are impressed to recognize your *exceptional technical acumen* in error detection and debugging!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *RECOGNITION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Recipient:* ${userName}
💻 *Achievement:* Error Detection & Debugging Excellence
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
💡 *YOUR ACHIEVEMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your sharp analytical skills, meticulous attention to detail, and systematic problem-solving approach have proven invaluable. You possess the rare ability to identify complex issues quickly and resolve them efficiently.

Your contributions have:
• Prevented potential system failures
• Saved countless development hours
• Enhanced code quality standards
• Mentored peers in best practices

This technical excellence and dedication to quality make you an asset to any development team.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Continue leveraging your problem-solving expertise to create robust solutions!

*With Technical Admiration,*
_${organizationName} Team_
🐛 *Making Code Better, One Solution at a Time*

📞 *Support:* +91 9892398976
      `.trim(),

      'Appreciation for Outstanding Performance': `
╔═══════════════════════════╗
   🏆 *EXCELLENCE ACHIEVED* 🏆
╚═══════════════════════════╝

Dear *${userName}*,

We are thrilled to recognize your *outstanding performance* that has exceeded all expectations!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *RECOGNITION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Recipient:* ${userName}
⭐ *Achievement:* Outstanding Performance
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
💡 *YOUR ACHIEVEMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your exceptional contributions, innovative thinking, and unwavering dedication have made a significant and lasting impact. You have consistently demonstrated:

✓ Exceptional work quality
✓ Innovative problem-solving
✓ Leadership by example
✓ Commitment to excellence

You don't just meet standards—you set them. Your performance serves as an inspiration and benchmark for professional excellence.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

We are proud to have you as part of our community. Continue to soar!

*With Highest Regards,*
_${organizationName} Team_
🌟 *Celebrating Outstanding Achievement*

📞 *Support:* +91 9892398976
      `.trim(),

      'Appreciation for Best Attendance': `
╔═══════════════════════════╗
   🎯 *COMMITMENT HONORED* 🎯
╚═══════════════════════════╝

Dear *${userName}*,

We are pleased to recognize your *exemplary attendance record* and unwavering commitment!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *RECOGNITION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Recipient:* ${userName}
📅 *Achievement:* Best Attendance
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
💡 *YOUR ACHIEVEMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your punctuality and consistent presence demonstrate exceptional professionalism and commitment. Attendance is more than just being present—it reflects:

✓ Dedication to learning
✓ Respect for time and commitments
✓ Professional work ethic
✓ Reliability and accountability

You have set a wonderful example for your peers, proving that success begins with showing up consistently.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your reliability and exemplary dedication!

*With Appreciation,*
_${organizationName} Team_
⏰ *Punctuality: The Soul of Professional Excellence*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Experience Certificate': {
      default: `
╔═══════════════════════════╗
   📄 *EXPERIENCE VALIDATED* 📄
╚═══════════════════════════╝

Dear *${userName}*,

We are pleased to provide you with your *Experience Certificate*, validating your professional journey and contributions.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *CERTIFICATE DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
📜 *Document:* Experience Certificate
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
💼 *ABOUT THIS CERTIFICATE*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

This certificate officially validates your professional experience and acknowledges the valuable contributions you made during your tenure with ${organizationName}.

Your dedication, skills, and professional conduct have been exemplary. We wish you continued success in all your future endeavors.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR CERTIFICATE*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Best wishes for a bright and successful career ahead!

*With Best Regards,*
_${organizationName} Team_
💼 *Your Success is Our Pride*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Internship Joining Letter': {
      'Internship Joining Letter - Paid': `
╔═══════════════════════════╗
   🎉 *WELCOME ABOARD!* 🎉
╚═══════════════════════════╝

Dear *${userName}*,

*Congratulations!* We are delighted to welcome you as a *Paid Intern* at ${organizationName}!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *JOINING LETTER DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
💼 *Position:* Paid Intern
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🚀 *WHAT AWAITS YOU*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

This internship offers you:
✓ Real-world industry experience
✓ Expert mentorship & guidance
✓ Skill development opportunities
✓ Professional growth pathways
✓ Stipend for your contributions

We believe in nurturing talent and providing meaningful learning experiences that shape successful careers.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *NEXT STEPS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Review all terms and conditions
2. Confirm your acceptance
3. Complete onboarding formalities
4. Prepare to embark on your learning journey

━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to working with you and supporting your professional development!

*Welcome to the Team!*
_${organizationName} Team_
🚀 *Begin Your Journey to Excellence*

📞 *Support:* +91 9892398976
      `.trim(),

      'Internship Joining Letter - Unpaid': `
╔═══════════════════════════╗
   🎉 *WELCOME TO LEARNING!* 🎉
╚═══════════════════════════╝

Dear *${userName}*,

*Congratulations!* We are pleased to welcome you as an *Intern* at ${organizationName}!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *JOINING LETTER DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
📚 *Position:* Intern
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🌟 *YOUR LEARNING JOURNEY*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

This internship provides:
✓ Hands-on practical experience
✓ Industry-standard skill development
✓ Professional mentorship
✓ Real-world project exposure
✓ Career foundation building

While this is an unpaid internship, the knowledge, experience, and skills you'll gain are invaluable investments in your future career.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *NEXT STEPS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Review internship terms carefully
2. Confirm your acceptance
3. Complete joining formalities
4. Get ready to learn and grow

━━━━━━━━━━━━━━━━━━━━━━━━

We're excited to support your learning and professional development!

*Welcome to the Team!*
_${organizationName} Team_
📖 *Learn. Grow. Succeed.*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Warning Letter': {
      'Warning for Incomplete Assignment/Project Submissions': `
╔═══════════════════════════╗
   ⚠️ *OFFICIAL WARNING* ⚠️
╚═══════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding incomplete assignment/project submissions.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *WARNING DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⚠️ *Subject:* Incomplete Submissions
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *CONCERN RAISED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Multiple instances of incomplete or missing assignment/project submissions have been recorded. Timely completion and submission are crucial for:

• Your learning progress evaluation
• Skill development assessment  
• Academic/professional records
• Overall program completion

This pattern affects not only your grades but also your learning outcomes and professional development.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW WARNING LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔴 *IMMEDIATE ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Complete all pending submissions immediately
2. Adhere to all future deadlines strictly
3. Seek help if facing difficulties
4. Maintain consistent work quality

*Consequences of Non-Compliance:*
Continued non-compliance may result in academic penalties, reduced grades, or removal from the program.

━━━━━━━━━━━━━━━━━━━━━━━━

We believe in your potential and expect immediate improvement. Our team is available to support you.

*Academic Standards Office,*
_${organizationName} Team_
📝 *Discipline & Dedication Lead to Excellence*

📞 *Support:* +91 9892398976
      `.trim(),

      'Warning for Low Attendance': `
╔═══════════════════════════╗
   ⚠️ *ATTENDANCE WARNING* ⚠️
╚═══════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding your below-standard attendance record.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *WARNING DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⚠️ *Subject:* Low Attendance
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *CONCERN RAISED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your attendance has fallen significantly below the required standards. Regular attendance is mandatory for:

• Comprehensive skill acquisition
• Effective learning outcomes
• Program completion eligibility
• Professional development
• Academic standing maintenance

Absence from sessions results in knowledge gaps that directly impact your overall performance and future opportunities.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW WARNING LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔴 *IMMEDIATE ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Attend all future sessions without fail
2. Inform in advance for any unavoidable absences
3. Provide valid documentation for medical/emergency leaves
4. Meet with your coordinator to discuss attendance recovery

*Consequences of Non-Compliance:*
Failure to improve attendance may result in ineligibility for certification, program termination, or academic penalties.

━━━━━━━━━━━━━━━━━━━━━━━━

Your presence is essential for your own success. We expect immediate improvement.

*Academic Affairs Office,*
_${organizationName} Team_
⏰ *Presence Builds Excellence*

📞 *Support:* +91 9892398976
      `.trim(),

      'Warning for Misconduct or Disrespectful Behavior': `
╔═══════════════════════════╗
   ⚠️ *BEHAVIORAL WARNING* ⚠️
╚═══════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding misconduct and disrespectful behavior.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *WARNING DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⚠️ *Subject:* Misconduct/Disrespectful Behavior
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *CONCERN RAISED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Recent incidents of misconduct and disrespectful behavior have been brought to our attention. We maintain strict standards of conduct that include:

• Respectful interaction with peers and faculty
• Professional communication at all times
• Adherence to organizational policies
• Maintaining a positive learning environment
• Upholding ethical standards

Such behavior disrupts the learning environment and is unacceptable under any circumstances.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW WARNING LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔴 *IMMEDIATE ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Demonstrate immediate behavioral improvement
2. Maintain professional conduct at all times
3. Issue formal apologies if applicable
4. Attend mandatory counseling session if required

*Consequences of Non-Compliance:*
Any further instances of misconduct or disrespectful behavior will result in immediate disciplinary action, including possible termination/dismissal from the program.

━━━━━━━━━━━━━━━━━━━━━━━━

Professional conduct is non-negotiable. We expect strict adherence to behavioral standards.

*Disciplinary Committee,*
_${organizationName} Team_
🤝 *Respect is Mandatory, Not Optional*

📞 *Support:* +91 9892398976
      `.trim(),

      'Warning for Unauthorized Absence from Training Sessions': `
╔═══════════════════════════╗
   ⚠️ *ABSENCE WARNING* ⚠️
╚═══════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding unauthorized absence from mandatory training sessions.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *WARNING DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⚠️ *Subject:* Unauthorized Training Absence
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *CONCERN RAISED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

You have been absent from mandatory training sessions without prior authorization or valid justification. Attendance at training sessions is compulsory because:

• Training builds essential skills
• Sessions are structured for progressive learning
• Missed sessions create knowledge gaps
• It reflects commitment to the program
• Unauthorized absence disrupts group dynamics

Your absence without permission demonstrates lack of seriousness toward the program.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW WARNING LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔴 *IMMEDIATE ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Ensure 100% attendance at all future training sessions
2. Request prior permission for any planned absence with valid reasons
3. Provide proper documentation for emergency absences
4. Schedule make-up sessions for missed content

*Consequences of Non-Compliance:*
Continued unauthorized absences will result in program termination and ineligibility for certification.

━━━━━━━━━━━━━━━━━━━━━━━━

Your commitment to training is essential for your skill development and career success.

*Training & Development Office,*
_${organizationName} Team_
📚 *Learning Requires Presence & Commitment*

📞 *Support:* +91 9892398976
      `.trim(),

      'Warning Regarding Punctuality and Professional Discipline': `
╔═══════════════════════════╗
   ⚠️ *PUNCTUALITY WARNING* ⚠️
╚═══════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding punctuality issues and lack of professional discipline.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *WARNING DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⚠️ *Subject:* Punctuality & Discipline Issues
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *CONCERN RAISED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Repeated instances of late arrivals and lack of professional discipline have been documented. Punctuality and discipline are fundamental to:

• Professional credibility
• Team coordination
• Respect for others' time
• Organizational efficiency
• Personal character development

Chronic tardiness reflects poorly on your commitment and professionalism.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW WARNING LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔴 *IMMEDIATE ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Arrive on time for all sessions and activities
2. Demonstrate professional discipline
3. Plan your schedule to ensure punctuality
4. Show respect for institutional timings

*Consequences of Non-Compliance:*
Continued tardiness and lack of discipline will result in further disciplinary action, including program removal.

━━━━━━━━━━━━━━━━━━━━━━━━

Punctuality is a reflection of professionalism. Discipline is the bridge to success.

*Disciplinary Office,*
_${organizationName} Team_
⏱️ *Time Waits for No One*

📞 *Support:* +91 9892398976
      `.trim(),

      'Warning for Unauthorized Absence from Sessions': `
╔═══════════════════════════╗
   ⚠️ *ABSENCE WARNING* ⚠️
╚═══════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding unauthorized absence from mandatory sessions.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *WARNING DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⚠️ *Subject:* Unauthorized Session Absence
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *CONCERN RAISED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

You have been absent from mandatory sessions without authorization or valid documentation. Regular attendance is essential for:

• Complete curriculum coverage
• Skill mastery and competency
• Peer collaboration opportunities
• Assessment eligibility
• Program completion requirements

Unauthorized absences severely impact your learning trajectory and overall performance.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW WARNING LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔴 *IMMEDIATE ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Attend all future sessions without exception
2. Seek prior permission for any unavoidable absence
3. Submit valid documentation for medical/emergency leaves
4. Make up for missed content immediately

*Consequences of Non-Compliance:*
Continued unauthorized absences will lead to serious consequences including certification ineligibility and program termination.

━━━━━━━━━━━━━━━━━━━━━━━━

Your presence is critical to your success. We expect full attendance compliance.

*Academic Operations,*
_${organizationName} Team_
📖 *Commitment Starts with Presence*

📞 *Support:* +91 9892398976
      `.trim(),

      'Warning for Punctuality and Discipline': `
╔═══════════════════════════╗
   ⚠️ *DISCIPLINE WARNING* ⚠️
╚═══════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding punctuality and discipline concerns.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *WARNING DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⚠️ *Subject:* Punctuality & Discipline
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *CONCERN RAISED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your behavior has consistently fallen short of expected standards in terms of punctuality and discipline. These qualities are non-negotiable for:

• Professional success
• Effective learning
• Team collaboration
• Career advancement
• Personal integrity

Lack of discipline creates barriers to your own growth and affects the learning environment.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW WARNING LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔴 *IMMEDIATE ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Strictly adhere to all schedules and timings
2. Demonstrate professional discipline consistently
3. Follow all institutional rules and regulations
4. Show immediate and sustained improvement

*Consequences of Non-Compliance:*
Failure to improve will result in escalated disciplinary action and potential program removal.

━━━━━━━━━━━━━━━━━━━━━━━━

Discipline is the foundation of all achievement. Excellence begins with self-control.

*Student Affairs Office,*
_${organizationName} Team_
🎯 *Discipline: The Bridge to Your Goals*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Committee Letter': {
      'Committee Member': `
╔═══════════════════════════╗
   🎖️ *LEADERSHIP APPOINTMENT* 🎖️
╚═══════════════════════════╝

Dear *${userName}*,

*Congratulations!* You have been appointed as a *Committee Member*!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *APPOINTMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
🏅 *Position:* Committee Member
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Appointment Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🌟 *YOUR ROLE & RESPONSIBILITIES*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your leadership qualities, dedication, and proven capabilities have earned you this position. As a Committee Member, you will:

✓ Contribute to organizational decisions
✓ Represent student/team interests
✓ Facilitate communication and initiatives
✓ Support organizational activities
✓ Mentor and guide peers

This is an opportunity to develop leadership skills and make meaningful contributions to the organization.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to your valuable contributions and leadership!

*With Confidence & Best Wishes,*
_${organizationName} Team_
👥 *Together We Lead, Together We Succeed*

📞 *Support:* +91 9892398976
      `.trim(),

      'Committee President': `
╔═══════════════════════════╗
   👑 *PRESIDENTIAL APPOINTMENT* 👑
╚═══════════════════════════╝

Dear *${userName}*,

*Congratulations!* We are honored to appoint you as the *Committee President*!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *APPOINTMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
🏆 *Position:* Committee President
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Appointment Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🌟 *YOUR LEADERSHIP ROLE*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your exceptional leadership skills, vision, and unwavering commitment have distinguished you as the ideal leader for this prestigious position. As President, you will:

✓ Lead and guide the entire committee
✓ Represent the organization in key initiatives
✓ Drive strategic decisions and planning
✓ Mentor committee members and peers
✓ Champion organizational values and goals
✓ Serve as the primary liaison

This position carries significant responsibility and offers tremendous opportunities for leadership development and organizational impact.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

We have complete confidence in your leadership and vision. Lead with purpose, inspire with action!

*With Pride & Highest Confidence,*
_${organizationName} Team_
👑 *Leading with Vision, Inspiring with Purpose*

📞 *Support:* +91 9892398976
      `.trim(),

      'Committee Vice-President': `
╔═══════════════════════════╗
   🏅 *VICE-PRESIDENTIAL APPOINTMENT* 🏅
╚═══════════════════════════╝

Dear *${userName}*,

*Congratulations!* You have been appointed as the *Committee Vice-President*!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *APPOINTMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⭐ *Position:* Committee Vice-President
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Appointment Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🌟 *YOUR LEADERSHIP ROLE*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your proven leadership abilities, reliability, and dedication make you the perfect choice for this senior position. As Vice-President, you will:

✓ Support and collaborate with the President
✓ Lead key organizational initiatives
✓ Oversee committee operations
✓ Represent the organization when needed
✓ Mentor committee members
✓ Drive strategic implementation

This role positions you as a core leader in shaping organizational direction and success.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to your strategic leadership and impactful contributions!

*With Confidence & Best Wishes,*
_${organizationName} Team_
🌟 *Leading by Example, Inspiring Excellence*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Memo': {
      default: `
╔═══════════════════════════╗
   📋 *OFFICIAL MEMORANDUM* 📋
╚═══════════════════════════╝

Dear *${userName}*,

This is an *official memorandum* regarding important organizational matters that require your attention.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *MEMORANDUM DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Recipient:* ${userName}
📄 *Document:* Official Memo
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Please review the complete memorandum carefully and take all necessary actions as specified within the stipulated timeframe.

This memo contains important information, instructions, or updates that may impact your program participation or responsibilities.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR MEMO*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

For any queries or clarifications, please contact the administration office.

*Official Communication,*
_${organizationName} Team_
📬 *Your Documents, Our Priority*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Non-Disclosure Agreement': {
      default: `
╔═══════════════════════════╗
   🔒 *CONFIDENTIALITY AGREEMENT* 🔒
╚═══════════════════════════╝

Dear *${userName}*,

We are sending you an important *Non-Disclosure Agreement (NDA)* that requires your immediate attention and acknowledgment.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *NDA DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
📜 *Document:* Non-Disclosure Agreement
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔐 *ABOUT THIS AGREEMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

This NDA ensures the protection of:
• Confidential organizational information
• Proprietary data and processes
• Intellectual property rights
• Sensitive business information
• Trade secrets and methodologies

By signing this agreement, you commit to maintaining strict confidentiality regarding all sensitive information you may encounter.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR NDA*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
⚠️ *URGENT ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Read the NDA thoroughly and carefully
2. Understand all terms and obligations
3. Sign and return the acknowledgment copy
4. Comply with all confidentiality requirements

━━━━━━━━━━━━━━━━━━━━━━━━

Confidentiality is paramount. This agreement is legally binding and must be treated with utmost seriousness.

*Legal & Compliance Office,*
_${organizationName} Team_
🔐 *Protecting What Matters - Trust Through Confidentiality*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Offer Letter': {
      default: `
╔═══════════════════════════╗
   🎊 *JOB OFFER - CONGRATULATIONS!* 🎊
╚═══════════════════════════╝

Dear *${userName}*,

*Congratulations!* We are thrilled to extend you an official job offer to join ${organizationName}!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *OFFER LETTER DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
💼 *Document:* Job Offer Letter
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Offer Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🌟 *WHY YOU WERE CHOSEN*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your skills, experience, and demonstrated capabilities make you an excellent fit for this role. We believe you will be a valuable addition to our team and contribute significantly to our organizational success.

This offer reflects our confidence in your abilities and our excitement about having you join our professional family.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR OFFER LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *TERMS & CONDITIONS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Please review and fill the Terms & Conditions form:

📄 *T&C Form Link:*
${getTermsLink()}

⚠️ *IMPORTANT NOTE:*
If the link is not opening, please:
1. Save this WhatsApp number first
2. Reply to this message requesting resend
3. We will assist you immediately

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *NEXT STEPS - ACTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. ✅ Download your offer letter
2. ✅ Read all terms carefully
3. ✅ Fill the T&C form (link above)
4. ✅ Sign the offer letter
5. ✅ Send back the signed copy via WhatsApp or email
6. ✅ Clarify any questions with HR
7. ✅ Complete pre-joining formalities

*🔴 Important:* Please send your signed copy to confirm acceptance!

━━━━━━━━━━━━━━━━━━━━━━━━

We are excited to welcome you aboard and look forward to a successful professional journey together!

*With Excitement & Best Wishes,*
_${organizationName} Team_
🎯 *Your Career, Our Commitment*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Promotion Letter': {
      default: `
╔═══════════════════════════╗
   🎉 *PROMOTION - CONGRATULATIONS!* 🎉
╚═══════════════════════════╝

Dear *${userName}*,

*Congratulations!* We are delighted to inform you about your well-deserved *promotion*!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *PROMOTION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
🚀 *Document:* Promotion Letter
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Effective Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🏆 *YOUR ACHIEVEMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

This promotion is a recognition of your:
✓ Outstanding contributions
✓ Exceptional work quality
✓ Leadership capabilities
✓ Dedication and commitment
✓ Professional growth

Your hard work, innovation, and consistent excellence have earned you this advancement. We are confident that you will excel in your new role and continue to inspire those around you.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *Verify:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Your success is our success. Congratulations once again on this well-earned promotion!

*With Pride & Congratulations,*
_${organizationName} Team_
📈 *Growing Together, Succeeding Together*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Timeline Letter': {
      default: `
╔═══════════════════════════╗
   📅 *IMPORTANT TIMELINE* 📅
╚═══════════════════════════╝

Dear *${userName}*,

We are sharing important *timeline information* regarding your program/project activities and deadlines.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *TIMELINE DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
⏰ *Document:* Timeline Letter
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *IMPORTANCE OF TIMELINES*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Adhering to timelines is critical for:
• Structured learning progression
• Timely completion of deliverables
• Meeting program requirements
• Maintaining quality standards
• Professional development

Please review all dates and deadlines carefully and plan your activities accordingly to ensure successful and timely completion.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR TIMELINE*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Time management is key to success. Plan, prioritize, and execute effectively!

*With Best Wishes,*
_${organizationName} Team_
📊 *Plan. Execute. Succeed.*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Live Project Agreement': {
      default: `
╔═══════════════════════════╗
   🚀 *LIVE PROJECT OPPORTUNITY* 🚀
╚═══════════════════════════╝

Dear *${userName}*,

We are excited to present you with the *Live Project Agreement* for an immersive practical learning experience!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *AGREEMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
💼 *Document:* Live Project Agreement
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🌟 *ABOUT LIVE PROJECTS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

This agreement outlines your participation in real-world projects that will provide:
✓ Hands-on industry experience
✓ Application of theoretical knowledge
✓ Practical skill development
✓ Professional work exposure
✓ Portfolio-worthy deliverables
✓ Industry-standard practices

Live projects bridge the gap between learning and professional practice, giving you invaluable real-world experience.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR AGREEMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *NEXT STEPS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

1. Review all terms and conditions carefully
2. Understand your responsibilities and deliverables
3. Acknowledge and accept the agreement
4. Prepare to apply your skills in real scenarios

━━━━━━━━━━━━━━━━━━━━━━━━

This is your opportunity to transform theory into practice. Embrace this learning journey!

*With Excitement,*
_${organizationName} Team_
💡 *Where Theory Meets Practice*

📞 *Support:* +91 9892398976
      `.trim(),
    },

    'Other': {
      default: `
╔═══════════════════════════╗
   📄 *OFFICIAL DOCUMENT* 📄
╚═══════════════════════════╝

Dear *${userName}*,

An official document has been generated and is ready for your review.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *DOCUMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Name:* ${userName}
📋 *Document:* Official Letter
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS YOUR DOCUMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Please review the document carefully. For any queries, contact our administration office.

*Official Communication,*
_${organizationName} Team_
📢 *Stay Informed, Stay Connected*

📞 *Support:* +91 9892398976
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
    credentialId,
    letterId,
    organizationName = 'Nexcore Alliance',
  } = data;
  
  // Use credentialId if available, otherwise fallback to letterId
  const finalId = credentialId || letterId;

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

  const verificationLink = `${baseUrl}/verify-certificate`;
  const downloadLink = `${baseUrl}/verify-certificate`;

  // Warning letters have a specific parent notification template
  if (letterType === 'Warning Letter') {
    return `
╔═══════════════════════════╗
   ⚠️ *PARENT NOTIFICATION* ⚠️
╚═══════════════════════════╝

Dear *${parentName}*,

This is an important notification regarding your ward's academic/professional conduct.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *NOTIFICATION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Student Name:* ${userName}
⚠️ *Subject:* ${subType?.replace('Warning for ', '') || 'Academic/Behavioral Warning'}
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *PARENTAL ATTENTION REQUIRED*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

A formal warning letter has been issued to your ward regarding the matter mentioned above. As part of our BVOC parent communication protocol, we believe in keeping parents informed about all official communications.

Your involvement and guidance are crucial at this stage. We request you to:

✓ Review the warning letter with your ward
✓ Discuss the concerns raised
✓ Provide necessary guidance and support
✓ Ensure your ward takes corrective action
✓ Monitor their progress going forward

Parental support significantly impacts student success and behavioral improvement.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS THE WARNING LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

If you have any concerns or would like to discuss this matter further, please feel free to contact us. Our team is available to provide any support needed.

*With Regards,*
_${organizationName} Team_
👨‍👩‍👧‍👦 *Parents & Institution: Partners in Student Success*

📞 *Support:* +91 9892398976
    `.trim();
  }

  // Appreciation letters have a positive parent notification template
  if (letterType === 'Appreciation Letter') {
    return `
╔═══════════════════════════╗
   🌟 *PROUD PARENT MOMENT!* 🌟
╚═══════════════════════════╝

Dear *${parentName}*,

We are delighted to share wonderful news about your ward's achievement!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *RECOGNITION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Student Name:* ${userName}
🏆 *Recognition:* ${subType?.replace('Appreciation for ', '') || 'Outstanding Achievement'}
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Recognition Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🎉 *CELEBRATING SUCCESS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your ward, ${userName}, has received an *Appreciation Letter* for their exceptional performance! This recognition reflects:

✓ Outstanding dedication and effort
✓ Excellence in their field
✓ Commitment to quality
✓ Professional growth
✓ Positive contribution to the program

We believe in celebrating achievements and sharing these proud moments with parents. Your support and encouragement have undoubtedly contributed to your ward's success.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW THE APPRECIATION LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

*Congratulations* to both you and your ward for this well-deserved recognition!

*With Pride & Joy,*
_${organizationName} Team_
👨‍👩‍👧‍👦 *Celebrating Student Excellence Together*

📞 *Support:* +91 9892398976
    `.trim();
  }

  // Committee appointments get special parent notification
  if (letterType === 'Committee Letter') {
    return `
╔═══════════════════════════╗
   🎖️ *LEADERSHIP ACHIEVEMENT!* 🎖️
╚═══════════════════════════╝

Dear *${parentName}*,

We are pleased to inform you about your ward's leadership appointment!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *APPOINTMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Student Name:* ${userName}
🏅 *Position:* ${subType || 'Committee Member'}
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Appointment Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🌟 *A PROUD MOMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

Your ward has been recognized for their leadership qualities and has been appointed to a committee position. This achievement reflects:

✓ Leadership capabilities
✓ Responsibility and maturity
✓ Peer recognition
✓ Organizational trust
✓ Personal development

Committee positions provide valuable experience in leadership, teamwork, and organizational management that will benefit their professional future.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *VIEW APPOINTMENT LETTER*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

Congratulations on your ward's leadership recognition!

*With Pride,*
_${organizationName} Team_
👨‍👩‍👧‍👦 *Nurturing Future Leaders Together*

📞 *Support:* +91 9892398976
    `.trim();
  }

  // Generic parent notification for all other letter types
  return `
╔═══════════════════════════╗
   📢 *PARENT NOTIFICATION* 📢
╚═══════════════════════════╝

Dear *${parentName}*,

We are writing to inform you about an official document issued to your ward.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *DOCUMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Student Name:* ${userName}
📄 *Document Type:* ${letterType}${subType ? ` - ${subType}` : ''}
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ''}
📅 *Issue Date:* ${formattedDate}

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📌 *PARENT COMMUNICATION*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

As part of our BVOC parent engagement initiative, we keep parents informed about all official communications sent to students. 

We encourage you to:
✓ Review the document with your ward
✓ Discuss its contents and implications
✓ Provide guidance as needed
✓ Support their academic/professional journey

Your involvement plays a crucial role in your ward's success and development.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
🔗 *ACCESS THE DOCUMENT*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

🔍 *View:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions, concerns, or would like to discuss this matter, please feel free to contact our administrative office.

*With Best Regards,*
_${organizationName} Team_
👨‍👩‍👧‍👦 *Partners in Education & Development*

📞 *Support:* +91 9892398976
  `.trim();
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