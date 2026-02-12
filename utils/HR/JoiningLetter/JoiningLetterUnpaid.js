import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawHRJoiningLetterUnpaid = async (
  ctx,
  width,
  height,
  data,
  headerImg,
  footerImg,
  signatureImg,
  stampImg,
  page
) => {
  const {
    name,
    role,
    trainingPeriod,
    trainingStartDate,
    trainingEndDate,
    officialStartDate,
    completionDate,
    responsibilities,
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
  // Content Area
  // =====================================================
  const contentStartY = 210;
  const leftMargin = 70;
  const rightMargin = width - 80;
  const contentWidth = rightMargin - leftMargin;

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  let currentY = contentStartY;

  if (page === 1) {
    // ==================== PAGE 1 ====================

    // Outward No (left aligned, bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
    currentY += 25;

    // Date (left aligned, bold)
    ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
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
    const subjectText = `Subject: Internship Joining Letter – ${name}`;
    currentY = wrapText(
      ctx,
      subjectText,
      leftMargin,
      currentY,
      contentWidth,
      25
    );
    currentY += 15;

    // Dear [Name] (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText(`Dear ${name},`, leftMargin, currentY);
    currentY += 30;

    // Congratulations
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("Congratulations!", leftMargin, currentY);
    currentY += 30;

    // Intro paragraph
    ctx.font = "16px 'Times New Roman'";
    const introPara = `We  are pleased to confirm your selection for the position of HR  **${role}** at **Nexcore Alliance LLP**. This letter serves as your official joining confirmation and outlines the details of your internship.`;
    const introParts = parseMarkdown(introPara);
    currentY = drawTextWithBold(
      ctx,
      introParts,
      leftMargin,
      currentY,
      16,
      contentWidth,
      23
    );
    currentY += 25;

    // Second paragraph
    const welcomePara =
      "We are delighted to welcome you to our team and look forward to your active engagement, learning, and contributions throughout your internship tenure.";
    currentY = wrapText(
      ctx,
      welcomePara,
      leftMargin,
      currentY,
      contentWidth,
      23
    );
    currentY += 30;

    // NOTE (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    const notePara =
      "NOTE: In the absence of a valid experience letter, this offer letter will be deemed invalid.";
    currentY = wrapText(ctx, notePara, leftMargin, currentY, contentWidth, 23);
    currentY += 35;

    // Internship Details Header (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("Internship Details", leftMargin, currentY);
    currentY += 45;

    // Details List
    ctx.font = "bold 16px 'Times New Roman'";
    const details = [
      `• Position: ${role}`,
      `• Location: Mumbai, India (Work-from-office at OFF BKC, Mumbai)`,
      `• Training Start Date: ${trainingStartDate}`,
      `• Training Duration: ${trainingEndDate}`,
      `• Official Internship Start Date: ${officialStartDate}`,
      `• Internship Completion Date: ${completionDate}`,
      `• Internship Duration: 6 months (post-training)`,
      `• Working Hours: 8 hours per day (as per standard norms)`,
      `• Weekly Off: 1 day (Sunday)`,
    ];

    details.forEach((detail) => {
      currentY = wrapText(ctx, detail, leftMargin, currentY, contentWidth, 25);
    });
    currentY += 25;
  } else if (page === 2) {
    // ==================== PAGE 2 ====================

    currentY = contentStartY + 30;

    // Roles and Responsibilities Header (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("Roles and Responsibilities", leftMargin, currentY);
    currentY += 20;

    // Responsibilities text
    ctx.font = "16px 'Times New Roman'";
    const responsibilitiesParts = parseMarkdown(responsibilities);
    currentY = drawTextWithBold(
      ctx,
      responsibilitiesParts,
      leftMargin,
      currentY,
      16,
      contentWidth,
      23
    );

    // Note about training extension
    ctx.font = "16px 'Times New Roman'";
    const trainingNote =
      "**Please  note** that if you are unable to meet the required learning outcomes or skill proficiency during the training period, the company reserves the right to extend your training duration until the expected standards are achieved.";
    const trainingNoteParts = parseMarkdown(trainingNote);
    currentY = drawTextWithBold(
      ctx,
      trainingNoteParts,
      leftMargin,
      currentY + 25,
      16,
      contentWidth,
      23
    );
    currentY += 10;

    // Performance-Based Evaluation Header (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("Performance-Based Evaluation", leftMargin, currentY);
    currentY += 30;

    // Training details paragraph
    
   ctx.font = "18px 'Times New Roman'";
   const trainingPara = `Your initial training period of ${trainingPeriod} days will cover onboarding, technical orientation, and tool familiarization. Upon successful completion of training, your formal internship phase will commence.`;
    currentY = wrapText(
      ctx,
      trainingPara,
      leftMargin,
      currentY-10,
      contentWidth,
      23
    );
    currentY += 10;

    // Performance paragraph
    const performancePara =
      "Your training will cover HR onboarding processes, recruitment fundamentals, documentation management, communication protocols, and familiarization with HR tools and platforms. Upon successful completion of the training period, your formal internship phase will begin. Your performance will be reviewed periodically, and based on your progress, professionalism, and consistency, you may become eligible for a performance-based stipend as well as additional HR responsibilities. The detailed evaluation criteria will be shared with you during the onboarding process.";
    currentY = wrapText(
      ctx,
      performancePara,
      leftMargin,
      currentY-10,
      contentWidth,
      23
    );
    currentY += 10;

    // Closing paragraph
    const closingPara =
      "We believe this internship will offer a strong foundation for your career in Human Resource, and we are committed to supporting your growth every step of the way.";
    currentY = wrapText(
      ctx,
      closingPara,
      leftMargin,
      currentY-10,
      contentWidth,
      23
    );
    currentY += 5;

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
        850,
        signatureWidth,
        signatureHeight
      );
    }

    // Draw Stamp (right, aligned with signature) - fixed position
    if (stampImg) {
      ctx.drawImage(
        stampImg,
        rightMargin - stampWidth,
        825,
        stampWidth,
        stampHeight
      );
    }

    // Credential ID (below signature) - fixed position
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, 965);

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
  }
};

export default drawHRJoiningLetterUnpaid;
