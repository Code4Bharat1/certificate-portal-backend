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
  getParentNotificationTemplate
} from '../services/whatsappService.js';
import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from "pdf-lib";

import TemplateCode from "../utils/templatesCode.js"

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
    if (typeof lastLetter.outwardSerial === "number" && lastLetter.outwardSerial > 0) {
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
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      'Internship Joining Letter - Unpaid': "C4B-internship-unpaid.pdf",
      'Internship Joining Letter - Paid': "C4B-internship-paid.pdf",
      'Memo': "Letter.jpg",
      'Non-Disclosure Agreement': "NDA.pdf",
    },
    "marketing-junction": {
      // "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "MJ-experience-certificate.jpg",
      // 'Internship Joining Letter - Unpaid': "Letter.jpg",
      // 'Internship Joining Letter - Paid': "Letter.jpg",
      'Non-Disclosure Agreement': "MJ-NDA.pdf",
      "Timeline Letter": "Timeline Letter.jpg",
      "Non Paid to Paid": "Non-Paid-to-Paid-Promotion-Letter.png",
      "Stipend Revision": "Stipend-Revision-Promotion-Letter.png",
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
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "FSD-WarningLetter.jpg",

      "Appreciation for Best Attendance": "FSD-appreciation-for-bestAttendance.jpg",
      "Appreciation for Outstanding Performance": "FSD-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance": "FSD-appreciation-for-consistent-performer.png",

      "Internship Experience Certificate": "FSD-internship-experience-certificate.jpg",
      'Live Project Agreement': "FSD-LiveProject.pdf",
      'Non-Disclosure Agreement': "NDA.pdf",
      'Offer Letter': "FSD-OfferLetter.pdf",

      "Warning for Incomplete Assignment/Project Submissions": "FSD-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "FSD-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior": "FSD-warning-for-misconduct.jpg",
      "Warning for Unauthorized Absence from Training Sessions": "FSD-warning-for-unauthorized-absence.jpg",
      "Warning Regarding Punctuality and Professional Discipline": "FSD-warning-regarding-punctuality.jpg",

      "Concern Letter-Audit Interview Performance": "FSD-concern-letter.jpg"
    },
    BVOC: {
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "BVOC-WarningLetter.jpg",
      // 'Community Letter': "Letter.jpg",

      "Appreciation for Best Attendance": "BVOC-appreciation-for-bestAttendance.jpg",
      "Appreciation for Detecting Errors And Debugging": "BVOC-appreciation-for-debugging.jpg",
      "Appreciation for Outstanding Performance": "BVOC-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance": "BVOC-appreciation-for-consistent-performer.jpg",

      "Committee Member": "BVOC-committe-member.jpg",
      "Committee President": "BVOC-committe-president.jpg",
      "Committee Vice-President": "BVOC-committe-vice-president.jpg",

      "Warning for Incomplete Assignment/Project Submissions": "BVOC-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "BVOC-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior": "BVOC-warning-for-misconduct.jpg",
      "Warning for Punctuality and Discipline": "BVOC-warning-for-punctuality.jpg",
      "Warning for Unauthorized Absence from Sessions": "BVOC-warning-for-unauthorized-absence.jpg",

      "Concern Letter-Audit Interview Performance": "BVOC-concern-letter.jpg"
    },
    DM: {
      // "Appreciation Letter": "Letter.jpg",
      // "Experience Certificate": "Letter.jpg",
      // 'Warning Letter': "FSD-WarningLetter.jpg",

      "Appreciation for Best Attendance": "DM-appreciation-for-bestAttendance.jpg",
      "Appreciation for Outstanding Performance": "DM-appreciation-for-outstanding-performance.jpg",
      "Appreciation for Consistent Performance": "DM-appreciation-for-consistent-performer.jpg",

      "Internship Experience Certificate": "DM-internship-experience-certificate.jpg",
      'Offer Letter': "DM-OfferLetter.pdf",

      "Warning for Incomplete Assignment/Project Submissions": "DM-warning-incomplete-assignment.jpg",
      "Warning for Low Attendance": "DM-warning-low-attendance.jpg",
      "Warning for Misconduct or Disrespectful Behavior": "DM-warning-for-misconduct.jpg",
      "Warning for Unauthorized Absence from Training Sessions": "DM-warning-for-unauthorized-absence.jpg",
      "Warning Regarding Punctuality and Professional Discipline": "DM-warning-regarding-punctuality.jpg",

      "Concern Letter-Audit Interview Performance": "DM-concern-letter.jpg"
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
      subType,  // ⚠️ IMPORTANT: Make sure this comes from frontend
      course,
      description = "",
      subject = "",
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
      subjectName,
      projectName,
      auditDate,
      batch,
      duration,
      uncover,
      parentPhone,    // ⚠️ For parent notification
      parentName,     // ⚠️ For parent notification
    } = req.body;

    // 🔹 Basic required validations
    if (!name || !category || !course || !issueDate || !letterType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, category, course, issueDate, letterType).",
      });
    }

    // 🔹 Generate unique letterId
    let letterId;
    let exists;
    do {
      letterId = await generateLetterId(category, course);
      exists = await Letter.findOne({ letterId });
    } while (exists);

    // 🔹 Generate outward number
    const { outwardNo, outwardSerial } = await generateOutwardNo(
      category,
      course,
      issueDate
    );

    // 🔹 Lookup user phone for WhatsApp
    const userData = await People.findOne({ name });
    const userPhone = userData?.phone || null;

    // 🔹 Prepare letter data object
    const letterData = {
      letterId,
      name,
      category,
      batch: batch || "",
      letterType: letterType || "",
      subType: subType || "default",  // ⚠️ IMPORTANT
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
      parentPhone: parentPhone || null,
      parentName: parentName || null,
    };

    // 🔹 Create letter
    const letter = await Letter.create(letterData);

    // ✅ CORRECTED: Send WhatsApp notification for LETTERS
    try {
      if (userPhone && letterId) {
        console.log('📱 Sending letter notification to:', userPhone);
        console.log('📋 Letter Type:', letterType);
        console.log('📋 Sub Type:', subType || 'default');

        // 🔹 Get the letter message template
        const letterMessage = getLetterMessageTemplate(
          letterType,
          course || 'default',
          {
            userName: name,
            category,
            batch: batch || null,
            issueDate: letter.issueDate,
            credentialId: letterId,
            letterId: letterId,
            organizationName: 'Nexcore Alliance',
          }
        );

        // 🔹 Send WhatsApp message to user
        const result = await sendWhatsAppMessage(userPhone, letterMessage);
        console.log('✅ Letter notification sent:', result);

        // 🔹 Send parent notification if applicable
        if (
          parentPhone &&
          parentName &&
          (letterType === 'Warning Letter' ||
            letterType === 'Appreciation Letter' ||
            letterType === 'Committee Letter')
        ) {
          console.log('📱 Sending parent notification to:', parentPhone);

          const parentMessage = getParentNotificationTemplate(
            letterType,
            subType || 'default',
            {
              userName: name,
              parentName,
              category,
              batch: batch || null,
              issueDate: letter.issueDate,
              credentialId: letterId,
              letterId: letterId,
              organizationName: 'Nexcore Alliance',
            }
          );

          const parentResult = await sendWhatsAppMessage(parentPhone, parentMessage);
          console.log('✅ Parent notification sent:', parentResult);
        }
      }
    } catch (err) {
      console.error("❌ WhatsApp send error:", err);
      // Don't fail the whole request if WhatsApp fails
    }

    // 🔹 Log admin activity
    await ActivityLog.create({
      action: "created",
      letterId: letter.letterId,
      userName: letter.name,
      adminId: req.user?._id,
      details: `Letter created for ${letter.name}`,
    });

    // ✅ Return success
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

    // Collect dynamic frontend fields to display (only if value exists)
    // const dynamicLines = [];
    // if (committeeType) dynamicLines.push(`${committeeType}`);
    // if (attendancePercent) dynamicLines.push(`${attendancePercent}`);
    // if (assignmentName) dynamicLines.push(`${assignmentName}`);
    // if (misconductReason) dynamicLines.push(`${misconductReason}`);
    // if (attendanceMonth && attendanceYear)
    //   dynamicLines.push(`${attendanceMonth} ${attendanceYear}`);
    // if (performanceMonth && performanceYear)
    //   dynamicLines.push(`${performanceMonth} ${performanceYear}`);
    // if (testingPhase) dynamicLines.push(`${testingPhase}`);
    // if (projectName) dynamicLines.push(`${projectName}`);

    /* ----------------------------------
       🖼 Image Template Rendering
    ---------------------------------- */
    if (templateType === "image") {
      const templateImage = await loadImage(templatePath);
      const width = templateImage.width;
      const height = templateImage.height;

      // // Convert performanceMonth to short form (e.g., "Jan", "Feb", etc.)
      // const monthMap = {
      //   January: "Jan",
      //   February: "Feb",
      //   March: "Mar",
      //   April: "Apr",
      //   May: "May",
      //   June: "Jun",
      //   July: "Jul",
      //   August: "Aug",
      //   September: "Sept",
      //   October: "Oct",
      //   November: "Nov",
      //   December: "Dec"
      // };

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
      }
      else if (category === "BVOC") {
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
      }
      else if (category === "DM") {
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
      }
      else if (category === "marketing-junction") {
        await TemplateCode.getMJTemplateCode(
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
      }

      else { }

      const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
      res.setHeader("Content-Type", "image/jpeg");
      return res.send(buffer);
    }

    /* ----------------------------------
   📄 PDF Template Rendering
---------------------------------- */
    else {
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
      return res.status(404).json({ success: false, message: "Letter not found" });
    }

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

    console.log(letter.course, letter.category);


    const templateFilename = getLetterTemplateFilename(letter.course, letter.category);
    const templatePath = path.join(__dirname, "../templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ success: false, message: "Template not found" });
    }

    const templateType = getTemplateTypeByFilename(templateFilename);
    const formattedDate = new Date(letter.issueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
      } = letter;

      const tempId = letter.letterId || (await generateLetterId(category, course));
      const outwardNo = letter.outwardNo;

      // const monthMap = {
      //   January: "Jan",
      //   February: "Feb",
      //   March: "Mar",
      //   April: "Apr",
      //   May: "May",
      //   June: "Jun",
      //   July: "Jul",
      //   August: "Aug",
      //   September: "Sept",
      //   October: "Oct",
      //   November: "Nov",
      //   December: "Dec",
      // };

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
      }
      else if (category === "BVOC") {
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
      }
      else if (category === "DM") {
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
      }
      else if (category === "marketing-junction") {
        await TemplateCode.getMJTemplateCode(
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
      }
      else { }

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
    }

    /* ----------------------------------
   📄 PDF Template Rendering (Download)
  ---------------------------------- */
    else {
      const existingPdfBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFLibDocument.load(existingPdfBytes);

      if (letter.category === "FSD") {
        // Reuse the same unified drawPdfTemplate logic
        await TemplateCode.drawFSDPdfTemplate(pdfDoc, letter.course, {
          name: letter.name,
          outwardNo: letter.outwardNo,
          issueDate: letter.issueDate,
          formattedDate: new Date(letter.issueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          tempId: letter.letterId,
          description: letter.description,
          subject: letter.subject,
          startDate: letter.startDate,
          endDate: letter.endDate,
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
