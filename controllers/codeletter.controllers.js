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
// IT-Nexcore templates
import drawJoiningLetterPaid from "../utils/C4B/JoiningLetter/JoiningLetterPaid.js";
import drawJoiningLetterUnpaid from "../utils/C4B/JoiningLetter/JoiningLetterUnpaid.js";
// Marketing Junction templates
import drawMJJoiningLetterPaid from "../utils/MJ/JoiningLetter/JoiningLetterPaid.js";
import drawMJJoiningLetterUnpaid from "../utils/MJ/JoiningLetter/JoiningLetterUnpaid.js";

const { getLetterEmailTemplate, sendEmail } = emailService;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// HELPER: Generate Letter ID
// =====================================================
async function generateCodeLetterId(category) {
  const catMap = {
    "IT-Nexcore": "NEX",
    "marketing-junction": "MJ",
    fsd: "FSD",
    hr: "HR",
    bvoc: "BVOC",
  };

  const catAbbr = catMap[category] || category.toUpperCase().slice(0, 4);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const regex = new RegExp(`^${catAbbr}-${dateStr}-(\\d+)$`);

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

// =====================================================
// HELPER: Get Template Paths
// =====================================================
function getTemplatePaths(category) {
  let templatesPath;

  if (category === "marketing-junction") {
    templatesPath = path.join(__dirname, "../templates/CL");
  } else {
    templatesPath = path.join(__dirname, "../templates/CL");
  }

  return {
    headerPath: path.join(templatesPath, "Header.jpg"),
    footerPath: path.join(templatesPath, "Footer.jpg"),
    signaturePath: path.join(templatesPath, "Signature.jpg"),
    stampPath: path.join(templatesPath, "Stamp.jpg"),
  };
}

// =====================================================
// HELPER: Get Drawing Function
// =====================================================
function getDrawingFunction(category, course) {
  if (category === "marketing-junction") {
    if (course === "Internship Joining Letter - Paid") {
      return drawMJJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawMJJoiningLetterUnpaid;
    }
  } else if (category === "IT-Nexcore") {
    if (course === "Internship Joining Letter - Paid") {
      return drawJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawJoiningLetterUnpaid;
    }
  }

  // Default for other letter types
  if (course === "Appreciation Letter") {
    return drawAppreciationTemplate;
  }

  return null;
}

// =====================================================
// CREATE CODE LETTER
// =====================================================
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
      role,
      trainingStartDate,
      trainingEndDate,
      officialStartDate,
      completionDate,
      responsibilities,
      amount,
      effectiveFrom,
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

    // Additional validation for Joining Letters
    if (
      course === "Internship Joining Letter - Paid" ||
      course === "Internship Joining Letter - Unpaid"
    ) {
      if (
        !role ||
        !trainingStartDate ||
        !trainingEndDate ||
        !officialStartDate ||
        !completionDate ||
        !responsibilities
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Joining Letter requires role, training dates, internship dates, and responsibilities",
        });
      }

      // Additional validation for paid internship
      if (course === "Internship Joining Letter - Paid") {
        if (!amount || !effectiveFrom) {
          return res.status(400).json({
            success: false,
            message: "Paid Internship requires amount and effective from date",
          });
        }
      }
    }

    // Generate unique letter ID
    let letterId;
    let exists;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      letterId = await generateCodeLetterId(category);
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
      issueDate: new Date(issueDate),
      outwardNo,
      outwardSerial,
      createdBy: req.user?._id || null,
    };

    // Add fields based on letter type
    if (course === "Appreciation Letter") {
      letterData.subject = subject || "";
      letterData.month = month || "";
      letterData.year = year || null;
      letterData.description = description || "";
    } else if (
      course === "Internship Joining Letter - Paid" ||
      course === "Internship Joining Letter - Unpaid"
    ) {
      letterData.role = role;
      letterData.trainingStartDate = new Date(trainingStartDate);
      letterData.trainingEndDate = new Date(trainingEndDate);
      letterData.officialStartDate = new Date(officialStartDate);
      letterData.completionDate = new Date(completionDate);
      letterData.responsibilities = responsibilities;

      if (course === "Internship Joining Letter - Paid") {
        letterData.amount = parseFloat(amount);
        letterData.effectiveFrom = new Date(effectiveFrom);
      }
    }

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
      role,
      trainingStartDate,
      trainingEndDate,
      officialStartDate,
      completionDate,
      responsibilities,
      amount,
      effectiveFrom,
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

    // Format dates
    const formattedDate = formatDate(issueDate);
    const formattedTrainingStart = trainingStartDate
      ? formatDate(trainingStartDate)
      : "";
    const formattedTrainingEnd = trainingEndDate
      ? formatDate(trainingEndDate)
      : "";
    const formattedOfficialStart = officialStartDate
      ? formatDate(officialStartDate)
      : "";
    const formattedCompletion = completionDate
      ? formatDate(completionDate)
      : "";
    const formattedEffectiveFrom = effectiveFrom
      ? formatDate(effectiveFrom)
      : "";

    // Get template paths based on category
    const { headerPath, footerPath, signaturePath, stampPath } =
      getTemplatePaths(category);

    console.log("📂 Template paths:", {
      category,
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

    // Check if this is a multi-page letter
    const isMultiPage =
      course === "Internship Joining Letter - Paid" ||
      course === "Internship Joining Letter - Unpaid";

    if (isMultiPage) {
      // For multi-page letters, create PDF directly
      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });

      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);

      // Prepare template data
      const templateData = {
        name,
        role: role || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: responsibilities || "",
        amount: amount || "",
        effectiveFrom: formattedEffectiveFrom,
        formattedDate,
        outwardNo,
        credentialId: tempId,
      };

      console.log("📋 Template data:", templateData);

      // Get the appropriate drawing function
      const drawFunction = getDrawingFunction(category, course);

      if (!drawFunction) {
        console.error("❌ No drawing function found for:", {
          category,
          course,
        });
        return res.status(400).json({
          success: false,
          message: `Template not implemented for: ${category} - ${course}`,
        });
      }

      // Generate both pages
      for (let pageNum = 1; pageNum <= 2; pageNum++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        console.log(`🖌️ Drawing page ${pageNum}...`);

        await drawFunction(
          ctx,
          width,
          height,
          templateData,
          headerImg,
          footerImg,
          signatureImg,
          stampImg,
          pageNum
        );

        const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
        doc.image(jpegBuffer, 0, 0, { width, height });

        if (pageNum < 2) {
          doc.addPage();
        }
      }

      doc.end();
      console.log("✅ Multi-page PDF preview generated successfully");
    } else {
      // Single page letters
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
    }
  } catch (error) {
    console.error("❌ Preview code letter error:", error);
    console.error("Error stack:", error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate preview",
        error: error.message,
      });
    }
  }
};

