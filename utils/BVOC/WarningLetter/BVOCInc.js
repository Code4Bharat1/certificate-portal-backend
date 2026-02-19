// utils/FSD/WarningLetter/FSDIncompleteAssignment.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawBVOCIncompleteAssignment = async (
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
    subjectName, // e.g., "Python Programming"
    projectName, // e.g., "E-Commerce Backend API"
  } = data;

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

  // Content Area - adjusted to fit between header and footer
  const contentStartY = 210;
  const leftMargin = 70;
  const rightMargin = width - 80;
  const contentWidth = rightMargin - leftMargin;
  const maxContentY = height - 140; // Stop before footer with some padding

  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  let currentY = contentStartY;

  // Outward No
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 22;

  // Date
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 32;

  // To
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 32;
  ctx.fillText(name, leftMargin, currentY);
  currentY += 32;

  // Subject
  const subjectText =
    "Subject: Warning for Incomplete Assignment / Project Submissions";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 22);
  currentY += 12;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 28;

  // Paragraph 1 with bold elements
  const paragraph1 = `This  is to formally inform you that you have failed to submit your assignment / project work for **${subjectName}**, titled **${projectName}**, within the stipulated deadline as required under the **B.Voc** program conducted by **Nexcore Alliance LLP**.`;
  const parts1 = parseMarkdown(paragraph1);
  currentY = drawTextWithBold(
    ctx,
    parts1,
    leftMargin,
    currentY,
    16,
    contentWidth,
    20
  );
  currentY += 20;

  // Paragraph 2
  ctx.font = "16px 'Times New Roman'";
  const paragraph2 = `Timely submission of assignments and project tasks is an essential part of the training process and directly reflects your commitment to learning and professional growth. Failure to meet deadlines demonstrates a lack of discipline and seriousness toward the course expectations.`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 20);
  currentY += 20;

  // Paragraph 3
  const paragraph3 = `You are hereby instructed to complete and submit all pending work without any further delay. Non-compliance may result in loss of marks, restrictions on certification, or other disciplinary action as per the company's academic and training policies.`;
  currentY = wrapText(ctx, paragraph3, leftMargin, currentY, contentWidth, 20);
  currentY += 20;

  // Closing
  ctx.font = "bold 16px 'Times New Roman'";
  const closing = `Kindly treat this letter as an official warning and take immediate corrective action.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 20);
  currentY += 28;

  // Signature and Stamp - reduced sizes
  const signatureWidth = 180;
  const signatureHeight = 95;
  const stampWidth = 200;
  const stampHeight = 200;

  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 8,
      currentY,
      signatureWidth,
      signatureHeight
    );
  }
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      currentY - 20,
      stampWidth,
      stampHeight
    );
  }
  currentY += signatureHeight + 15;

  // Credential ID
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, currentY);
  currentY += 25;

  // Student Acknowledgement Section
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Student Acknowledgement:", leftMargin, currentY);
  currentY += 22;

  ctx.font = "16px 'Times New Roman'";
  const ackText = `I, __________________________, acknowledge that I have received and read this Warning Letter issued by Nexcore Alliance LLP. I understand the contents, the disciplinary concern mentioned, and the consequences outlined herein.`;
  currentY = wrapText(ctx, ackText, leftMargin, currentY, contentWidth, 20);
  currentY += 22;

  ctx.fillText(
    "Student Signature: __________________________",
    leftMargin,
    currentY
  );
  currentY += 20;
  ctx.fillText("Date: __________________________", leftMargin, currentY);
  currentY += 25;

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

export default drawBVOCIncompleteAssignment;
