// utils/BVOC/CommitteeLetter/VicePresident.js
import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawBVOCCommitteeVicePresident = async (
  ctx,
  width,
  height,
  data,
  headerImg,
  footerImg,
  signatureImg,
  stampImg
) => {
  const { name, formattedDate, outwardNo, credentialId, committeeType } = data;

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
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Outward No.: ${outwardNo}`, leftMargin, currentY);
  currentY += 20;

  // Date
  ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
  currentY += 30;

  // To
  ctx.fillText("To,", leftMargin, currentY);
  currentY += 40;
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(name, leftMargin, currentY);
  currentY += 40;
  ctx.fillText(
    "B.Voc in Artificial Intelligence and Machine Learning",
    leftMargin,
    currentY
  );
  currentY += 18;
  ctx.fillText("Nexcore Alliance LLP", leftMargin, currentY);
  currentY += 30;

  // Subject
  ctx.font = "bold 18px 'Times New Roman'";
  const subjectText = `Subject: Letter of Selection – ${committeeType} Committee Vice President`;
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 20);
  currentY += 20;

  // Salutation
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 25;

  // Paragraph 1
  ctx.font = "18px 'Times New Roman'";
  const paragraph1 = `We are pleased to inform you that, following the official voting process conducted among students and faculty members, you have been elected as the Vice President of the ${committeeType} Committee for the B.Voc in Artificial Intelligence and Machine Learning program.`;
  currentY = wrapText(ctx, paragraph1, leftMargin, currentY, contentWidth, 19);
  currentY += 18;

  // Paragraph 2
  const paragraph2 = `Your selection reflects the confidence your peers and faculty have in your leadership potential, teamwork, and commitment to contributing meaningfully to the committee's objectives. As the Vice President, you are entrusted with supporting the President in leading the committee's initiatives, coordinating activities, and fostering collaboration among members to ensure the successful execution of all endeavors.`;
  currentY = wrapText(ctx, paragraph2, leftMargin, currentY, contentWidth, 19);
  currentY += 18;

  // Closing
  const closing = `We congratulate you on this well-deserved selection and wish you continued success in all your future pursuits.`;
  currentY = wrapText(ctx, closing, leftMargin, currentY, contentWidth, 19);
  currentY += 25;

  // With best regards
    ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText("Warm regards,", leftMargin, currentY);
  currentY += 80;

  // Authorized Signature label
  // ctx.font = "bold 18px 'Times New Roman'";
  // ctx.fillText("Authorized Signature", leftMargin, currentY);
  // currentY += 10;

  // Signature and Stamp - properly sized and positioned
  const signatureWidth = 190;
  const signatureHeight = 105;
  const stampWidth = 160;
  const stampHeight = 130;

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
  currentY += signatureHeight + 15;

  // Credential ID
  ctx.font = "bold 18px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, currentY);

  // Verification footer (positioned absolutely)
  ctx.font = "18px 'Times New Roman'";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText(
    "To verify the authenticity of this certificate",
    width / 2,
    980
  );

  // Verification URL
  ctx.fillText(
    "https://portal.nexcorealliance.com/verify-certificate",
    width / 2,
    1000
  );
};

export default drawBVOCCommitteeVicePresident;
