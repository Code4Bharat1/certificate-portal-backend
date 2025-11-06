// letter.controllers.js
import Letter from "../models/letter.models.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { createCanvas, loadImage, registerFont } from "canvas";
import { fileURLToPath } from "url";
import { validationResult } from "express-validator";
import People from "../models/people.models.js";
import ActivityLog from "../models/activitylog.models.js";
import { sendCertificateNotification } from "../services/whatsappService.js";
import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If you have local font files you want to register for node-canvas, register them here.
// Example:
// registerFont(path.join(__dirname, "../assets/fonts/Poppins-Bold.ttf"), { family: "Poppins", weight: "bold" });

/* -------------------------
   Configurable top-row font size (from your choice)
   ------------------------- */
const TOP_ROW_FONT_SIZE = 15;

/* -------------------------
   Helper: generateLetterId
   (unchanged) ...
   ------------------------- */
// (Paste the same generateLetterId implementation here)
export async function generateLetterId(category, course) {
  const courseMap = {
    "Appreciation Letter": "APP",
    "Experience Certificate": "EXP",
    "Internship Joining Letter": "INT",
    "Memo": "MEM",
    "Non-Disclosure Agreement": "NDA",
    "Offer Letter": "OFF",
    "Warning Letter": "WRN",
    "Live Project Agreement": "LPA",
    "Community Letter": "COM"
  };

  const catMap = {
    "code4bharat": "C4B",
    "marketing-junction": "MJ",
    "FSD": "FSD",
    "HR": "HR",
    "BVOC": "BVOC"
  };

  const courseAbbr = courseMap[course] || course
    .split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3);

  const catAbbr = catMap[category] || category.toUpperCase().slice(0, 4);

  const regex = new RegExp(`^${courseAbbr}-${catAbbr}-(\\d+)$`);
  const last = await Letter.find({ letterId: { $regex: `^${courseAbbr}-${catAbbr}-` } })
    .select("letterId")
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  let nextNum = 1;
  if (last && last.length) {
    const match = last[0].letterId.match(regex);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNum).padStart(5, "0");
  return `${courseAbbr}-${catAbbr}-${padded}`;
}

/* -------------------------
   Helper: generateOutwardNo
   (unchanged, used to produce outwardNo/outwardSerial)
   ------------------------- */
export async function generateOutwardNo(category, course, issueDate) {
  const cat = category || "";
  const crs = course || "";
  const issue = issueDate ? new Date(issueDate) : new Date();

  const yyyy = issue.getFullYear();
  const mm = String(issue.getMonth() + 1).padStart(2, "0");
  const dd = String(issue.getDate()).padStart(2, "0");
  const datePart = `${yyyy}/${mm}/${dd}`;

  // ✅ Get the last outwardSerial globally (no category / no course filter)
  let lastLetter = await Letter.findOne({})
    .sort({ outwardSerial: -1, createdAt: -1 })
    .lean();

  let maxSerial = 0;
  if (lastLetter) {
    if (typeof lastLetter.outwardSerial === "number" && lastLetter.outwardSerial > 0) {
      maxSerial = lastLetter.outwardSerial;
    } else if (lastLetter.outwardNo) {
      const m = String(lastLetter.outwardNo).match(/(\d+)\s*$/);
      if (m && m[1]) maxSerial = parseInt(m[1], 10);
    }
  }

  // ✅ Continuous serial for all categories now
  let nextSerial = maxSerial + 1;

  // Special FSD offsets still applied (optional - remove if not needed)
  if (cat === "FSD" && crs === "Warning Letter") {
    if (maxSerial < 4) nextSerial = 5;
  }
  if (cat === "FSD" && crs === "Offer Letter") {
    if (maxSerial < 49) nextSerial = 50;
  }

  const appreciationTypes = ["Appreciation Letter", "Experience Certificate"];
  let outwardNo;
  if (appreciationTypes.includes(crs)) {
    outwardNo = `Outward no.:-NEX/${datePart}/${nextSerial}`;
  } else {
    outwardNo = `NEX/${datePart}-${nextSerial}`;
  }

  return { outwardNo, outwardSerial: nextSerial };
}

