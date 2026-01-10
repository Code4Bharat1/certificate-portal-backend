// utils/FSD/ConcernLetter.js
import parseMarkdown from "../ParseMarkdown.js";
import drawTextWithBold from "../TextWithBold.js";
import wrapText from "../WrapText.js";

const drawBVOCConcernLetter = async (
  ctx,
  width,
  height,
  data,
  headerImg,
  footerImg,
  signatureImg,
  stampImg
) => {
  const { name, formattedDate, outwardNo, credentialId, auditDate } = data;

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

  // Content Area - optimized spacing
  const contentStartY = 220;
  const leftMargin = 80;
  const rightMargin = width - 80;
  const contentWidth = rightMargin - leftMargin;

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  let currentY = contentStartY;

  // Outward No
  ctx.font = "bold 16px 'Times New Roman'";
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
  ctx.font = "bold 16px 'Times New Roman'";
  const subjectText = "Subject: Concern Letter – Audit Interview Performance";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 20);
  currentY += 15;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 25;

  // Paragraph 1 with audit date
  ctx.font = "16px 'Times New Roman'";
  const paragraph1 = `This is to inform you that your performance in the audit interview conducted on ${auditDate} has been found below the expected level.`;
  currentY = wrapText(ctx, paragraph1, leftMargin, currentY, contentWidth, 19);
  currentY += 18;

  // Paragraph 2 with bold elements
  const paragraph2 = `As  part of the **B.Voc program**, these audits are conducted to assess your technical understanding, coding ability, and overall preparedness. Based on your recent interaction, it has been observed that your conceptual clarity and consistency require improvement.`;
  const parts2 = parseMarkdown(paragraph2);
  currentY = drawTextWithBold(
    ctx,
    parts2,
    leftMargin,
    currentY,
    16,
    contentWidth,
    19
  );
  currentY += 18;

  // "You are advised to:" heading
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("You are advised to:", leftMargin, currentY);
  currentY += 20;

  // Bullet points
  ctx.font = "16px 'Times New Roman'";
  const bullets = [
    "Revise the covered modules and assignments thoroughly.",
    "Seek assistance from mentors or attend support sessions as required.",
    "Prepare diligently for the upcoming audits and classroom evaluations.",
  ];

  bullets.forEach((bullet) => {
    // Draw bullet point
    ctx.fillText("•", leftMargin + 15, currentY);
    // Draw bullet text with left indent
    const bulletY = wrapText(
      ctx,
      bullet,
      leftMargin + 35,
      currentY,
      contentWidth - 35,
      19
    );
    currentY = bulletY + 6;
  });

  currentY += 15;

  // Paragraph 3 with bold elements
  const paragraph3 = `Please  note that continued poor performance or lack of improvement will be monitored closely and may affect your overall evaluation and **placement eligibility**.`;
  const parts3 = parseMarkdown(paragraph3);
  currentY = drawTextWithBold(
    ctx,
    parts3,
    leftMargin,
    currentY,
    14,
    contentWidth,
    19
  );
  currentY += 18;

  // Closing
  ctx.font = "bold 16px 'Times New Roman'";
  const closing = `We trust you will take this feedback seriously and work towards better results in the future.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 19);
  currentY += 25;

  // Signature and Stamp - properly sized
  const signatureWidth = 140;
  const signatureHeight = 75;
  const stampWidth = 130;
  const stampHeight = 110;

  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 5,
      currentY,
      signatureWidth,
      signatureHeight
    );
  }
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth - 10,
      currentY - 15,
      stampWidth,
      stampHeight
    );
  }
  currentY += signatureHeight + 10;

  // Credential ID
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, currentY);
  currentY += 25;

  // Student Acknowledgement Section
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Student Acknowledgement:", leftMargin, currentY);
  currentY += 20;

  ctx.font = "16px 'Times New Roman'";
  const ackText = `I, ________________________________, acknowledge that I have received and read this Concern Letter issued by Nexcore Alliance LLP. I understand the contents, the concern mentioned, and the consequences outlined herein.`;
  currentY = wrapText(ctx, ackText, leftMargin, currentY, contentWidth, 19);
  currentY += 15;

  ctx.fillText(
    "Student Signature: _________________________________",
    leftMargin,
    currentY
  );
  currentY += 18;
  ctx.fillText("Date: _________________________________", leftMargin, currentY);
  currentY += 25;

  // Verification footer (positioned absolutely)
  ctx.font = "16px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "To verify the authenticity of this certificate",
    width / 3.3,
    980
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

export default drawBVOCConcernLetter;
