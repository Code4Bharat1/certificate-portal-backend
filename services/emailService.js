// Email Service for Certificate and Letter Notifications
// File: server/services/emailService.js

import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

export const getEmailAccountByCategory = (category) => {
  const cat = (category || "").toLowerCase();

  if (cat.includes("code4bharat") || cat.includes("c4b")) {
    return {
      user: process.env.EMAIL_USER_C4B,
      pass: process.env.EMAIL_PASSWORD_C4B,
      fromName: "Code4Bharat Team",
    };
  }
  if (cat.includes("marketing-junction") || cat.includes("MJ")) {
    return {
      user: process.env.EMAIL_USER_C4B,
      pass: process.env.EMAIL_PASSWORD_C4B,
      fromName: "marketing-junction Team",
    };
  }
  if (cat.includes("HR") || cat.includes("HR")) {
    return {
      user: process.env.EMAIL_USER_C4B,
      pass: process.env.EMAIL_PASSWORD_C4B,
      fromName: "HR Team",
    };
  }
 if (cat.includes("OD") || cat.includes("OD")) {
    return {
      user: process.env.EMAIL_USER_C4B,
      pass: process.env.EMAIL_PASSWORD_C4B,
      fromName: "OD Team",
    };
  }
  if (cat.includes("fsd")) {
    return {
      user: process.env.EMAIL_USER_FSD,
      pass: process.env.EMAIL_PASSWORD_FSD,
      fromName: "FSD Team",
    };
  }
  if (cat.includes("DM")) {
    return {
      user: process.env.EMAIL_USER_FSD,
      pass: process.env.EMAIL_PASSWORD_FSD,
      fromName: "DM Team",
    };
  }

  if (cat.includes("bvoc")) {
    return {
      user: process.env.EMAIL_USER_BVOC,
      pass: process.env.EMAIL_PASSWORD_BVOC,
      fromName: "BVOC Department",
    };
  }

  return {
    user: process.env.EMAIL_USER_C4B,
    pass: process.env.EMAIL_PASSWORD_C4B,
    fromName: "Nexcore Alliance",
  };
};

/**
 * 🔥 Create transporter dynamically (Fix Gmail "Missing credentials for PLAIN")
 */
const createTransporter = (user, pass) => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
};



// In-memory OTP store (use Redis in production)
// const otpStore = new Map();

/**
 * Generate 6-digit OTP
 */
// export const generateOTP = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

/**
 * Send Email using Nodemailer
 */