/* -------------------------
   Template filename helper (unchanged)
   ------------------------- */
export function getLetterTemplateFilename(course, category) {
  const templateMap = {
    code4bharat: {
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      'Internship Joining Letter - Unpaid': "C4B-internship-unpaid.pdf",
      'Internship Joining Letter - Paid': "C4B-internship-paid.pdf",
      'Memo': "Letter.jpg",
      'Non-Disclosure Agreement': "NDA.pdf",
    },
    "marketing-junction": {
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      'Internship Joining Letter - Unpaid': "Letter.jpg",
      'Internship Joining Letter - Paid': "Letter.jpg",
      'Memo': "Letter.jpg",
      'Non-Disclosure Agreement': "NDA.pdf",
    },
    HR: {
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      'Internship Joining Letter - Unpaid': "Letter.jpg",
      'Internship Joining Letter - Paid': "Letter.jpg",
      'Memo': "Letter.jpg",
      'Non-Disclosure Agreement': "NDA.pdf",
    },
    FSD: {
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      'Offer Letter': "FSD-OfferLetter.pdf",
      'Warning Letter': "FSD-WarningLetter.jpg",
      'Non-Disclosure Agreement': "NDA.pdf",
      'Live Project Agreement': "FSD-LiveProject.pdf",
    },
    BVOC: {
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      'Warning Letter': "BVOC-WarningLetter.jpg",
      'Community Letter': "Letter.jpg",
    },
  };

  return templateMap[category]?.[course] || `${category}-default.jpg`;
}

/* -------------------------
   Helper: wrapText for canvas context (unchanged)
   ------------------------- */
export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return 0;
  const words = text.split(" ");
  let line = "";
  let drawY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, drawY);
      line = words[n] + " ";
      drawY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, drawY);
  return drawY + lineHeight;
}

/* -------------------------
   Helper: detect template type
   returns 'pdf' or 'image'
   ------------------------- */
function getTemplateTypeByFilename(filename) {
  if (!filename) return "image";
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if ([".jpg", ".jpeg", ".png"].includes(ext)) return "image";
  // default to image
  return "image";
}

/* -------------------------
   createLetter (unchanged except outward persistence already implemented earlier)
   ------------------------- */
export const createLetter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      category,
      batch,
      course,
      description,
      issueDate,
      subject,
      role,
      startDate,
      endDate,
      duration
    } = req.body;

    if (!name || !category || !course || !issueDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, category, course, issueDate)."
      });
    }

    // Generate unique letterId
    let letterId;
    let exists;
    do {
      letterId = await generateLetterId(category, course);
      exists = await Letter.findOne({ letterId });
    } while (exists);

    // Generate outward number & serial (and persist it)
    const { outwardNo, outwardSerial } = await generateOutwardNo(category, course, issueDate);

    // Lookup phone for whatsapp (optional)
    const userData = await People.findOne({ name });
    const userPhone = userData?.phone || null;

    // Prepare letter document (model fields)
    const letterData = {
      letterId,
      name,
      category,
      batch: batch || "",
      course,
      subject: subject?.trim() || "",
      role: role || "",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      duration: duration || "",
      description: description?.trim() || "",
      issueDate: new Date(issueDate),
      outwardNo,
      outwardSerial,
      createdBy: req.user?._id || null
    };

    const letter = await Letter.create(letterData);

    // Send WhatsApp notification if phone found
    try {
      if (userPhone && letterId) {
        await sendCertificateNotification({
          userName: name,
          userPhone,
          certificateId: letterId,
          course,
          category,
          batch: batch || null,
          issueDate: letter.issueDate
        });
      }
    } catch (err) {
      console.error("WhatsApp send error:", err);
    }

    // Log activity
    await ActivityLog.create({
      action: "created",
      letterId: letter.letterId,
      userName: letter.name,
      adminId: req.user?._id,
      details: `Letter created for ${letter.name}`
    });

    return res.status(201).json({
      success: true,
      message: "Letter created successfully",
      letter
    });
  } catch (error) {
    console.error("Create letter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create letter",
      error: error.message
    });
  }
};

