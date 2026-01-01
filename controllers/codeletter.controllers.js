import Letter from "../models/letter.models.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";
import { validationResult } from "express-validator";
import People from "../models/people.models.js";
import ActivityLog from "../models/activitylog.models.js";
import {
  sendWhatsAppMessage,
  getLetterMessageTemplate,
} from "../services/whatsappService.js";
import emailService from "../services/emailService.js";
import { generateUnifiedOutwardNo } from "../utils/outwardNumberGenerator.js";
import drawAppreciationTemplate from "../utils/AppreciationTemplate.js";

const { getLetterEmailTemplate, sendEmail } = emailService;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// HELPER: Generate Letter ID for IT-Nexcore
// =====================================================
// async function generateCodeLetterId() {
//   const catAbbr = "NEX";

//   const today = new Date();
//   const yyyy = today.getFullYear();
//   const mm = String(today.getMonth() + 1).padStart(2, "0");
//   const dd = String(today.getDate()).padStart(2, "0");
//   const dateStr = `${yyyy}-${mm}-${dd}`;

//   const regex = new RegExp(`^${catAbbr}-${dateStr}-(\\d+)$`);

//   const last = await Letter.find({
//     letterId: { $regex: `^${catAbbr}-${dateStr}-` },
//   })
//     .select("letterId")
//     .sort({ createdAt: -1 })
//     .limit(1)
//     .lean();

//   let nextNum = 1;

//   if (last.length) {
//     const match = last[0].letterId.match(regex);
//     if (match && match[1]) {
//       nextNum = parseInt(match[1], 10) + 1;
//     }
//   }

//   const padded = String(nextNum).padStart(2, "0");
//   return `${catAbbr}-${dateStr}-${padded}`;
// }

async function generateCodeLetterId(category) {
  const catMap = {
    "IT-Nexcore": "NEX",
    "marketing-junction": "MJ",
    fsd: "fsd",
    hr: "hr",
    bvoc: "bvoc",
  };

  const catAbbr = catMap[category] || category.toUpperCase().slice(0, 4);

  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Regex to match: C4B-YYYY-MM-DD-XX
  const regex = new RegExp(`^${catAbbr}-${dateStr}-(\\d+)$`);

  // Find last ID for today's date
  const last = await Letter.find({
    letterId: { $regex: `^${catAbbr}-${dateStr}-` },
  })
    .select("letterId")
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  let nextNum = 1;

  if (last.length) {
    const match = last[0].letterId.match(regex);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNum).padStart(2, "0");

  return `${catAbbr}-${dateStr}-${padded}`;
}

// =====================================================
// HELPER: Format Date
// =====================================================
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}


export const createCodeLetter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      category,
      issueDate,
      letterType,
      course,
      subject,
      month,
      year,
      description,
    } = req.body;

    console.log("📥 Create Code Letter Request:", {
      name,
      category,
      course,
      letterType,
    });

    // Validation
    if (!name || !category || !course || !issueDate || !letterType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Additional validation for Appreciation Letter
    if (course === "Appreciation Letter") {
      if (!subject || !month || !year || !description) {
        return res.status(400).json({
          success: false,
          message:
            "Appreciation Letter requires subject, month, year, and description",
        });
      }
    }

    // Generate unique letter ID
    let letterId;
    let exists;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      letterId = await generateCodeLetterId();
      exists = await Letter.findOne({ letterId });
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique letter ID");
      }
    } while (exists);

    // Generate outward number
    const { outwardNo, outwardSerial } = await generateUnifiedOutwardNo(
      issueDate
    );

    console.log("✅ Generated IDs:", { letterId, outwardNo, outwardSerial });

    // Get user data
    const userData = await People.findOne({ name });
    const userPhone = userData?.phone || null;

    // Prepare letter data
    const letterData = {
      letterId,
      name,
      category,
      batch: "",
      letterType,
      subType: "code-letter",
      course,
      subject: subject || "",
      month: month || "",
      year: year || null,
      description: description || "",
      issueDate: new Date(issueDate),
      outwardNo,
      outwardSerial,
      createdBy: req.user?._id || null,
    };

    // Create letter
    const letter = await Letter.create(letterData);

    console.log("✅ Letter created successfully:", letter.letterId);

    // Send notifications
    if (userPhone) {
      try {
        const message = getLetterMessageTemplate(
          name,
          course,
          formatDate(issueDate)
        );
        await sendWhatsAppMessage(userPhone, message);
        console.log("📱 WhatsApp sent to:", userPhone);
      } catch (error) {
        console.error("WhatsApp notification failed:", error);
      }
    }

    if (userData?.email) {
      try {
        const emailContent = getLetterEmailTemplate(
          name,
          course,
          formatDate(issueDate)
        );
        await sendEmail(
          userData.email,
          `Your ${course} is Ready`,
          emailContent
        );
        console.log("📧 Email sent to:", userData.email);
      } catch (error) {
        console.error("Email notification failed:", error);
      }
    }

    // Log activity
    try {
      await ActivityLog.create({
        action: "created",
        letterId: letter.letterId,
        userName: letter.name,
        adminId: req.user?._id,
        details: `Code Letter created for ${letter.name} - ${course}`,
      });
    } catch (error) {
      console.error("Activity log failed:", error);
    }

    return res.status(201).json({
      success: true,
      message: "Code Letter created successfully",
      letter: {
        letterId: letter.letterId,
        name: letter.name,
        category: letter.category,
        course: letter.course,
        outwardNo: letter.outwardNo,
        issueDate: letter.issueDate,
      },
    });
  } catch (error) {
    console.error("❌ Create code letter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create code letter",
      error: error.message,
    });
  }
};

