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



    return { success: true, data: response.data };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("WhatsApp send failed:", error.message);
    }



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
*Nexcore Alliance *
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
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
    let baseVerificationUrl = 'https://portal.nexcorealliance.com/';
    

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

Greetings from *Nexcore Alliance*! 🌟

We are pleased to inform you that your certificate has been successfully generated! 

📜 *Certificate Details:*
━━━━━━━━━━━━━━━━━━
👤 Name: ${userName}
🆔 Certificate ID: *${certificateId}*
📚 Course: ${course}
🏷️ Category: ${categoryDisplay}
📅 Issue Date: ${new Date(issueDate).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
${batch ? `🎓 Batch: ${batch}` : ""}

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


💙 Keep Learning, Keep Growing!
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
    `.trim();

    // Send WhatsApp notification
    const result = await sendWhatsAppMessage(userPhone, message);
    

    return result;
  } catch (error) {
   
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

${successful > 0 ? "🎉 Notifications have been sent to all recipients!" : ""}
${failed > 0 ? `⚠️ Please check the failed records and retry.` : ""}

---
_Nexcore Alliance_
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
    `.trim();

    const result = await sendWhatsAppMessage(adminPhone, message);
    return result;
  } catch (error) {
   console.error("Send OTP Error:", error.message);

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
    organizationName = 'Nexcore Alliance LLP',
  } = data;

  // Use credentialId if available, otherwise fallback to letterId
  const finalId = credentialId || letterId;

  const formattedDate = new Date(issueDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Base verification URL based on category
  const baseUrl = 'https://portal.nexcorealliance.com';
  const verificationLink = `${baseUrl}`;
  const downloadLink = `${baseUrl}`;

  // Get Terms & Conditions link based on category
  const getTermsLink = () => {
  return baseUrl;
}
  // Letter type specific messages
  const templates = {
    "Appreciation Letter": {
      "Appreciation for Best Performance": `
╔════════════════════════════════╗
   🏆 *EXCELLENCE RECOGNIZED* 🏆
╚════════════════════════════════╝

Dear *${userName}*,

We are delighted to recognize your *exceptional performance* that has set new benchmarks of excellence in our organization!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *RECOGNITION DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Recipient:* ${userName}
🎖️ *Achievement:* Best Performance Excellence
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *YOUR OUTSTANDING ACHIEVEMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your unwavering dedication, consistent excellence, and outstanding contributions have distinguished you among your peers. This recognition reflects your commitment to quality, innovation, and professional growth.

You have not only met expectations but exceeded them remarkably, setting a gold standard for others to aspire to. Your work demonstrates:

✓ Exceptional quality and attention to detail
✓ Innovative problem-solving approach
✓ Consistent delivery of results
✓ Leadership through example
✓ Dedication to continuous improvement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR APPRECIATION LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Certificate:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep up the exceptional work! Your journey of excellence continues to inspire us all.

*With Pride & Highest Regards,*
_${organizationName}_

🌟 *Celebrating Excellence, Inspiring Greatness*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Appreciation for Consistent Performance": `
╔════════════════════════════════╗
   ⭐ *CONSISTENCY HONORED* ⭐
╚════════════════════════════════╝

Dear *${userName}*,

We are pleased to recognize your *exemplary consistency and reliability* throughout your journey with us!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *RECOGNITION DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Recipient:* ${userName}
🎯 *Achievement:* Consistent Performance Excellence
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *YOUR REMARKABLE CONSISTENCY*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Consistency is the hallmark of true professionals, and you have demonstrated this quality admirably. Your steady commitment, reliable work ethic, and unwavering dedication have been instrumental in maintaining high standards.

While many shine momentarily, you have proven that sustained excellence is the true measure of capability. Your consistent contributions have:

✓ Created a foundation of trust and reliability
✓ Maintained high-quality standards throughout
✓ Inspired peers through steady performance
✓ Demonstrated professional maturity
✓ Built a reputation for dependability

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR APPRECIATION LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Certificate:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for being a dependable pillar of excellence!

*With Sincere Appreciation,*
_${organizationName}_

🌟 *Excellence Through Consistency*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Appreciation for Detecting Errors and Debugging": `
╔════════════════════════════════╗
   🔍 *TECHNICAL EXCELLENCE* 🔍
╚════════════════════════════════╝

Dear *${userName}*,

We are impressed to recognize your *exceptional technical acumen* in error detection and debugging excellence!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *RECOGNITION DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Recipient:* ${userName}
💻 *Achievement:* Error Detection & Debugging Excellence
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *YOUR TECHNICAL MASTERY*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your sharp analytical skills, meticulous attention to detail, and systematic problem-solving approach have proven invaluable to our development processes.

You possess the rare ability to identify complex issues quickly and resolve them efficiently. Your technical contributions have:

✓ Prevented potential system failures
✓ Saved countless development hours
✓ Enhanced overall code quality standards
✓ Mentored peers in debugging best practices
✓ Improved system stability and reliability
✓ Demonstrated exceptional problem-solving skills

This technical excellence and dedication to quality make you an invaluable asset to any development team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR APPRECIATION LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Certificate:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Continue leveraging your problem-solving expertise to create robust solutions!

*With Technical Admiration,*
_${organizationName}_

🐛 *Making Code Better, One Solution at a Time*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Appreciation for Outstanding Performance": `
╔════════════════════════════════╗
   🏆 *EXCELLENCE ACHIEVED* 🏆
╚════════════════════════════════╝

Dear *${userName}*,

We are thrilled to recognize your *outstanding performance* that has exceeded all expectations!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *RECOGNITION DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Recipient:* ${userName}
⭐ *Achievement:* Outstanding Performance
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *YOUR EXCEPTIONAL ACHIEVEMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your exceptional contributions, innovative thinking, and unwavering dedication have made a significant and lasting impact on our organization.

You have consistently demonstrated:

✓ Exceptional work quality and precision
✓ Innovative problem-solving abilities
✓ Leadership by example
✓ Commitment to excellence in all tasks
✓ Professional integrity and dedication
✓ Positive influence on team dynamics

You don't just meet standards—you set them. Your performance serves as an inspiration and benchmark for professional excellence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR APPRECIATION LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Certificate:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We are proud to have you as part of our community. Continue to soar!

*With Highest Regards,*
_${organizationName}_

🌟 *Celebrating Outstanding Achievement*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Appreciation for Best Attendance": `
╔════════════════════════════════╗
   🎯 *COMMITMENT HONORED* 🎯
╚════════════════════════════════╝

Dear *${userName}*,

We are pleased to recognize your *exemplary attendance record* and unwavering commitment to the program!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *RECOGNITION DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Recipient:* ${userName}
📅 *Achievement:* Best Attendance Record
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *YOUR EXEMPLARY DEDICATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your punctuality and consistent presence demonstrate exceptional professionalism and commitment to your learning journey.

Attendance is more than just being present—it reflects:

✓ Dedication to continuous learning
✓ Respect for time and commitments
✓ Strong professional work ethic
✓ Reliability and accountability
✓ Commitment to personal growth
✓ Setting an example for peers

You have set a wonderful example, proving that success begins with showing up consistently and being fully present.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR APPRECIATION LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Certificate:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your reliability and exemplary dedication!

*With Appreciation,*
_${organizationName}_

⏰ *Punctuality: The Foundation of Professional Excellence*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Experience Certificate": {
      default: `
╔════════════════════════════════╗
   📄 *EXPERIENCE CERTIFICATE* 📄
╚════════════════════════════════╝

Dear *${userName}*,

We are pleased to provide you with your *Experience Certificate*, officially validating your professional journey and valuable contributions to our organization.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *CERTIFICATE DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
📜 *Document:* Experience Certificate
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 *CERTIFICATE SIGNIFICANCE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This certificate officially validates your professional experience and acknowledges the valuable contributions you made during your tenure with ${organizationName}.

Your dedication, skills, and professional conduct have been exemplary. This document serves as formal recognition of:

✓ Your professional competencies
✓ Skills developed and demonstrated
✓ Contributions to projects and initiatives
✓ Professional conduct and work ethics
✓ Successful completion of responsibilities

We wish you continued success in all your future professional endeavors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR CERTIFICATE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Certificate:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best wishes for a bright and successful career ahead!

*With Best Regards,*
_${organizationName}_

💼 *Your Success is Our Pride*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Internship Joining Letter": {
      "Internship Joining Letter - Paid": `
╔════════════════════════════════╗
   🎉 *WELCOME ABOARD!* 🎉
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎊

We are delighted to welcome you as a *Paid Intern* at ${organizationName}! This is the beginning of an exciting professional journey.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *JOINING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
💼 *Position:* Paid Intern
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *WHAT AWAITS YOU*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This internship offers you valuable opportunities to grow professionally:

✓ Real-world industry experience
✓ Expert mentorship and guidance
✓ Comprehensive skill development
✓ Professional growth pathways
✓ Competitive stipend for your contributions
✓ Hands-on project involvement
✓ Networking with industry professionals

We believe in nurturing talent and providing meaningful learning experiences that shape successful careers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR JOINING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Letter:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *NEXT STEPS - ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ Download and review your joining letter carefully
2. ✅ Read all terms and conditions thoroughly
3. ✅ Sign the letter and scan it
4. ✅ Send the signed copy to: hr@nexcorealliance.com
5. ✅ Complete all onboarding formalities
6. ✅ Prepare necessary documents for joining
7. ✅ Reach out to HR for any clarifications

*Important:* Please submit your signed joining letter within 48 hours to confirm your acceptance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to working with you and supporting your professional development journey!

*Welcome to the Team!*
_${organizationName}_

🚀 *Begin Your Journey to Excellence*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Internship Joining Letter - Unpaid": `
╔════════════════════════════════╗
   🎉 *WELCOME TO LEARNING!* 🎉
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎊

We are pleased to welcome you as an *Intern* at ${organizationName}! Embark on this valuable learning journey with us.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *JOINING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
📚 *Position:* Intern
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *YOUR LEARNING JOURNEY*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This internship provides invaluable learning opportunities:

✓ Hands-on practical experience
✓ Industry-standard skill development
✓ Professional mentorship and guidance
✓ Real-world project exposure
✓ Career foundation building
✓ Portfolio development
✓ Professional networking opportunities

While this is an unpaid internship, the knowledge, experience, and skills you'll gain are invaluable investments in your future career success.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR JOINING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Letter:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *NEXT STEPS - ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ Download and review your joining letter carefully
2. ✅ Read all internship terms and conditions
3. ✅ Sign the letter and scan it
4. ✅ Send the signed copy to: hr@nexcorealliance.com
5. ✅ Complete all joining formalities
6. ✅ Prepare for your first day
7. ✅ Contact HR for any questions

*Important:* Please submit your signed joining letter within 48 hours to confirm your participation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We're excited to support your learning and professional development!

*Welcome to the Team!*
_${organizationName}_

📖 *Learn. Grow. Succeed.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Warning Letter": {
      "Warning for Incomplete Assignment/Project Submissions": `
╔════════════════════════════════╗
   ⚠️ *OFFICIAL WARNING NOTICE* ⚠️
╚════════════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding incomplete assignment and project submissions that require your immediate attention.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WARNING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⚠️ *Subject:* Incomplete Submissions
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *CONCERN IDENTIFIED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Multiple instances of incomplete or missing assignment/project submissions have been recorded. This pattern is concerning as timely completion is crucial for:

❌ Your learning progress evaluation
❌ Skill development assessment
❌ Academic/professional records
❌ Overall program completion eligibility
❌ Performance tracking and improvement

This pattern affects not only your grades but also your learning outcomes and professional development trajectory.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *VIEW WARNING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 *IMMEDIATE ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must take the following actions immediately:

1. ✅ Complete all pending submissions within 48 hours
2. ✅ Adhere to all future deadlines strictly
3. ✅ Seek help from mentors if facing difficulties
4. ✅ Maintain consistent work quality standards
5. ✅ Schedule a meeting with your coordinator

⚠️ *CONSEQUENCES OF NON-COMPLIANCE:*

Continued non-compliance will result in:
• Academic penalties and grade reduction
• Possible removal from the program
• Impact on final certification eligibility
• Negative performance records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We believe in your potential and expect immediate improvement. Our support team is available to assist you.

*Academic Standards Office*
_${organizationName}_

📝 *Discipline & Dedication Lead to Excellence*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Warning for Low Attendance": `
╔════════════════════════════════╗
   ⚠️ *ATTENDANCE WARNING* ⚠️
╚════════════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding your below-standard attendance record that requires immediate corrective action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WARNING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⚠️ *Subject:* Low Attendance Record
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *CONCERN IDENTIFIED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your attendance has fallen significantly below the required minimum standards. Regular attendance is mandatory for:

❌ Comprehensive skill acquisition
❌ Effective learning outcomes
❌ Program completion eligibility
❌ Professional development opportunities
❌ Academic standing maintenance
❌ Certification requirements

Absence from sessions results in critical knowledge gaps that directly impact your overall performance, future opportunities, and career growth.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *VIEW WARNING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 *IMMEDIATE ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must take the following actions immediately:

1. ✅ Attend all future sessions without exception
2. ✅ Inform in advance for any unavoidable absences
3. ✅ Provide valid documentation for medical/emergency leaves
4. ✅ Meet with your coordinator to discuss attendance recovery plan
5. ✅ Schedule makeup sessions for missed content

⚠️ *CONSEQUENCES OF NON-COMPLIANCE:*

Failure to improve attendance will result in:
• Ineligibility for certification
• Program termination
• Academic penalties
• Loss of program benefits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your presence is essential for your own success. We expect immediate and sustained improvement.

*Academic Affairs Office*
_${organizationName}_

⏰ *Presence Builds Excellence*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Warning for Misconduct or Disrespectful Behavior": `
╔════════════════════════════════╗
   ⚠️ *BEHAVIORAL WARNING* ⚠️
╚════════════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding recent incidents of misconduct and disrespectful behavior that violate our organizational standards.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WARNING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⚠️ *Subject:* Misconduct/Disrespectful Behavior
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *CONCERN IDENTIFIED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent incidents of misconduct and disrespectful behavior have been brought to our attention. We maintain strict standards of professional conduct that include:

❌ Respectful interaction with peers, faculty, and staff
❌ Professional communication at all times
❌ Adherence to organizational policies and guidelines
❌ Maintaining a positive learning environment
❌ Upholding ethical and professional standards
❌ Respectful disagreement and constructive dialogue

Such behavior disrupts the learning environment, affects team morale, and is unacceptable under any circumstances.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *VIEW WARNING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 *IMMEDIATE ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must take the following actions immediately:

1. ✅ Demonstrate immediate behavioral improvement
2. ✅ Maintain professional conduct at all times
3. ✅ Issue formal apologies to affected parties if applicable
4. ✅ Attend mandatory counseling session if required
5. ✅ Review and acknowledge organizational code of conduct

⚠️ *CONSEQUENCES OF NON-COMPLIANCE:*

Any further instances will result in:
• Immediate disciplinary action
• Possible suspension from the program
• Termination/dismissal from the program
• Permanent record notation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Professional conduct is non-negotiable. We expect strict adherence to behavioral standards and immediate improvement.

*Disciplinary Committee*
_${organizationName}_

🤝 *Respect is Mandatory, Not Optional*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Warning for Unauthorized Absence from Training Sessions": `
╔════════════════════════════════╗
   ⚠️ *ABSENCE WARNING NOTICE* ⚠️
╚════════════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding unauthorized absence from mandatory training sessions without prior approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WARNING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⚠️ *Subject:* Unauthorized Training Absence
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *CONCERN IDENTIFIED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have been absent from mandatory training sessions without prior authorization or valid justification. Attendance is compulsory because:

❌ Training builds essential professional skills
❌ Sessions are structured for progressive learning
❌ Missed sessions create critical knowledge gaps
❌ It reflects commitment to the program
❌ Unauthorized absence disrupts group dynamics
❌ Affects overall learning outcomes

Your absence without permission demonstrates a lack of seriousness toward your professional development.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *VIEW WARNING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 *IMMEDIATE ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must take the following actions immediately:

1. ✅ Ensure 100% attendance at all future training sessions
2. ✅ Request prior permission for any planned absence with valid reasons
3. ✅ Provide proper documentation for emergency absences
4. ✅ Schedule make-up sessions for missed content
5. ✅ Submit a written explanation for past unauthorized absences

⚠️ *CONSEQUENCES OF NON-COMPLIANCE:*

Continued unauthorized absences will result in:
• Program termination
• Ineligibility for certification
• Loss of all program benefits
• Negative academic record

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your commitment to training is essential for your skill development and career success. Immediate compliance is expected.

*Training & Development Office*
_${organizationName}_

📚 *Learning Requires Presence & Commitment*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Warning Regarding Punctuality and Professional Discipline": `
╔════════════════════════════════╗
   ⚠️ *PUNCTUALITY WARNING* ⚠️
╚════════════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding repeated punctuality issues and lack of professional discipline that must be addressed immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WARNING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⚠️ *Subject:* Punctuality & Discipline Issues
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *CONCERN IDENTIFIED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Repeated instances of late arrivals and lack of professional discipline have been documented. Punctuality and discipline are fundamental to:

❌ Professional credibility and reputation
❌ Effective team coordination
❌ Respect for others' time and effort
❌ Organizational efficiency and productivity
❌ Personal character and integrity development
❌ Career success and advancement

Chronic tardiness reflects poorly on your commitment, professionalism, and respect for the learning environment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *VIEW WARNING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 *IMMEDIATE ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must take the following actions immediately:

1. ✅ Arrive on time (or early) for all sessions and activities
2. ✅ Demonstrate professional discipline consistently
3. ✅ Plan your schedule to ensure punctuality
4. ✅ Show respect for institutional timings and schedules
5. ✅ Set multiple alarms and prepare in advance

⚠️ *CONSEQUENCES OF NON-COMPLIANCE:*

Continued tardiness and lack of discipline will result in:
• Further escalated disciplinary action
• Academic penalties
• Program removal consideration
• Negative professional record

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Punctuality is a reflection of professionalism. Discipline is the bridge between goals and accomplishment.

*Disciplinary Office*
_${organizationName}_

⏱️ *Time Waits for No One - Be Punctual*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Warning for Unauthorized Absence from Sessions": `
╔════════════════════════════════╗
   ⚠️ *ABSENCE WARNING NOTICE* ⚠️
╚════════════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding unauthorized absence from mandatory sessions without proper authorization or documentation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WARNING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⚠️ *Subject:* Unauthorized Session Absence
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *CONCERN IDENTIFIED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have been absent from mandatory sessions without authorization or valid documentation. Regular attendance is essential for:

❌ Complete curriculum coverage and understanding
❌ Skill mastery and competency development
❌ Peer collaboration opportunities
❌ Assessment and evaluation eligibility
❌ Program completion requirements
❌ Professional development tracking

Unauthorized absences severely impact your learning trajectory, overall performance, and program standing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *VIEW WARNING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 *IMMEDIATE ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must take the following actions immediately:

1. ✅ Attend all future sessions without exception
2. ✅ Seek prior permission for any unavoidable absence
3. ✅ Submit valid documentation for medical/emergency leaves
4. ✅ Make up for all missed content immediately
5. ✅ Meet with your coordinator to discuss attendance plan

⚠️ *CONSEQUENCES OF NON-COMPLIANCE:*

Continued unauthorized absences will lead to:
• Certification ineligibility
• Program termination
• Academic penalties
• Loss of program standing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your presence is critical to your success and program completion. We expect full attendance compliance going forward.

*Academic Operations*
_${organizationName}_

📖 *Commitment Starts with Presence*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Warning for Punctuality and Discipline": `
╔════════════════════════════════╗
   ⚠️ *DISCIPLINE WARNING* ⚠️
╚════════════════════════════════╝

Dear *${userName}*,

This is an *official warning* regarding persistent punctuality and discipline concerns that require immediate corrective action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *WARNING LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⚠️ *Subject:* Punctuality & Discipline Concerns
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *CONCERN IDENTIFIED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your behavior has consistently fallen short of expected standards in terms of punctuality and professional discipline. These qualities are non-negotiable for:

❌ Professional success and career growth
❌ Effective learning and skill development
❌ Successful team collaboration
❌ Career advancement opportunities
❌ Personal integrity and character building
❌ Organizational respect and standing

Lack of discipline creates significant barriers to your own growth and negatively affects the entire learning environment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *VIEW WARNING LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 *IMMEDIATE ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must take the following actions immediately:

1. ✅ Strictly adhere to all schedules and timings
2. ✅ Demonstrate professional discipline consistently
3. ✅ Follow all institutional rules and regulations
4. ✅ Show immediate and sustained improvement
5. ✅ Attend counseling session if recommended

⚠️ *CONSEQUENCES OF NON-COMPLIANCE:*

Failure to improve will result in:
• Escalated disciplinary action
• Academic penalties
• Potential program removal
• Permanent disciplinary record

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Discipline is the foundation of all achievement. Excellence begins with self-control and punctuality.

*Student Affairs Office*
_${organizationName}_

🎯 *Discipline: The Bridge to Your Goals*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Concern Letter-Audit Interview Performance": `
╔════════════════════════════════╗
   ⚠️ *PERFORMANCE CONCERN* ⚠️
╚════════════════════════════════╝

Dear *${userName}*,

This letter addresses concerns regarding your performance in the recent audit interview. We believe in supporting your improvement and growth.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *CONCERN LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⚠️ *Subject:* Audit Interview Performance Concern
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *PERFORMANCE CONCERN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your recent audit interview performance fell below expected standards. Areas needing improvement include:

❌ Technical knowledge and understanding
❌ Communication and articulation skills
❌ Problem-solving and analytical abilities
❌ Confidence and presentation
❌ Practical application of concepts
❌ Professional demeanor and preparedness

This feedback is provided constructively to help you identify areas for focused improvement and professional development.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *VIEW CONCERN LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 *IMPROVEMENT PLAN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We recommend the following steps for improvement:

1. ✅ Schedule one-on-one mentoring sessions
2. ✅ Focus on strengthening technical foundations
3. ✅ Practice communication and presentation skills
4. ✅ Participate in mock interview sessions
5. ✅ Seek regular feedback from instructors
6. ✅ Dedicate additional time to self-study
7. ✅ Prepare for re-audit interview

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We are committed to your success and our team is here to support your improvement journey. Please take this feedback constructively.

*Academic Development Office*
_${organizationName}_

📈 *Growth Through Constructive Feedback*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Committee Letter": {
      "Committee Member": `
╔════════════════════════════════╗
   🎖️ *LEADERSHIP APPOINTMENT* 🎖️
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎉

You have been appointed as a *Committee Member*! Your leadership qualities and dedication have earned you this prestigious position.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *APPOINTMENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
🏅 *Position:* Committee Member
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Appointment Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *YOUR ROLE & RESPONSIBILITIES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your leadership qualities, dedication, and proven capabilities have earned you this important position. As a Committee Member, you will:

✓ Contribute to organizational decisions and initiatives
✓ Represent student/team interests effectively
✓ Facilitate communication between leadership and members
✓ Support and organize organizational activities
✓ Mentor and guide fellow peers
✓ Uphold organizational values and standards

This is an excellent opportunity to develop leadership skills, gain valuable experience, and make meaningful contributions to the organization's growth and success.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR APPOINTMENT LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Letter:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to your valuable contributions, leadership, and positive impact on the organization!

*With Confidence & Best Wishes,*
_${organizationName}_

👥 *Together We Lead, Together We Succeed*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Committee President": `
╔════════════════════════════════╗
   👑 *PRESIDENTIAL APPOINTMENT* 👑
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎊

We are honored to appoint you as the *Committee President*! Your exceptional leadership has distinguished you as the ideal leader for this prestigious position.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *APPOINTMENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
🏆 *Position:* Committee President
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Appointment Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *YOUR PRESIDENTIAL LEADERSHIP ROLE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your exceptional leadership skills, strategic vision, and unwavering commitment have distinguished you as the ideal leader for this prestigious position. As President, you will:

✓ Lead and guide the entire committee with vision
✓ Represent the organization in key initiatives and events
✓ Drive strategic decisions and long-term planning
✓ Mentor committee members and peers
✓ Champion organizational values, mission, and goals
✓ Serve as the primary liaison with administration
✓ Inspire excellence and foster team collaboration

This position carries significant responsibility and offers tremendous opportunities for leadership development, strategic thinking, and creating lasting organizational impact.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR APPOINTMENT LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Letter:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We have complete confidence in your leadership abilities and vision. Lead with purpose, inspire through action, and create positive change!

*With Pride & Highest Confidence,*
_${organizationName}_

👑 *Leading with Vision, Inspiring with Purpose*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Committee Vice-President": `
╔════════════════════════════════╗
   🏅 *VICE-PRESIDENTIAL APPOINTMENT* 🏅
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎉

You have been appointed as the *Committee Vice-President*! Your proven leadership abilities make you the perfect choice for this senior position.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *APPOINTMENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⭐ *Position:* Committee Vice-President
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Appointment Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *YOUR VICE-PRESIDENTIAL LEADERSHIP ROLE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your proven leadership abilities, reliability, and dedication make you the perfect choice for this senior leadership position. As Vice-President, you will:

✓ Support and collaborate closely with the President
✓ Lead key organizational initiatives and projects
✓ Oversee committee operations and coordination
✓ Represent the organization when needed
✓ Mentor and guide committee members
✓ Drive strategic implementation and execution
✓ Ensure continuity of leadership and vision

This role positions you as a core leader in shaping organizational direction, driving success, and creating meaningful impact.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR APPOINTMENT LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Letter:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to your strategic leadership, impactful contributions, and collaborative approach to organizational success!

*With Confidence & Best Wishes,*
_${organizationName}_

🌟 *Leading by Example, Inspiring Excellence*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Non-Disclosure Agreement": {
      default: `
╔════════════════════════════════╗
   🔒 *CONFIDENTIALITY AGREEMENT* 🔒
╚════════════════════════════════╝

Dear *${userName}*,

We are sending you an important *Non-Disclosure Agreement (NDA)* that requires your immediate attention, review, and acknowledgment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *NDA DOCUMENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
📜 *Document:* Non-Disclosure Agreement
🆔 *Document ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 *ABOUT THIS AGREEMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This Non-Disclosure Agreement ensures the protection of:

🔒 Confidential organizational information and data
🔒 Proprietary processes and methodologies
🔒 Intellectual property rights and innovations
🔒 Sensitive business information and strategies
🔒 Trade secrets and competitive advantages
🔒 Client and stakeholder information
🔒 Internal communications and documents

By signing this agreement, you commit to maintaining strict confidentiality regarding all sensitive information you may encounter during your association with ${organizationName}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR NDA DOCUMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Document:* ${verificationLink}
⬇️ *Download NDA:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *URGENT - ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please complete the following steps immediately:

1. ✅ Read the NDA thoroughly and carefully
2. ✅ Understand all terms, obligations, and legal implications
3. ✅ Review confidentiality scope and duration
4. ✅ Comply with all confidentiality requirements strictly
5. ✅ Contact legal team for any clarifications

*Important Legal Notice:*
This agreement is legally binding and must be treated with utmost seriousness. Breach of confidentiality may result in legal action and severe consequences.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confidentiality is paramount to our operations. Your adherence to this agreement protects both you and the organization.

*Legal & Compliance Office*
_${organizationName}_

🔐 *Protecting What Matters - Trust Through Confidentiality*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Offer Letter": {
      default: `
╔════════════════════════════════╗
   🎊 *JOB OFFER - CONGRATULATIONS!* 🎊
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎉

We are absolutely thrilled to extend you an official job offer to join ${organizationName}! This is the beginning of an exciting professional journey together.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *OFFER LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
💼 *Document:* Job Offer Letter
🆔 *Offer ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Offer Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *WHY YOU WERE CHOSEN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your exceptional skills, proven experience, and demonstrated capabilities make you an excellent fit for this role and our organization.

We believe you will be a valuable addition to our professional family and will contribute significantly to our organizational success and growth. This offer reflects our confidence in your abilities and our excitement about having you join our team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR OFFER LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Letter:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *TERMS & CONDITIONS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review and complete the Terms & Conditions form:

📄 *T&C Form:* ${getTermsLink()}

⚠️ *IMPORTANT:* If the link doesn't open:
1. Save this WhatsApp number first
2. Reply to this message requesting resend
3. We will assist you immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *NEXT STEPS - ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please complete the following within 48 hours:

1. ✅ Download your offer letter
2. ✅ Read all terms and conditions carefully
3. ✅ Fill and submit the T&C form (link above)
4. ✅ Sign the offer letter (digital/physical signature)
5. ✅ Send signed copy to: hr@nexcorealliance.com
6. ✅ Clarify any questions with our HR team
7. ✅ Complete all pre-joining formalities
8. ✅ Prepare required documents for joining

🔴 *CRITICAL:* Please send your signed copy within 48 hours to confirm your acceptance of this offer!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We are genuinely excited to welcome you aboard and look forward to a long, successful, and mutually rewarding professional journey together!

*With Excitement & Best Wishes,*
_${organizationName}_

🎯 *Your Career, Our Commitment*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Promotion Letter": {
      default: `
╔════════════════════════════════╗
   🎉 *PROMOTION - CONGRATULATIONS!* 🎉
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎊

We are absolutely delighted to inform you about your well-deserved *promotion*! Your hard work and dedication have earned you this advancement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *PROMOTION LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
🚀 *Document:* Promotion Letter
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Effective Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *YOUR OUTSTANDING ACHIEVEMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This promotion is formal recognition of your exceptional contributions and professional growth. It acknowledges your:

✓ Outstanding contributions and consistent results
✓ Exceptional work quality and attention to detail
✓ Leadership capabilities and team collaboration
✓ Dedication, commitment, and work ethic
✓ Professional growth and skill development
✓ Positive impact on team and organizational success

Your hard work, innovation, consistent excellence, and unwavering commitment have earned you this well-deserved advancement.

We are confident that you will excel in your new role, take on greater responsibilities with enthusiasm, and continue to inspire those around you with your dedication and professionalism.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR PROMOTION LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Letter:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your success is our success. Congratulations once again on this well-earned promotion! We look forward to your continued contributions in your new role.

*With Pride & Congratulations,*
_${organizationName}_

📈 *Growing Together, Succeeding Together*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Non Paid to Paid": `
╔════════════════════════════════╗
   🎉 *PROMOTION - PAID POSITION!* 🎉
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎊

We are thrilled to announce your *promotion from Non-Paid to Paid Intern*! Your exceptional performance has earned you this advancement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *PROMOTION LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
🚀 *Promotion:* Non-Paid to Paid Intern
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Effective Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *YOUR EARNED RECOGNITION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This promotion from non-paid to paid internship recognizes your:

✓ Outstanding performance and dedication
✓ Exceptional work quality and reliability
✓ Professional growth and skill development
✓ Consistent contributions to projects
✓ Positive attitude and team collaboration
✓ Commitment to learning and excellence

Your hard work, dedication, and professional conduct have demonstrated that you deserve this recognition and reward for your valuable contributions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR PROMOTION LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Letter:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Congratulations on this well-deserved recognition! We look forward to your continued growth and contributions as a paid member of our team.

*With Pride & Best Wishes,*
_${organizationName}_

📈 *Recognizing Excellence, Rewarding Dedication*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),

      "Stipend Revision": `
╔════════════════════════════════╗
   📈 *STIPEND REVISION - PROMOTION!* 📈
╚════════════════════════════════╝

Dear *${userName}*,

*Congratulations!* 🎉

We are pleased to announce a *stipend revision and promotion* in recognition of your outstanding performance and contributions!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *PROMOTION LETTER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
💰 *Promotion:* Stipend Revision
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Effective Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *RECOGNITION OF YOUR EXCELLENCE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This stipend revision recognizes and rewards your:

✓ Exceptional performance and consistent results
✓ Outstanding work quality and professionalism
✓ Significant contributions to projects and initiatives
✓ Professional growth and skill advancement
✓ Dedication, reliability, and positive attitude
✓ Value added to the team and organization

Your performance has exceeded expectations, and this revision reflects our appreciation for your hard work and the value you bring to our organization.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR PROMOTION LETTER*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *Verify Authenticity:* ${verificationLink}
⬇️ *Download Letter:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Congratulations on this well-deserved recognition! Keep up the excellent work and continue to grow with us.

*With Appreciation & Best Wishes,*
_${organizationName}_

💰 *Rewarding Excellence, Inspiring Growth*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Timeline Letter": {
      default: `
╔════════════════════════════════╗
   📅 *IMPORTANT TIMELINE INFORMATION* 📅
╚════════════════════════════════╝

Dear *${userName}*,

We are sharing important *timeline information* regarding your program activities, milestones, and critical deadlines that you must adhere to.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *TIMELINE DOCUMENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
⏰ *Document:* Timeline Letter
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *IMPORTANCE OF TIMELINE ADHERENCE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Adhering to timelines is absolutely critical for:

✓ Structured learning progression and curriculum completion
✓ Timely completion of projects and deliverables
✓ Meeting program and certification requirements
✓ Maintaining quality standards and performance
✓ Professional development and skill mastery
✓ Successful program completion and outcomes

Please review all dates, deadlines, and milestones carefully. Plan your activities, assignments, and projects accordingly to ensure successful and timely completion of all requirements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR TIMELINE DOCUMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Timeline:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Effective time management is key to success. Plan strategically, prioritize wisely, and execute efficiently!

*With Best Wishes,*
_${organizationName}_

📊 *Plan. Execute. Succeed.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    "Live Project Agreement": {
      default: `
╔════════════════════════════════╗
   🚀 *LIVE PROJECT OPPORTUNITY* 🚀
╚════════════════════════════════╝

Dear *${userName}*,

We are excited to present you with the *Live Project Agreement* for an immersive, hands-on practical learning experience!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *AGREEMENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
💼 *Document:* Live Project Agreement
🆔 *Agreement ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *LIVE PROJECT BENEFITS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This agreement outlines your participation in real-world projects that will provide invaluable experience:

✓ Hands-on industry experience with real clients
✓ Practical application of theoretical knowledge
✓ Comprehensive skill development and mastery
✓ Professional work environment exposure
✓ Portfolio-worthy deliverables and projects
✓ Industry-standard practices and workflows
✓ Mentorship from experienced professionals
✓ Real-world problem-solving opportunities

Live projects bridge the critical gap between academic learning and professional practice, giving you invaluable real-world experience that sets you apart in the job market.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR AGREEMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Agreement:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *NEXT STEPS - ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ Review all terms and conditions carefully
2. ✅ Understand your responsibilities and deliverables
3. ✅ Review project timelines and milestones
4. ✅ Acknowledge and accept the agreement formally
5. ✅ Prepare to apply your skills in real scenarios
6. ✅ Contact project coordinator for any clarifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is your opportunity to transform theory into practice and gain industry-ready experience. Embrace this learning journey with enthusiasm!

*With Excitement & Best Wishes,*
_${organizationName}_

💡 *Where Theory Meets Practice*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    Memo: {
      default: `
╔════════════════════════════════╗
   📋 *OFFICIAL MEMORANDUM* 📋
╚════════════════════════════════╝

Dear *${userName}*,

This is an *official memorandum* regarding important organizational matters that require your immediate attention and action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *MEMORANDUM DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Recipient:* ${userName}
📄 *Document:* Official Memorandum
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *ACTION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review the complete memorandum carefully and take all necessary actions as specified within the stipulated timeframe.

This memo contains important information, instructions, policy updates, or procedural changes that may directly impact your program participation, responsibilities, or organizational standing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR MEMORANDUM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Memo:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For any queries, clarifications, or additional information, please contact the administration office immediately.

*Official Communication*
_${organizationName}_

📬 *Important Communication - Please Review*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
`.trim(),
    },

    Other: {
      default: `
╔════════════════════════════════╗
   📄 *OFFICIAL DOCUMENT* 📄
╚════════════════════════════════╝

Dear *${userName}*,

An official document has been generated and is now ready for your review and necessary action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *DOCUMENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${userName}
📋 *Document Type:* Official Letter
🆔 *Reference ID:* ${finalId}
🏷️ *Program:* ${category}${batch ? `\n📚 *Batch:* ${batch}` : ""}
📅 *Issue Date:* ${formattedDate}
🏢 *Organization:* ${organizationName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *ACCESS YOUR DOCUMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *View Document:* ${verificationLink}
⬇️ *Download:* ${downloadLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review the document carefully. For any queries or clarifications, please contact our administration office.

*Official Communication*
_${organizationName}_

📢 *Stay Informed, Stay Connected*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Support:* +91 9892398976
📧 *Email:* hr@nexcorealliance.com

📌 *Note:* If the link doesn't open, please save this WhatsApp number and try again.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
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
    // parentName,
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
  let baseUrl = 'https://portal.nexcorealliance.com';
  

  const verificationLink = `${baseUrl}/verify-certificate`;
  const downloadLink = `${baseUrl}/verify-certificate`;

  // Warning letters have a specific parent notification template
  if (letterType === 'Warning Letter') {
    return `
╔═══════════════════════════╗
   ⚠️ *PARENT NOTIFICATION* ⚠️
╚═══════════════════════════╝

This is an important notification regarding your ward's academic/professional conduct.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *NOTIFICATION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Student Name:* ${userName}
⚠️ *Subject:* ${
      subType?.replace("Warning for ", "") || "Academic/Behavioral Warning"
    }
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ""}
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
📌 Please send the signed copy to us via email.  
📌 If the link does not open, please save this WhatsApp number and try again for further updates.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
    `.trim();
  }

  // Appreciation letters have a positive parent notification template
  if (letterType === 'Appreciation Letter') {
    return `
╔═══════════════════════════╗
   🌟 *PROUD PARENT MOMENT!* 🌟
╚═══════════════════════════╝

We are delighted to share wonderful news about your ward's achievement!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *RECOGNITION DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Student Name:* ${userName}
🏆 *Recognition:* ${
      subType?.replace("Appreciation for ", "") || "Outstanding Achievement"
    }
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ""}
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
📌 Please send the signed copy to us via email.  
📌 If the link does not open, please save this WhatsApp number and try again for further updates.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
    `.trim();
  }

  // Committee appointments get special parent notification
  if (letterType === 'Committee Letter') {
    return `
╔═══════════════════════════╗
   🎖️ *LEADERSHIP ACHIEVEMENT!* 🎖️
╚═══════════════════════════╝

We are pleased to inform you about your ward's leadership appointment!

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *APPOINTMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Student Name:* ${userName}
🏅 *Position:* ${subType || "Committee Member"}
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ""}
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
📌 Please send the signed copy to us via email.  
📌 If the link does not open, please save this WhatsApp number and try again for further updates.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
    `.trim();
  }

  // Generic parent notification for all other letter types
  return `
╔═══════════════════════════╗
   📢 *PARENT NOTIFICATION* 📢
╚═══════════════════════════╝

We are writing to inform you about an official document issued to your ward.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
📋 *DOCUMENT DETAILS*
┗━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Student Name:* ${userName}
📄 *Document Type:* ${letterType}${subType ? ` - ${subType}` : ""}
🆔 *Credential ID:* ${finalId}
🏷️ *Program:* ${category}
${batch ? `📚 *Batch:* ${batch}` : ""}
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
📌 Please send the signed copy to us via email.  
📌 If the link does not open, please save this WhatsApp number and try again for further updates.
🌐 Nexcore Alliance
Empowering global business solutions.
Head Office:
• IN - India

Branch Offices:
• QA - Qatar
• OM - Oman
• KW - Kuwait
• AE - UAE
• SA - Saudi Arabia

🔗 Website: www.nexcorealliance.com
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