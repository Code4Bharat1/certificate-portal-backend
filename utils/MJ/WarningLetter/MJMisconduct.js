// utils/FSD/WarningLetter/FSDMisconduct.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawMJMisconduct = async (
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
    misconductReason, // e.g., "use of offensive language toward a faculty member"
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
  currentY += 32;
  ctx.fillText(name, leftMargin, currentY);
  currentY += 32;

  // Subject
  const subjectText =
    "Subject: Warning for Misconduct or Disrespectful Behavior";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 22);
  currentY += 12;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 28;

  // Paragraph 1
  const paragraph1 = `This  is to bring to your notice that your recent conduct in the workplace has been found to be unprofessional and contrary to the code of conduct and behavioral standards prescribed by MarketIQ Junction (a Nexcore Company). It has been observed and/or reported that you engaged in the following behavior:`;
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

  // Misconduct reason (indented, bold)
  ctx.font = "bold 18px 'Times New Roman'";
  const reasonText = `• ${misconductReason}`;
  currentY = wrapText(
    ctx,
    reasonText,
    leftMargin + 20,
    currentY,
    contentWidth - 20,
    20
  );
  currentY += 20;

  // Paragraph 2
  ctx.font = "18px 'Times New Roman'";
  const paragraph2 = `Such actions disrupt the professional work environment and demonstrate a lack of discipline, respect, and professional ethics expected from employees of the Company. You are hereby warned to maintain appropriate workplace discipline, respect, and professional decorum at all times, including during office hours, meetings, and any company-related communication, whether online or offline.`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 20);
  currentY += 20;

  // Paragraph 3
  const paragraph3 = `Please note that any recurrence of such behavior will invite strict disciplinary action, which may include formal warnings, suspension, or termination of employment, in accordance with the Company’s HR policies and applicable rules.`;
  currentY = wrapText(ctx, paragraph3, leftMargin, currentY, contentWidth, 20);
  currentY += 28;

   ctx.font = "bold 18px 'Times New Roman'";
   const paragraph4 = `Kindly treat this letter as an official warning.`;
   currentY = wrapText(ctx, paragraph4, leftMargin, currentY, contentWidth, 20);
   currentY += 60;

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

export default drawMJMisconduct;
