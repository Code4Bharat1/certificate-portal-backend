// utils/FSD/WarningLetter/FSDUnauthorizedAbsence.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawODUnauthorizedAbsence = async (
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
  const subjectText =
    "Subject: Warning for Unauthorized Absence";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 22);
  currentY += 20;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 28;

  // Paragraph 1
  const paragraph1 = `This  is to bring to your attention that you have accumulated more than three (3) instances of unauthorized absence from work without prior approval or valid justification. Such repeated unauthorized absences are a violation of the attendance and discipline policies of ** Nexcore Alliance LLP.**`;
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
  currentY += 20;

  // Paragraph 2
  ctx.font = "18px 'Times New Roman'";
  const paragraph2 = `Regular attendance is an essential aspect of professional responsibility, workplace discipline, and overall performance evaluation. Your continued unauthorized absence reflects a lack of professionalism and seriousness toward your assigned duties and responsibilities. Please note that non-compliance with attendance and leave procedures may adversely impact your performance appraisal and may result in further disciplinary action, as per Company policy.`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 20);
  currentY += 20;

  // Closing
  const closing = `You are hereby directed to take immediate corrective measures to improve your attendance and ensure strict adherence to the Company’s attendance and leave approval procedures.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 20);
  currentY += 40;

    ctx.font = "bold 18px 'Times New Roman'";

   const paragraphclosing = `Kindly treat this letter as an official warning.`;
   currentY = wrapText(ctx, paragraphclosing, leftMargin, currentY, contentWidth, 20);
   currentY += 28;
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
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, currentY);
  currentY += 25;

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

export default drawODUnauthorizedAbsence;
