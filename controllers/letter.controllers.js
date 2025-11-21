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
    code4bharat: "C4B",
    "marketing-junction": "MJ",
    FSD: "FSD",
    HR: "HR",
    BVOC: "BVOC",
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
   Helper: generateOutwardNo
   (unchanged, used to produce outwardNo/outwardSerial)
   ------------------------- */
export async function generateOutwardNo(category, course, issueDate) {
  const issue = issueDate ? new Date(issueDate) : new Date();

  const yyyy = issue.getFullYear();
  const mm = String(issue.getMonth() + 1).padStart(2, "0");
  const dd = String(issue.getDate()).padStart(2, "0");
  const datePart = `${yyyy}/${mm}/${dd}`;

  // ✅ Get the last letter globally — no category/course filters
  let lastLetter = await Letter.findOne({})
    .sort({ outwardSerial: -1, createdAt: -1 })
    .lean();

  let maxSerial = 0;

  if (lastLetter) {
    if (
      typeof lastLetter.outwardSerial === "number" &&
      lastLetter.outwardSerial > 0
    ) {
      maxSerial = lastLetter.outwardSerial;
    } else if (lastLetter.outwardNo) {
      const match = String(lastLetter.outwardNo).match(/(\d+)\s*$/);
      if (match && match[1]) {
        maxSerial = parseInt(match[1], 10);
      }
    }
  }

  // ✅ Continuous outward serial for all categories/courses
  let nextSerial = maxSerial + 1;

  // ✅ Ensure numbering starts from 5 if no previous letters
  if (nextSerial < 5) {
    nextSerial = 5;
  }

  // ✅ Unified outward number format (no category logic)
  const outwardNo = `NEX/${datePart}/${nextSerial}`;

  return { outwardNo, outwardSerial: nextSerial };
}

/* -------------------------
   Template filename helper (unchanged)
   ------------------------- */
