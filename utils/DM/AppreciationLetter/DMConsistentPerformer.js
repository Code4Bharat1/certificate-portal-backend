import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawDMConsistentPerformance = async (
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
  const subjectText = `Subject: Appreciation For Consistent Performer – ${name}`;
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 15;

  // Dear (regular)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 35;

  // Main content with bold elements
  const paragraph1 = `We  are pleased to recognize your dedication and reliability by presenting you with the **Consistent Performer** for your sustained commitment, technical excellence, and consistent performance throughout the **Digital Marketing (DM)** training program conducted by **Nexcore Alliance LLP**.`;
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

  // Second paragraph
  ctx.font = "18px 'Times New Roman'";
  const paragraph2 = `Your steady progress, active participation, and quality of work across all modules reflect true professionalism and a strong learning attitude. Your consistent effort and focus in areas such as campaign strategy, content planning, SEO, and analytics have set a benchmark of excellence and inspired your peers.`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 23);
  currentY += 25;

  // Third paragraph with bold elements
  const paragraph3 = `We congratulate you on this achievement and appreciate your continued consistency and dedication. Your performance truly reflects the values of perseverance and excellence that Nexcore Alliance LLP stands for.`;
  const parts3 = parseMarkdown(paragraph3);
  currentY = drawTextWithBold(
    ctx,
    parts3,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 40;

  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Warm regards,", leftMargin, currentY);
  currentY += 40;

  // =====================================================
  // Signature (left) and Stamp (right) - Fixed position
  // =====================================================
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

export default drawDMConsistentPerformance;
