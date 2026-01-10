// utils/FSD/LiveProjectAgreement.js
import parseMarkdown from "../ParseMarkdown.js";
import drawTextWithBold from "../TextWithBold.js";
import wrapText from "../WrapText.js";

const drawFSDLiveProjectAgreement = async (
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

  if (page === 1) {
    // ==================== PAGE 1 ====================

    // Outward No (bold)
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText(`Outward No.:- ${outwardNo}`, leftMargin, currentY);
    currentY += 25;

    // Date (bold)
    ctx.fillText(`Date: ${formattedDate}`, leftMargin, currentY);
    currentY += 35;

    // Title (bold, centered)
    ctx.font = "bold 20px 'Times New Roman'";
    ctx.textAlign = "center";
    ctx.fillText("LIVE PROJECT PARTICIPATION AGREEMENT", width / 2, currentY);
    ctx.textAlign = "left";
    currentY += 35;

    // First paragraph
    ctx.font = "18px 'Times New Roman'";
    const introPara = `This **Live Project Participation Agreement** is made and entered into on this **${formattedDate}**, by and between:`;
    const introParts = parseMarkdown(introPara);
    currentY = drawTextWithBold(
      ctx,
      introParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 25;

    // Company details
    const companyPara = `** Nexcore Alliance**, a brand of **Nexcore Alliance LLP**, a company incorporated under the **Limited Liability Partnership Act, 2008**, having its registered office at **Office No. 2, White House Bldg No. 3, Kurla West Basement, SG Barve Marg, Mumbai, Maharashtra, India 400070**, hereinafter referred to as the "Company";`;
    const companyParts = parseMarkdown(companyPara);
    currentY = drawTextWithBold(
      ctx,
      companyParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 25;

    // AND
    ctx.font = "18px 'Times New Roman'";
    ctx.fillText("AND", leftMargin, currentY);
    currentY += 25;

    // Recipient details
    const recipientPara = `** ${name}**, residing at **${
      data.address || "address not provided"
    }**, Aadhaar card no: **${
      data.aadhaarCard || "not provided"
    }**, hereinafter referred to as the "Participant" or "Intern";`;
    const recipientParts = parseMarkdown(recipientPara);
    currentY = drawTextWithBold(
      ctx,
      recipientParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 25;

    // WHEREAS clause
    ctx.font = "18px 'Times New Roman'";
    const whereas = "WHEREAS,";
    ctx.fillText(whereas, leftMargin, currentY);
    currentY += 23;

    const whereasPara = `The  Company provides technical training followed by hands-on exposure to **live client projects** (including international projects) to enhance real-world learning. The Participant, having successfully completed the initial training phase, is now being assigned to live project work under Nexcore Alliance . The Company expects all participants to maintain high standards of **professionalism, confidentiality, and responsibility** during this engagement.`;
    const whereasParts = parseMarkdown(whereasPara);
    currentY = drawTextWithBold(
      ctx,
      whereasParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 25;

    const nowTherefore = "NOW, THEREFORE, both parties agree as follows:";
    ctx.fillText(nowTherefore, leftMargin, currentY);
    currentY += 30;

    // Section 1
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("1. Purpose of Agreement", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section1Para = `The  purpose of this Agreement is to outline the **rules, responsibilities, and professional conduct** expected from the Participant while working on live projects handled by Nexcore Alliance .`;
    const section1Parts = parseMarkdown(section1Para);
    currentY = drawTextWithBold(
      ctx,
      section1Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );

    // Signature line and stamp at bottom of page 1
    const signatureLineY = 950;
    const stampWidth = 180;
    const stampHeight = 140;

    // ctx.font = "18px 'Times New Roman'";
    // ctx.fillText("Signature: ____________________", leftMargin, signatureLineY);

    // Draw Stamp (right aligned)
    // if (stampImg) {
    //   ctx.drawImage(
    //     stampImg,
    //     rightMargin - stampWidth,
    //     signatureLineY - 100,
    //     stampWidth,
    //     stampHeight
    //   );
    // }
  } else if (page === 2) {
    // ==================== PAGE 2 ====================

    currentY = contentStartY;

    // Section 2
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText(
      "2. Confidentiality and Data Protection",
      leftMargin,
      currentY
    );
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";

    const section2a =
      "(a) The Participant may have access to **sensitive company or client data**, including project plans, source code, documentation, credentials, or communication details.";
    const section2aParts = parseMarkdown(section2a);
    currentY = drawTextWithBold(
      ctx,
      section2aParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section2b =
      "(b) All such information shall be treated as **strictly confidential** and shall not be disclosed, shared, or reused for any purpose outside the project.";
    const section2bParts = parseMarkdown(section2b);
    currentY = drawTextWithBold(
      ctx,
      section2bParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section2c =
      "(c) The Participant shall comply with all applicable data protection laws, including the **Information Technology Act, 2000**, and **GDPR**, where applicable.";
    const section2cParts = parseMarkdown(section2c);
    currentY = drawTextWithBold(
      ctx,
      section2cParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 30;

    // Section 3
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("3. Work Responsibility & Performance", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";

    const section3a =
      "(a) The Participant shall complete all assigned tasks and deliverables within the given timeline communicated by the **Project Mentor or Team Leader**.";
    const section3aParts = parseMarkdown(section3a);
    currentY = drawTextWithBold(
      ctx,
      section3aParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section3b =
      "(b) It is the Participant's **sole responsibility** to ensure that assigned work is completed on time, with quality and consistency.";
    const section3bParts = parseMarkdown(section3b);
    currentY = drawTextWithBold(
      ctx,
      section3bParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section3c =
      "(c) In case of any confusion, delay, or challenge, the Participant must **immediately connect** with their mentor or team leader to resolve the concern—ensuring that project progress is not hampered.";
    const section3cParts = parseMarkdown(section3c);
    currentY = drawTextWithBold(
      ctx,
      section3cParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section3d =
      "(d) Regular updates, proactive participation, and effective communication with the team are **mandatory expectations**.";
    const section3dParts = parseMarkdown(section3d);
    currentY = drawTextWithBold(
      ctx,
      section3dParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section3e =
      "(e) The Participant must maintain a minimum performance and activity level, as monitored by their mentor or supervisor.";
    currentY = wrapText(ctx, section3e, leftMargin, currentY, contentWidth, 23);
    currentY += 20;

    const section3f =
      "(f) Failure to meet project expectations, timelines, or communication standards may result in **removal from the live project** and discontinuation of participation privileges.";
    const section3fParts = parseMarkdown(section3f);
    currentY = drawTextWithBold(
      ctx,
      section3fParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 10;

    // Section 4
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText(
      "4. Intellectual Property (IP) Ownership",
      leftMargin,
      currentY
    );
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";

    const section4a =
      "(a) All work, source code, design, documentation, or innovation created during the live project shall be the **exclusive intellectual property** of Nexcore Alliance  (Nexcore Alliance LLP).";
    const section4aParts = parseMarkdown(section4a);
    currentY = drawTextWithBold(
      ctx,
      section4aParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 10;

    const section4b =
      "(b) The Participant shall not claim ownership, authorship, or use any portion of the project for external purposes without **written permission** from the Company.";
    const section4bParts = parseMarkdown(section4b);
    currentY = drawTextWithBold(
      ctx,
      section4bParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );

    // Signature line and stamp at bottom of page 2
    const signatureLineY = 950;
    const stampWidth = 180;
    const stampHeight = 140;

    // ctx.font = "18px 'Times New Roman'";
    // ctx.fillText("Signature: ____________________", leftMargin, signatureLineY);

    // // Draw Stamp (right aligned)
    // if (stampImg) {
    //   ctx.drawImage(
    //     stampImg,
    //     rightMargin - stampWidth,
    //     signatureLineY - 100,
    //     stampWidth,
    //     stampHeight
    //   );
    // }
  } else if (page === 3) {
    // ==================== PAGE 3 ====================

    currentY = contentStartY;

    // Section 5
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("5. Communication & Team Conduct", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";

    const section5a =
      "(a) The Participant shall maintain **professional communication** with all team members, mentors, and clients (if applicable).";
    const section5aParts = parseMarkdown(section5a);
    currentY = drawTextWithBold(
      ctx,
      section5aParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section5b =
      "(b) Sharing internal discussions, meeting content, or technical materials outside authorized groups is **strictly prohibited**.";
    const section5bParts = parseMarkdown(section5b);
    currentY = drawTextWithBold(
      ctx,
      section5bParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section5c =
      "(c) Respect, discipline, and teamwork are expected at all times. Any form of misconduct or unprofessional behavior may lead to **immediate removal** from the project.";
    const section5cParts = parseMarkdown(section5c);
    currentY = drawTextWithBold(
      ctx,
      section5cParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 30;

    // Section 6
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("6. Access & Return of Assets", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";

    const section6a =
      "(a) Any access credentials, tools, or resources provided by the Company shall be used **only for official project purposes**.";
    const section6aParts = parseMarkdown(section6a);
    currentY = drawTextWithBold(
      ctx,
      section6aParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section6b =
      "(b) Upon completion of the project or training, the Participant must **return or delete all data**, credentials, and files associated with the project.";
    const section6bParts = parseMarkdown(section6b);
    currentY = drawTextWithBold(
      ctx,
      section6bParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 30;

    // Section 7
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("7. Evaluation & Removal", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";

    const section7a =
      "(a) The Participant's performance and consistency will be **periodically evaluated**.";
    const section7aParts = parseMarkdown(section7a);
    currentY = drawTextWithBold(
      ctx,
      section7aParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section7b =
      "(b) Failure to follow this Agreement, maintain active participation, or adhere to deadlines may lead to **termination of project access** without prior notice.";
    const section7bParts = parseMarkdown(section7b);
    currentY = drawTextWithBold(
      ctx,
      section7bParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section7c =
      "(c) The Company's decision regarding continuation or removal from the live project shall be **final and binding**.";
    const section7cParts = parseMarkdown(section7c);
    currentY = drawTextWithBold(
      ctx,
      section7cParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 30;

    // Section 8
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("8. Non-Disclosure Duration", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section8Para =
      "The confidentiality obligations mentioned in this Agreement shall remain in effect during the entire project period and for a duration of **two (2) years** after its completion.";
    const section8Parts = parseMarkdown(section8Para);
    currentY = drawTextWithBold(
      ctx,
      section8Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 30;

    // Section 9
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("9. Legal Validity", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section9Para =
      "In case of any violation of this Agreement, the Company reserves the right to take necessary action, including but not limited to **legal proceedings** under applicable laws of India.";
    const section9Parts = parseMarkdown(section9Para);
    currentY = drawTextWithBold(
      ctx,
      section9Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );

    // Signature line and stamp at bottom of page 3
    const signatureLineY = 950;
    const stampWidth = 180;
    const stampHeight = 140;

    // ctx.font = "18px 'Times New Roman'";
    // ctx.fillText("Signature: ____________________", leftMargin, signatureLineY);

    // // Draw Stamp (right aligned)
    // if (stampImg) {
    //   ctx.drawImage(
    //     stampImg,
    //     rightMargin - stampWidth,
    //     signatureLineY - 100,
    //     stampWidth,
    //     stampHeight
    //   );
    // }
  } else if (page === 4) {
    // ==================== PAGE 4 ====================

    currentY = contentStartY;

    // Section 10
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("10. Governing Law & Jurisdiction", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section10Para =
      "This  Agreement shall be governed by the **laws of India**, and any disputes shall fall under the exclusive jurisdiction of the **courts in Mumbai, Maharashtra**.";
    const section10Parts = parseMarkdown(section10Para);
    currentY = drawTextWithBold(
      ctx,
      section10Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 30;

    // Section 11
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("11. Acknowledgment", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section11Para1 =
      "By signing this Agreement, the Participant confirms that they have **read, understood, and agreed** to all the terms and responsibilities stated herein.";
    const section11Para1Parts = parseMarkdown(section11Para1);
    currentY = drawTextWithBold(
      ctx,
      section11Para1Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 20;

    const section11Para2 =
      "They further acknowledge the importance of maintaining **confidentiality, discipline, and professionalism** while working on live client projects under Nexcore Alliance .";
    const section11Para2Parts = parseMarkdown(section11Para2);
    currentY = drawTextWithBold(
      ctx,
      section11Para2Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 40;

    // Company signature section
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("For Nexcore Alliance , Nexcore Alliance LLP", leftMargin, currentY);
    currentY += 30;

    // Signature section with fixed positions
    const signatureWidth = 190;
    const signatureHeight = 100;
    const stampWidth = 180;
    const stampHeight = 140;

    // Draw Signature (left)
    if (signatureImg) {
      ctx.drawImage(
        signatureImg,
        leftMargin - 8,
        currentY,
        signatureWidth,
        signatureHeight
      );
    }

    // Draw Stamp (right, aligned with signature)
    if (stampImg) {
      ctx.drawImage(
        stampImg,
        rightMargin - stampWidth,
        currentY,
        stampWidth,
        stampHeight
      );
    }

    currentY += signatureHeight + 15;

    ctx.fillText(`CREDENTIAL ID: ${credentialId}`, leftMargin, currentY);
    currentY += 40;

    // Recipient section
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("For the Participant (Intern)", leftMargin, currentY);
    currentY += 30;

    ctx.fillText(`Name: ${name}`, leftMargin, currentY);
    currentY += 100;

    ctx.fillText(
      "Signature: ____________________  Date: ____________________",
      leftMargin,
      currentY
    );
    currentY += 80;

    // Verification section - FIXED POSITION
    ctx.font = "18px 'Times New Roman'";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(
      "To verify the authenticity of this certificate",
      width / 2,
      980
    );

    const verifyUrl = "https://portal.nexcorealliance.com/verify-certificate";
    ctx.fillText(verifyUrl, width / 2, 1000);
  }
};

export default drawFSDLiveProjectAgreement;
