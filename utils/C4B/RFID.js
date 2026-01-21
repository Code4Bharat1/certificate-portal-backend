// utils/C4B/RFIDLetter.js
import wrapText from "../WrapText.js";
import parseMarkdown from "../ParseMarkdown.js";
import drawTextWithBold from "../TextWithBold.js";

const drawRFIDLetter = async (
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

  // console.log("📋 RFID Letter Data:", {
  //   name,
  //   formattedDate,
  //   outwardNo,
  //   credentialId,
  // });

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
  const leftMargin = 50;
  const rightMargin = width - 50;
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

  // Subject (bold, wrapped)
  ctx.font = "bold 16px 'Times New Roman'";
  const subjectText =
    "Subject: Appreciation for your contribution in RFID Project.";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 5;

  // Greeting (bold)
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 35;

  // Paragraph 1 - with bold portion
  const paragraph1 = `On behalf of the entire team at Nexcore Alliance, I would like to take this opportunity to express our sincere **appreciation for the outstanding work you have done during your internship with us.**`;
  const paragraph1Parts = parseMarkdown(paragraph1);
  currentY = drawTextWithBold(
    ctx,
    paragraph1Parts,
    leftMargin,
    currentY,
    16,
    contentWidth,
    23
  );
  currentY += 5;

  // Paragraph 2 - with bold portions
  const paragraph2 = `**Your  contributions to the project representing the Government of India and its UPI (Unified Payments Interface) at an international platform in Germany have been exceptional.**This project, which was of immense importance not only for our company but also for the nation, could not have been executed with such finesse and professionalism without your collective efforts. Your dedication, hard work, and creativity demonstrated throughout the project have not gone unnoticed. You've shown an admirable ability to adapt, collaborate, and innovate, all while maintaining a high level of commitment to excellence. It was truly a pleasure to see how you approached each challenge with enthusiasm and determination.`;
  const paragraph2Parts = parseMarkdown(paragraph2);
  currentY = drawTextWithBold(
    ctx,
    paragraph2Parts,
    leftMargin,
    currentY,
    16,
    contentWidth,
    23
  );
  currentY += 5;

  // Paragraph 4
  ctx.font = "16px 'Times New Roman'";
  const paragraph4 =
    "Representing India on such a prestigious international stage was no small feat, and your role in contributing to the success of this project is a testament to your skills and potential. This experience will undoubtedly serve as an invaluable asset as you move forward in your careers.";
  currentY = wrapText(ctx, paragraph4, leftMargin, currentY, contentWidth, 23);
  currentY += 5;

  // Paragraph 5
  const paragraph5 =
    "We are confident that the knowledge and experience you have gained here at Nexcore Alliance will play a significant role in shaping your future endeavors. We have no doubt that your talents will continue to shine and lead you to greater success in the professional world.";
  currentY = wrapText(ctx, paragraph5, leftMargin, currentY, contentWidth, 23);
  currentY += 5;

  // Paragraph 6
  const paragraph6 =
    "Once again, thank you for your hard work and dedication. We wish you all the best in your future endeavors, and we hope that you will continue to achieve great things.";
  currentY = wrapText(ctx, paragraph6, leftMargin, currentY, contentWidth, 23);
  currentY += 5;

  // Closing
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Warm regards,", leftMargin, currentY);
  currentY += 40;

  // =====================================================
  // Signature Section (Fixed Position)
  // =====================================================
  const signatureY = 825;
  const signatureWidth = 190;
  const signatureHeight = 100;
  const stampWidth = 180;
  const stampHeight = 140;

  // Draw Signature (left)
  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 8,
      signatureY + 20,
      signatureWidth,
      signatureHeight
    );
  }

  // Draw Stamp (right, aligned with signature)
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      signatureY - 5,
      stampWidth,
      stampHeight
    );
  }

  // Credential ID (below signature)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`CREDENTIAL ID: ${credentialId}`, leftMargin, 960);

  // Verification text
  ctx.font = "16px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "To verify the authenticity of this certificate:",
    width / 3.3,
    980
  );

  // Verification URL
  ctx.font = "16px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  const verifyUrl = "https://portal.nexcorealliance.com/verify-certificate";
  ctx.fillText(verifyUrl, width / 3.8, 1000);

  // console.log("✅ RFID letter drawn successfully");
};

export default drawRFIDLetter;
