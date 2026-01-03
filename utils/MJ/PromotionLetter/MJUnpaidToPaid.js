import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawMJUnpaidToPaid = async (
  ctx,
  width,
  height,
  data,
  headerImg,
  footerImg,
  signatureImg,
  stampImg
) => {
  const { name, effectiveFrom, formattedDate, outwardNo, credentialId } = data;

  // Draw white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Draw Header (top 190px)
  if (headerImg) {
    ctx.drawImage(headerImg, 0, 0, width, 190);
  }

  // Draw Footer (bottom 120px)
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

  // Outward No (left aligned, bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 25;

  // Date (left aligned, bold)
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 40;

  // To (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 40;

  // Name (bold)
  ctx.fillText(name, leftMargin, currentY);
  currentY += 40;

  // Subject (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  const subjectText = "Subject: Promotion from Non-Paid Intern to Paid Intern";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 30;

  // Dear Name (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 35;

  // Congratulations! (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Congratulations!", leftMargin, currentY);
  currentY += 30;

  // Promotion paragraph with bold elements
  ctx.font = "16px 'Times New Roman'";
  const promotionText = `We  are pleased to inform you that in recognition of your consistent performance, dedication, and valuable contribution during your internship at **Nexcore Alliance LLP**, you have been promoted from a **Non-Paid Intern** to a **Paid Intern** effective from **${effectiveFrom}**.`;
  const promotionParts = parseMarkdown(promotionText);
  currentY = drawTextWithBold(
    ctx,
    promotionParts,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 15;

  // Stipend paragraph with bold elements
  ctx.font = "16px 'Times New Roman'";
  const stipendText = `As  part of this promotion, you will now be entitled to a monthly stipend of **₹3,000 (Rupees Three Thousand only)** during the remaining period of your internship.`;
  const stipendParts = parseMarkdown(stipendText);
  currentY = drawTextWithBold(
    ctx,
    stipendParts,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 15;

  // Appreciation paragraph
  ctx.font = "16px 'Times New Roman'";
  const appreciationText = `We appreciate your efforts, positive attitude, and commitment toward learning and development. We are confident that you will continue to demonstrate the same level of enthusiasm and professionalism in the future as well.`;
  currentY = wrapText(
    ctx,
    appreciationText,
    leftMargin,
    currentY,
    contentWidth,
    23
  );
  currentY += 15;

  // Closing paragraph
  ctx.font = "16px 'Times New Roman'";
  const closingText = `Once again, congratulations on your well-deserved recognition. Keep up the good work and continue to grow with us.`;
  currentY = wrapText(ctx, closingText, leftMargin, currentY, contentWidth, 23);
  currentY += 30;

  // Warm regards (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Warm regards,", leftMargin, currentY);
  currentY += 40;

  // Signature and Stamp - Fixed position
  const signatureWidth = 190;
  const signatureHeight = 100;
  const stampWidth = 180;
  const stampHeight = 140;

  // Draw Signature (left) - fixed position
  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 8,
      825,
      signatureWidth,
      signatureHeight
    );
  }

  // Draw Stamp (right, aligned with signature) - fixed position
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      800,
      stampWidth,
      stampHeight
    );
  }

  // Credential ID (below signature) - fixed position
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, 940);

  // Verification text - fixed position
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "To verify the authenticity of this certificate",
    width / 3.3,
    980
  );

  // Verification URL - fixed position
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  const verifyUrl = "https://portal.nexcorealliance.com/verify-certificate";
  ctx.fillText(verifyUrl, width / 3.8, 1000);
};

export default drawMJUnpaidToPaid;