// =====================================================
// PREVIEW CODE LETTER
// =====================================================
export const previewCodeLetter = async (req, res) => {
  try {
    console.log("🔍 Preview code letter request received");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      name,
      category,
      issueDate,
      letterType,
      course,
      subject,
      month,
      year,
      description,
    } = req.body;

    // Validation
    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, category, issueDate, course",
      });
    }

    console.log("✅ Validation passed");

    // Generate temporary IDs
    const tempId = await generateCodeLetterId(category);
    const { outwardNo } = await generateUnifiedOutwardNo(issueDate);

    console.log("📝 Generated temp IDs:", { tempId, outwardNo });

    // Format date
    const formattedDate = formatDate(issueDate);

    // Load template images
    const templatesPath = path.join(__dirname, "../templates/CL");
    const headerPath = path.join(templatesPath, "Header.jpg");
    const footerPath = path.join(templatesPath, "Footer.jpg");
    const signaturePath = path.join(templatesPath, "Signature.jpg");
    const stampPath = path.join(templatesPath, "Stamp.jpg");

    console.log("📂 Template paths:", {
      templatesPath,
      headerExists: fs.existsSync(headerPath),
      footerExists: fs.existsSync(footerPath),
      signatureExists: fs.existsSync(signaturePath),
      stampExists: fs.existsSync(stampPath),
    });

    // Check if files exist
    if (!fs.existsSync(headerPath) || !fs.existsSync(footerPath)) {
      console.error("❌ Template files not found");
      return res.status(500).json({
        success: false,
        message: "Template files not found",
        paths: { headerPath, footerPath },
      });
    }

    console.log("✅ Loading template images...");

    // Load images
    const headerImg = await loadImage(headerPath);
    const footerImg = await loadImage(footerPath);
    const signatureImg = fs.existsSync(signaturePath)
      ? await loadImage(signaturePath)
      : null;
    const stampImg = fs.existsSync(stampPath)
      ? await loadImage(stampPath)
      : null;

    console.log("✅ Template images loaded successfully");

    // Create canvas (A4 size in pixels at 96 DPI)
    const width = 794;
    const height = 1123;

    console.log("🎨 Creating canvas:", { width, height });

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Prepare data
    const templateData = {
      name,
      subject: subject || "",
      month: month || "",
      year: year || "",
      description: description || "",
      formattedDate,
      outwardNo,
      credentialId: tempId,
    };

    console.log("📋 Template data:", templateData);

    // Draw template based on course
    if (course === "Appreciation Letter") {
      console.log("🖌️ Drawing Appreciation Letter template...");
      await drawAppreciationTemplate(
        ctx,
        width,
        height,
        templateData,
        headerImg,
        footerImg,
        signatureImg,
        stampImg
      );
      console.log("✅ Template drawn successfully");
    } else {
      console.error("❌ Unknown course type:", course);
      return res.status(400).json({
        success: false,
        message: `Template not implemented for course: ${course}`,
      });
    }

    // Convert to buffer
    console.log("🔄 Converting canvas to JPEG buffer...");
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });

    console.log(
      "✅ Preview generated successfully, buffer size:",
      buffer.length
    );

    res.setHeader("Content-Type", "image/jpeg");
    return res.send(buffer);
  } catch (error) {
    console.error("❌ Preview code letter error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to generate preview",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL CODE LETTERS
// =====================================================
export const getCodeLetters = async (req, res) => {
  try {
    const letters = await Letter.find({
      subType: "code-letter",
      category: "IT-Nexcore",
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: letters });
  } catch (error) {
    console.error("Get code letters error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch code letters" });
  }
};

// =====================================================
// GET CODE LETTER BY ID
// =====================================================
export const getCodeLetterById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let letter;
    if (isObjectId) {
      letter = await Letter.findById(identifier);
    } else {
      letter = await Letter.findOne({ letterId: identifier });
    }

    if (!letter) {
      return res
        .status(404)
        .json({ success: false, message: "Letter not found" });
    }

    res.status(200).json({ success: true, data: letter });
  } catch (error) {
    console.error("Get code letter by ID error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch letter" });
  }
};

