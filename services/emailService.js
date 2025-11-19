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

  if (cat.includes("fsd")) {
    return {
      user: process.env.EMAIL_USER_FSD,
      pass: process.env.EMAIL_PASSWORD_FSD,
      fromName: "FSD Team",
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
            <div class="detail-row">
              <span class="detail-label">👤 Name:</span> ${userName}
            </div>
            <div class="detail-row">
              <span class="detail-label">🆔 Certificate ID:</span> ${certificateId}
            </div>
            <div class="detail-row">
              <span class="detail-label">📚 Course:</span> ${course}
            </div>
            <div class="detail-row">
              <span class="detail-label">🏷️ Category:</span> ${categoryDisplay}
            </div>
            <div class="detail-row">
              <span class="detail-label">📅 Issue Date:</span> ${formattedDate}
            </div>
            ${batch ? `<div class="detail-row"><span class="detail-label">🎓 Batch:</span> ${batch}</div>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" class="button">🔍 Verify Certificate</a>
            <a href="${downloadLink}" class="button">⬇️ Download Certificate</a>
          </div>
          
          <p>✨ Keep this certificate safe as proof of your achievement!</p>
          <p>📱 For any queries, feel free to reach out to us at <strong>+91 9892398976</strong></p>
        </div>
        <div class="footer">
          <p><strong>With Best Wishes,</strong></p>
          <p><strong>Nexcore Alliance Team</strong></p>
          <p><strong>Code4Bharat Initiative</strong></p>
          <p>💙 Keep Learning, Keep Growing!</p>
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

  // Get Terms & Conditions link
  const getTermsLink = () => {
    if (category?.toLowerCase().includes('fsd') || category?.toLowerCase().includes('dm')) {
      return 'https://forms.gle/FSD_DM_FORM_LINK';
    } else if (category?.toLowerCase().includes('marketing') || category?.toLowerCase().includes('mj') || 
               category?.toLowerCase().includes('code4bharat') || category?.toLowerCase().includes('c4b')) {
      return `${baseUrl}/termsandconditions/C4B`;
    } else {
      return 'https://forms.gle/HR_OPS_FORM_LINK';
    }
  };

  // Base HTML template style with enhanced styling
  const baseStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        background: #f5f5f5;
      }
      .container { 
        max-width: 650px; 
        margin: 20px auto; 
        background: #ffffff; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        border-radius: 12px;
        overflow: hidden;
      }
      .header { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
        padding: 40px 30px; 
        text-align: center; 
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .content { 
        background: white; 
        padding: 35px 30px; 
      }
      .content > p {
        margin-bottom: 15px;
        font-size: 15px;
      }
      .details-box { 
        background: linear-gradient(to right, #f8f9fa 0%, #ffffff 100%);
        border-left: 4px solid #667eea; 
        padding: 25px; 
        margin: 25px 0; 
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      .details-box h3 {
        margin: 0 0 15px 0;
        font-size: 18px;
      }
      .detail-row { 
        padding: 10px 0; 
        border-bottom: 1px solid #e9ecef;
        font-size: 14px;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .button { 
        display: inline-block; 
        padding: 14px 32px; 
        margin: 10px 8px; 
        background: #667eea; 
        color: white !important; 
        text-decoration: none; 
        border-radius: 6px; 
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      }
      .warning-box { 
        background: #fff8e1; 
        border-left: 5px solid #ffc107; 
        padding: 20px; 
        margin: 25px 0;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
      }
      .warning-box strong {
        color: #e65100;
      }
      .success-box { 
        background: #e8f5e9; 
        border-left: 5px solid #28a745; 
        padding: 20px; 
        margin: 25px 0;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(40, 167, 69, 0.1);
      }
      .success-box strong {
        color: #1b5e20;
      }
      .important-notice {
        background: #fff3e0;
        border: 2px solid #ff9800;
        border-radius: 8px;
        padding: 15px 20px;
        margin: 20px 0;
        text-align: center;
      }
      .important-notice p {
        margin: 5px 0;
        color: #e65100;
        font-weight: 600;
        font-size: 14px;
      }
      .footer { 
        text-align: center; 
        padding: 25px 20px; 
        color: #666; 
        font-size: 13px; 
        background: #f8f9fa; 
        border-top: 1px solid #e9ecef;
      }
      .footer p {
        margin: 5px 0;
      }
      .footer strong {
        color: #333;
      }
      ul { 
        padding-left: 25px; 
        margin: 10px 0;
      }
      li { 
        margin: 10px 0; 
        font-size: 14px;
      }
      ol {
        padding-left: 25px;
        margin: 10px 0;
      }
      ol li {
        margin: 12px 0;
        font-size: 14px;
      }
      @media only screen and (max-width: 600px) {
        .container { margin: 10px; }
        .content { padding: 25px 20px; }
        .button { 
          display: block; 
          margin: 10px 0; 
          text-align: center;
        }
      }
    </style>
  `;

  // Letter-specific templates
  const templates = {
    'Appreciation Letter': `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Excellence Recognized</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>We are delighted to recognize your <strong>${subType?.replace('Appreciation for ', '') || 'outstanding achievement'}</strong>!</p>
            
            <div class="details-box">
              <h3 style="color: #667eea; margin-top: 0;">Recognition Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>🎖️ Recognition:</strong> ${subType || 'Outstanding Performance'}</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${batch ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>` : ''}
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
          <div class="footer">
            <p><strong>With Pride & Highest Regards,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>📞 Support: +91 9892398976</p>
          </div>
        </div>
      </body>
      </html>
    `,

    'Warning Letter': `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
            <h1>⚠️ Official Warning</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>This is an <strong>official warning</strong> regarding ${subType?.replace('Warning for ', '').toLowerCase() || 'performance concerns'}.</p>
            
            <div class="details-box">
              <h3 style="color: #dc3545; margin-top: 0;">Warning Details</h3>
              <div class="detail-row"><strong>👤 Name:</strong> ${userName}</div>
              <div class="detail-row"><strong>⚠️ Subject:</strong> ${subType || 'Performance Warning'}</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${batch ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>` : ''}
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
              <p><strong>Consequences of Non-Compliance:</strong> Continued non-compliance may result in further disciplinary action.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #dc3545;">🔍 View Warning Letter</a>
              <a href="${downloadLink}" class="button" style="background: #dc3545;">⬇️ Download Letter</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>Academic Standards Office,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>📞 Support: +91 9892398976</p>
          </div>
        </div>
      </body>
      </html>
    `,

    'Offer Letter': `
      <!DOCTYPE html>
      <html>
      <head>${baseStyle}</head>
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
              ${batch ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>` : ''}
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
                <li>Fill the Terms & Conditions form: <a href="${getTermsLink()}" style="color: #667eea; font-weight: 600;">Click Here</a></li>
                <li>Sign the offer letter</li>
                <li>Send back the signed copy via email</li>
                <li>Complete pre-joining formalities</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button" style="background: #28a745;">🔍 View Offer Letter</a>
              <a href="${downloadLink}" class="button" style="background: #28a745;">⬇️ Download Letter</a>
            </div>
            
            <p style="text-align: center; color: #dc3545; font-weight: 600;"><strong>🔴 Important:</strong> Please send your signed copy to confirm acceptance!</p>
          </div>
          <div class="footer">
            <p><strong>With Excitement & Best Wishes,</strong></p>
            <p><strong>${organizationName} Team</strong></p>
            <p>🎯 Your Career, Our Commitment</p>
            <p>📞 Support: +91 9892398976</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // Return appropriate template or default
  return templates[letterType] || `
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
            <div class="detail-row"><strong>📋 Document:</strong> ${letterType}${subType ? ` - ${subType}` : ''}</div>
            <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
            <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
            ${batch ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>` : ''}
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
        </div>
      </div>
    </body>
    </html>
  `;
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
              <div class="detail-row"><strong>⚠️ Subject:</strong> ${subType?.replace('Warning for ', '') || 'Academic/Behavioral Warning'}</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${batch ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>` : ''}
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
              <div class="detail-row"><strong>🏆 Recognition:</strong> ${subType?.replace('Appreciation for ', '') || 'Outstanding Achievement'}</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${batch ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>` : ''}
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
              <div class="detail-row"><strong>🏅 Position:</strong> ${subType || 'Committee Member'}</div>
              <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
              <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
              ${batch ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>` : ''}
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
            <div class="detail-row"><strong>📄 Document Type:</strong> ${letterType}${subType ? ` - ${subType}` : ''}</div>
            <div class="detail-row"><strong>🆔 Credential ID:</strong> ${finalId}</div>
            <div class="detail-row"><strong>🏷️ Program:</strong> ${category}</div>
            ${batch ? `<div class="detail-row"><strong>📚 Batch:</strong> ${batch}</div>` : ''}
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