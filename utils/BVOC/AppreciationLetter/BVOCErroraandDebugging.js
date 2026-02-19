import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawBVOCDebugging = async (
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
    testingPhase,
    uncover,
  } = data;

  // Draw white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // =====================================================
  // Draw Header (top 190px)
  // =====================================================
  if (headerImg) {
    ctx.drawImage(headerImg, 0, 0, width, 190);
  }

  // =====================================================
  // Draw Footer (bottom 120px)
  // =====================================================
  if (footerImg) {
    ctx.drawImage(footerImg, 0, height - 120, width, 120);
  }

  // =====================================================
  // Content Area
  // =====================================================
  const contentStartY = 210;
  const leftMargin = 70;
  const rightMargin = width - 80;
  const contentWidth = rightMargin - leftMargin;

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  let currentY = contentStartY;

  // Outward No (left aligned, bold)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 25;

  // Date (left aligned, bold)
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 40;

  // To
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 40;
  ctx.fillText(name, leftMargin, currentY);
  currentY += 40;

  // Subject (bold)
  ctx.font = "bold 18px 'Times New Roman'";
  const subjectText =
    "Subject: Appreciation for Detecting Errors and Debugging";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 15;

  // Dear (bold)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 35;

  // Main content with dynamic fields
  const paragraph1 = `We  would like to extend our sincere appreciation for your commendable efforts in detecting and reporting multiple issues during the **${testingPhase}**.`;
  const parts1 = parseMarkdown(paragraph1);
  currentY = drawTextWithBold(
    ctx,
    parts1,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 25;

  // Second paragraph with dynamic field
  const paragraph2 = `Your  detailed and consistent observations helped uncover **${uncover}**, contributing to the enhancement of our system's overall performance and stability.`;
  const parts2 = parseMarkdown(paragraph2);
  currentY = drawTextWithBold(
    ctx,
    parts2,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 25;

  // Third paragraph (regular)
  ctx.font = "18px 'Times New Roman'";
  const paragraph3 = `Your structured feedback and dedication to quality assurance reflect a strong sense of responsibility and professionalism.`;
  currentY = wrapText(ctx, paragraph3, leftMargin, currentY, contentWidth, 23);
  currentY += 25;

  // Fourth paragraph (regular)
  const paragraph4 = `We truly value your contribution and encourage you to continue demonstrating the same level of diligence and excellence in future testing and debugging tasks.`;
  currentY = wrapText(ctx, paragraph4, leftMargin, currentY, contentWidth, 23);
  currentY += 40;

  // Warm regards
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText("Warm regards,", leftMargin, currentY);
  currentY += 40;

  // =====================================================
  // Signature (left) and Stamp (right) - Fixed position
  // =====================================================
  const signatureWidth = 190;
  const signatureHeight = 100;
  const stampWidth = 200;
  const stampHeight = 200;

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
  ctx.font = "bold 18px 'Times New Roman'";
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

export default drawBVOCDebugging;