// =====================================================
// DOWNLOAD CODE LETTER AS PDF
// =====================================================
export const downloadCodeLetterAsPdf = async (req, res) => {
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
      return res
        .status(404)
        .json({ success: false, message: "Letter not found" });
    }

    // Generate outward no if missing
    if (!letter.outwardNo || !letter.outwardSerial) {
      const { outwardNo, outwardSerial } = await generateUnifiedOutwardNo(
        letter.issueDate || new Date()
      );
      await Letter.findByIdAndUpdate(letter._id, { outwardNo, outwardSerial });
      letter.outwardNo = outwardNo;
      letter.outwardSerial = outwardSerial;
    }

    const formattedDate = formatDate(letter.issueDate);

    // Load template images
    const templatesPath = path.join(__dirname, "../templates/CL");
    const headerPath = path.join(templatesPath, "Header.jpg");
    const footerPath = path.join(templatesPath, "Footer.jpg");
    const signaturePath = path.join(templatesPath, "Signature.jpg");
    const stampPath = path.join(templatesPath, "Stamp.jpg");

    const headerImg = await loadImage(headerPath);
    const footerImg = await loadImage(footerPath);
    const signatureImg = fs.existsSync(signaturePath)
      ? await loadImage(signaturePath)
      : null;
    const stampImg = fs.existsSync(stampPath)
      ? await loadImage(stampPath)
      : null;

    // Create canvas
    const width = 794;
    const height = 1123;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Prepare data
    const templateData = {
      name: letter.name,
      subject: letter.subject || "",
      month: letter.month || "",
      year: letter.year || "",
      description: letter.description || "",
      formattedDate,
      outwardNo: letter.outwardNo,
      credentialId: letter.letterId,
    };

    // Draw template
    if (letter.course === "Appreciation Letter") {
      await drawAppreciationTemplate(
        ctx,
        width,
        height,
        templateData,
        headerImg,
        footerImg,
        signatureImg,
        stampImg
      );
    }

    // Convert canvas to JPEG buffer
    const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });

    // Create PDF with the image
    const doc = new PDFDocument({
      size: [width, height],
      margin: 0,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${letter.letterId || "code-letter"}.pdf"`
    );

    doc.pipe(res);
    doc.image(jpegBuffer, 0, 0, { width, height });
    doc.end();

    // Update download stats
    await Letter.findByIdAndUpdate(letter._id, {
      $inc: { downloadCount: 1 },
      lastDownloaded: new Date(),
      status: "downloaded",
    });
  } catch (error) {
    console.error("Download code letter error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: error.message,
      });
    }
  }
};

export default {
  createCodeLetter,
  previewCodeLetter,
  getCodeLetters,
  getCodeLetterById,
  downloadCodeLetterAsPdf,
};
