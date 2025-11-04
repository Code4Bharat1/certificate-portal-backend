import Letter from "../models/letter.models.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { createCanvas, loadImage } from "canvas";

import certificateControllers from '../controllers/certificate.controllers.js';
import { fileURLToPath } from "url";

import { validationResult } from "express-validator";
import People from "../models/people.models.js";
import ActivityLog from "../models/activitylog.models.js";
import { sendCertificateNotification } from "../services/whatsappService.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @route POST /api/letters
 * @desc Create new letter
 */

export const createLetter = async (req, res) => {
  try {
    // ✅ Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, category, batch, course, description, issueDate } = req.body;

    // ✅ Auto-generate unique letterId
    let letterId;
    let existingId;
    do {
      letterId = certificateControllers.generateCertificateId(category, course);
      existingId = await Letter.findOne({ letterId });
    } while (existingId);

    // ✅ Optional: fetch phone number for WhatsApp
    const userData = await People.findOne({ name });
    let userPhone = userData?.phone || null;

    // ✅ Prepare letter data
    const letterData = {
      letterId,
      name,
      category,
      batch: batch || null,
      course,
      description: description?.trim(),
      issueDate,
      userPhone,
      createdBy: req.user?._id || null,
    };
    // letterData.description = description?.trim();

    console.log(letterData);
    

    // ✅ Create letter in DB
    const letter = await Letter.create(letterData);

    // ✅ Optional: WhatsApp Notification
    try {
      if (userPhone && letterId) {
        await sendCertificateNotification({
          userName: name,
          userPhone,
          certificateId: letterId,
          course,
          category,
          batch: batch || null,
          issueDate,
        });
        console.log(`✅ WhatsApp notification sent to ${userPhone}`);
      }
    } catch (error) {
      console.error("⚠️ WhatsApp notification error:", error);
    }

    // ✅ Log activity
    await ActivityLog.create({
      action: "created",
      letterId: letter.letterId,
      userName: letter.name,
      adminId: req.user?._id,
      details: `Letter created for ${letter.name}`,
    });

    // ✅ Success response
    return res.status(201).json({
      success: true,
      message: "Letter created successfully",
      letter,
    });

  } catch (error) {
    console.error("❌ Create letter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create letter",
      error: error.message,
    });
  }
};

/**
 * @route POST /api/letters/preview
 * @desc Generate letter preview as image/pdf blob
 */

export const previewLetter = async (req, res) => {
  try {
    const { name, category, issueDate, course, description } = req.body;

    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for preview",
      });
    }

    const tempLetterId = certificateControllers.generateCertificateId(category, course);
    const templateFilename = certificateControllers.getCourseTemplateFilename(course, category);
    const templatePath = path.join(__dirname, "../templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: `Letter template not found for course: ${course}`,
      });
    }

    const templateImage = await loadImage(templatePath);
    const width = templateImage.width;
    const height = templateImage.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);

    const formattedDate = new Date(issueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // =================== STYLES ===================
    ctx.fillStyle = "#111827";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    // ==============================================

    // ---- DATE ----
    ctx.font = 'bold 40px "Times New Roman", serif';
    ctx.fillText(formattedDate, width * 0.78, height * 0.253);

    // ---- SUBJECT ----
    const subject = `${course} – ${name}`;
    ctx.font = '50px "Times New Roman", serif';
    ctx.fillText(subject, width * 0.32, height * 0.313);

    // ---- GREETING ----
    // ctx.font = 'bold 40px "Times New Roman", serif';
    // ctx.fillText("To Whom It May Concern,", width * 0.13, height * 0.36);

    // ---- DESCRIPTION ----
    ctx.fillStyle = "#1a1a1a"; // slightly softer black for a printed look
    ctx.font = '45px "Georgia", "Garamond", "Merriweather", "Times New Roman", serif';
    ctx.textAlign = "left";

    // Dynamic area between greeting and “Warm Regards”
    const topY = height * 0.40;
    const bottomY = height * 0.70;
    const availableHeight = bottomY - topY;
    const descMaxWidth = width * 0.80;

    // Split into paragraphs based on blank lines
    const paragraphs = description
      .split(/\n\s*\n/)
      .map(p => p.replace(/\n/g, " ").trim())
      .filter(p => p.length > 0)
      .slice(0, 3);

    // 🧩 Softer line height for readability
    const lineHeight = 66; // increased from 45 → gives elegant paragraph rhythm

    // 🧩 Balanced paragraph spacing
    const paraSpacing =
      paragraphs.length > 1
        ? availableHeight / (paragraphs.length + 1)
        : availableHeight / 2;

    // Draw wrapped text for each paragraph, spaced evenly
    paragraphs.forEach((p, i) => {
      const y = topY + i * paraSpacing;
      wrapText(ctx, p, width * 0.13, y, descMaxWidth, lineHeight);
    });

    // ---- SIGN-OFF ----
    // ctx.font = 'bold 40px "Times New Roman", serif';
    // ctx.fillText("Warm Regards,", width * 0.13, height * 0.74);

    // ---- LETTER ID ----
    ctx.textAlign = "left";
    ctx.font = 'bold 60px "Poppins"';
    ctx.fillText(`${tempLetterId}`, width * 0.33, height * 0.761);

    // ---- FOOTER INFO ----
    ctx.font = '60px "Ovo", serif';
    ctx.fillStyle = "#1F2937";
    ctx.textAlign = "center";
    ctx.fillText(
      "https://certificate.nexcorealliance.com/verify-certificate",
      width / 2,
      height * 0.830
    );

    // ---- Final Output ----
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);

  } catch (error) {
    console.error("Preview letter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate letter preview",
      error: error.message,
    });
  }
};

// Helper for wrapping text
export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  lines.forEach((l, i) => {
    ctx.fillText(l, x, y + i * lineHeight);
  });
}


/**
 * @route GET /api/letters
 * @desc Get all letters
 */
// export const getLetters = async (req, res) => {
//   try {
//     const letters = await Letter.find().sort({ createdAt: -1 });
//     res.status(200).json({ success: true, data: letters });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to fetch letters" });
//   }
// };


