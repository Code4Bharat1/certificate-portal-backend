import parseMarkdown from "../ParseMarkdown.js";
import drawTextWithBold from "../TextWithBold.js";
import wrapText from "../WrapText.js";

const drawODEL = async (
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
    role,
    startDate,
    endDate,
    description,
    genderPronoun,
    formattedDate,
    outwardNo,
    credentialId,
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
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 25;

  // Date (left aligned, bold)
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 40;

  // Subject (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  const subjectText = `Subject: Experience Certificate – ${name}`;
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 15;

  // To Whom It May Concern (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("To Whom It May Concern,", leftMargin, currentY);
  currentY += 35;

  // Certification paragraph with bold elements
  ctx.font = "16px 'Times New Roman'";
  const certificationText = `This  is to certify that **${name}** was associated with **Nexcore Alliance LLP** as a **${role}** from **${startDate}** to **${endDate}**.`;
  const certificationParts = parseMarkdown(certificationText);
  currentY = drawTextWithBold(
    ctx,
    certificationParts,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 15;

  // Description content (from frontend input)
  if (description) {
    ctx.font = "16px 'Times New Roman'";
    const descriptionParts = parseMarkdown(description);
    currentY = drawTextWithBold(
      ctx,
      descriptionParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 15;
  }

  // Recommendation paragraph (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  const recommendationText = `We value ${
    genderPronoun || "their"
  } contributions and confidently recommend ${
    genderPronoun === "his" ? "him" : genderPronoun === "her" ? "her" : "them"
  } for future opportunities that align with ${
    genderPronoun || "their"
  } skills and aspirations.`;
  currentY = wrapText(
    ctx,
    recommendationText,
    leftMargin,
    currentY,
    contentWidth,
    23
  );
  currentY += 25;

  // Warm regards (bold)
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

export default drawODEL;
