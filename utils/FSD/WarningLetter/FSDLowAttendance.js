// utils/FSD/WarningLetter/FSDLowAttendance.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawFSDLowAttendance = async (
  ctx,
  width,
  height,
  data,
  headerImg,
  footerImg,
  signatureImg,
  stampImg
) => {
  const {
    name,
    formattedDate,
    outwardNo,
    credentialId,
    attendancePercent, // e.g., "65"
  } = data;

  // Draw white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Draw Header
  if (headerImg) {
    ctx.drawImage(headerImg, 0, 0, width, 190);
  }

  // Draw Footer
  if (footerImg) {
    ctx.drawImage(footerImg, 0, height - 120, width, 120);
  }

  // Content Area
  const contentStartY = 210;
  const leftMargin = 70;
  const rightMargin = width - 80;
  const contentWidth = rightMargin - leftMargin;

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  let currentY = contentStartY;

  // Outward No
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 22;

  // Date
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 32;

  // To
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 32;
  ctx.fillText(name, leftMargin, currentY);
  currentY += 32;

  // Subject
  const subjectText =
    "Subject: Warning for Low Attendance – Students Acknowledgement Required";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 22);
  currentY += 12;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 28;

  // Paragraph 1 with attendance percentage
  const paragraph1 = `This  is to formally inform you that your attendance is **${attendancePercent}%** till date, which is below the minimum requirement set by **Nexcore Alliance LLP** for successful completion of the course.`;
  const parts1 = parseMarkdown(paragraph1);
  currentY = drawTextWithBold(
    ctx,
    parts1,
    leftMargin,
    currentY,
    16,
    contentWidth,
    20
  );
  currentY += 20;

  // Paragraph 2
  ctx.font = "16px 'Times New Roman'";
  const paragraph2 = `You are hereby warned to improve your attendance immediately. Please note that if your attendance does not improve in the upcoming month, the following actions will be taken:`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 20);
  currentY += 12;

  // Bullet points
  const bullet1 = `• Your placement process and issuance of the experience letter will be delayed by two months.`;
  currentY = wrapText(ctx, bullet1, leftMargin, currentY, contentWidth, 20);
  currentY += 12;

  const bullet2 = `• If your placement is delayed due to continued low attendance, you will also be required to pay the remaining ₹25,000 of your training fees after completion of three (3) months from the start of your course, irrespective of your placement status.`;
  currentY = wrapText(ctx, bullet2, leftMargin, currentY, contentWidth, 20);
  currentY += 14;

  // Paragraph 3
  const paragraph3 = `Regular attendance is a critical component of your learning and professional development. No further reminders will be given. Any continuation of such behavior will lead to the consequences mentioned above being enforced without exception.`;
  currentY = wrapText(ctx, paragraph3, leftMargin, currentY, contentWidth, 20);
  currentY += 14;

  // Closing
    ctx.font = "bold 16px 'Times New Roman'";

  const closing = `Kindly treat this letter as an official warning.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 20);
  // currentY += 18;



  // Signature and Stamp
  const signatureWidth = 160;
  const signatureHeight = 85;
  const stampWidth = 200;
  const stampHeight = 200;

  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 8,
      currentY - 3,
      signatureWidth,
      signatureHeight
    );
  }
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      currentY - 23,
      stampWidth,
      stampHeight
    );
  }
  currentY += signatureHeight + 12;

  // Credential ID
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, currentY);
  currentY += 25;

  // Student Acknowledgement
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Student Acknowledgement:", leftMargin, currentY);
  currentY += 22;

  ctx.font = "16px 'Times New Roman'";
  const ackText = `I, __________________________, acknowledge that I have received and read this Warning Letter issued by Nexcore Alliance LLP. I understand the contents, the disciplinary concern mentioned, and the consequences outlined herein.`;
  currentY = wrapText(ctx, ackText, leftMargin, currentY, contentWidth, 20);
  currentY += 19;

  ctx.fillText(
    "Student Signature: __________________________",
    leftMargin,
    currentY
  );
  currentY += 19;
  ctx.fillText("Date: __________________________", leftMargin, currentY);

  // Verification footer (positioned absolutely)
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "To verify the authenticity of this certificate",
    width / 3.3,
    980
  );

  // Verification URL
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "https://portal.nexcorealliance.com/verify-certificate",
    width / 3.8,
    1000
  );
};

export default drawFSDLowAttendance;