// =====================================================
// GET ALL CODE LETTERS
// =====================================================
export const getCodeLetters = async (req, res) => {
  try {
    const letters = await Letter.find({
      subType: "code-letter",
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

    // Format dates
    const formattedDate = formatDate(letter.issueDate);
    const formattedTrainingStart = letter.trainingStartDate
      ? formatDate(letter.trainingStartDate)
      : "";
    const formattedTrainingEnd = letter.trainingEndDate
      ? formatDate(letter.trainingEndDate)
      : "";
    const formattedOfficialStart = letter.officialStartDate
      ? formatDate(letter.officialStartDate)
      : "";
    const formattedCompletion = letter.completionDate
      ? formatDate(letter.completionDate)
      : "";
    const formattedEffectiveFrom = letter.effectiveFrom
      ? formatDate(letter.effectiveFrom)
      : "";

    // Get template paths
    const { headerPath, footerPath, signaturePath, stampPath } =
      getTemplatePaths(letter.category);

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

    // Check if multi-page
    const isMultiPage =
      letter.course === "Internship Joining Letter - Paid" ||
      letter.course === "Internship Joining Letter - Unpaid";

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

    if (isMultiPage) {
      // Multi-page joining letters
      const templateData = {
        name: letter.name,
        role: letter.role || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: letter.responsibilities || "",
        amount: letter.amount || "",
        effectiveFrom: formattedEffectiveFrom,
        formattedDate,
        outwardNo: letter.outwardNo,
        credentialId: letter.letterId,
      };

      // Get the appropriate drawing function
      const drawFunction = getDrawingFunction(letter.category, letter.course);

      for (let pageNum = 1; pageNum <= 2; pageNum++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        await drawFunction(
          ctx,
          width,
          height,
          templateData,
          headerImg,
          footerImg,
          signatureImg,
          stampImg,
          pageNum
        );

        const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
        doc.image(jpegBuffer, 0, 0, { width, height });

        if (pageNum < 2) {
          doc.addPage();
        }
      }
    } else {
      // Single page letters
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

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

      const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
      doc.image(jpegBuffer, 0, 0, { width, height });
    }

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