/* -------------------------
   previewLetter
   - If template is image -> returns image/jpeg (as before)
   - If template is PDF -> returns modified PDF (Content-Type: application/pdf) so browser shows a preview
   ------------------------- */
export const previewLetter = async (req, res) => {
  try {
    const {
      name,
      category,
      issueDate,
      course,
      description = "",
      subject = ""
    } = req.body;

    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for preview"
      });
    }

    // generate temp id and outwardNo for preview
    const tempId = await generateLetterId(category, course);
    const { outwardNo } = await generateOutwardNo(category, course, issueDate);

    // Determine template path + type
    const templateFilename = getLetterTemplateFilename(course, category);
    const templatePath = path.join(__dirname, "../templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: `Letter template not found for course: ${course}`
      });
    }

    const templateType = getTemplateTypeByFilename(templateFilename);

    const formattedDate = new Date(issueDate).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });

    // Common top-row: outwardNo (left) and date (right), same Y coordinate
    if (templateType === "image") {
      // Image template path -> use canvas and return JPEG
      const templateImage = await loadImage(templatePath);
      const width = templateImage.width;
      const height = templateImage.height;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // draw template
      ctx.drawImage(templateImage, 0, 0);

      // Top row: outwardNo (left) and date (right) - same Y
      ctx.fillStyle = "#111827";
      ctx.textBaseline = "top";

      // Outward No (left)
      // ctx.textAlign = "left";
      ctx.font = `bold 60px "Poppins"`;
      ctx.fillText(`${outwardNo}`, width * 0.085, height * 0.237);

      // Date (right)
      // ctx.textAlign = "right";
      ctx.font = `bold 40px "Times New Roman", serif`;
      ctx.fillText(formattedDate, width * 0.78, height * 0.253);

      // SUBJECT (Title)
      const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
      ctx.textAlign = "left";
      ctx.font = '50px "Times New Roman", serif';
      ctx.fillText(subjectText, width * 0.32, height * 0.313);

      // DESCRIPTION (wrapped)
      ctx.fillStyle = "#1a1a1a";
      ctx.font = '40px "Georgia", "Garamond", "Times New Roman", serif';

      const topY = height * 0.40;
      const bottomY = height * 0.70;
      const availableHeight = bottomY - topY;
      const descMaxWidth = width * 0.80;

      const paragraphs = (description || "")
        .split(/\n\s*\n/)
        .map(p => p.replace(/\n/g, " ").trim())
        .filter(p => p.length > 0)
        .slice(0, 3);

      console.log(paragraphs);


      const lineHeight = 66;
      const paraSpacing = paragraphs.length > 1 ? availableHeight / (paragraphs.length + 1) : availableHeight / 2;

      paragraphs.forEach((p, i) => {
        const y = topY + i * paraSpacing;
        wrapText(ctx, p, width * 0.13, y, descMaxWidth, lineHeight);
      });

      // Letter ID
      ctx.textAlign = "left";
      ctx.font = 'bold 60px "Poppins"';
      ctx.fillText(`${tempId}`, width * 0.33, height * 0.761);

      // Footer / verify link (center)
      ctx.font = '60px "Ovo", serif';
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.fillText(
        "https://certificate.nexcorealliance.com/verify-certificate",
        width / 2,
        height * 0.833
      );

      const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
      res.setHeader("Content-Type", "image/jpeg");
      return res.send(buffer);
    } else {
      // PDF template -> overlay using pdf-lib and return PDF for preview (inline)
      const existingPdfBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFLibDocument.load(existingPdfBytes);

      // Choose page 0 (first page)
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      // Embed a standard font (Times Roman for date & subject, Helvetica for others)
      // const timesFont = await pdfDoc.embedFont(StandardFonts.TIMES_ROMAN);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold || StandardFonts.TIMES_ROMAN);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Top-row positions (percentage-based)
      const leftX = width * 0.05;
      const rightX = width * 0.95;
      const topY = height - (height * 0.06); // from top: using top margin

      // Draw outwardNo (left)
      page.drawText(outwardNo, {
        x: width * 0.085,
        y: height * 0.65,
        size: TOP_ROW_FONT_SIZE,
        font: helveticaBold,
        color: rgb(0.067, 0.094, 0.152) // #111827 in rgb (approx)
      });

      // Draw date (right) aligned to right:
      // const dateWidth = timesBold.widthOfTextAtSize(formattedDate, TOP_ROW_FONT_SIZE);
      page.drawText(formattedDate, {
        x: width * 0.083,
        y: height * 0.90,
        size: TOP_ROW_FONT_SIZE,
        font: timesBold,
        color: rgb(0.067, 0.094, 0.152)
      });

      // Subject (left area)
      // const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
      // page.drawText(subjectText, {
      //   x: width * 0.32,
      //   y: height - (height * 0.313),
      //   size: 50,
      //   font: timesBold,
      //   color: rgb(0, 0, 0)
      // });

      // Description: we will do simple line-wrapped drawing for PDF (not as advanced as canvas wrapText)
      // const descX = width * 0.13;
      // let descY = height - (height * 0.40);
      // const descMaxWidth = width * 0.80;
      // const pdfLineHeight = 66;
      // const paragraphs = (description || "")
      //   .split(/\n\s*\n/)
      //   .map(p => p.replace(/\n/g, " ").trim())
      //   .filter(p => p.length > 0)
      //   .slice(0, 3);

      // const wrapPdfText = (text, maxWidth, font, size) => {
      //   const words = text.split(" ");
      //   let line = "";
      //   const lines = [];
      //   for (let i = 0; i < words.length; i++) {
      //     const testLine = line ? `${line} ${words[i]}` : words[i];
      //     const testWidth = font.widthOfTextAtSize(testLine, size);
      //     if (testWidth > maxWidth && line) {
      //       lines.push(line);
      //       line = words[i];
      //     } else {
      //       line = testLine;
      //     }
      //   }
      //   if (line) lines.push(line);
      //   return lines;
      // };

      // paragraphs.forEach((p) => {
      //   const lines = wrapPdfText(p, descMaxWidth, helvetica, 45);
      //   lines.forEach((ln) => {
      //     page.drawText(ln, {
      //       x: descX,
      //       y: descY,
      //       size: 45,
      //       font: helvetica,
      //       color: rgb(0.1, 0.1, 0.1)
      //     });
      //     descY -= pdfLineHeight;
      //   });
      //   descY -= 10; // paragraph gap
      // });

      // Letter ID near bottom-left (approx)
      page.drawText(tempId, {
        x: width * 0.33,
        y: height * 0.239, // similar to your previous fraction
        size: 15,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });

      // Footer verify link centered
      const verifyText = "https://certificate.nexcorealliance.com/verify-certificate";
      const verifyWidth = helvetica.widthOfTextAtSize(verifyText, 60);
      page.drawText(verifyText, {
        x: (width - verifyWidth) / 2,
        y: height * 0.17,
        size: 15,
        font: helvetica,
        color: rgb(0.12, 0.16, 0.22)
      });

      const modifiedPdfBytes = await pdfDoc.save();
      res.setHeader("Content-Type", "application/pdf");
      // Inline so browser shows it as preview
      res.setHeader("Content-Disposition", "inline; filename=preview.pdf");
      return res.send(Buffer.from(modifiedPdfBytes));
    }
  } catch (error) {
    console.error("Preview letter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate letter preview",
      error: error.message
    });
  }
};

