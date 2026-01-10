// utils/C4B/OnboardingNDA.js
import parseMarkdown from "../ParseMarkdown.js";
import drawTextWithBold from "../TextWithBold.js";
import wrapText from "../WrapText.js";

const drawHROnboardingNDA = async (
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
  const { name, role, duration, formattedDate, outwardNo, credentialId } = data;

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
    ctx.fillText("NON-DISCLOSURE AGREEMENT (NDA)", width / 2, currentY);
    ctx.textAlign = "left";
    currentY += 35;

    // First paragraph
    ctx.font = "18px 'Times New Roman'";
    const introPara = `This **Non-Disclosure Agreement** is made and entered into on this **${formattedDate},** by and between:`;
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
    const companyPara = `** Nexcore Alliance LLP,** a company incorporated under the **Limited Liability Partnership Act, 2008,** having its registered office at **Office No. 2, White House Bldg No. 3, Kurla West Basement, SG Barve Marg, Mumbai, Maharashtra, India 400070,** hereinafter referred to as the "Company";`;
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
    const recipientPara = `** ${name},** an individual who has been employed as a **${role}** with Nexcore Alliance LLP, residing at **${
      data.address || "address not provided"
    },** Aadhaar card no: **${
      data.aadhaarCard || "not provided"
    },** hereinafter referred to as the "Recipient";`;
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

    // WHEREAS clauses
    ctx.font = "18px 'Times New Roman'";
    const whereas1 = "WHEREAS,";
    ctx.fillText(whereas1, leftMargin, currentY);
    currentY += 23;

    const whereas1Para = `The  Recipient, during his tenure, had access to confidential, proprietary, and sensitive information of the Company related to human resources functions, including but not limited to employee records, internal policies, compensation structures, and personnel data; and`;
    const whereas1Parts = parseMarkdown(whereas1Para);
    currentY = drawTextWithBold(
      ctx,
      whereas1Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 23;

    const whereas2 =
      "WHEREAS, the Company seeks to safeguard its human resource–related confidential information from any unauthorized disclosure, misuse, or exploitation.";
    currentY = wrapText(ctx, whereas2, leftMargin, currentY, contentWidth, 23);
    currentY += 23;

    const nowTherefore =
      "NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties hereto agree as follows:";
    currentY = wrapText(
      ctx,
      nowTherefore,
      leftMargin,
      currentY,
      contentWidth,
      23
    );

    // Signature line and stamp at bottom of page 1
    const signatureLineY = 950;
    const stampWidth = 180;
    const stampHeight = 140;

    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("Signature: ____________________", leftMargin, signatureLineY);

    // Draw Stamp (right aligned)
    if (stampImg) {
      ctx.drawImage(
        stampImg,
        rightMargin - stampWidth,
        signatureLineY - 100,
        stampWidth,
        stampHeight
      );
    }
  } else if (page === 2) {
    // ==================== PAGE 2 ====================

    currentY = contentStartY + 50; // Moved up from 100

    // Section 1
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText(
      "1. Definition of Confidential Information",
      leftMargin,
      currentY
    );
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section1Para = `For the purposes of this Agreement, "Confidential Information" shall include, but not be limited to:`;
    currentY = wrapText(
      ctx,
      section1Para,
      leftMargin,
      currentY,
      contentWidth,
      23
    );
    currentY += 20;

    const section1Items = [
      "(a) Employee personal data, personnel files, payroll details, compensation structures, and benefits information.",
      "(b) Recruitment processes, interview records, appraisal systems, and performance evaluations.",
      "(c) Internal HR policies, disciplinary records, grievance handling procedures, and compliance documentation.",
      "(d) Login credentials, access rights, HR systems data, internal reports, and official communications.",
      "(e) Any other non-public human resource–related information that provides an operational or strategic advantage to the Company.",
    ];

    section1Items.forEach((item) => {
      currentY = wrapText(ctx, item, leftMargin, currentY, contentWidth, 23);
      currentY += 5;
    });
    currentY += 30; // Space before Section 2

    // Section 2 - Added to Page 2
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("2. Obligations of the Recipient", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section2Intro = "The Recipient agrees to:";
    ctx.fillText(section2Intro, leftMargin, currentY);
    currentY += 20;

    // Confidentiality & Non-Disclosure
    const section2a =
      "• **Confidentiality & Non-Disclosure:** Not disclose, share, copy, publish, or use any Confidential Information for personal benefit or for any third party, during or after engagement with the Company.";
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

    // Limited Use
    const section2b =
      "• **Limited Use:** Use Confidential Information solely for the purpose of performing assigned duties for the Company.";
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

    // Protection of Information
    const section2c =
      "• **Protection of Information:** Take all reasonable steps to protect Confidential Information from unauthorized access, loss, or misuse.";
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

    // Signature line and stamp at bottom of page 2
    const signatureLineY = 950;
    const stampWidth = 180;
    const stampHeight = 140;

    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("Signature: ____________________", leftMargin, signatureLineY);

    // Draw Stamp (right aligned)
    if (stampImg) {
      ctx.drawImage(
        stampImg,
        rightMargin - stampWidth,
        signatureLineY - 100,
        stampWidth,
        stampHeight
      );
    }
  } else if (page === 3) {
    // ==================== PAGE 3 ====================

    currentY = contentStartY;

    // Section 3
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("3. Return of Company Assets", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section3Para =
      "Upon termination or completion of engagement, or upon request, the Recipient shall immediately return or permanently delete all Company assets, including:";
    currentY = wrapText(
      ctx,
      section3Para,
      leftMargin,
      currentY,
      contentWidth,
      23
    );
    currentY += 18;

    const section3Items = [
      "• Devices, documents, files, source code",
      "• Login credentials, access keys, email accounts",
      "• Any copies or backups of Company data",
    ];

    section3Items.forEach((item) => {
      currentY = wrapText(ctx, item, leftMargin, currentY, contentWidth, 23);
      currentY += 5;
    });
    currentY += 18;

    const noRetention = "No Company information may be retained in any form.";
    currentY = wrapText(
      ctx,
      noRetention,
      leftMargin,
      currentY,
      contentWidth,
      23
    );
    currentY += 30;

    // Section 4
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText(
      "4. Non-Compete & Non-Solicitation (Limited)",
      leftMargin,
      currentY
    );
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section4Para =
      "For  a period of **one (1) year** from the end of engagement, the Recipient shall not:";
    const section4Parts = parseMarkdown(section4Para);
    currentY = drawTextWithBold(
      ctx,
      section4Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 15;

    const section4Items = [
      "• Use Confidential Information to compete unfairly with the Company",
      "• Solicit Company employees, clients, or vendors using Company knowledge",
    ];

    section4Items.forEach((item) => {
      currentY = wrapText(ctx, item, leftMargin, currentY, contentWidth, 23);
      currentY += 5;
    });
    currentY += 25;

    // Section 5
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("5. Legal Compliance & Remedies", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section5Para =
      "Any breach of this Agreement may result in disciplinary action and legal proceedings under applicable laws, including but not limited to:";
    currentY = wrapText(
      ctx,
      section5Para,
      leftMargin,
      currentY,
      contentWidth,
      23
    );
    currentY += 18;

    const legalItems = [
      "• **Information Technology Act, 2000**",
      "• **Indian Contract Act, 1872**",
      "• **Copyright Act, 1957**",
      "• **Indian Penal Code, 1860**",
    ];

    legalItems.forEach((item) => {
      const itemParts = parseMarkdown(item);
      currentY = drawTextWithBold(
        ctx,
        itemParts,
        leftMargin,
        currentY,
        18,
        contentWidth,
        23
      );
      currentY += 5;
    });
    currentY += 18;

    const remedies =
      "The Company may seek injunctive relief, damages, or other remedies available in law.";
    currentY = wrapText(ctx, remedies, leftMargin, currentY, contentWidth, 23);

    // Signature line and stamp at bottom of page 3
    const signatureLineY = 950;
    const stampWidth = 180;
    const stampHeight = 140;

    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("Signature: ____________________", leftMargin, signatureLineY);

    // Draw Stamp (right aligned)
    if (stampImg) {
      ctx.drawImage(
        stampImg,
        rightMargin - stampWidth,
        signatureLineY - 100,
        stampWidth,
        stampHeight
      );
    }
  } else if (page === 4) {
    // ==================== PAGE 4 ====================

    currentY = contentStartY;

    // Section 6
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("6. Duration", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section6Para =
      "The  confidentiality obligations under this Agreement shall survive the termination or completion of the Recipient's engagement and shall remain in effect **indefinitely,** unless released in writing by the Company.";
    const section6Parts = parseMarkdown(section6Para);
    currentY = drawTextWithBold(
      ctx,
      section6Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 25;

    // Section 7
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("7. Governing Law & Jurisdiction", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section7Para =
      "This  Agreement shall be governed by and construed in accordance with the **laws of India.** Courts at **Mumbai, Maharashtra** shall have exclusive jurisdiction.";
    const section7Parts = parseMarkdown(section7Para);
    currentY = drawTextWithBold(
      ctx,
      section7Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 25;

    // Section 8
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("8. Acknowledgment", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section8Para =
      "By signing below, the Recipient confirms that they have read, understood, and agreed to comply with this Agreement.";
    currentY = wrapText(
      ctx,
      section8Para,
      leftMargin,
      currentY,
      contentWidth,
      23
    );
    currentY += 35;

    // Company signature section
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("For Nexcore Alliance LLP", leftMargin, currentY);
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
    currentY += 35;

    // Recipient section
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("For the Recipient", leftMargin, currentY);
    currentY += 25;

    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText(`Name: ${name}`, leftMargin, currentY);
    currentY += 25;

    ctx.fillText(`Designation: ${role}`, leftMargin, currentY);
    currentY += 35;

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

export default drawHROnboardingNDA;
