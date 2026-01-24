//AppreciationTemplate.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawBVOCGeneralAppreciation = async (
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
    subject,
    month,
    year,
    description,
    formattedDate,
    outwardNo,
    credentialId,
  } = data;

  // Draw white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // =====================================================
  // Draw Header (top 150px)
  // =====================================================
  if (headerImg) {
    ctx.drawImage(headerImg, 0, 0, width, 190);
  }

  // =====================================================
  // Draw Footer (bottom 100px)
  // =====================================================
  if (footerImg) {
    ctx.drawImage(footerImg, 0, height - 120, width, 120);
  }

  // =====================================================
  // Content Area (between header and footer)
  // =====================================================
  const contentStartY = 210;
  const leftMargin = 70;
  const rightMargin = width - 80;
  const contentWidth = rightMargin - leftMargin;

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  let currentY = contentStartY;

  // Outward No (top right)
  ctx.font = "bold 16px 'Times New Roman'";
  const outwardText = `Outward No: ${outwardNo}`;
  const outwardWidth = ctx.measureText(outwardText).width;
  ctx.fillText(outwardText, leftMargin, currentY);
  currentY += 25;

  // Date (top right)
  const dateText = `Date: ${formattedDate}`;
  const dateWidth = ctx.measureText(dateText).width;
  ctx.fillText(dateText, leftMargin, currentY);
  currentY += 40;

  // "To,"
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 40;

  // Name (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(name, leftMargin, currentY);
  currentY += 40;

  // Subject
  ctx.font = "bold 16px 'Times New Roman'";
  const subjectText = `Subject: ${subject}`;
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 20;

  // Description with markdown bold support and paragraph handling
  const descriptionParts = parseMarkdown(description);
  currentY = drawTextWithBold(
    ctx,
    descriptionParts,
    leftMargin,
    currentY,
    16,
    contentWidth,
    23
  );
  currentY += 15;

  // "Warm regards,"
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Warm regards,", leftMargin, currentY);
  currentY += 40;

  // =====================================================
  // Signature (left) and Stamp (right)
  // =====================================================
  const signatureY = currentY;
  const signatureWidth = 190;
  const signatureHeight = 100;
  const stampWidth = 180;
  const stampHeight = 140;

  // Draw Signature (left)
  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 8,
      825,
      signatureWidth,
      signatureHeight
    );
  }

  // Draw Stamp (right, aligned with signature)
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      800,
      stampWidth,
      stampHeight
    );
  }

  // Credential ID (below signature)
  currentY = signatureY + signatureHeight + 15;
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, 940);
  currentY += 110;

  // Verification text
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "To verify the authenticity of this certificate",
    width / 3.3,
    980
  );
  currentY += 25;

  // Verification URL (in blue, underlined)
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  const verifyUrl = "https://portal.nexcorealliance.com/verify-certificate";
  ctx.fillText(verifyUrl, width / 3.8, 1000);
};

export default drawBVOCGeneralAppreciation;