/* -------------------------
   downloadLetterAsPdf
   - If letter missing outwardNo/outwardSerial -> generate and persist
   - If template is image -> use canvas + pdfkit (as before)
   - If template is PDF -> use pdf-lib to draw directly on the existing PDF and stream as attachment
   ------------------------- */
export const downloadLetterAsPdf = async (req, res) => {
  try {
    const identifier = req.params.id;
    let letter;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    if (isObjectId) {
      letter = await Letter.findById(identifier).lean();
    } else {
      letter = await Letter.findOne({ letterId: identifier }).lean();
    }

    if (!letter) {
      return res.status(404).json({ success: false, message: "Letter not found" });
    }

    // If outwardNo / outwardSerial missing — generate and persist
    if (!letter.outwardNo || !letter.outwardSerial) {
      const { outwardNo, outwardSerial } = await generateOutwardNo(letter.category, letter.course, letter.issueDate || new Date());
      await Letter.findByIdAndUpdate(letter._id, { outwardNo, outwardSerial });
      letter.outwardNo = outwardNo;
      letter.outwardSerial = outwardSerial;
    }

    // Template path + type
    const templateFilename = getLetterTemplateFilename(letter.course, letter.category);
    const templatePath = path.join(__dirname, "../templates", templateFilename);
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ success: false, message: "Template not found" })
    }

    const templateType = getTemplateTypeByFilename(templateFilename);

    const formattedDate = new Date(letter.issueDate).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });

    if (templateType === "image") {
      // Create canvas JPEG first (so PDF looks same)
      const templateImage = await loadImage(templatePath);
      const width = templateImage.width;
      const height = templateImage.height;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(templateImage, 0, 0);

      // Top row: outwardNo (left) and date (right)
      ctx.fillStyle = "#111827";
      ctx.textBaseline = "top";

      // Outward No (left)
      // ctx.textAlign = "left";
      ctx.font = `bold ${TOP_ROW_FONT_SIZE}px "Poppins"`;
      ctx.fillText(`${letter.outwardNo}`, width * 0.085, height * 0.237);

      // Date (right)
      // ctx.textAlign = "right";
      ctx.font = `bold ${TOP_ROW_FONT_SIZE}px "Times New Roman", serif`;
      ctx.fillText(formattedDate, width * 0.78, height * 0.253);

      // Subject
      const subjectText = letter.subject ? `${letter.subject} – ${letter.name}` : `${letter.course} – ${letter.name}`;
      ctx.textAlign = "left";
      ctx.font = '50px "Times New Roman", serif';
      ctx.fillText(subjectText, width * 0.32, height * 0.313);

      // Description
      ctx.fillStyle = "#1a1a1a";
      ctx.font = '45px "Georgia", "Garamond", "Times New Roman", serif';
      const topY = height * 0.40;
      const bottomY = height * 0.70;
      const availableHeight = bottomY - topY;
      const descMaxWidth = width * 0.80;

      const paragraphs = (letter.description || "")
        .split(/\n\s*\n/)
        .map(p => p.replace(/\n/g, " ").trim())
        .filter(p => p.length > 0)
        .slice(0, 3);

      const lineHeight = 66;
      const paraSpacing = paragraphs.length > 1 ? availableHeight / (paragraphs.length + 1) : availableHeight / 2;

      paragraphs.forEach((p, i) => {
        const y = topY + i * paraSpacing;
        wrapText(ctx, p, width * 0.13, y, descMaxWidth, lineHeight);
      });

      // Letter ID
      ctx.textAlign = "left";
      ctx.font = 'bold 60px "Poppins"';
      ctx.fillText(`${letter.letterId}`, width * 0.33, height * 0.761);

      // Footer link
      ctx.font = '60px "Ovo", serif';
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.fillText(
        "https://certificate.nexcorealliance.com/verify-certificate",
        width / 2,
        height * 0.830
      );

      const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });

      // Create PDF with pdfkit and embed the JPEG
      const doc = new PDFDocument({
        size: [width, height],
        margin: 0
      });

      // Set headers for download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${letter.letterId}.pdf"`);

      // Pipe PDF stream to response
      doc.pipe(res);

      // Add full-page image (scaled to page)
      doc.image(jpegBuffer, 0, 0, { width: width, height: height });

      // finalize PDF
      doc.end();

      // Update download counters (async)
      await Letter.findByIdAndUpdate(letter._id, {
        $inc: { downloadCount: 1 },
        lastDownloaded: new Date(),
        status: "downloaded"
      });

      return;
    } else {
      // Template is PDF -> load, overlay with pdf-lib and return PDF (attachment)
      const existingPdfBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFLibDocument.load(existingPdfBytes);

      // We'll overlay on first page
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      // Embed fonts
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold || StandardFonts.TIMES_ROMAN);

      // Top-row positions (percentage-based)
      const leftX = width * 0.05;
      const rightX = width * 0.95;
      const topY = height - (height * 0.06);

      // Draw Outward No (left)
      page.drawText(letter.outwardNo, {
        x: leftX,
        y: topY,
        size: TOP_ROW_FONT_SIZE,
        font: helveticaBold,
        color: rgb(0.067, 0.094, 0.152)
      });

      // Draw Date (right-aligned)
      const dateWidth = timesBold.widthOfTextAtSize(formattedDate, TOP_ROW_FONT_SIZE);
      page.drawText(formattedDate, {
        x: rightX - dateWidth,
        y: topY,
        size: TOP_ROW_FONT_SIZE,
        font: timesBold,
        color: rgb(0.067, 0.094, 0.152)
      });

      // Subject
      const subjectText = letter.subject ? `${letter.subject} – ${letter.name}` : `${letter.course} – ${letter.name}`;
      page.drawText(subjectText, {
        x: width * 0.32,
        y: height - (height * 0.313),
        size: 50,
        font: timesBold,
        color: rgb(0, 0, 0)
      });

      // Description (simple wrapped approach)
      const descX = width * 0.13;
      let descY = height - (height * 0.40);
      const descMaxWidth = width * 0.80;
      const pdfLineHeight = 66;
      const paragraphs = (letter.description || "")
        .split(/\n\s*\n/)
        .map(p => p.replace(/\n/g, " ").trim())
        .filter(p => p.length > 0)
        .slice(0, 3);

      const wrapPdfText = (text, maxWidth, font, size) => {
        const words = text.split(" ");
        let line = "";
        const lines = [];
        for (let i = 0; i < words.length; i++) {
          const testLine = line ? `${line} ${words[i]}` : words[i];
          const testWidth = font.widthOfTextAtSize(testLine, size);
          if (testWidth > maxWidth && line) {
            lines.push(line);
            line = words[i];
          } else {
            line = testLine;
          }
        }
        if (line) lines.push(line);
        return lines;
      };

      paragraphs.forEach((p) => {
        const lines = wrapPdfText(p, descMaxWidth, helvetica, 45);
        lines.forEach((ln) => {
          page.drawText(ln, {
            x: descX,
            y: descY,
            size: 45,
            font: helvetica,
            color: rgb(0.1, 0.1, 0.1)
          });
          descY -= pdfLineHeight;
        });
        descY -= 10;
      });

      // Letter ID near bottom-left
      page.drawText(letter.letterId, {
        x: width * 0.33,
        y: height * 0.239,
        size: 60,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });

      // Footer verify link centered
      const verifyText = "https://certificate.nexcorealliance.com/verify-certificate";
      const verifyWidth = helvetica.widthOfTextAtSize(verifyText, 60);
      page.drawText(verifyText, {
        x: (width - verifyWidth) / 2,
        y: height * 0.17,
        size: 60,
        font: helvetica,
        color: rgb(0.12, 0.16, 0.22)
      });

      const modifiedPdfBytes = await pdfDoc.save();

      // Set headers for download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${letter.letterId}.pdf"`);
      res.send(Buffer.from(modifiedPdfBytes));

      // Update download counters (async)
      await Letter.findByIdAndUpdate(letter._id, {
        $inc: { downloadCount: 1 },
        lastDownloaded: new Date(),
        status: "downloaded"
      });

      return;
    }
  } catch (error) {
    console.error("downloadLetterAsPdf error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to generate PDF", error: error.message });
    } else {
      try { res.end(); } catch (e) { }
    }
  }
};

/* -------------------------
   getLetters, getLetterById (unchanged)
   ------------------------- */
export const getLetters = async (req, res) => {
  try {
    const letters = await Letter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: letters });
  } catch (error) {
    console.error("getLetters error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch letters" });
  }
};

export const getLetterById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    let letter;
    if (isObjectId) letter = await Letter.findById(identifier);
    else letter = await Letter.findOne({ letterId: identifier });

    if (!letter) return res.status(404).json({ success: false, message: "Letter not found" });
    res.status(200).json({ success: true, data: letter });
  } catch (error) {
    console.error("getLetterById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch letter" });
  }
};
