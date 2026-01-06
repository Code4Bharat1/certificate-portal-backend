// utils/FSD/WarningLetter/FSDUnauthorizedAbsence.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawBVOCUnauthorizedAbsence = async (
  ctx,
  width,
  height,
  data,
  headerImg,
  footerImg,
  signatureImg,
  stampImg
) => {
  const { name, formattedDate, outwardNo, credentialId } = data;

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
    "Subject: Warning for Unauthorized Absence from Training Sessions";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 22);
  currentY += 12;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 28;

  // Paragraph 1
  const paragraph1 = `This is to bring to your attention that you have accumulated more than three unauthorized leaves without prior permission or valid justification. Such repeated absences from scheduled training sessions violate the discipline and attendance policy of the **Full Stack Development** program conducted by **Nexcore Alliance LLP**.`;
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
  const paragraph2 = `Regular attendance is an essential part of your technical learning and overall performance evaluation. Your continued unauthorized absence demonstrates a lack of professionalism and seriousness toward the program's objectives. Please note that irregular attendance and non-compliance with training schedules can adversely affect your placement eligibility or lead to delays in placement opportunities, as active participation and consistency are key evaluation parameters for industry readiness.`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 20);
  currentY += 20;

  // Closing
  const closing = `Kindly treat this as an official warning and take immediate corrective measures to improve your attendance and commitment to the program.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 20);
  currentY += 28;

  // Authorized Signature
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Authorized Signature", leftMargin, currentY);
  currentY += 8;

  // Signature and Stamp
  const signatureWidth = 160;
  const signatureHeight = 85;
  const stampWidth = 150;
  const stampHeight = 120;

  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 8,
      currentY,
      signatureWidth,
      signatureHeight
    );
  }
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      currentY - 20,
      stampWidth,
      stampHeight
    );
  }
  currentY += signatureHeight + 15;

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
  currentY += 22;

  ctx.fillText(
    "Student Signature: __________________________",
    leftMargin,
    currentY
  );
  currentY += 20;
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

export default drawBVOCUnauthorizedAbsence;
