import Letter from "../models/letter.models.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { createCanvas, loadImage } from "canvas";
// import { generateLetterId } from "../utils/idUtils.js";
// import { getLetterTemplateFilename } from "../utils/templateUtils.js";

import certificateControllers from '../controllers/certificate.controllers.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @route POST /api/letters
 * @desc Create new letter
 */
export const createLetter = async (req, res) => {
  try {
    const { name, category, batch, course, description, issueDate } = req.body;

    if (!name || !category || !course || !issueDate) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const newLetter = await Letter.create({
      name,
      category,
      batch,
      course,
      description,
      issueDate,
      createdBy: req.user?._id, // optional, if using auth
    });

    return res.status(201).json({
      success: true,
      message: "Letter created successfully",
      data: newLetter,
    });
  } catch (error) {
    console.error("Create letter error:", error);
    res.status(500).json({ success: false, message: "Server error" });
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

    // ---- DATE (Top-right corner beside 'Date:') ----
    ctx.font = 'bold 40px "Times New Roman", serif';
    ctx.fillText(formattedDate, width * 0.78, height * 0.253);

    // ---- SUBJECT ----
    const subject = `${course} – ${name}`;
    // ctx.font = 'bold 30px "Times New Roman", serif';
    // ctx.fillText("Subject:", width * 0.13, height * 0.26);

    ctx.font = '40px "Times New Roman", serif';
    ctx.fillText(subject, width * 0.32, height * 0.314);

    // ---- GREETING ----
    // ctx.font = 'bold 30px "Times New Roman", serif';
    // ctx.fillText("To Whom It May Concern,", width * 0.13, height * 0.37);

    // ---- DESCRIPTION (3 paragraphs, wrapped) ----
    ctx.font = '40px "Times New Roman", serif';
    ctx.textAlign = "justify";

    const descYStart = height * 0.39;
    const descMaxWidth = width * 0.80;
    const lineHeight = 40;

    // Split into paragraphs (approx every ~300 chars)
    const paragraphs = [];
    if (description && description.length > 0) {
      const words = description.split(" ");
      let para = "";
      for (const word of words) {
        if (para.length + word.length > 300 && paragraphs.length < 2) {
          paragraphs.push(para.trim());
          para = "";
        }
        para += word + " ";
      }
      if (para.trim()) paragraphs.push(para.trim());
    }

    // Limit to max 3 paragraphs
    const limitedParagraphs = paragraphs.slice(0, 3);
    limitedParagraphs.forEach((para, i) => {
      wrapText(ctx, para, width * 0.13, descYStart + i * 180, descMaxWidth, lineHeight);
    });

    // ---- LETTER ID ----
    ctx.textAlign = "left";
    ctx.font = 'bold 60px "Poppins"';
    ctx.fillText(`${tempLetterId}`, width * 0.33, height * 0.761);

    // ---- FOOTER INFO (verify note) ----
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
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l.trim(), x, y + i * lineHeight));
}


/**
 * @route GET /api/letters
 * @desc Get all letters
 */
export const getLetters = async (req, res) => {
  try {
    const letters = await Letter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: letters });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch letters" });
  }
};
