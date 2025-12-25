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
import {
  sendWhatsAppMessage,
  getLetterMessageTemplate,
  getParentNotificationTemplate,
} from "../services/whatsappService.js";
import emailService from "../services/emailService.js";
import { generateUnifiedOutwardNo } from "../utils/outwardNumberGenerator.js";

// Add this helper function after your imports in letter.controllers.js

/**
 * Normalize category for template lookup
 * Maps Code4Bharat to it-nexcore for template selection
 */
function normalizeCategory(category) {
  const lower = category.toLowerCase();
  if (lower === "code4bharat") {
    return "it-nexcore";
  }
  return category;
}

const { getLetterEmailTemplate, getParentNotificationEmailTemplate, sendEmail, sendParentNotification } = emailService;


import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from "pdf-lib";

import TemplateCode from "../utils/templatesCode.js";

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
export async function generateLetterId(category) {
  const catMap = {
    "it-nexcore": "NEX",
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


/* -------------------------
   Template filename helper (unchanged)
   ------------------------- */
export function getLetterTemplateFilename(course, category) {
  const templateMap = {
    "it-nexcore": {
      "Internship Joining Letter - Unpaid": "C4B/C4B-internship-unpaid.pdf",
      "Internship Joining Letter - Paid": "C4B/C4B-internship-paid.pdf",
      "Non-Disclosure Agreement": "C4B/C4B-NDA.pdf",
      // 'Memo': "Letter.jpg",
      // common
      "Appreciation Letter": "common/Appreciation.jpg",
      "Experience Certificate": "common/Experience-certificate.jpg",
      "Timeline Letter": "common/Timeline Letter.jpg",
      "Non Paid to Paid": "common/Non-Paid-to-Paid-Promotion-Letter.png",
      "Stipend Revision": "common/Stipend-Revision-Promotion-Letter.png",
    },
    "marketing-junction": {
      "Internship Joining Letter - Unpaid": "MJ/MJ-internship-unpaid.pdf",
      "Internship Joining Letter - Paid": "MJ/MJ-internship-paid.pdf",
      "Non-Disclosure Agreement": "MJ/MJ-NDA.pdf",
      // common
      "Appreciation Letter": "common/Appreciation.jpg",
      "Experience Certificate": "common/Experience-certificate.jpg",
      "Timeline Letter": "common/Timeline Letter.jpg",
      "Non Paid to Paid": "common/Non-Paid-to-Paid-Promotion-Letter.png",
      "Stipend Revision": "common/Stipend-Revision-Promotion-Letter.png",
    },
    fsd: {
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "fsd-WarningLetter.jpg",

      "Appreciation for Best Attendance":
        "fsd/fsd-appreciation-for-bestAttendance.jpg",
      "Appreciation for Outstanding Performance":
        "fsd/fsd-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance":
        "fsd/fsd-appreciation-for-consistent-performer.png",

      "Internship Experience Certificate":
        "fsd/fsd-internship-experience-certificate.jpg",
      "Live Project Agreement": "fsd/fsd-LiveProject.pdf",
      "Non-Disclosure Agreement": "fsd/NDA.pdf",
      "Offer Letter": "fsd/fsd-OfferLetter.pdf",

      "Warning for Incomplete Assignment/Project Submissions":
        "fsd/fsd-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "fsd/fsd-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior":
        "fsd/fsd-warning-for-misconduct.jpg",
      "Warning for Unauthorized Absence from Training Sessions":
        "fsd/fsd-warning-for-unauthorized-absence.jpg",
      "Warning Regarding Punctuality and Professional Discipline":
        "fsd/fsd-warning-regarding-punctuality.jpg",

      "Concern Letter-Audit Interview Performance":
        "fsd/fsd-concern-letter.jpg",
    },
    bvoc: {
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "bvoc-WarningLetter.jpg",
      // 'Community Letter': "Letter.jpg",

      "Appreciation for Best Attendance":
        "bvoc/bvoc-appreciation-for-bestAttendance.jpg",
      "Appreciation for Detecting Errors And Debugging":
        "bvoc/bvoc-appreciation-for-debugging.jpg",
      "Appreciation for Outstanding Performance":
        "bvoc/bvoc-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance":
        "bvoc/bvoc-appreciation-for-consistent-performer.jpg",

      "Committee Member": "bvoc/bvoc-committe-member.jpg",
      "Committee President": "bvoc/bvoc-committe-president.jpg",
      "Committee Vice-President": "bvoc/bvoc-committe-vice-president.jpg",

      "Warning for Incomplete Assignment/Project Submissions":
        "bvoc/bvoc-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "bvoc/bvoc-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior":
        "bvoc/bvoc-warning-for-misconduct.jpg",
      "Warning for Punctuality and Discipline":
        "bvoc/bvoc-warning-for-punctuality.jpg",
      "Warning for Unauthorized Absence from Sessions":
        "bvoc/bvoc-warning-for-unauthorized-absence.jpg",

      "Concern Letter-Audit Interview Performance":
        "bvoc/bvoc-concern-letter.jpg",
    },
    dm: {
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "fsd-WarningLetter.jpg",

      "Appreciation for Best Attendance":
        "dm/dm-appreciation-for-bestAttendance.jpg",
      "Appreciation for Outstanding Performance":
        "dm/dm-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance":
        "dm/dm-appreciation-for-consistent-performer.jpg",

      "Internship Experience Certificate":
        "dm/dm-internship-experience-certificate.jpg",
      "Offer Letter": "dm/dm-OfferLetter.pdf",

      "Warning for Incomplete Assignment/Project Submissions":
        "dm/dm-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "dm/dm-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior":
        "dm/dm-warning-for-misconduct.jpg",
      "Warning for Unauthorized Absence from Training Sessions":
        "dm/dm-warning-for-unauthorized-absence.jpg",
      "Warning Regarding Punctuality and Professional Discipline":
        "dm/dm-warning-regarding-punctuality.jpg",

      "Concern Letter-Audit Interview Performance": "dm/dm-concern-letter.jpg",
    },
    hr: {
      "Internship Joining Letter - Unpaid": "hr/hr-internship-unpaid.pdf",
      "Internship Joining Letter - Paid": "hr/hr-internship-paid.pdf",
      "Non-Disclosure Agreement": "hr/hr-NDA.pdf",
      // 'Memo': "Letter.jpg",
      // common
      "Appreciation Letter": "common/Appreciation.jpg",
      "Experience Certificate": "common/Experience-certificate.jpg",
      "Timeline Letter": "common/Timeline Letter.jpg",
      "Non Paid to Paid": "common/Non-Paid-to-Paid-Promotion-Letter.png",
      "Stipend Revision": "common/Stipend-Revision-Promotion-Letter.png",
    },
    operations: {
      "Internship Joining Letter - Unpaid": "operations/operations-internship-unpaid.pdf",
      "Internship Joining Letter - Paid": "operations/operations-internship-paid.pdf",
      "Non-Disclosure Agreement": "operations/operations-NDA.pdf",
      // 'Memo': "Letter.jpg",
      // common
      "Appreciation Letter": "common/Appreciation.jpg",
      "Experience Certificate": "common/Experience-certificate.jpg",
      "Timeline Letter": "common/Timeline Letter.jpg",
      "Non Paid to Paid": "common/Non-Paid-to-Paid-Promotion-Letter.png",
      "Stipend Revision": "common/Stipend-Revision-Promotion-Letter.png",
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
      issueDate,
      letterType,
      subType,
      course,
      description = "",
      subject = "",
      role,
      startDate,
      endDate,
      duration,
      batch,
      committeeType,
      attendancePercent,
      assignmentName,
      misconductReason,
      attendanceMonth,
      attendanceYear,
      performanceMonth,
      performanceYear,
      testingPhase,
      uncover,
      subjectName,
      projectName,
      auditDate,
      trainingStartDate,
      trainingEndDate,
      officialStartDate,
      completionDate,
      responsibilities,
      amount,
      effectiveFrom,
      timelineStage,
      timelineProjectName,
      timelineDueDate,
      timelineNewDate,
      genderPronoun,
      month,
      year,
    } = req.body;

    if (!name || !category || !course || !issueDate || !letterType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (name, category, course, issueDate, letterType).",
      });
    }

    let letterId;
    let exists;
    do {
      letterId = await generateLetterId(category, course);
      exists = await Letter.findOne({ letterId });
    } while (exists);

    // ✅ USE UNIFIED FUNCTION
    const { outwardNo, outwardSerial } = await generateUnifiedOutwardNo(
      issueDate
    );

    const userData = await People.findOne({ name });
    const userPhone = userData?.phone || null;

    const letterData = {
      letterId,
      name,
      category,
      batch: batch || "",
      letterType: letterType || "",
      subType: subType || "default",
      course,
      subject: subject.trim(),
      role: role || "",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      duration: duration || "",
      description: description.trim(),
      issueDate: new Date(issueDate),
      outwardNo,
      outwardSerial,
      createdBy: req.user?._id || null,
      committeeType: committeeType || "",
      attendancePercent: attendancePercent || "",
      assignmentName: assignmentName || "",
      misconductReason: misconductReason || "",
      attendanceMonth: attendanceMonth || "",
      attendanceYear: attendanceYear || "",
      performanceMonth: performanceMonth || "",
      performanceYear: performanceYear || "",
      testingPhase: testingPhase || "",
      subjectName: subjectName || "",
      projectName: projectName || "",
      uncover: uncover || "",
      auditDate: auditDate ? new Date(auditDate) : null,
      trainingStartDate: trainingStartDate ? new Date(trainingStartDate) : null,
      trainingEndDate: trainingEndDate ? new Date(trainingEndDate) : null,
      officialStartDate: officialStartDate ? new Date(officialStartDate) : null,
      completionDate: completionDate ? new Date(completionDate) : null,
      responsibilities: responsibilities || "",
      amount: amount || "",
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      timelineStage: timelineStage || "",
      timelineProjectName: timelineProjectName || "",
      timelineDueDate: timelineDueDate || "",
      timelineNewDate: timelineNewDate || "",
      genderPronoun: genderPronoun || "",
      month: month || "",
      year: year || "",
    };

    const letter = await Letter.create(letterData);

    // ... rest of notification code ...

    await ActivityLog.create({
      action: "created",
      letterId: letter.letterId,
      userName: letter.name,
      adminId: req.user?._id,
      details: `Letter created for ${letter.name}`,
    });

    return res.status(201).json({
      success: true,
      message: "Letter created successfully",
      letter,
    });
  } catch (error) {
    console.error("Create letter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create letter",
      error: error.message,
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
      letterType,
      course,
      description = "",
      subject = "",
      role,
      startDate,
      endDate,
      duration,
      committeeType,
      attendancePercent,
      assignmentName,
      misconductReason,
      attendanceMonth,
      attendanceYear,
      performanceMonth,
      performanceYear,
      testingPhase,
      uncover,
      subjectName,
      projectName,
      auditDate,
      trainingStartDate,
      trainingEndDate,
      officialStartDate,
      completionDate,
      responsibilities,
      amount,
      effectiveFrom,
      timelineStage,
      timelineProjectName,
      timelineDueDate,
      timelineNewDate,
      genderPronoun,
      month,
      year,
    } = req.body;

    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for preview",
      });
    }

    const tempId = await generateLetterId(category, course);
   const { outwardNo } = await generateUnifiedOutwardNo(issueDate);

