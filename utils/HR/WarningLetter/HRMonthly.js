// utils/FSD/WarningLetter/FSDLowAttendance.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawHRMonthly = async (
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
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 22;

  // Date
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 32;

  // To
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 40;
  ctx.fillText(name, leftMargin, currentY);
  currentY += 40;

  // Subject
  const subjectText = "Subject: Warning for Low Attendance";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 22);
  currentY += 25;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 25;

  // Paragraph 1 with attendance percentage
  const paragraph1 = `This  is to formally inform you that your attendance for the current month is **${attendancePercent}%,** which is below the minimum monthly attendance requirement set by ** Nexcore Alliance LLP** for employees.`;
  const parts1 = parseMarkdown(paragraph1);
  currentY = drawTextWithBold(
    ctx,
    parts1,
    leftMargin,
    currentY,
    18,
    contentWidth,
    20
  );
  currentY += 10;

  // Paragraph 2
  ctx.font = "18px 'Times New Roman'";
  const paragraph2 = `You are hereby warned to improve your attendance immediately. Please note that if your attendance does not improve in the upcoming month, the following actions will be taken:`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 20);
  currentY += 10;

  // Bullet points
  const bullet1 = `• Your performance review, appraisal, and related employment benefits may be impacted, and`;
  currentY = wrapText(ctx, bullet1, leftMargin, currentY, contentWidth, 20);
  currentY += 12;

  const bullet2 = `• Continued low attendance may result in disciplinary action, including warnings, stipend adjustments, or other corrective measures, promotion delay as per the Company’s HR and attendance policies.`;
  currentY = wrapText(ctx, bullet2, leftMargin, currentY, contentWidth, 20);
  currentY += 10;

  // Paragraph 3
  const paragraph3 = `Regular monthly attendance is a critical component of workplace discipline, productivity, and professional responsibility. No further reminders will be issued. Any continuation of such behavior will lead to the strict enforcement of the consequences mentioned above, without exception.`;
  currentY = wrapText(ctx, paragraph3, leftMargin, currentY, contentWidth, 20);
  currentY += 60;

  // Closing
  ctx.font = "bold 18px 'Times New Roman'";

  const closing = `Kindly treat this letter as an official warning.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 20);
  currentY;

  // Signature and Stamp
  const signatureWidth = 160;
  const signatureHeight = 85;
  const stampWidth = 150;
  const stampHeight = 120;

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
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, currentY);
  currentY += 22;

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

export default drawHRMonthly;
