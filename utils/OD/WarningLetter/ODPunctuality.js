// utils/FSD/WarningLetter/FSDPunctuality.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawODPunctuality = async (
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
  const contentStartY = 220;
  const leftMargin = 70;
  const rightMargin = width - 80;
  const contentWidth = rightMargin - leftMargin;

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  let currentY = contentStartY - 10;

  // Outward No
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 20;

  // Date
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 40;

  // To
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 40;
  ctx.fillText(name, leftMargin, currentY);
  currentY += 40;

  // Subject
  const subjectText =
    "Subject: Warning Regarding Punctuality and Professional Discipline";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 21);
  currentY += 20;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 26;

  // Paragraph 1
  const paragraph1 = `This  is to formally inform you that you have accumulated more than three (3) instances of late reporting during your employment with**Nexcore Alliance LLP.** This reflects a continued lack of punctuality and non-adherence to workplace discipline, which is unacceptable and has been recorded as a disciplinary concern.`;
  const parts1 = parseMarkdown(paragraph1);
  currentY = drawTextWithBold(
    ctx,
    parts1,
    leftMargin,
    currentY,
    18,
    contentWidth,
    19
  );
  currentY += 20;

  // Paragraph 2
  ctx.font = "18px 'Times New Roman'";
  const paragraph2 = `You are hereby warned to maintain punctuality and professional discipline with immediate effect. Please note that if this behavior continues, the following actions may be taken:`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 19);
  currentY += 20;

  // Bullet points
  const bullet1 = `• Your performance evaluation, appraisal, and related employment benefits may be adversely impacted, and`;
  currentY = wrapText(ctx, bullet1, leftMargin, currentY, contentWidth, 19);
  currentY += 15;

  const bullet2 = `• Continued non-compliance may result in disciplinary action, including formal warnings, deductions, promotion delay, or other corrective measures, as per Company policy.`;
  currentY = wrapText(ctx, bullet2, leftMargin, currentY, contentWidth, 19);
  currentY += 20;

  // Paragraph 3
  const paragraph3 = `Punctuality and regular attendance are essential components of professional conduct and directly affect workplace efficiency, team coordination, and overall performance.`;
  currentY = wrapText(ctx, paragraph3, leftMargin, currentY, contentWidth, 19);
  currentY += 20;

  // Closing
  const closing = `This letter serves as a formal warning, and no further reminders will be issued. Continued violation of punctuality and discipline norms will lead to strict enforcement of disciplinary actions without exception.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 19);
  currentY += 20;

  ctx.font = "bold 18px 'Times New Roman'";
  const closing2 = `Kindly treat this letter as an official warning.`;
  currentY = wrapText(ctx, closing2, leftMargin, currentY, contentWidth, 20);
  currentY;

  // Signature and Stamp
  const signatureWidth = 155;
  const signatureHeight = 75;
  const stampWidth = 145;
  const stampHeight = 105;

  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 8,
      currentY - 4,
      signatureWidth,
      signatureHeight
    );
  }
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      currentY - 14,
      stampWidth,
      stampHeight
    );
  }
  currentY += signatureHeight + 10;

  // Credential ID
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, currentY);
  currentY += 18;

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

export default drawODPunctuality;
