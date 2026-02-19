// utils/FSD/WarningLetter/FSDPunctuality.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawBVOCPunctuality = async (
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
    ctx.drawImage(headerImg, 0, 0, width, 185);
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
  let currentY = contentStartY - 10;

  // Outward No
  ctx.font = "bold 15px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 20;

  // Date
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 30;

  // To
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 30;
  ctx.fillText(name, leftMargin, currentY);
  currentY += 30;

  // Subject
  const subjectText =
    "Subject: Warning Regarding Punctuality and Professional Discipline";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 21);
  currentY += 10;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 26;

  // Paragraph 1
  const paragraph1 = `This  is to formally inform you that you have accumulated more than three **(3) late marks** during your ongoing **B.Voc Training Program** at **Nexcore Alliance LLP**. This reflects a continued lack of punctuality and non-adherence to the training schedule, which is not acceptable and has been recorded as a disciplinary concern.`;
  const parts1 = parseMarkdown(paragraph1);
  currentY = drawTextWithBold(
    ctx,
    parts1,
    leftMargin,
    currentY,
    15,
    contentWidth,
    19
  );
  currentY += 18;

  // Paragraph 2
  ctx.font = "15px 'Times New Roman'";
  const paragraph2 = `You are hereby warned to maintain punctuality and discipline with immediate effect. Please note that if this behaviour continues, the following actions will be taken:`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 19);
  currentY += 15;

  // Bullet points
  const bullet1 = `• Your placement process and issuance of the experience letter will be delayed.`;
  currentY = wrapText(ctx, bullet1, leftMargin, currentY, contentWidth, 19);
  currentY += 15;

  const bullet2 = `• You will still be required to pay the remaining ₹25,000 program fee after completion of three (3) months from the start of your course, irrespective of your placement status.`;
  currentY = wrapText(ctx, bullet2, leftMargin, currentY, contentWidth, 19);
  currentY += 18;

  // Paragraph 3
  const paragraph3 = `Punctuality and regular participation are essential parts of your professional conduct and directly impact your placement readiness.`;
  currentY = wrapText(ctx, paragraph3, leftMargin, currentY, contentWidth, 19);
  currentY += 18;

  // Closing
  ctx.font = "bold 15px 'Times New Roman'";
  const closing = `This serves as a formal warning, and no further reminders will be issued. Continued violation of attendance and discipline norms will lead to enforcement of the actions mentioned above without exception.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 19);
  // currentY += 10;

  // Signature and Stamp
  const signatureWidth = 155;
  const signatureHeight = 75;
  const stampWidth = 192;
  const stampHeight = 192;

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
  currentY += signatureHeight + 20;

  // Credential ID
  ctx.font = "bold 15px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, currentY);
  currentY += 25;

  // Student Acknowledgement
  ctx.font = "bold 15px 'Times New Roman'";
  ctx.fillText("Student Acknowledgement:", leftMargin, currentY);
  currentY += 25;

  ctx.font = "15px 'Times New Roman'";
  const ackText = `I, __________________________, acknowledge that I have received and read this Warning Letter issued by Nexcore Alliance LLP. I understand the contents, the disciplinary concern mentioned, and the consequences outlined herein.`;
  currentY = wrapText(ctx, ackText, leftMargin, currentY, contentWidth, 19);
  currentY += 15;

  ctx.fillText(
    "Student Signature: __________________________",
    leftMargin,
    currentY
  );
  currentY += 30;
  ctx.fillText("Date: __________________________", leftMargin, currentY - 2);

  // Verification footer (positioned absolutely)
  ctx.font = "16px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "To verify the authenticity of this certificate",
    width / 3.3,
    985
  );

  // Verification URL
  ctx.font = "16px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "https://portal.nexcorealliance.com/verify-certificate",
    width / 3.8,
    1000
  );
};

export default drawBVOCPunctuality;
