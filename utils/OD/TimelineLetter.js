import parseMarkdown from "../ParseMarkdown.js";
import drawTextWithBold from "../TextWithBold.js";
import wrapText from "../WrapText.js";

const drawODTimelineLetter = async (
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
    timelineStage,
    timelineProjectName,
    timelineDueDate,
    timelineNewDate,
    formattedDate,
    outwardNo,
    credentialId,
    address,
  } = data;

  // console.log("📋 Timeline Letter Data:", {
  //   name,
  //   timelineStage,
  //   timelineProjectName,
  //   timelineDueDate,
  //   timelineNewDate,
  //   formattedDate,
  //   outwardNo,
  //   credentialId,
  // });

  // ✅ Fixed date formatting to DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) {
      console.error("❌ Date is undefined or null:", dateStr);
      return "Invalid Date";
    }

    try {
      const date = new Date(dateStr);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("❌ Invalid date string:", dateStr);
        return "Invalid Date";
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error(
        "❌ Date formatting error:",
        error,
        "Date string:",
        dateStr
      );
      return "Invalid Date";
    }
  };

  const formattedDueDate = formatDate(timelineDueDate);
  const formattedNewDate = formatDate(timelineNewDate);

  // console.log("📅 Formatted Dates:", {
  //   original_due: timelineDueDate,
  //   formatted_due: formattedDueDate,
  //   original_new: timelineNewDate,
  //   formatted_new: formattedNewDate,
  // });

  // ✅ Fixed stage text determination with proper validation
  let stageText = "First Official Warning"; // Default

  if (timelineStage) {
    const stageLower = timelineStage.toLowerCase().trim();

    if (stageLower === "first") {
      stageText = "First Official Warning";
    } else if (stageLower === "second") {
      stageText = "Second Official Warning";
    } else if (stageLower === "final") {
      stageText = "Final Official Warning";
    } else {
      console.warn("⚠️ Unknown timeline stage:", timelineStage);
    }
  } else {
    console.warn("⚠️ Timeline stage is undefined, using default");
  }

  // console.log("📊 Stage Text:", {
  //   received: timelineStage,
  //   mapped: stageText,
  // });

  // ✅ Validate project name
  const projectName = timelineProjectName || "Unnamed Project";
  // console.log("📝 Project Name:", {
  //   received: timelineProjectName,
  //   using: projectName,
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

  // To (bold)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 40;

  // Name (bold)
  ctx.fillText(name, leftMargin, currentY);
  currentY += 40;

  // Subject (bold, wrapped)
  ctx.font = "bold 18px 'Times New Roman'";
  const subjectText =
    "Subject: Warning for Non-Completion of Assigned Task within Deadline";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 3;

  // Greeting (bold)
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 35;

  // First paragraph with bold stage
  ctx.font = "18px 'Times New Roman'";
  const firstParagraph = `This  letter serves as a formal **${stageText}** regarding your failure to complete the assigned task/project titled **${projectName}**, which was due on **${formattedDueDate}**.`;
  const firstParts = parseMarkdown(firstParagraph);
  currentY = drawTextWithBold(
    ctx,
    firstParts,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 15;

  // Second paragraph
  ctx.font = "18px 'Times New Roman'";
  const secondParagraph =
    "Despite clear instructions and sufficient time provided, the task remains incomplete beyond the stipulated timeline.";
  currentY = wrapText(
    ctx,
    secondParagraph,
    leftMargin,
    currentY,
    contentWidth,
    23
  );
  currentY += 15;

  // Instructions header (bold)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText("You are hereby instructed to:", leftMargin, currentY);
  currentY += 25;

  // Bullet points
  ctx.font = "18px 'Times New Roman'";
  const bulletPoints = [
    `Complete and submit the pending deliverables by**${formattedNewDate}.**`,
    "Provide daily progress updates to your reporting manager until the task is completed.",
    "Ensure strict compliance with all future project timelines.",
  ];

  bulletPoints.forEach((point) => {
    ctx.fillText("•", leftMargin, currentY);
    const parts = parseMarkdown(point);
    drawTextWithBold(
      ctx,
      parts,
      leftMargin + 20,
      currentY,
      18,
      contentWidth - 20,
      23
    );
    currentY += 30;
  });

  currentY += 10;

  // Warning note (bold header)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText("Please note that:", leftMargin, currentY);
  currentY += 25;

  // Warning details
  ctx.font = "bold 18px 'Times New Roman'";
  const warningText = `This  is your**${stageText}.**Accumulation of three (3) such timeline warnings will result in termination of employment due to continuous non-performance and failure to meet assigned deadlines.`;
  const warningParts = parseMarkdown(warningText);
  currentY = drawTextWithBold(
    ctx,
    warningParts,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 15;

  // Closing paragraph
  ctx.font = "bold    18px 'Times New Roman'";
  const closingText =
    "We urge you to treat this matter with utmost seriousness and demonstrate immediate improvement in your work performance.";
  currentY = wrapText(ctx, closingText, leftMargin, currentY, contentWidth, 23);
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
      signatureY,
      signatureWidth,
      signatureHeight
    );
  }

  // Draw Stamp (right, aligned with signature)
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      signatureY - 25,
      stampWidth,
      stampHeight
    );
  }

  // Credential ID (below signature)
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`CREDENTIAL ID: ${credentialId}`, leftMargin, 940);

  // Verification text
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "To verify the authenticity of this certificate:",
    width / 3.3,
    980
  );

  // Verification URL
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  const verifyUrl = "https://portal.nexcorealliance.com/verify-certificate";
  ctx.fillText(verifyUrl, width / 3.8, 1000);

  // console.log("✅ Timeline letter drawn successfully");
};

export default drawODTimelineLetter;
