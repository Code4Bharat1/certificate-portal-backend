import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawDMBestAttendance = async (
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
    attendanceMonth,
    attendanceYear,
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
  const subjectText = `Subject: Appreciation For Best Attendance – ${name}`;
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 15;

  // Dear (regular)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 35;

  // Main content with bold elements
  const paragraph1 = `We  take great pleasure in recognizing your discipline and punctuality by awarding you the **Best Attendance** for the month of **${attendanceMonth}** in the **Full Stack Development (FSD)** program conducted by **Nexcore Alliance LLP**.`;
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
  const paragraph2 = `Your consistent presence in all training sessions demonstrates your professionalism, enthusiasm for learning, and commitment to personal and technical growth. Regular participation is a key factor in successful training outcomes and career readiness, and your approach serves as a role model for others.`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 23);
  currentY += 25;

  // Third paragraph
  const paragraph3 = `We congratulate you on this well-deserved achievement and appreciate your continued dedication. Maintain this positive attitude and consistency in the coming months.`;
  currentY = wrapText(ctx, paragraph3, leftMargin, currentY, contentWidth, 23);
  currentY += 25;

  // Closing (bold)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText("Keep up the excellent work!", leftMargin, currentY);
  currentY += 40;

  ctx.font = "bold 18px 'Times Roman'";
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

export default drawDMBestAttendance;
