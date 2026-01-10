import parseMarkdown from "../ParseMarkdown.js";
import drawTextWithBold from "../TextWithBold.js";
import wrapText from "../WrapText.js";

const drawDMOfferLetter = async (
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
  const { name, startDate, endDate, formattedDate, outwardNo, credentialId } =
    data;

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

    // Subject (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText(
      "Subject: Internship cum Training Offer Letter",
      leftMargin,
      currentY
    );
    currentY += 40;

    // Dear [Name] (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText(`Dear ${name},`, leftMargin, currentY);
    currentY += 30;

    // Opening paragraph
    ctx.font = "16px 'Times New Roman'";
    const openingPara = `It  is with great pleasure that **Nexcore Alliance LLP** extends this Internship cum Training Offer for the position of **Digital Marketing Intern**.`;
    const openingParts = parseMarkdown(openingPara);
    currentY = drawTextWithBold(
      ctx,
      openingParts,
      leftMargin,
      currentY,
      16,
      contentWidth,
      23
    );
    currentY += 40;

    // TERMS AND CONDITIONS Header (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("TERMS AND CONDITIONS", leftMargin, currentY);
    currentY += 35;

    // Terms list
    ctx.font = "16px 'Times New Roman'";
    const terms = [
      {
        number: "1.",
        title: "Validity of Offer:",
        text: "This offer is valid only upon successful completion of the internship, after which an Experience Letter will be issued.",
      },
      {
        number: "2.",
        title: "Attendance Requirement:",
        text: "Minimum attendance of 85% is required. Up to 15% of the total internship duration may be availed as approved leave.",
      },
      {
        number: "3.",
        title: "Participation in Technical Processes:",
        text: "You are required to participate in all technical rounds, assessments, and audits scheduled by Nexcore Alliance LLP.",
      },
      {
        number: "4.",
        title: "Completion of Formalities:",
        text: "All formalities and documentation as required by Nexcore Alliance LLP must be completed before joining.",
      },
      {
        number: "5.",
        title: "Key Performance Indicators (KPIs):",
        text: "You must meet the defined KPIs to qualify for the Experience Letter.",
      },
    ];

    terms.forEach((term) => {
      // Draw number
      ctx.font = "bold 16px 'Times New Roman'";
      ctx.fillText(term.number, leftMargin, currentY);

      // Draw title
      const numberWidth = ctx.measureText(term.number).width;
      ctx.fillText(term.title, leftMargin + numberWidth + 5, currentY);

      // Draw text on next line with indentation
      ctx.font = "16px 'Times New Roman'";
      currentY += 25;
      currentY = wrapText(
        ctx,
        term.text,
        leftMargin + 25,
        currentY,
        contentWidth - 25,
        23
      );
      currentY += 15;
    });
  } else if (page === 2) {
    // ==================== PAGE 2 ====================

    currentY = contentStartY + 30;

    // INTERNSHIP DETAILS Header (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("INTERNSHIP DETAILS", leftMargin, currentY);
    currentY += 40;

    // Internship details
    ctx.font = "16px 'Times New Roman'";
    const details = [
      { label: "Domain:", value: "Digital Marketing" },
      { label: "Duration:", value: "6 months" },
      { label: "Start Date:", value: startDate },
      { label: "End Date:", value: endDate },
    ];

    details.forEach((detail) => {
      ctx.font = "bold 16px 'Times New Roman'";
      ctx.fillText(detail.label, leftMargin, currentY);
      ctx.font = "16px 'Times New Roman'";
      const labelWidth = ctx.measureText(detail.label).width;
      ctx.fillText(detail.value, leftMargin + labelWidth + 10, currentY);
      currentY += 28;
    });
    currentY += 20;

    // EXPECTATIONS Header (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("EXPECTATIONS", leftMargin, currentY);
    currentY += 35;

    // Expectations list
    ctx.font = "16px 'Times New Roman'";
    const expectations = [
      "Active participation in all training sessions and project activities.",
      "Adherence to company policies, procedures, and professional conduct.",
      "Timely completion of deliverables and assigned tasks.",
    ];

    expectations.forEach((expectation) => {
      currentY = wrapText(
        ctx,
        `• ${expectation}`,
        leftMargin,
        currentY,
        contentWidth,
        25
      );
      currentY += 5;
    });
    currentY += 30;

    // ACCEPTANCE Header (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("ACCEPTANCE", leftMargin, currentY);
    currentY += 30;

    // Acceptance text
    ctx.font = "16px 'Times New Roman'";
    const acceptanceText =
      "Please confirm your acceptance of this offer by signing and returning a copy of this letter.";
    currentY = wrapText(
      ctx,
      acceptanceText,
      leftMargin,
      currentY,
      contentWidth,
      23
    );
    currentY += 35;

    // BEST WISHES Header (bold)
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("BEST WISHES", leftMargin, currentY);
    currentY += 30;

    // Best wishes text
    ctx.font = "16px 'Times New Roman'";
    const bestWishesText = `** Nexcore Alliance LLP **congratulates you on your selection and looks forward to your active contribution and growth during your internship.`;
    const bestWishesParts = parseMarkdown(bestWishesText);
    currentY = drawTextWithBold(
      ctx,
      bestWishesParts,
      leftMargin,
      currentY,
      16,
      contentWidth,
      23
    );
    currentY += 50;

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
        750,
        signatureWidth,
        signatureHeight
      );
    }

    // Draw Stamp (right, aligned with signature) - fixed position
    if (stampImg) {
      ctx.drawImage(
        stampImg,
        rightMargin - stampWidth,
        750,
        stampWidth,
        stampHeight
      );
    }

    // Credential ID (below signature) - fixed position
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText(`CREDENTIAL ID: ${credentialId}`, leftMargin, 865);
    currentY = 895;

    // Intern's Acceptance section
    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("Intern's Acceptance", leftMargin, currentY);
    currentY += 50;

    ctx.font = "bold 16px 'Times New Roman'";
    ctx.fillText("Signature: __________________________", leftMargin, currentY);
    ctx.fillText(
      "Date: __________________________",
      leftMargin + 350,
      currentY
    );
    currentY += 50;

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

export default drawDMOfferLetter;