export function getLetterTemplateFilename(course, category) {
  const templateMap = {
    code4bharat: {
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
    FSD: {
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "FSD-WarningLetter.jpg",

      "Appreciation for Best Attendance":
        "FSD/FSD-appreciation-for-bestAttendance.jpg",
      "Appreciation for Outstanding Performance":
        "FSD/FSD-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance":
        "FSD/FSD-appreciation-for-consistent-performer.png",

      "Internship Experience Certificate":
        "FSD/FSD-internship-experience-certificate.jpg",
      "Live Project Agreement": "FSD/FSD-LiveProject.pdf",
      "Non-Disclosure Agreement": "FSD/NDA.pdf",
      "Offer Letter": "FSD/FSD-OfferLetter.pdf",

      "Warning for Incomplete Assignment/Project Submissions":
        "FSD/FSD-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "FSD/FSD-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior":
        "FSD/FSD-warning-for-misconduct.jpg",
      "Warning for Unauthorized Absence from Training Sessions":
        "FSD/FSD-warning-for-unauthorized-absence.jpg",
      "Warning Regarding Punctuality and Professional Discipline":
        "FSD/FSD-warning-regarding-punctuality.jpg",

      "Concern Letter-Audit Interview Performance":
        "FSD/FSD-concern-letter.jpg",
    },
    BVOC: {
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "BVOC-WarningLetter.jpg",
      // 'Community Letter': "Letter.jpg",

      "Appreciation for Best Attendance":
        "BVOC/BVOC-appreciation-for-bestAttendance.jpg",
      "Appreciation for Detecting Errors And Debugging":
        "BVOC/BVOC-appreciation-for-debugging.jpg",
      "Appreciation for Outstanding Performance":
        "BVOC/BVOC-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance":
        "BVOC/BVOC-appreciation-for-consistent-performer.jpg",

      "Committee Member": "BVOC/BVOC-committe-member.jpg",
      "Committee President": "BVOC/BVOC-committe-president.jpg",
      "Committee Vice-President": "BVOC/BVOC-committe-vice-president.jpg",

      "Warning for Incomplete Assignment/Project Submissions":
        "BVOC/BVOC-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "BVOC/BVOC-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior":
        "BVOC/BVOC-warning-for-misconduct.jpg",
      "Warning for Punctuality and Discipline":
        "BVOC/BVOC-warning-for-punctuality.jpg",
      "Warning for Unauthorized Absence from Sessions":
        "BVOC/BVOC-warning-for-unauthorized-absence.jpg",

      "Concern Letter-Audit Interview Performance":
        "BVOC/BVOC-concern-letter.jpg",
    },
    DM: {
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "FSD-WarningLetter.jpg",

      "Appreciation for Best Attendance":
        "DM/DM-appreciation-for-bestAttendance.jpg",
      "Appreciation for Outstanding Performance":
        "DM/DM-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance":
        "DM/DM-appreciation-for-consistent-performer.jpg",

      "Internship Experience Certificate":
        "DM/DM-internship-experience-certificate.jpg",
      "Offer Letter": "DM/DM-OfferLetter.pdf",

      "Warning for Incomplete Assignment/Project Submissions":
        "DM/DM-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "DM/DM-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior":
        "DM/DM-warning-for-misconduct.jpg",
      "Warning for Unauthorized Absence from Training Sessions":
        "DM/DM-warning-for-unauthorized-absence.jpg",
      "Warning Regarding Punctuality and Professional Discipline":
        "DM/DM-warning-regarding-punctuality.jpg",

      "Concern Letter-Audit Interview Performance": "DM/DM-concern-letter.jpg",
    },
    HR: {
      "Internship Joining Letter - Unpaid": "HR/HR-internship-unpaid.pdf",
      "Internship Joining Letter - Paid": "HR/HR-internship-paid.pdf",
      "Non-Disclosure Agreement": "HR/HR-NDA.pdf",
      // 'Memo': "Letter.jpg",
      // common
      "Appreciation Letter": "common/Appreciation.jpg",
      "Experience Certificate": "common/Experience-certificate.jpg",
      "Timeline Letter": "common/Timeline Letter.jpg",
      "Non Paid to Paid": "common/Non-Paid-to-Paid-Promotion-Letter.png",
      "Stipend Revision": "common/Stipend-Revision-Promotion-Letter.png",
    },
    OD: {
      "Internship Joining Letter - Unpaid": "OD/OD-internship-unpaid.pdf",
      "Internship Joining Letter - Paid": "OD/OD-internship-paid.pdf",
      "Non-Disclosure Agreement": "OD/OD-NDA.pdf",
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

    // ✅ Extract ALL fields from frontend formData
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

      // Newly added missing fields:
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

    // Basic validations
    if (!name || !category || !course || !issueDate || !letterType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (name, category, course, issueDate, letterType).",
      });
    }

    // Generate Letter ID
    let letterId;
    let exists;
    do {
      letterId = await generateLetterId(category, course);
      exists = await Letter.findOne({ letterId });
    } while (exists);

    // Generate outward no
    const { outwardNo, outwardSerial } = await generateOutwardNo(
      category,
      course,
      issueDate
    );

    // Get user phone
    const userData = await People.findOne({ name });
    const userPhone = userData?.phone || null;

    // Prepare DB object with ALL fields included
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

      // NEWLY ADDED FIELDS
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

    // Create letter
    const letter = await Letter.create(letterData);

    // Send WhatsApp Message
    try {
      const subType = letter.subType || letterType; // safest

      const templateData = {
        userName: name,
        category,
        batch,
        issueDate: letter.issueDate,
        credentialId: letterId,
        letterId: letterId,
        organizationName: "Nexcore Alliance",
      };

      // ----------------------- WHATSAPP TO STUDENT -----------------------
      if (userPhone && letterId) {
        // WhatsApp = plain text required
        const html = getLetterMessageTemplate(letterType, subType, templateData);
        const waText = html.replace(/<[^>]+>/g, "").replace(/\s{2,}/g, "\n");

        await sendWhatsAppMessage(userPhone, waText);

        // Parent WhatsApp only for BVOC
        if (userData.parentPhone1 && userData.parentPhone2 && category === "BVOC") {
          const parentHtml = getParentNotificationTemplate(letterType, subType, templateData);
          const parentWaText = parentHtml.replace(/<[^>]+>/g, "").replace(/\s{2,}/g, "\n");

          await sendWhatsAppMessage(userData.parentPhone1, parentWaText);
          await sendWhatsAppMessage(userData.parentPhone2, parentWaText);
        }
      }

      // ----------------------- EMAIL TO STUDENT -----------------------
      if (userData.email && letterId) {
        const htmlContent = emailService.getLetterEmailTemplate(letterType, subType, templateData);
        const emailSubject = `${letterType}${subType ? " - " + subType : ""} | ${templateData.organizationName}`;

        await emailService.sendEmail(
          userData.email,
          emailSubject,
          htmlContent
        );

        // Parent WhatsApp notifications
        if (userData.parentPhone1 && userData.parentPhone2 && category === "BVOC") {
          const parentHtml = emailService.getParentNotificationEmailTemplate(letterType, subType, templateData);
          const parentWaText = parentHtml.replace(/<[^>]+>/g, "").replace(/\s{2,}/g, "\n");

          await sendWhatsAppMessage(userData.parentPhone1, parentWaText);
          await sendWhatsAppMessage(userData.parentPhone2, parentWaText);
        }
      }

    } catch (err) {
      console.error("WhatsApp/Email error:", err);
    }


    // Log admin activity
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
    const { outwardNo } = await generateOutwardNo(category, course, issueDate);

    const templateFilename = getLetterTemplateFilename(course, category);
    const templatePath = path.join(__dirname, "../templates", templateFilename);

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

      if (category === "FSD") {
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
      } else if (category === "BVOC") {
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
      } else if (category === "DM") {
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
      } else if (category === "marketing-junction" || category === "code4bharat" || category === "HR" || category === "OD") {
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

      if (category === "FSD") {
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
      } else if (category === "code4bharat") {
        await TemplateCode.drawC4BPdfTemplate(pdfDoc, course, {
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
      } else if (category === "HR") {
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
      } else if (category === "OD") {
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
      } else if (category === "OD") {
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
      const { outwardNo, outwardSerial } = await generateOutwardNo(
        letter.category,
        letter.course,
        letter.issueDate || new Date()
      );
      await Letter.findByIdAndUpdate(letter._id, { outwardNo, outwardSerial });
      letter.outwardNo = outwardNo;
      letter.outwardSerial = outwardSerial;
    }

    // console.log(letter.course, letter.category);

    const templateFilename = getLetterTemplateFilename(
      letter.course,
      letter.category
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

    const trainingStartDate = new Date(letter.trainingStartDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const trainingEndDate = new Date(letter.trainingEndDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const officialStartDate = new Date(letter.officialStartDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

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
      const effectiveFrom = formatDate(letter.effectiveFrom)

      if (category === "FSD") {
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
          auditDate
        );
      } else if (category === "BVOC") {
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
          auditDate
        );
      } else if (category === "DM") {
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
          auditDate
        );
      } else if (category === "marketing-junction" || category === "code4bharat" || category === "HR" || category === "OD") {
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
          year
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

      if (letter.category === "FSD") {
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
        });
      } else if (letter.category === "marketing-junction") {
        await TemplateCode.drawMJPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          formattedDate: new Date(letter.issueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
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
        });

      } else if (letter.category === "code4bharat") {
        await TemplateCode.drawC4BPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          formattedDate: new Date(letter.issueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
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
        });

      } else if (letter.category === "HR") {
        await TemplateCode.drawHRPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          formattedDate: new Date(letter.issueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
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
        });

      } else if (letter.category === "OD") {
        await TemplateCode.drawODPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          formattedDate: new Date(letter.issueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
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
