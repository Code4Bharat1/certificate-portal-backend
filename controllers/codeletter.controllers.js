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
import drawC4BExperienceLetter from "../utils/C4B/ExperienceLetter.js";
import drawODExperienceLetter from "../utils/OD/ExperienceLetter.js";
import drawC4BNDA from "../utils/C4B/NDA.js";
import drawODNDA from "../utils/OD/NDA.js";
// Add to existing imports
import drawC4BUnpaidToPaid from "../utils/C4B/PromotionLetter/C4BUnpaidToPaid.js";
import drawC4BStipendRevision from "../utils/C4B/PromotionLetter/C4BStipendRev.js";
import drawODUnpaidToPaid from "../utils/OD/PromotionLetter/ODUnpaidToPaid.js";
import drawODStipendRevision from "../utils/OD/PromotionLetter/ODStipendRev.js";
import drawHRUnpaidToPaid from "../utils/HR/PromotionLetter/HRUnpaidToPaid.js";
import drawHRStipendRevision from "../utils/HR/PromotionLetter/HRStipendRev.js";
import drawMJUnpaidToPaid from "../utils/MJ/PromotionLetter/MJUnpaidToPaid.js";
import drawMJStipendRevision from "../utils/MJ/PromotionLetter/MJStipendRev.js";
import drawTimelineLetter from "../utils/C4B/TimelineLetter.js";
import drawHRTimelineLetter from "../utils/HR/TimelineLetter.js";
import drawMJTimelineLetter from "../utils/MJ/TimelineLetter.js";
import drawODTimelineLetter from "../utils/OD/TimelineLetter.js";
import drawFSDGeneralAppreciation from "../utils/FSD/AppreciationLetter/FSDGeneral.js";
import drawFSDConsistentPerformance from "../utils/FSD/AppreciationLetter/FSDConsistentPerformance.js";
import drawFSDOutstandingPerformance from "../utils/FSD/AppreciationLetter/FSDOutstandingPerformance.js";
import drawFSDBestAttendance from "../utils/FSD/AppreciationLetter/FSDBestAttendance.js";
import drawFSDGeneralWarning from "../utils/FSD/WarningLetter/FSDGeneralWarningLetter.js";
import drawFSDIncompleteAssignment from "../utils/FSD/WarningLetter/FSDInc.js";
import drawFSDLowAttendance from "../utils/FSD/WarningLetter/FSDLowAttendance.js";
import drawFSDMisconduct from "../utils/FSD/WarningLetter/FSDMisconduct.js";
import drawFSDUnauthorizedAbsence from "../utils/FSD/WarningLetter/FSDUnauth.js";
import drawFSDPunctuality from "../utils/FSD/WarningLetter/FSDPunctuality.js";
import drawFSDConcernLetter from "../utils/FSD/ConcernLetter.js";


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
    } else if (course === "Experience Certificate") {
      return drawMJExperienceLetter;
    } else if (course === "Non Paid to Paid") {
      return drawMJUnpaidToPaid;
    } else if (course === "Stipend Revision") {
      return drawMJStipendRevision;
    } else if (course === "Timeline Letter") {
      return drawMJTimelineLetter;
    }
  } else if (category === "IT-Nexcore") {
    if (course === "Internship Joining Letter - Paid") {
      return drawJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawJoiningLetterUnpaid;
    } else if (course === "Experience Certificate") {
      return drawC4BExperienceLetter;
    } else if (course === "Non-Disclosure Agreement") {
      return drawC4BNDA;
    } else if (course === "Non Paid to Paid") {
      return drawC4BUnpaidToPaid;
    } else if (course === "Stipend Revision") {
      return drawC4BStipendRevision;
    } else if (course === "Timeline Letter") {
      return drawTimelineLetter;
    }
  } else if (category === "Operations Department") {
    if (course === "Internship Joining Letter - Paid") {
      return drawODJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawODJoiningLetterUnpaid;
    } else if (course === "Experience Certificate") {
      return drawODExperienceLetter;
    } else if (course === "Non-Disclosure Agreement") {
      return drawODNDA;
    } else if (course === "Non Paid to Paid") {
      return drawODUnpaidToPaid;
    } else if (course === "Stipend Revision") {
      return drawODStipendRevision;
    } else if (course === "Timeline Letter") {
      return drawODTimelineLetter;
    }
  } else if (category === "HR") {
    if (course === "Internship Joining Letter - Paid") {
      return drawHRJoiningLetterPaid;
    } else if (course === "Internship Joining Letter - Unpaid") {
      return drawHRJoiningLetterUnpaid;
    } else if (course === "Experience Certificate") {
      return drawC4BExperienceLetter;
    } else if (course === "Non Paid to Paid") {
      return drawHRUnpaidToPaid;
    } else if (course === "Stipend Revision") {
      return drawHRStipendRevision;
    } else if (course === "Timeline Letter") {
      return drawHRTimelineLetter;
    }
  }  else if (category === "FSD") {
    if (course === "General Appreciation Letter") {
      return drawFSDGeneralAppreciation;
    } else if (course === "Appreciation for Consistent Performance") {
      return drawFSDConsistentPerformance;
    } else if (course === "Appreciation for Outstanding Performance") {
      return drawFSDOutstandingPerformance;
    } else if (course === "Appreciation for Best Attendance") {
      return drawFSDBestAttendance;
    } else if (course === "General Warning Letter") {
      return drawFSDGeneralWarning;
    } else if (
      course === "Warning for Incomplete Assignment/Project Submissions"
    ) {
      return drawFSDIncompleteAssignment;
    } else if (course === "Warning for Low Attendance") {
      return drawFSDLowAttendance;
    } else if (course === "Warning for Misconduct or Disrespectful Behavior") {
      return drawFSDMisconduct;
    } else if (
      course === "Warning for Unauthorized Absence from Training Sessions"
    ) {
      return drawFSDUnauthorizedAbsence;
    } else if (
      course === "Warning Regarding Punctuality and Professional Discipline"
    ) {
      return drawFSDPunctuality;
    } else if (course === "Concern Letter-Audit Interview Performance") {
     
      return drawFSDConcernLetter;
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
const createCodeLetter = async (req, res) => {
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
      startDate,
      endDate,
      genderPronoun,
      duration,
      timelineStage,
      timelineProjectName,
      timelineDueDate,
      timelineNewDate,
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
    if (letterType === "Timeline Letter") {
      if (
        !timelineStage ||
        !timelineProjectName ||
        !timelineDueDate ||
        !timelineNewDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Timeline Letter requires stage, project name, and both dates",
        });
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

    letterData.amount = amount ? parseFloat(amount) : undefined;
    letterData.effectiveFrom = effectiveFrom
      ? new Date(effectiveFrom)
      : undefined;

    letterData.startDate = startDate ? new Date(startDate) : undefined;
    letterData.endDate = endDate ? new Date(endDate) : undefined;

    letterData.genderPronoun = genderPronoun || "";
    letterData.duration = duration || "";

    // ✅ ADD TIMELINE LETTER FIELDS
    if (letterType === "Timeline Letter") {
      letterData.timelineStage = timelineStage;
      letterData.timelineProjectName = timelineProjectName;
      letterData.timelineDueDate = new Date(timelineDueDate);
      letterData.timelineNewDate = new Date(timelineNewDate);
    }

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
    // if (userPhone) {
    //   try {
    //     const message = getLetterMessageTemplate(
    //       name,
    //       course,
    //       formatDate(issueDate)
    //     );
    //     await sendWhatsAppMessage(userPhone, message);
    //     console.log("📱 WhatsApp sent to:", userPhone);
    //   } catch (error) {
    //     console.error("WhatsApp notification failed:", error);
    //   }
    // }

    // if (userData?.email) {
    //   try {
    //     const emailContent = getLetterEmailTemplate(
    //       name,
    //       course,
    //       formatDate(issueDate)
    //     );
    //     await sendEmail(
    //       userData.email,
    //       `Your ${course} is Ready`,
    //       emailContent
    //     );
    //     console.log("📧 Email sent to:", userData.email);
    //   } catch (error) {
    //     console.error("Email notification failed:", error);
    //   }
    // }

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
const previewCodeLetter = async (req, res) => {
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
      startDate,
      endDate,
      genderPronoun,
      duration,
      timelineStage,
      timelineProjectName,
      timelineDueDate,
      timelineNewDate,
      // ✅ BVOC/FSD specific fields
      committeeType,
      attendancePercent,
      attendanceMonth,
      attendanceYear,
      performanceMonth,
      performanceYear,
      testingPhase,
      uncover,
      subjectName,
      projectName,
      misconductReason,
      auditDate,
    } = req.body;

    // Validation
    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, category, issueDate, course",
      });
    }

    console.log("✅ Validation passed");

    let userData = null;
    if (name) {
      userData = await People.findOne({ name }).lean();
      console.log("👤 User data fetched:", userData ? "Found" : "Not found");
    }

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
    const formattedStartDate = startDate ? formatDate(startDate) : "";
    const formattedEndDate = endDate ? formatDate(endDate) : "";

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
      course === "Internship Joining Letter - Unpaid" ||
      course === "Non-Disclosure Agreement";

    if (isMultiPage) {
      // For multi-page letters, create PDF directly
      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });

      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);

      // Prepare template data for multi-page
      const templateData = {
        name,
        role: role || "",
        duration: duration || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: responsibilities || "",
        amount: amount || "",
        effectiveFrom: formattedEffectiveFrom,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        genderPronoun: genderPronoun || "",
        formattedDate,
        outwardNo,
        credentialId: tempId,
        address: userData?.address || "Address not provided",
        aadhaarCard: userData?.aadhaarCard || "Not provided",
      };

      console.log("📋 Multi-page template data:", templateData);

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

      // Determine number of pages
      const totalPages = course === "Non-Disclosure Agreement" ? 4 : 2;

      // Generate all pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
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

        if (pageNum < totalPages) {
          doc.addPage();
        }
      }

      doc.end();
      console.log("✅ Multi-page PDF preview generated successfully");
    } else {
      // Single page letters
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ✅ COMPLETE template data with ALL fields
      const templateData = {
        name,
        // Appreciation Letter fields
        subject: subject || "",
        month: month || "",
        year: year || "",
        description: description || "",
        // Joining/Experience Letter fields
        role: role || "",
        duration: duration || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: responsibilities || "",
        amount: amount || "",
        effectiveFrom: formattedEffectiveFrom,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        genderPronoun: genderPronoun || "",
        // Timeline fields
        timelineStage: timelineStage || "",
        timelineProjectName: timelineProjectName || "",
        timelineDueDate: timelineDueDate || "",
        timelineNewDate: timelineNewDate || "",
        // ✅ BVOC/FSD specific fields
        committeeType: committeeType || "",
        attendancePercent: attendancePercent || "",
        attendanceMonth: attendanceMonth || "",
        attendanceYear: attendanceYear || "",
        performanceMonth: performanceMonth || "",
        performanceYear: performanceYear || "",
        testingPhase: testingPhase || "",
        uncover: uncover || "",
        subjectName: subjectName || "",
        projectName: projectName || "",
        misconductReason: misconductReason || "",
        auditDate: auditDate || "",
        // Standard fields
        formattedDate,
        outwardNo,
        credentialId: tempId,
        address: userData?.address || "Address not provided",
        aadhaarCard: userData?.aadhaarCard || "Not provided",
      };

      console.log("📋 Single-page template data:", templateData);
      console.log("📊 Performance fields:", {
        performanceMonth: templateData.performanceMonth,
        performanceYear: templateData.performanceYear,
      });

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

      console.log("🖌️ Drawing template...");

      await drawFunction(
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
 const getCodeLetters = async (req, res) => {
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
 const getCodeLetterById = async (req, res) => {
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
const downloadCodeLetterAsPdf = async (req, res) => {
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

    // Fetch people data
    const userData = await People.findOne({ name: letter.name }).lean();
    console.log(
      "👤 User data fetched for download:",
      userData ? "Found" : "Not found"
    );

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
    const formattedStartDate = letter.startDate
      ? formatDate(letter.startDate)
      : "";
    const formattedEndDate = letter.endDate ? formatDate(letter.endDate) : "";

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
      letter.course === "Internship Joining Letter - Unpaid" ||
      letter.course === "Non-Disclosure Agreement";

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
      // Multi-page letters
      const templateData = {
        name: letter.name,
        role: letter.role || "",
        duration: letter.duration || "",
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
        address: userData?.address || "Address not provided",
        aadhaarCard: userData?.aadhaarCard || "Not provided",
      };

      // Get the appropriate drawing function
      const drawFunction = getDrawingFunction(letter.category, letter.course);

      const totalPages = letter.course === "Non-Disclosure Agreement" ? 4 : 2;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
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

        if (pageNum < totalPages) {
          doc.addPage();
        }
      }
    } else {
      // Single page letters - ✅ COMPLETE with ALL fields
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const templateData = {
        name: letter.name,
        // Appreciation Letter fields
        subject: letter.subject || "",
        month: letter.month || "",
        year: letter.year || "",
        description: letter.description || "",
        // Joining/Experience Letter fields
        role: letter.role || "",
        duration: letter.duration || "",
        trainingStartDate: formattedTrainingStart,
        trainingEndDate: formattedTrainingEnd,
        officialStartDate: formattedOfficialStart,
        completionDate: formattedCompletion,
        responsibilities: letter.responsibilities || "",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        genderPronoun: letter.genderPronoun || "",
        amount: letter.amount || "",
        effectiveFrom: formattedEffectiveFrom,
        // Timeline fields
        timelineStage: letter.timelineStage || "",
        timelineProjectName: letter.timelineProjectName || "",
        timelineDueDate: letter.timelineDueDate || "",
        timelineNewDate: letter.timelineNewDate || "",
        // ✅ BVOC/FSD specific fields
        committeeType: letter.committeeType || "",
        attendancePercent: letter.attendancePercent || "",
        attendanceMonth: letter.attendanceMonth || "",
        attendanceYear: letter.attendanceYear || "",
        performanceMonth: letter.performanceMonth || "",
        performanceYear: letter.performanceYear || "",
        testingPhase: letter.testingPhase || "",
        uncover: letter.uncover || "",
        subjectName: letter.subjectName || "",
        projectName: letter.projectName || "",
        misconductReason: letter.misconductReason || "",
        auditDate: letter.auditDate || "",
        // Standard fields
        formattedDate,
        outwardNo: letter.outwardNo,
        credentialId: letter.letterId,
        address: userData?.address || "Address not provided",
        aadhaarCard: userData?.aadhaarCard || "Not provided",
      };

      console.log("📋 Download template data:", templateData);
      console.log("📊 Performance fields:", {
        performanceMonth: templateData.performanceMonth,
        performanceYear: templateData.performanceYear,
      });

      const drawFunction = getDrawingFunction(letter.category, letter.course);

      if (drawFunction) {
        await drawFunction(
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
export {
  createCodeLetter,
  previewCodeLetter,
  getCodeLetters,
  getCodeLetterById,
  downloadCodeLetterAsPdf,
};