export const sendEmail = async (to, subject, html, text = "", category = "") => {
  try {
    console.log("📧 Preparing email...");

    // Get dynamic email account
    const account = getEmailAccountByCategory(category);

    if (!account.user || !account.pass) {
      throw new Error("Email credentials missing for category: " + category);
    }

    // Create new transporter based on category
    const transporter = createTransporter(account.user, account.pass);

    console.log("📨 Using Email:", account.user);

    const mailOptions = {
      from: `"${account.fromName}" <${account.user}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Email Send Error:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send OTP via Email
 */
// export const sendOTPViaEmail = async (email, adminName = 'Admin') => {
//   try {
//     // Generate OTP
//     const otp = generateOTP();

//     // Store OTP with expiration (5 minutes)
//     const expiresAt = Date.now() + 5 * 60 * 1000;
//     otpStore.set(email, { otp, expiresAt });

//     // Create email HTML
//     const html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <style>
//         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//         .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
//         .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
//         .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
//         .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
//         .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
//         .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>🔐 OTP Verification</h1>
//         </div>
//         <div class="content">
//           <p>Hello <strong>${adminName}</strong>,</p>
//           <p>Your OTP for certificate/letter creation is:</p>
          
//           <div class="otp-box">
//             <div class="otp-code">${otp}</div>
//           </div>
          
//           <p>⏰ <strong>This OTP will expire in 5 minutes.</strong></p>
          
//           <div class="warning">
//             <strong>🔒 Security Notice:</strong> Do not share this OTP with anyone. Our team will never ask for your OTP.
//           </div>
          
//           <p>If you did not request this OTP, please ignore this email or contact support immediately.</p>
//         </div>
//         <div class="footer">
//           <p><strong>Nexcore Alliance & Code4Bharat</strong></p>
//           <p>📞 Support: +91 9892398976</p>
//         </div>
//       </div>
//     </body>
//     </html>
//     `;

//     // Send via Email
//     const result = await sendEmail(email, 'OTP for Certificate/Letter Creation', html);

//     if (result.success) {
//       // Auto-delete OTP after expiration
//       setTimeout(() => {
//         otpStore.delete(email);
//       }, 5 * 60 * 1000);

//       return {
//         success: true,
//         message: 'OTP sent successfully via email'
//       };
//     } else {
//       return {
//         success: false,
//         message: result.error
//       };
//     }
//   } catch (error) {
//     console.error('Send OTP Error:', error);
//     return {
//       success: false,
//       message: 'Failed to send OTP'
//     };
//   }
// };

/**
 * Verify OTP
 */
// export const verifyOTP = (email, otpCode) => {
//   try {
//     const storedData = otpStore.get(email);

//     if (!storedData) {
//       return {
//         success: false,
//         message: 'OTP not found or expired'
//       };
//     }

//     // Check expiration
//     if (Date.now() > storedData.expiresAt) {
//       otpStore.delete(email);
//       return {
//         success: false,
//         message: 'OTP has expired'
//       };
//     }

//     // Verify OTP
//     if (storedData.otp !== otpCode) {
//       return {
//         success: false,
//         message: 'Invalid OTP'
//       };
//     }

//     // OTP verified successfully
//     otpStore.delete(email);

//     return {
//       success: true,
//       message: 'OTP verified successfully'
//     };
//   } catch (error) {
//     console.error('Verify OTP Error:', error);
//     return {
//       success: false,
//       message: 'Failed to verify OTP'
//     };
//   }
// };

/**
 * Send Certificate Generation Success Email
 */
export const sendCertificateNotification = async (certificateData) => {
  try {
    const {
      userName,
      userEmail,
      certificateId,
      course,
      category,
      batch,
      issueDate,
    } = certificateData;

    // Determine correct base URL for verification/download
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
      baseVerificationUrl = `${process.env.FRONTEND_URL}/verify`;
    }

    const verificationLink = baseVerificationUrl;
    const downloadLink = baseVerificationUrl;

    let categoryDisplay = category?.toUpperCase() || 'N/A';

    const formattedDate = new Date(issueDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create HTML email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .details-box { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #667eea; }
    .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .button:hover { background: #5568d3; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .celebration { font-size: 48px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <div class="celebration">🎉</div>
      <h1>Congratulations!</h1>
      <p>Your Certificate Has Been Generated Successfully</p>
    </div>

    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Greetings from <strong>Nexcore Alliance</strong> & <strong>Code4Bharat</strong>! 🌟</p>
      <p>We are pleased to inform you that your certificate has been successfully generated!</p>

      <div class="details-box">
        <h3 style="color: #667eea; margin-top: 0;">📜 Certificate Details</h3>

        <div class="detail-row"><span class="detail-label">👤 Name:</span> ${userName}</div>
        <div class="detail-row"><span class="detail-label">🆔 Certificate ID:</span> ${certificateId}</div>
        <div class="detail-row"><span class="detail-label">📚 Course:</span> ${course}</div>
        <div class="detail-row"><span class="detail-label">🏷️ Category:</span> ${categoryDisplay}</div>
        <div class="detail-row"><span class="detail-label">📅 Issue Date:</span> ${formattedDate}</div>
        ${
          batch
            ? `<div class="detail-row"><span class="detail-label">🎓 Batch:</span> ${batch}</div>`
            : ""
        }
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button">🔍 Verify Certificate</a>
        <a href="${downloadLink}" class="button">⬇️ Download Certificate</a>
      </div>

      <p>✨ Keep this certificate safe as proof of your achievement!</p>
      <p>📱 For any queries, feel free to reach out to us at <strong>+91 9892398976</strong></p>
    </div>

    <!-- Updated Footer WITH branches + website -->
    <div class="footer">
      <p><strong>With Best Wishes,</strong></p>
      <p><strong>Nexcore Alliance Team</strong></p>
      <p><strong>Code4Bharat Initiative</strong></p>
      <p>💙 Keep Learning, Keep Growing!</p>

      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

      <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
    </div>

  </div>
</body>
</html>

    `;

    // Send email notification
    const result = await sendEmail(
      userEmail,
      `🎉 Your Certificate is Ready - ${certificateId}`,
      html
    );

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
// export const sendBulkCertificateNotification = async (adminEmail, adminName, stats) => {
//   try {
//     const { total, successful, failed } = stats;
//     const successRate = ((successful / total) * 100).toFixed(1);

//     const html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <style>
//         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//         .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
//         .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
//         .stats-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
//         .stat-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
//         .stat-label { font-weight: bold; }
//         .stat-value { color: #667eea; font-weight: bold; }
//         .success { color: #28a745; }
//         .failed { color: #dc3545; }
//         .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>📊 Bulk Certificate Generation Complete</h1>
//         </div>
//         <div class="content">
//           <p>Hello <strong>${adminName}</strong>,</p>
//           <p>Your bulk certificate generation process has been completed!</p>
          
//           <div class="stats-box">
//             <h3 style="color: #667eea; margin-top: 0;">Summary Report</h3>
//             <div class="stat-row">
//               <span class="stat-label">📁 Total Records:</span>
//               <span class="stat-value">${total}</span>
//             </div>
//             <div class="stat-row">
//               <span class="stat-label">✅ Successfully Created:</span>
//               <span class="stat-value success">${successful}</span>
//             </div>
//             <div class="stat-row">
//               <span class="stat-label">❌ Failed:</span>
//               <span class="stat-value failed">${failed}</span>
//             </div>
//             <div class="stat-row">
//               <span class="stat-label">📈 Success Rate:</span>
//               <span class="stat-value">${successRate}%</span>
//             </div>
//           </div>
          
//           ${successful > 0 ? '<p>🎉 Email notifications have been sent to all recipients!</p>' : ''}
//           ${failed > 0 ? '<p>⚠️ Please check the failed records and retry if needed.</p>' : ''}
//         </div>
//         <div class="footer">
//           <p><strong>Nexcore Alliance & Code4Bharat</strong></p>
//         </div>
//       </div>
//     </body>
//     </html>
//     `;

//     const result = await sendEmail(
//       adminEmail,
//       `📊 Bulk Certificate Generation Report - ${successRate}% Success`,
//       html
//     );
//     return result;
//   } catch (error) {
//     console.error('Bulk Notification Error:', error);
//     return {
//       success: false,
//       error: 'Failed to send bulk notification'
//     };
//   }
// };

/**
 * Get professional email template for letters
 */
export const getLetterEmailTemplate = (letterType, subType, data) => {
  const {
    userName,
    category,
    batch,
    issueDate,
    credentialId,
    letterId,
    organizationName = 'Nexcore Alliance',
  } = data;
  
  const finalId = credentialId || letterId;

  const formattedDate = new Date(issueDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Base verification URL
  let baseUrl = 'https://portal.nexcorealliance.com';
  

  const verificationLink = `${baseUrl}`;
  const downloadLink = `${baseUrl}`;

  // Get Terms & Conditions link
  const getTermsLink = () => {
  return baseUrl;
}

  // Base HTML template style with enhanced styling
 const baseStyle = `
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    line-height: 1.6;
  }
  
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  }
  
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }
  
  .header h1 {
    font-size: 28px;
    margin: 0;
    font-weight: 600;
  }
  
  .content {
    padding: 40px 30px;
    color: #333;
  }
  
  .content p {
    margin-bottom: 15px;
    font-size: 16px;
  }
  
  .details-box {
    background: #f8f9fa;
    border-left: 4px solid #667eea;
    padding: 20px;
    margin: 25px 0;
    border-radius: 8px;
  }
  
  .details-box h3 {
    margin-bottom: 15px;
    font-size: 18px;
  }
  
  .detail-row {
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
    font-size: 15px;
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .success-box {
    background: #d4edda;
    border-left: 4px solid #28a745;
    padding: 20px;
    margin: 25px 0;
    border-radius: 8px;
  }
  
  .success-box ul, .success-box ol {
    margin-left: 20px;
    margin-top: 10px;
  }
  
  .success-box li {
    margin: 8px 0;
  }
  
  .warning-box {
    background: #f8d7da;
    border-left: 4px solid #dc3545;
    padding: 20px;
    margin: 25px 0;
    border-radius: 8px;
  }
  
  .warning-box ul {
    margin-left: 20px;
    margin-top: 10px;
  }
  
  .warning-box li {
    margin: 8px 0;
  }
  
  .important-notice {
    background: #fff3cd;
    border: 2px dashed #ffc107;
    padding: 15px;
    margin: 20px 0;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
  }
  
  .important-notice p {
    margin: 5px 0;
  }
  
  .button {
    display: inline-block;
    padding: 12px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 25px;
    font-weight: 600;
    margin: 10px 5px;
    transition: transform 0.3s ease;
  }
  
  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
  
  .footer {
    background: #f8f9fa;
    padding: 25px;
    text-align: center;
    border-top: 3px solid #667eea;
  }
  
  .footer p {
    margin: 5px 0;
    color: #666;
  }
  
  .footer strong {
    color: #333;
  }
  
  @media only screen and (max-width: 600px) {
    .container {
      margin: 0;
      border-radius: 0;
    }
    
    .content {
      padding: 20px 15px;
    }
    
    .header h1 {
      font-size: 24px;
    }
    
    .button {
      display: block;
      margin: 10px 0;
    }
  }
</style>
`;


  // Letter-specific templates
  const templates = {
    // ===== APPRECIATION LETTERS =====
    "Appreciation Letter": `
      <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseStyle}
</head>
<body>
  <div class="container">

    <div class="header">
      <h1>🏆 Excellence Recognized</h1>
    </div>

    <div class="content">
      <p>Dear <strong>${userName}</strong>,</p>
      <p>We are delighted to recognize your <strong>${
        subType?.replace("Appreciation for ", "") || "outstanding achievement"
      }</strong>!</p>
      
      <div class="details-box">
        <h3 style="color: #667eea; margin-top: 0;">Recognition Details</h3>

        <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
        <div class="detail-row"><strong>🎖️ Recognition:</strong> ${
          subType || "Outstanding Performance"
        }</div>
        <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
        <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
        ${
          batch
            ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
            : ""
        }
        <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
      </div>

      <div class="success-box">
        <p><strong>Your exceptional contributions include:</strong></p>
        <ul>
          <li>Outstanding dedication and effort</li>
          <li>Excellence in your field</li>
          <li>Commitment to quality</li>
          <li>Professional growth</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button">🔍 Verify Letter</a>
        <a href="${downloadLink}" class="button">⬇️ Download Letter</a>
      </div>

      <p>Keep up the exceptional work!</p>
    </div>

    <!-- Updated footer with branches + website -->
    <div class="footer">
      <p><strong>With Pride & Highest Regards,</strong></p>
      <p><strong>${organizationName} Team</strong></p>
      <p>📞 Support: +91 9892398976</p>

      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

      <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
    </div>

  </div>
</body>
</html>

    `,

    // ===== WARNING LETTERS =====
    "Warning Letter": `
     <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseStyle}
</head>
<body>
  <div class="container">

    <div class="header" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
      <h1>⚠️ Official Warning</h1>
    </div>

    <div class="content">
      <p>Dear <strong>${userName}</strong>,</p>
      <p>
        This is an <strong>official warning</strong> regarding 
        ${
          subType?.replace("Warning for ", "").toLowerCase() ||
          "performance concerns"
        }.
      </p>

      <div class="details-box">
        <h3 style="color: #dc3545; margin-top: 0;">Warning Details</h3>

        <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
        <div class="detail-row"><strong>⚠️ Subject:</strong> ${
          subType || "Performance Warning"
        }</div>
        <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
        <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
        ${
          batch
            ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
            : ""
        }
        <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
      </div>

      <div class="important-notice">
        <p>⚠️ IMPORTANT NOTICE</p>
        <p>📌 Please send the signed copy to us via email</p>
      </div>

      <div class="warning-box">
        <p><strong>🔴 Immediate Action Required:</strong></p>
        <ul>
          <li>Review this warning carefully</li>
          <li>Take immediate corrective action</li>
          <li>Maintain required standards</li>
          <li>Contact your coordinator if needed</li>
        </ul>
        <p>
          <strong>Consequences of Non-Compliance:</strong>  
          Continued non-compliance may result in further disciplinary action.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button" style="background: #dc3545;">🔍 View Warning Letter</a>
        <a href="${downloadLink}" class="button" style="background: #dc3545;">⬇️ Download Letter</a>
      </div>
    </div>

    <!-- Nexcore Footer Added -->
    <div class="footer">
      <p><strong>Academic Standards Office</strong></p>
      <p><strong>${organizationName} Team</strong></p>
      <p>📞 Support: +91 9892398976</p>

      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

      <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
    </div>

  </div>
</body>
</html>

    `,

    // ===== OFFER LETTER =====
    "Offer Letter": `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseStyle}
</head>
<body>
  <div class="container">

    <div class="header" style="background: linear-gradient(135deg, #28a745 0%, #218838 100%);">
      <h1>🎊 Job Offer - Congratulations!</h1>
    </div>

    <div class="content">
      <p>Dear <strong>${userName}</strong>,</p>
      <p><strong>Congratulations!</strong> We are thrilled to extend you an official job offer to join ${organizationName}!</p>

      <div class="details-box">
        <h3 style="color: #28a745; margin-top: 0;">Offer Letter Details</h3>

        <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
        <div class="detail-row"><strong>💼 Document:</strong> Job Offer Letter</div>
        <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
        <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>

        ${
          batch
            ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
            : ""
        }

        <div class="detail-row"><strong>📅 Offer Date:</strong> ${formattedDate}</div>
      </div>

      <div class="important-notice">
        <p>⚠️ IMPORTANT NOTICE</p>
        <p>📌 Please send the signed copy to us via email</p>
      </div>

      <div class="success-box">
        <p><strong>📋 Next Steps:</strong></p>
        <ol>
          <li>Download and review your offer letter</li>
          <li>Fill the Terms & Conditions form: 
            <a href="${getTermsLink()}" style="color: #667eea; font-weight: 600;">Click Here</a>
          </li>
          <li>Sign the offer letter</li>
          <li>Send back the signed copy via email</li>
          <li>Complete pre-joining formalities</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button" style="background: #28a745;">🔍 View Offer Letter</a>
        <a href="${downloadLink}" class="button" style="background: #28a745;">⬇️ Download Letter</a>
      </div>

      <p style="text-align: center; color: #dc3545; font-weight: 600;">
        <strong>🔴 Important:</strong> Please send your signed copy to confirm acceptance!
      </p>
    </div>

    <!-- Nexcore Footer (Added Here) -->
    <div class="footer">
      <p><strong>With Excitement & Best Wishes,</strong></p>
      <p><strong>${organizationName} Team</strong></p>
      <p>🎯 Your Career, Our Commitment</p>
      <p>📞 Support: +91 9892398976</p>

      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

      <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
    </div>

  </div>
</body>
</html>

    `,

    // ===== TIMELINE LETTER =====
    "Timeline Letter": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);">
            <h1>📅 Timeline Communication</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>This letter outlines the important timeline and schedule for your program activities.</p>
            
            <div class="details-box">
              <h3 style="color: #17a2b8; margin-top: 0;">Timeline Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document Type:</strong> Timeline Letter</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="important-notice">
              <p>📌 IMPORTANT INFORMATION</p>
              <p>Please review the timeline carefully and mark important dates in your calendar.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #17a2b8;">🔍 View Timeline</a>
              <a href="${downloadLink}" class="button" style="background: #17a2b8;">⬇️ Download Letter</a>
            </div>
            
            <p>If you have any questions about the timeline, please contact your coordinator.</p>
          </div>
          <div class="footer">
            <p><strong>Program Coordination Team,</strong></p>
            <p><strong>${organizationName}</strong></p>
            <p>📞 Support: +91 9892398976</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== EXPERIENCE CERTIFICATE =====
    "Experience Certificate": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);">
            <h1>📜 Experience Certificate</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Congratulations on the successful completion of your tenure with us! Your experience certificate is now ready.</p>
            
            <div class="details-box">
              <h3 style="color: #6f42c1; margin-top: 0;">Certificate Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document:</strong> Experience Certificate</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🎯 Key Highlights:</strong></p>
              <ul>
                <li>Successfully completed the program</li>
                <li>Demonstrated professional competence</li>
                <li>Contributed positively to projects</li>
                <li>Met all program requirements</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #6f42c1;">🔍 View Certificate</a>
              <a href="${downloadLink}" class="button" style="background: #6f42c1;">⬇️ Download Certificate</a>
            </div>
            
            <p>We wish you all the best for your future endeavors!</p>
          </div>
          <div class="footer">
            <p><strong>With Best Wishes,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== INTERNSHIP EXPERIENCE CERTIFICATE =====
    "Internship Experience Certificate": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);">
            <h1>🎓 Internship Experience Certificate</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Congratulations on successfully completing your internship! Your internship experience certificate is now ready.</p>
            
            <div class="details-box">
              <h3 style="color: #6f42c1; margin-top: 0;">Certificate Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document:</strong> Internship Experience Certificate</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🎯 Internship Achievements:</strong></p>
              <ul>
                <li>Successfully completed internship tenure</li>
                <li>Gained practical industry experience</li>
                <li>Contributed to real-world projects</li>
                <li>Developed professional skills</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #6f42c1;">🔍 View Certificate</a>
              <a href="${downloadLink}" class="button" style="background: #6f42c1;">⬇️ Download Certificate</a>
            </div>
            
            <p>Thank you for your dedication and we wish you success in your career!</p>
          </div>
          <div class="footer">
            <p><strong>With Best Wishes,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== CONCERN LETTER =====
    "Concern Letter-Audit Interview Performance": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);">
            <h1>📋 Performance Concern Letter</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>This letter is to address concerns regarding your audit interview performance.</p>
            
            <div class="details-box">
              <h3 style="color: #ffc107; margin-top: 0;">Letter Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Subject:</strong> Concern Letter - Audit Interview Performance</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="important-notice">
              <p>📌 ATTENTION REQUIRED</p>
              <p>Please review the concerns mentioned and take appropriate action.</p>
            </div>
            
            <div class="warning-box" style="background: #fff3cd; border-left-color: #ffc107;">
              <p><strong>📝 Recommended Actions:</strong></p>
              <ul>
                <li>Review your interview performance</li>
                <li>Identify areas for improvement</li>
                <li>Seek guidance from mentors</li>
                <li>Practice and prepare better</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #ffc107; color: #000;">🔍 View Letter</a>
              <a href="${downloadLink}" class="button" style="background: #ffc107; color: #000;">⬇️ Download Letter</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>Training & Development Team,</strong></p>
            <p><strong>${organizationName}</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== INTERNSHIP JOINING LETTER - UNPAID =====
    "Internship Joining Letter - Unpaid": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);">
            <h1>🎯 Internship Joining Letter</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Welcome to ${organizationName}! We are pleased to confirm your joining as an intern with us.</p>
            
            <div class="details-box">
              <h3 style="color: #007bff; margin-top: 0;">Joining Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document:</strong> Internship Joining Letter (Unpaid)</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="important-notice">
              <p>📌 IMPORTANT INFORMATION</p>
              <p>Please review all terms and conditions in the joining letter carefully.</p>
            </div>

            <div class="success-box">
              <p><strong>📋 Action Items:</strong></p>
              <ul>
                <li>Download and read the joining letter</li>
                <li>Sign the letter and NDA</li>
                <li>Submit required documents</li>
                <li>Join on the specified date</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #007bff;">🔍 View Letter</a>
              <a href="${downloadLink}" class="button" style="background: #007bff;">⬇️ Download Letter</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>Welcome Aboard!</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== INTERNSHIP JOINING LETTER - PAID =====
    "Internship Joining Letter - Paid": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #28a745 0%, #218838 100%);">
            <h1>💰 Paid Internship Joining Letter</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Congratulations! We are pleased to confirm your joining as a paid intern with ${organizationName}!</p>
            
            <div class="details-box">
              <h3 style="color: #28a745; margin-top: 0;">Joining Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document:</strong> Internship Joining Letter (Paid)</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="important-notice">
              <p>📌 IMPORTANT INFORMATION</p>
              <p>Review stipend details and payment terms in the joining letter.</p>
            </div>

            <div class="success-box">
              <p><strong>📋 Next Steps:</strong></p>
              <ul>
                <li>Download and review the joining letter</li>
                <li>Sign and return the letter</li>
                <li>Submit bank details for stipend</li>
                <li>Complete joining formalities</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #28a745;">🔍 View Letter</a>
              <a href="${downloadLink}" class="button" style="background: #28a745;">⬇️ Download Letter</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>Welcome to the Team!</strong></p>
            <p><strong>${organizationName}</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== NON-DISCLOSURE AGREEMENT =====
    "Non-Disclosure Agreement": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%);">
            <h1>🔒 Non-Disclosure Agreement</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Please find attached the Non-Disclosure Agreement (NDA) for your review and signature.</p>
            
            <div class="details-box">
              <h3 style="color: #6c757d; margin-top: 0;">NDA Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document:</strong> Non-Disclosure Agreement</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>

            <div class="warning-box" style="background: #f8f9fa; border-left-color: #6c757d;">
              <p><strong>🔐 Confidentiality Requirements:</strong></p>
              <ul>
                <li>Read the agreement carefully</li>
                <li>Understand confidentiality obligations</li>
                <li>Sign and return within 48 hours</li>
                <li>Maintain confidentiality throughout</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #6c757d;">🔍 View NDA</a>
              <a href="${downloadLink}" class="button" style="background: #6c757d;">⬇️ Download NDA</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>Legal & Compliance Team,</strong></p>
            <p><strong>${organizationName}</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== LIVE PROJECT AGREEMENT =====
    "Live Project Agreement": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);">
            <h1>🚀 Live Project Agreement</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Welcome to the live project! Please review and sign the project agreement.</p>
            
            <div class="details-box">
              <h3 style="color: #ff6b6b; margin-top: 0;">Project Agreement Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document:</strong> Live Project Agreement</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="important-notice">
              <p>📌 PROJECT COMMITMENT</p>
              <p>This agreement outlines your responsibilities for the live project.</p>
            </div>

            <div class="success-box">
              <p><strong>🎯 Project Guidelines:</strong></p>
              <ul>
                <li>Review project terms and conditions</li>
                <li>Understand deliverables and timeline</li>
                <li>Sign and submit the agreement</li>
                <li>Adhere to project standards</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #ff6b6b;">🔍 View Agreement</a>
              <a href="${downloadLink}" class="button" style="background: #ff6b6b;">⬇️ Download Agreement</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>Project Management Team,</strong></p>
            <p><strong>${organizationName}</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== NON PAID TO PAID PROMOTION =====
    "Non Paid to Paid": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #28a745 0%, #218838 100%);">
            <h1>🎉 Promotion - Paid Internship!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p><strong>Congratulations!</strong> We are pleased to inform you that you have been promoted to a paid internship!</p>
            
            <div class="details-box">
              <h3 style="color: #28a745; margin-top: 0;">Promotion Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document:</strong> Non-Paid to Paid Promotion Letter</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Effective Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🌟 Recognition of Excellence:</strong></p>
              <ul>
                <li>Outstanding performance recognized</li>
                <li>Promoted to paid internship status</li>
                <li>Stipend details in the letter</li>
                <li>Continue your excellent work!</li>
              </ul>
            </div>
            
            <div class="important-notice">
              <p>📌 ACTION REQUIRED</p>
              <p>Please submit your bank details for stipend processing.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #28a745;">🔍 View Letter</a>
              <a href="${downloadLink}" class="button" style="background: #28a745;">⬇️ Download Letter</a>
            </div>
            
            <p>Thank you for your dedication and hard work!</p>
          </div>
          <div class="footer">
            <p><strong>Congratulations from,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== STIPEND REVISION =====
    "Stipend Revision": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #28a745 0%, #218838 100%);">
            <h1>💰 Stipend Revision - Promotion!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p><strong>Excellent News!</strong> Your stipend has been revised based on your outstanding performance!</p>
            
            <div class="details-box">
              <h3 style="color: #28a745; margin-top: 0;">Revision Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Document:</strong> Stipend Revision Promotion Letter</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Effective Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🎯 Performance Recognition:</strong></p>
              <ul>
                <li>Exceptional work quality demonstrated</li>
                <li>Consistent high performance</li>
                <li>Stipend increased as per policy</li>
                <li>Revised amount effective immediately</li>
              </ul>
            </div>
            
            <div class="important-notice">
              <p>📌 IMPORTANT INFORMATION</p>
              <p>Check the letter for detailed stipend breakdown and revised amount.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #28a745;">🔍 View Letter</a>
              <a href="${downloadLink}" class="button" style="background: #28a745;">⬇️ Download Letter</a>
            </div>
            
            <p>Keep up the outstanding work! We appreciate your contribution.</p>
          </div>
          <div class="footer">
            <p><strong>With Appreciation,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== COMMITTEE MEMBER =====
    "Committee Member": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%);">
            <h1>🏅 Committee Member Appointment</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Congratulations! You have been appointed as a <strong>Committee Member</strong>.</p>
            
            <div class="details-box">
              <h3 style="color: #4e54c8; margin-top: 0;">Appointment Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Position:</strong> Committee Member</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Appointment Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🎯 Responsibilities:</strong></p>
              <ul>
                <li>Active participation in committee meetings</li>
                <li>Support in organizing events</li>
                <li>Collaborate with team members</li>
                <li>Represent student interests</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #4e54c8;">🔍 View Letter</a>
              <a href="${downloadLink}" class="button" style="background: #4e54c8;">⬇️ Download Letter</a>
            </div>
            
            <p>We look forward to your valuable contributions!</p>
          </div>
          <div class="footer">
            <p><strong>Best Wishes,</strong></p>
            <p><strong>${organizationName} Committee</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== COMMITTEE PRESIDENT =====
    "Committee President": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <h1>👑 Committee President Appointment</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p><strong>Congratulations!</strong> You have been appointed as the <strong>Committee President</strong>!</p>
            
            <div class="details-box">
              <h3 style="color: #f5576c; margin-top: 0;">Appointment Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Position:</strong> Committee President</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Appointment Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🎯 Leadership Responsibilities:</strong></p>
              <ul>
                <li>Lead and coordinate committee activities</li>
                <li>Organize and chair meetings</li>
                <li>Represent the committee officially</li>
                <li>Guide and mentor committee members</li>
                <li>Ensure smooth execution of events</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #f5576c;">🔍 View Letter</a>
              <a href="${downloadLink}" class="button" style="background: #f5576c;">⬇️ Download Letter</a>
            </div>
            
            <p>We have full confidence in your leadership abilities!</p>
          </div>
          <div class="footer">
            <p><strong>With Great Expectations,</strong></p>
            <p><strong>${organizationName} Committee</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,

    // ===== COMMITTEE VICE-PRESIDENT =====
    "Committee Vice-President": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <h1>🎖️ Committee Vice-President Appointment</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p><strong>Congratulations!</strong> You have been appointed as the <strong>Committee Vice-President</strong>!</p>
            
            <div class="details-box">
              <h3 style="color: #fa709a; margin-top: 0;">Appointment Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>📋 Position:</strong> Committee Vice-President</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Appointment Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🎯 Key Responsibilities:</strong></p>
              <ul>
                <li>Assist the President in leadership duties</li>
                <li>Coordinate with committee members</li>
                <li>Act as President in their absence</li>
                <li>Support event planning and execution</li>
                <li>Maintain communication channels</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #fa709a;">🔍 View Letter</a>
              <a href="${downloadLink}" class="button" style="background: #fa709a;">⬇️ Download Letter</a>
            </div>
            
            <p>We appreciate your commitment to leadership!</p>
          </div>
          <div class="footer">
            <p><strong>With Best Wishes,</strong></p>
            <p><strong>${organizationName} Committee</strong></p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  // Return appropriate template or default
  return (
    templates[letterType] ||
    `
    <!DOCTYPE html>
    <html>
    <head>${baseStyle}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Official Document</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${userName}</strong>,</p>
          <p>An official document has been generated and is ready for your review.</p>
          
          <div class="details-box">
            <h3 style="color: #667eea; margin-top: 0;">Document Details</h3>
            <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
            <div class="detail-row"><strong>📋 Document:</strong> ${letterType}${
      subType ? ` - ${subType}` : ""
    }</div>
            <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
            <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
            ${
              batch
                ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                : ""
            }
            <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" class="button">🔍 View Document</a>
            <a href="${downloadLink}" class="button">⬇️ Download Document</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>Official Communication,</strong></p>
          <p><strong>${organizationName} Team</strong></p>
          <p>📞 Support: +91 9892398976</p>
           <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
        </div>
      </div>
    </body>
    </html>
  `
  );
};

/**
 * Send Letter Notification via Email
 */
export const sendLetterNotification = async (letterData) => {
  try {
    const {
      userName,
      userEmail,
      letterType,
      subType,
    } = letterData;

    const emailHtml = getLetterEmailTemplate(letterType, subType, letterData);
    const subject = `📄 ${letterType}${subType ? ` - ${subType}` : ''} | ${letterData.organizationName || 'Nexcore Alliance'}`;

    const result = await sendEmail(userEmail, subject, emailHtml);
    return result;
  } catch (error) {
    console.error('Letter Notification Error:', error);
    return {
      success: false,
      error: 'Failed to send letter notification'
    };
  }
};

/**
 * Get parent notification email template
 */
export const getParentNotificationEmailTemplate = (letterType, subType, data) => {
  const {
    userName,
    category,
    batch,
    issueDate,
    credentialId,
    letterId,
    organizationName = 'Nexcore Alliance',
  } = data;
  
  const finalId = credentialId || letterId;

  const formattedDate = new Date(issueDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Base verification URL
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

  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
      .details-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
      .detail-row { padding: 8px 0; }
      .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
      .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
      .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
      .info-box { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f8f9fa; border-radius: 0 0 10px 10px; }
      ul { padding-left: 20px; }
      li { margin: 8px 0; }
    </style>
  `;

  // Warning letters parent notification
  if (letterType === 'Warning Letter') {
    return `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
            <h1>⚠️ Parent Notification</h1>
          </div>
          <div class="content">
            <p>Dear Parent/Guardian,</p>
            <p>This is an important notification regarding your ward's academic/professional conduct.</p>
            
            <div class="details-box">
              <h3 style="color: #dc3545; margin-top: 0;">Notification Details</h3>
              <div class="detail-row"><strong>👤 Student Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>⚠️ Subject:</strong> ${
                subType?.replace("Warning for ", "") ||
                "Academic/Behavioral Warning"
              }</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="warning-box">
              <p><strong>📌 Parental Attention Required:</strong></p>
              <p>A formal warning letter has been issued to your ward regarding the matter mentioned above. As part of our parent communication protocol, we believe in keeping parents informed about all official communications.</p>
              <p>Your involvement and guidance are crucial at this stage. We request you to:</p>
              <ul>
                <li>Review the warning letter with your ward</li>
                <li>Discuss the concerns raised</li>
                <li>Provide necessary guidance and support</li>
                <li>Ensure your ward takes corrective action</li>
                <li>Monitor their progress going forward</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #dc3545;">🔍 View Warning Letter</a>
              <a href="${downloadLink}" class="button" style="background: #dc3545;">⬇️ Download Letter</a>
            </div>
            
            <p>If you have any concerns or would like to discuss this matter further, please feel free to contact us.</p>
          </div>
          <div class="footer">
            <p><strong>With Regards,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>👨‍👩‍👧‍👦 Parents & Institution: Partners in Student Success</p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Appreciation letters parent notification
  if (letterType === 'Appreciation Letter') {
    return `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #28a745 0%, #218838 100%);">
            <h1>🌟 Proud Parent Moment!</h1>
          </div>
          <div class="content">
            <p>Dear Parent/Guardian,</p>
            <p>We are delighted to share wonderful news about your ward's achievement!</p>
            
            <div class="details-box">
              <h3 style="color: #28a745; margin-top: 0;">Recognition Details</h3>
              <div class="detail-row"><strong>👤 Student Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>🏆 Recognition:</strong> ${
                subType?.replace("Appreciation for ", "") ||
                "Outstanding Achievement"
              }</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Recognition Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🎉 Celebrating Success</strong></p>
              <p>Your ward, <strong>${userName}</strong>, has received an <strong>Appreciation Letter</strong> for their exceptional performance! This recognition reflects:</p>
              <ul>
                <li>Outstanding dedication and effort</li>
                <li>Excellence in their field</li>
                <li>Commitment to quality</li>
                <li>Professional growth</li>
                <li>Positive contribution to the program</li>
              </ul>
              <p>We believe in celebrating achievements and sharing these proud moments with parents. Your support and encouragement have undoubtedly contributed to your ward's success.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #28a745;">🔍 View Appreciation Letter</a>
              <a href="${downloadLink}" class="button" style="background: #28a745;">⬇️ Download Letter</a>
            </div>
            
            <p style="text-align: center; font-size: 18px; color: #28a745;"><strong>Congratulations to both you and your ward for this well-deserved recognition!</strong></p>
          </div>
          <div class="footer">
            <p><strong>With Pride & Joy,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>👨‍👩‍👧‍👦 Celebrating Student Excellence Together</p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Committee appointments parent notification
  if (letterType === 'Committee Letter') {
    return `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #fd7e14 0%, #e8590c 100%);">
            <h1>🎖️ Leadership Achievement!</h1>
          </div>
          <div class="content">
            <p>Dear Parent/Guardian,</p>
            <p>We are pleased to inform you about your ward's leadership appointment!</p>
            
            <div class="details-box">
              <h3 style="color: #fd7e14; margin-top: 0;">Appointment Details</h3>
              <div class="detail-row"><strong>👤 Student Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>🏅 Position:</strong> ${
                subType || "Committee Member"
              }</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${
                batch
                  ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                  : ""
              }
              <div class="detail-row"><strong>📅 Appointment Date:</strong> ${formattedDate}</div>
            </div>
            
            <div class="success-box">
              <p><strong>🌟 A Proud Moment</strong></p>
              <p>Your ward has been recognized for their leadership qualities and has been appointed to a committee position. This achievement reflects:</p>
              <ul>
                <li>Leadership capabilities</li>
                <li>Responsibility and maturity</li>
                <li>Peer recognition</li>
                <li>Organizational trust</li>
                <li>Personal development</li>
              </ul>
              <p>Committee positions provide valuable experience in leadership, teamwork, and organizational management that will benefit their professional future.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #fd7e14;">🔍 View Appointment Letter</a>
              <a href="${downloadLink}" class="button" style="background: #fd7e14;">⬇️ Download Letter</a>
            </div>
            
            <p style="text-align: center; font-size: 18px; color: #fd7e14;"><strong>Congratulations on your ward's leadership recognition!</strong></p>
          </div>
          <div class="footer">
            <p><strong>With Pride,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>👨‍👩‍👧‍👦 Nurturing Future Leaders Together</p>
            <p>📞 Support: +91 9892398976</p>
             <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generic parent notification for other letter types
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyle}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 Parent Notification</h1>
        </div>
        <div class="content">
          <p>Dear Parent/Guardian,</p>
          <p>We are writing to inform you about an official document issued to your ward.</p>
          
          <div class="details-box">
            <h3 style="color: #667eea; margin-top: 0;">Document Details</h3>
            <div class="detail-row"><strong>👤 Student Name:</strong> ${userName}</div>
            <div class="detail-row"><strong>📄 Document Type:</strong> ${letterType}${
    subType ? ` - ${subType}` : ""
  }</div>
            <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
            <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
            ${
              batch
                ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>`
                : ""
            }
            <div class="detail-row"><strong>📅 Issue Date:</strong> ${formattedDate}</div>
          </div>
          
          <div class="info-box">
            <p><strong>📌 Parent Communication</strong></p>
            <p>As part of our parent engagement initiative, we keep parents informed about all official communications sent to students.</p>
            <p>We encourage you to:</p>
            <ul>
              <li>Review the document with your ward</li>
              <li>Discuss its contents and implications</li>
              <li>Provide guidance as needed</li>
              <li>Support their academic/professional journey</li>
            </ul>
            <p>Your involvement plays a crucial role in your ward's success and development.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" class="button">🔍 View Document</a>
            <a href="${downloadLink}" class="button">⬇️ Download Document</a>
          </div>
          
          <p>If you have any questions, concerns, or would like to discuss this matter, please feel free to contact our administrative office.</p>
        </div>
        <div class="footer">
          <p><strong>With Best Regards,</strong></p>
          <p><strong>${organizationName} Team</strong></p>
          <p>👨‍👩‍👧‍👦 Partners in Education & Development</p>
          <p>📞 Support: +91 9892398976</p>
           <p><strong>🌐 Nexcore Alliance</strong><br>Empowering global business solutions.</p>

      <p><strong>Head Office:</strong><br>🇮🇳 IN – India</p>

      <p><strong>Branch Offices:</strong><br>
        • QA – Qatar<br>
        • OM – Oman<br>
        • KW – Kuwait<br>
        • AE – UAE<br>
        • SA – Saudi Arabia
      </p>

      <p>🔗 <strong>Website:</strong> www.nexcorealliance.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send Parent Notification Email
 */
export const sendParentNotification = async (letterData, parentEmail) => {
  try {
    const {
      userName,
      letterType,
      subType,
    } = letterData;

    const emailHtml = getParentNotificationEmailTemplate(letterType, subType, letterData);
    const subject = `📢 Parent Notification: ${letterType} for ${userName} | ${letterData.organizationName || 'Nexcore Alliance'}`;

    const result = await sendEmail(parentEmail, subject, emailHtml);
    return result;
  } catch (error) {
    console.error('Parent Notification Error:', error);
    return {
      success: false,
      error: 'Failed to send parent notification'
    };
  }
};

// Export as a single default object
export default {
  
  sendCertificateNotification,
  
  sendLetterNotification,
  sendParentNotification,
  
  getLetterEmailTemplate,
  getParentNotificationEmailTemplate,
  sendEmail,
};