import parseMarkdown from "../../ParseMarkdown.js";
import drawTextWithBold from "../../TextWithBold.js";
import wrapText from "../../WrapText.js";

const drawODStipendRevision = async (
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
    amount,
    effectiveFrom,
    formattedDate,
    outwardNo,
    credentialId,
  } = data;

  // Format amount in Indian Rupees
  const formatAmount = (amt) => {
    const num = parseFloat(amt);
    if (isNaN(num) || num <= 0) {
      return "₹0"; // Fallback for invalid amounts
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Convert amount to words - Indian numbering (Lakhs only, no Crores)
  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const n = Math.floor(Math.abs(parseFloat(num) || 0));
    if (n === 0) return "Zero";

    let result = "";

    // Lakhs (100,000 and above - NO CRORES)
    if (n >= 100000) {
      const lakhs = Math.floor(n / 100000);
      result += numberToWords(lakhs) + " Lakh ";
      const remainder = n % 100000;
      if (remainder > 0) {
        result += numberToWords(remainder);
      }
      return result.trim();
    }

    // Thousands (1,000 to 99,999)
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      result += numberToWords(thousands) + " Thousand ";
      const remainder = n % 1000;
      if (remainder > 0) {
        result += numberToWords(remainder);
      }
      return result.trim();
    }

    // Hundreds (100 to 999)
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      result += ones[hundreds] + " Hundred ";
      const remainder = n % 100;
      if (remainder > 0) {
        result += numberToWords(remainder);
      }
      return result.trim();
    }

    // Tens and Ones (20 to 99)
    if (n >= 20) {
      const tensDigit = Math.floor(n / 10);
      const onesDigit = n % 10;
      return tens[tensDigit] + (onesDigit ? " " + ones[onesDigit] : "");
    }

    // Teens (10 to 19)
    if (n >= 10) {
      return teens[n - 10];
    }

    // Single digit (1 to 9)
    return ones[n];
  };

  // ✅ Validate and parse amount safely
  const parsedAmount = parseFloat(amount);
  const amountInWords =
    isNaN(parsedAmount) || parsedAmount <= 0
      ? "Zero"
      : numberToWords(parsedAmount);
  const formattedAmount = formatAmount(amount);

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

  // Content Area
  const contentStartY = 210;
  const leftMargin = 70;
  const rightMargin = width - 80;
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

  // Subject (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  const subjectText =
    "Subject: Promotion and Stipend Revision for Outstanding Performance";
  currentY = wrapText(ctx, subjectText, leftMargin, currentY, contentWidth, 25);
  currentY += 30;

  // Dear Name (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Dear ${name},`, leftMargin, currentY);
  currentY += 35;

  // Congratulations! (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Congratulations!", leftMargin, currentY);
  currentY += 30;

  // Promotion paragraph with bold elements
  ctx.font = "16px 'Times New Roman'";
  // Format the effective from date properly
  const formattedEffectiveFrom = effectiveFrom || "Date not specified";
  const promotionText = `We  are pleased to inform you that in recognition of your consistent efforts, dedication, and the value you bring to your role, the management has approved a revision in your monthly stipend, effective from **${formattedEffectiveFrom}**.`;
  const promotionParts = parseMarkdown(promotionText);
  currentY = drawTextWithBold(
    ctx,
    promotionParts,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 15;

  // Revised stipend paragraph with bold amount
  ctx.font = "16px 'Times New Roman'";
  const stipendText = `Your  revised stipend will now be **${formattedAmount} (Rupees ${amountInWords} only)** per month.`;
  const stipendParts = parseMarkdown(stipendText);
  currentY = drawTextWithBold(
    ctx,
    stipendParts,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 15;

  // Appreciation paragraph with bold company name
  ctx.font = "16px 'Times New Roman'";
  const appreciationText = `This  revision reflects our appreciation of your hard work, learning attitude, and performance during your internship period. We look forward to your continued contributions, commitment, and professional growth with **Nexcore Alliance LLP**.`;
  const appreciationParts = parseMarkdown(appreciationText);
  currentY = drawTextWithBold(
    ctx,
    appreciationParts,
    leftMargin,
    currentY,
    18,
    contentWidth,
    23
  );
  currentY += 15;

  // Closing paragraph
  ctx.font = "16px 'Times New Roman'";
  const closingText = `Keep up the good work and continue to strive for excellence in all that you do.`;
  currentY = wrapText(ctx, closingText, leftMargin, currentY, contentWidth, 23);
  currentY += 30;

  // Warm regards (bold)
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText("Warm regards,", leftMargin, currentY);
  currentY += 40;

  // Signature and Stamp - Fixed position
  const signatureWidth = 190;
  const signatureHeight = 100;
  const stampWidth = 180;
  const stampHeight = 140;

  // Draw Signature (left) - fixed position
  if (signatureImg) {
    ctx.drawImage(
      signatureImg,
      leftMargin - 8,
      825,
      signatureWidth,
      signatureHeight
    );
  }

  // Draw Stamp (right, aligned with signature) - fixed position
  if (stampImg) {
    ctx.drawImage(
      stampImg,
      rightMargin - stampWidth,
      800,
      stampWidth,
      stampHeight
    );
  }

  // Credential ID (below signature) - fixed position
  ctx.font = "bold 16px 'Times New Roman'";
  ctx.fillText(`Credential ID: ${credentialId}`, leftMargin, 940);

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
};

export default drawODStipendRevision;
