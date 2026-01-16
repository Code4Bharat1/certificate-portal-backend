// utils/MJ/NDA.js
import parseMarkdown from "../ParseMarkdown.js";
import drawTextWithBold from "../TextWithBold.js";
import wrapText from "../WrapText.js";

const drawMJNDA = async (
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
    const introPara = `This **Non-Disclosure Agreement** is made and entered into on this **${formattedDate}**, by and between:`;
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
    const companyPara = `** Marketiq Junction, a brand of Nexcore Alliance LLP**, a company incorporated under the **Limited Liability Partnership Act, 2008,** having its registered office at **Office No 2, White House Bldg No.3, Kurla West Basement, SG Barve Marg, Mumbai, Maharashtra, India 400070,** hereinafter referred to as the "Company";`;
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
    const recipientPara = `** ${name} **, an individual who has been employed as a **${role}** with Marketiq Junction for a period of **${duration} months,**residing at **${
      data.address || "address not provided"
    }**, Aadhaar card no: **${
      data.aadhaarCard || "not provided"
    }**, hereinafter referred to as the "Recipient";`;
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

    const whereas1Para = `The  Recipient, during their engagement with the Company, may have access to confidential, proprietary, and sensitive business information relating to digital marketing strategies, analytics, client campaigns, and other intellectual assets; and`;
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
      "The Company seeks to ensure protection of such confidential and proprietary information from unauthorized use, disclosure, or duplication.";
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

    ctx.font = "18px 'Times New Roman'";
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

    currentY = contentStartY;

    // Section 1
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText(
      "1. Definition of Confidential Information",
      leftMargin,
      currentY
    );
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section1Para = `For the purposes of this Agreement, “Confidential Information” shall include, but not be limited to:`;
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
      "(a) Marketing strategies, campaign plans, SEO/SEM reports, social media data, lead generation tactics, ad copies, analytics reports, and media budgets.",
      "(b) Client lists, contact details, project briefs, deliverables, and financial proposals",
      "(c) Internal documentation, passwords, creative assets, tools access (Google Ads, Meta Ads, etc.), and proprietary marketing templates.",
      "(d) All non-public data, know-how, or business insights which, if disclosed, could harm the Company’s interests or give competitors an unfair advantage.",
    ];

    section1Items.forEach((item) => {
      currentY = wrapText(ctx, item, leftMargin, currentY, contentWidth, 23);
      currentY += 5;
    });

    // Section 2
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("2. Obligations of the Recipient", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section2Intro = "The Recipient agrees to:";
    ctx.fillText(section2Intro, leftMargin, currentY);
    currentY += 20;

    // (a)
    const section2a =
      "(a) **Return of Assets & Access:** Upon completion or termination of engagement, immediately return or revoke all access to Company property, including login credentials, creative materials, ad accounts, documents, or confidential data.";
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
    currentY += 5;

    // (b)
    const section2b =
      "(b) **Non-Disclosure & Non-Use:** Not disclose, share, copy, reproduce, or use any Confidential Information for personal benefit or for any third party, either during or after the engagement.";
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
    currentY += 5;

    // (c)
    const section2c =
      "(c) **Non-Compete & Non-Solicitation:** For a period of one (1) year after termination of engagement, the Recipient shall not:";
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
    currentY += 5;

    ctx.font = "18px 'Times New Roman'";
    const section2cItems = [
      "•	Work directly with any clients or leads introduced through the Company without written consent.",
      "•	Offer similar digital marketing services to Company clients or attempt to solicit them.",
      "•	Engage in any business that competes directly with MarketIQ Junction’s services.",
    ];

    section2cItems.forEach((item) => {
      currentY = wrapText(ctx, item, leftMargin, currentY, contentWidth, 23);
      currentY += 5;
    });
    currentY += 15;

    // Signature line and stamp at bottom of page 2
    const signatureLineY = 950;
    const stampWidth = 180;
    const stampHeight = 140;

    ctx.font = "18px 'Times New Roman'";
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

    // (d)
    const section2d =
      "(d) **Compliance & Legal Accountability:** The Recipient acknowledges that any breach of this Agreement may constitute:";
    const section2dParts = parseMarkdown(section2d);
    currentY = drawTextWithBold(
      ctx,
      section2dParts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 18;

    const legalItems = [
      "•	A violation under the **Information Technology Act, 2000** (Section 72 – Breach of Confidentiality & Privacy).",
      "•	A breach under the **Indian Contract Act, 1872.**",
      "•	A violation under the **Copyright Act, 1957**, if proprietary materials are misused.",
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
      currentY += 30;
    });

    // Section 3
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("3. Duration & Enforcement", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section3Para =
      "This  Agreement shall remain in force during the term of engagement and indefinitely thereafter for all confidential information disclosed during the period.";
    const section3Parts = parseMarkdown(section3Para);
    currentY = drawTextWithBold(
      ctx,
      section3Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 23;

    const section3Para2 =
      "In case of breach, the Company reserves the right to:";
    currentY = wrapText(
      ctx,
      section3Para2,
      leftMargin,
      currentY,
      contentWidth,
      23
    );
    currentY += 18;

    const section3Items = [
      "•	Pursue civil or criminal legal proceedings.",
      "•	Claim damages and seek injunctive relief.",
      "•	Report and blacklist the Recipient from future opportunities within the digital marketing or IT industry",
    ];

    section3Items.forEach((item) => {
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
    currentY += 25;

    // Section 4
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("4. Jurisdiction & Governing Law", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section4Para =
      "This  Agreement shall be governed by and construed in accordance with the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the **courts in Mumbai, Maharashtra.**";
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
    currentY += 30;

    // Signature line and stamp at bottom of page 3
    const signatureLineY = 950;
    const stampWidth = 180;
    const stampHeight = 140;

    ctx.font = "18px 'Times New Roman'";
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

  
    // Section 5
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("5. Acknowledgment & Agreement", leftMargin, currentY);
    currentY += 23;

    ctx.font = "18px 'Times New Roman'";
    const section5Para =
      "By  signing below, both parties acknowledge that they have read, understood, and agree to the terms of this Non-Disclosure Agreement.";
    const section5Parts = parseMarkdown(section5Para);
    currentY = drawTextWithBold(
      ctx,
      section5Parts,
      leftMargin,
      currentY,
      18,
      contentWidth,
      23
    );
    currentY += 40;

    // Company signature section
    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText("For Marketiq Junction, Nexcore Alliance LLP", leftMargin, currentY);
    currentY += 25;

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
    currentY += 20;

    ctx.font = "bold 18px 'Times New Roman'";
    ctx.fillText(`Name: ${name}`, leftMargin, currentY);
    currentY += 20;

    ctx.fillText(`Designation: ${role}`, leftMargin, currentY);
    currentY += 35;

    ctx.fillText(
      "Signature: ____________________  Date: ____________________",
      leftMargin,
      currentY
    );
    currentY += 75;

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

export default drawMJNDA;