const normalizedCategory = normalizeCategory(category);
const templateFilename = getLetterTemplateFilename(course, normalizedCategory);    const templatePath = path.join(__dirname, "../templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: `Letter template not found for course: ${course}`,
      });
    }

    const templateType = getTemplateTypeByFilename(templateFilename);
    const formattedDate = new Date(issueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedtrainingStartDate = new Date(trainingStartDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const formattedtrainingEndDate = new Date(trainingEndDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const formattedofficialStartDate = new Date(officialStartDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const formattedcompletionDate = new Date(completionDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    /* ----------------------------------
       🖼 Image Template Rendering
    ---------------------------------- */
    if (templateType === "image") {
      const templateImage = await loadImage(templatePath);
      const width = templateImage.width;
      const height = templateImage.height;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(templateImage, 0, 0);

      if (category === "fsd") {
        await TemplateCode.getFSDTemplateCode(
          ctx,
          width,
          height,
          issueDate,
          course,
          name,
          outwardNo,
          formattedDate,
          tempId,
          description,
          subject,
          role,
          startDate,
          endDate,
          committeeType,
          attendancePercent,
          assignmentName,
          misconductReason,
          attendanceMonth,
          attendanceYear,
          performanceMonth,
          performanceYear,
          testingPhase,
          uncover,
          subjectName,
          projectName,
          auditDate
        );
      } else if (category === "bvoc") {
        await TemplateCode.getBVOCTemplateCode(
          ctx,
          width,
          height,
          issueDate,
          course,
          name,
          outwardNo,
          formattedDate,
          tempId,
          description,
          subject,
          role,
          startDate,
          endDate,
          committeeType,
          attendancePercent,
          assignmentName,
          misconductReason,
          attendanceMonth,
          attendanceYear,
          performanceMonth,
          performanceYear,
          testingPhase,
          uncover,
          subjectName,
          projectName,
          auditDate
        );
      } else if (category === "dm") {
        await TemplateCode.getDMTemplateCode(
          ctx,
          width,
          height,
          issueDate,
          course,
          name,
          outwardNo,
          formattedDate,
          tempId,
          description,
          subject,
          role,
          startDate,
          endDate,
          committeeType,
          attendancePercent,
          assignmentName,
          misconductReason,
          attendanceMonth,
          attendanceYear,
          performanceMonth,
          performanceYear,
          testingPhase,
          uncover,
          subjectName,
          projectName,
          auditDate
        );
      } else if (category === "marketing-junction" || category === "it-nexcore" || category === "hr" || category === "operations") {
        await TemplateCode.getCommonTemplateCode(
          ctx,
          width,
          height,
          issueDate,
          course,
          name,
          outwardNo,
          formattedDate,
          tempId,
          description,
          subject,
          role,
          startDate,
          endDate,
          committeeType,
          attendancePercent,
          assignmentName,
          misconductReason,
          attendanceMonth,
          attendanceYear,
          performanceMonth,
          performanceYear,
          testingPhase,
          uncover,
          subjectName,
          projectName,
          auditDate,
          trainingStartDate,
          trainingEndDate,
          officialStartDate,
          completionDate,
          responsibilities,
          amount,
          effectiveFrom,
          timelineStage,
          timelineProjectName,
          timelineDueDate,
          timelineNewDate,
          genderPronoun,
          month,
          year,
        );
      } else {
      }

      const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
      res.setHeader("Content-Type", "image/jpeg");
      return res.send(buffer);
    }
    else {
      /* ----------------------------------
      📄 PDF Template Rendering
      ---------------------------------- */
      const existingPdfBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFLibDocument.load(existingPdfBytes);

      if (category === "fsd") {
        await TemplateCode.drawFSDPdfTemplate(pdfDoc, course, {
          name,
          outwardNo,
          issueDate,
          formattedDate,
          tempId,
          description,
          subject,
          startDate,
          endDate,
        });
      } else if (category === "marketing-junction") {
        await TemplateCode.drawMJPdfTemplate(pdfDoc, course, {
          name,
          outwardNo,
          formattedDate,
          tempId,
          role,
          trainingStartDate,
          trainingEndDate,
          officialStartDate,
          completionDate,
          responsibilities,
          amount,
          effectiveFrom,
          duration,
        });
     } else if (["it-nexcore", "Code4Bharat"].includes(category)) {

        await TemplateCode.drawC4BPdfTemplate(pdfDoc, course, {
          name,
          outwardNo,
          formattedDate,
          tempId,
          role,
          formattedtrainingStartDate,
          formattedtrainingEndDate,
          formattedofficialStartDate,
          formattedcompletionDate,
          responsibilities,
          amount,
          effectiveFrom,
          duration,
        });
      } else if (category === "hr") {
        await TemplateCode.drawHRPdfTemplate(pdfDoc, course, {
          name,
          outwardNo,
          formattedDate,
          tempId,
          role,
          trainingStartDate,
          trainingEndDate,
          officialStartDate,
          completionDate,
          responsibilities,
          amount,
          effectiveFrom,
          duration,
        });
      } else if (category === "operations") {
        await TemplateCode.drawODPdfTemplate(pdfDoc, course, {
          name,
          outwardNo,
          formattedDate,
          tempId,
          role,
          trainingStartDate,
          trainingEndDate,
          officialStartDate,
          completionDate,
          responsibilities,
          amount,
          effectiveFrom,
          duration,
        });
      } else if (category === "dm") {
        await TemplateCode.drawDMPdfTemplate(pdfDoc, course, {
          name,
          outwardNo,
          issueDate,
          formattedDate,
          tempId,
          description,
          subject,
          startDate,
          endDate,
        });
      }

      const pdfBytes = await pdfDoc.save();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=preview.pdf");
      return res.send(Buffer.from(pdfBytes));
    }
  } catch (error) {
    console.error("Preview letter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate letter preview",
      error: error.message,
    });
  }
};

/* Helper for PDF text wrapping */
function wrapPdfText(text, maxWidth, font, size) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (let word of words) {
    const test = line + word + " ";
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(line.trim());
      line = word + " ";
    } else line = test;
  }
  if (line) lines.push(line.trim());
  return lines;
}

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
      return res
        .status(404)
        .json({ success: false, message: "Letter not found" });
    }

    // console.log(letter);

    // Generate outward no. if missing
    if (!letter.outwardNo || !letter.outwardSerial) {
      const { outwardNo, outwardSerial } = await generateUnifiedOutwardNo(
        letter.issueDate || new Date()
      );
      await Letter.findByIdAndUpdate(letter._id, { outwardNo, outwardSerial });
      letter.outwardNo = outwardNo;
      letter.outwardSerial = outwardSerial;
    }

    // console.log(letter.course, letter.category);

    const normalizedCategory = normalizeCategory(letter.category);
    const templateFilename = getLetterTemplateFilename(
      letter.course,
      normalizedCategory
    );
    const templatePath = path.join(__dirname, "../templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      return res
        .status(500)
        .json({ success: false, message: "Template not found" });
    }

    const templateType = getTemplateTypeByFilename(templateFilename);
    const formattedDate = new Date(letter.issueDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const trainingStartDate = new Date(
      letter.trainingStartDate
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const trainingEndDate = new Date(letter.trainingEndDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const officialStartDate = new Date(
      letter.officialStartDate
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const completionDate = new Date(letter.completionDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const effectiveFrom = new Date(letter.effectiveFrom).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    // ------------------------------------
    // 🖼 IMAGE TEMPLATE (SAME AS PREVIEW)
    // ------------------------------------
    if (templateType === "image") {
      const templateImage = await loadImage(templatePath);
      const width = templateImage.width;
      const height = templateImage.height;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(templateImage, 0, 0);

      // Load signature only if exists
      let signatureImage = null;
      if (letter.signedUploaded && letter.signedDocumentPath) {
        try {
          signatureImage = await loadImage(
            path.join(__dirname, "../", letter.signedDocumentPath)
          );
        } catch (err) {}
      }

      const {
        name,
        category,
        issueDate,
        letterType,
        course,
        description = "",
        subject = "",
        role,
        committeeType,
        attendancePercent,
        assignmentName,
        misconductReason,
        attendanceMonth,
        attendanceYear,
        performanceMonth,
        performanceYear,
        testingPhase,
        uncover,
        subjectName,
        projectName,
        auditDate,

        // ⭐ Add new fields so image template gets them
        trainingStartDate,
        trainingEndDate,
        officialStartDate,
        completionDate,
        responsibilities,
        amount,
        // effectiveFrom,

        timelineStage,
        timelineProjectName,
        timelineDueDate,
        timelineNewDate,

        genderPronoun,
        month,
        year,
      } = letter;

      const tempId =
        letter.letterId || (await generateLetterId(category, course));
      const outwardNo = letter.outwardNo;

      const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
      };

      const startDate = formatDate(letter.startDate);
      const endDate = formatDate(letter.endDate);
      const effectiveFrom = formatDate(letter.effectiveFrom);

      if (category === "fsd") {
        TemplateCode.getFSDTemplateCode(
          ctx,
          width,
          height,
          issueDate,
          course,
          name,
          outwardNo,
          formattedDate,
          tempId,
          description,
          subject,
          role,
          startDate,
          endDate,
          committeeType,
          attendancePercent,
          assignmentName,
          misconductReason,
          attendanceMonth,
          attendanceYear,
          performanceMonth,
          performanceYear,
          testingPhase,
          uncover,
          subjectName,
          projectName,
          auditDate,
          signatureImage
        );
      } else if (category === "bvoc") {
        TemplateCode.getBVOCTemplateCode(
          ctx,
          width,
          height,
          issueDate,
          course,
          name,
          outwardNo,
          formattedDate,
          tempId,
          description,
          subject,
          role,
          startDate,
          endDate,
          committeeType,
          attendancePercent,
          assignmentName,
          misconductReason,
          attendanceMonth,
          attendanceYear,
          performanceMonth,
          performanceYear,
          testingPhase,
          uncover,
          subjectName,
          projectName,
          auditDate,
          signatureImage
        );
      } else if (category === "dm") {
        TemplateCode.getDMTemplateCode(
          ctx,
          width,
          height,
          issueDate,
          course,
          name,
          outwardNo,
          formattedDate,
          tempId,
          description,
          subject,
          role,
          startDate,
          endDate,
          committeeType,
          attendancePercent,
          assignmentName,
          misconductReason,
          attendanceMonth,
          attendanceYear,
          performanceMonth,
          performanceYear,
          testingPhase,
          uncover,
          subjectName,
          projectName,
          auditDate,
          signatureImage
        );
      } else if (
        category === "marketing-junction" ||
        category === "it-nexcore" ||
        category === "hr" ||
        category === "operations"
      ) {
        await TemplateCode.getCommonTemplateCode(
          ctx,
          width,
          height,
          issueDate,
          course,
          name,
          outwardNo,
          formattedDate,
          tempId,
          description,
          subject,
          role,
          startDate,
          endDate,
          committeeType,
          attendancePercent,
          assignmentName,
          misconductReason,
          attendanceMonth,
          attendanceYear,
          performanceMonth,
          performanceYear,
          testingPhase,
          uncover,
          subjectName,
          projectName,
          auditDate,

          // ⭐ Add missing fields for MJ image template
          trainingStartDate,
          trainingEndDate,
          officialStartDate,
          completionDate,
          responsibilities,
          amount,
          effectiveFrom,
          timelineStage,
          timelineProjectName,
          timelineDueDate,
          timelineNewDate,
          genderPronoun,
          month,
          year,
          signatureImage
        );
      } else {
      }

      // Convert canvas to JPEG buffer
      const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });

      // Now embed that image into a PDF (1:1 match)
      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${letter.letterId || "certificate"}.pdf"`
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

      return;
    } else {
      /* ----------------------------------
     📄 PDF Template Rendering (Download)
    ---------------------------------- */
      const existingPdfBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFLibDocument.load(existingPdfBytes);

      let signatureImage = null;

      if (letter.signedUploaded && letter.signedDocumentPath) {
        const sigPath = path.join(__dirname, "../", letter.signedDocumentPath);

        if (fs.existsSync(sigPath)) {
          const signatureBytes = fs.readFileSync(sigPath);
          signatureImage = await pdfDoc.embedPng(signatureBytes);
        }
      }

      if (letter.category === "fsd") {
        // Reuse the same unified drawPdfTemplate logic
        await TemplateCode.drawFSDPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          issueDate: letter.issueDate,
          formattedDate: new Date(letter.issueDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          tempId: letter.letterId,
          description: letter.description,
          subject: letter.subject,
          startDate: letter.startDate,
          endDate: letter.endDate,
          signatureImage,
        });
      } else if (letter.category === "marketing-junction") {
        await TemplateCode.drawMJPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          formattedDate: new Date(letter.issueDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          tempId: letter.letterId,
          role: letter.role,

          trainingStartDate: trainingStartDate,
          trainingEndDate: trainingEndDate,
          officialStartDate: officialStartDate,
          completionDate: completionDate,
          responsibilities: letter.responsibilities,
          amount: letter.amount,
          effectiveFrom: effectiveFrom,
          duration: letter.duration,

          // Add missing fields to MJ PDF
          timelineStage: letter.timelineStage,
          timelineProjectName: letter.timelineProjectName,
          timelineDueDate: letter.timelineDueDate,
          timelineNewDate: letter.timelineNewDate,

          genderPronoun: letter.genderPronoun,
          month: letter.month,
          year: letter.year,
          signatureImage,
        });
      } else if (letter.category === "it-nexcore") {
        await TemplateCode.drawC4BPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          formattedDate: new Date(letter.issueDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          tempId: letter.letterId,
          role: letter.role,

          trainingStartDate: trainingStartDate,
          trainingEndDate: trainingEndDate,
          officialStartDate: officialStartDate,
          completionDate: completionDate,
          responsibilities: letter.responsibilities,
          amount: letter.amount,
          effectiveFrom: effectiveFrom,
          duration: letter.duration,

          // Add missing fields to MJ PDF
          timelineStage: letter.timelineStage,
          timelineProjectName: letter.timelineProjectName,
          timelineDueDate: letter.timelineDueDate,
          timelineNewDate: letter.timelineNewDate,

          genderPronoun: letter.genderPronoun,
          month: letter.month,
          year: letter.year,
          signatureImage,
        });
      } else if (letter.category === "hr") {
        await TemplateCode.drawHRPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          formattedDate: new Date(letter.issueDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          tempId: letter.letterId,
          role: letter.role,

          trainingStartDate: trainingStartDate,
          trainingEndDate: trainingEndDate,
          officialStartDate: officialStartDate,
          completionDate: completionDate,
          responsibilities: letter.responsibilities,
          amount: letter.amount,
          effectiveFrom: effectiveFrom,
          duration: letter.duration,

          // Add missing fields to MJ PDF
          timelineStage: letter.timelineStage,
          timelineProjectName: letter.timelineProjectName,
          timelineDueDate: letter.timelineDueDate,
          timelineNewDate: letter.timelineNewDate,

          genderPronoun: letter.genderPronoun,
          month: letter.month,
          year: letter.year,
          signatureImage,
        });
      } else if (letter.category === "operations") {
        await TemplateCode.drawODPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          formattedDate: new Date(letter.issueDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          tempId: letter.letterId,
          role: letter.role,

          trainingStartDate: trainingStartDate,
          trainingEndDate: trainingEndDate,
          officialStartDate: officialStartDate,
          completionDate: completionDate,
          responsibilities: letter.responsibilities,
          amount: letter.amount,
          effectiveFrom: effectiveFrom,
          duration: letter.duration,

          // Add missing fields to MJ PDF
          timelineStage: letter.timelineStage,
          timelineProjectName: letter.timelineProjectName,
          timelineDueDate: letter.timelineDueDate,
          timelineNewDate: letter.timelineNewDate,

          genderPronoun: letter.genderPronoun,
          month: letter.month,
          year: letter.year,
          signatureImage,
        });
      } else if (letter.category === "dm") {
        // Reuse the same unified drawPdfTemplate logic
        await TemplateCode.drawDMPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          issueDate: letter.issueDate,
          formattedDate: new Date(letter.issueDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          tempId: letter.letterId,
          description: letter.description,
          subject: letter.subject,
          startDate: letter.startDate,
          endDate: letter.endDate,
          signatureImage,
        });
      }

      // Save PDF and send as downloadable file
      const pdfBytes = await pdfDoc.save();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${letter.letterId || "certificate"}.pdf"`
      );
      res.send(Buffer.from(pdfBytes));

      // Update metadata in DB
      await Letter.findByIdAndUpdate(letter._id, {
        $inc: { downloadCount: 1 },
        lastDownloaded: new Date(),
        status: "downloaded",
      });
    }
  } catch (error) {
    console.error("downloadLetterAsPdf error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: error.message,
      });
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
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch letters" });
  }
};

export const getLetterById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    let letter;
    if (isObjectId) letter = await Letter.findById(identifier);
    else letter = await Letter.findOne({ letterId: identifier });

    if (!letter)
      return res
        .status(404)
        .json({ success: false, message: "Letter not found" });
    res.status(200).json({ success: true, data: letter });
  } catch (error) {
    console.error("getLetterById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch letter" });
  }
};
