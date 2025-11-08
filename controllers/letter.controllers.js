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
      letterType, // from frontend (main type)
      description,
      issueDate,
      subject,
      role,
      startDate,
      endDate,
      duration,

      // new frontend-based fields
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
      projectName
    } = req.body;

    // 🔹 Basic required validations
    if (!name || !category || !course || !issueDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, category, course, issueDate)."
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
    const { outwardNo, outwardSerial } = await generateOutwardNo(category, course, issueDate);

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

      // 🔹 Extended fields based on your frontend
      committeeType: committeeType || "",
      attendancePercent: attendancePercent || "",
      assignmentName: assignmentName || "",
      misconductReason: misconductReason || "",
      attendanceMonth: attendanceMonth || "",
      attendanceYear: attendanceYear || "",
      performanceMonth: performanceMonth || "",
      performanceYear: performanceYear || "",
      testingPhase: testingPhase || "",
      uncover: uncover || "",
      subjectName: subjectName || "",
      projectName: projectName || ""
    };

    // 🔹 Create letter
    const letter = await Letter.create(letterData);

    // 🔹 Send WhatsApp notification if user has phone
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

    // 🔹 Log admin activity
    await ActivityLog.create({
      action: "created",
      letterId: letter.letterId,
      userName: letter.name,
      adminId: req.user?._id,
      details: `Letter created for ${letter.name}`
    });

    // ✅ Return success
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

    // ✅ Collect dynamic frontend fields to display (only if value exists)
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

      // Convert performanceMonth to short form (e.g., "Jan", "Feb", etc.)
      const monthMap = {
        January: "Jan",
        February: "Feb",
        March: "Mar",
        April: "Apr",
        May: "May",
        June: "Jun",
        July: "Jul",
        August: "Aug",
        September: "Sept",
        October: "Oct",
        November: "Nov",
        December: "Dec"
      };

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(templateImage, 0, 0);

      // FSD
      if (course === "Appreciation for Best Attendance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.195, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.236);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.045, height * 0.300);

        // Subject / Title
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.45, height * 0.338);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.095, height * 0.372);

        // const shortMonth = monthMap[performanceMonth] || performanceMonth; // fallback if custom
        const attendanceDate = attendanceMonth + " " + attendanceYear;

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(attendanceDate, width * 0.316, height * 0.422);

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.26, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.843
        );
      }
      else if (course === "Appreciation for Outstanding Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.178, height * 0.230);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.090, height * 0.2526);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.033, height * 0.325);

        // Subject / Title
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.59, height * 0.370);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.087, height * 0.409);

        const shortMonth = monthMap[performanceMonth] || performanceMonth; // fallback if custom
        const performanceDate = `${shortMonth} ${performanceYear}`;

        // console.log(performanceDate);

        ctx.font = 'bold 28px "Poppins"';
        ctx.fillText(performanceDate, width * 0.566, height * 0.465);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.18, height * 0.787);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.845
        );
      }
      else if (course === "Appreciation for Consistent Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.165, height * 0.229);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.245);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.300);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.080, height * 0.383);

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.19, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.843
        );
      }
      else if (course === "Internship Experience Certificate") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.185, height * 0.222);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.240);

        // Subject / Title
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.49, height * 0.280);

        // === MAIN DESCRIPTION ===
        const descLines = [
          { text: "This is to certify that ", bold: false },
          { text: name, bold: true },
          { text: " was associated with ", bold: false },
          { text: "Nexcore Alliance LLP", bold: true },
          { text: " under its brand ", bold: false },
          { text: "Code4Bharat", bold: true },
          { text: " as a", bold: false },
          { text: ` ${role} from ${startDate} to ${endDate}.`, bold: true },
        ];

        const descY = height * 0.35;
        const startX = width * 0.041;
        const maxWidth = width * 0.90;
        let currentX = startX;
        let currentY = descY;

        const lineHeight = 32;

        // Draw mixed-style line wrapping
        descLines.forEach((part, idx) => {
          const words = part.text.split(" ");
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + " ";
            ctx.font = `${part.bold ? "bold" : "normal"} 25px "Poppins"`;
            const wordWidth = ctx.measureText(word).width;

            if (currentX + wordWidth > startX + maxWidth) {
              // wrap line
              currentX = startX;
              currentY += lineHeight;
            }

            ctx.fillText(word, currentX, currentY);
            currentX += wordWidth;
          }
        });

        // === DESCRIPTION PARAGRAPHS ===
        ctx.fillStyle = "#1a1a1a";
        ctx.font = '25px "Poppins"';

        const paragraphs = (description || "")
          .split(/\n\s*\n/)
          .map(p => p.replace(/\n/g, " ").trim())
          .filter(p => p.length > 0)
          .slice(0, 2);

        let descParagraphY = currentY + 40; // Start after the first section
        const paraLineHeight = 30;
        const paraSpacing = 30;

        paragraphs.forEach((paragraph, idx) => {
          const words = paragraph.split(" ");
          let line = "";

          words.forEach(word => {
            const testLine = line + word + " ";
            const testWidth = ctx.measureText(testLine).width;

            if (testWidth > maxWidth) {
              ctx.fillText(line.trim(), startX, descParagraphY);
              line = word + " ";
              descParagraphY += paraLineHeight;
            } else {
              line = testLine;
            }
          });

          if (line.trim()) {
            ctx.fillText(line.trim(), startX, descParagraphY);
            descParagraphY += paraLineHeight;
          }

          if (idx < paragraphs.length - 1) {
            descParagraphY += paraSpacing;
          }
        });

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.20, height * 0.780);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.850
        );
      }
      else if (course === "Live Project Agreement") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.165, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.236);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.290);

        // Subject / Title
        // const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.43, height * 0.338);

        // Description (from frontend)
        ctx.fillStyle = "#1a1a1a";
        ctx.font = '25px "Georgia", "Garamond", "Times New Roman", serif';
        wrapText(ctx, description, width * 0.13, height * 0.40, width * 0.80, 60);

        // ✅ Add dynamic frontend field values (below description)
        let yDynamic = height * 0.423;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillStyle = "#222";
        dynamicLines.forEach((line) => {
          wrapText(ctx, line, width * 0.30, yDynamic, width * 0.8, 55);
          yDynamic += 60;
        });

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.25, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.843
        );
      }
      else if (course === "Non-Disclosure Agreement") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.165, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.236);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.290);

        // Subject / Title
        // const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.43, height * 0.338);

        // Description (from frontend)
        ctx.fillStyle = "#1a1a1a";
        ctx.font = '25px "Georgia", "Garamond", "Times New Roman", serif';
        wrapText(ctx, description, width * 0.13, height * 0.40, width * 0.80, 60);

        // ✅ Add dynamic frontend field values (below description)
        let yDynamic = height * 0.423;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillStyle = "#222";
        dynamicLines.forEach((line) => {
          wrapText(ctx, line, width * 0.30, yDynamic, width * 0.8, 55);
          yDynamic += 60;
        });

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.25, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.843
        );
      }
      else if (course === "Offer Letter") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.165, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.236);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.290);

        // Subject / Title
        // const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.43, height * 0.338);

        // Description (from frontend)
        ctx.fillStyle = "#1a1a1a";
        ctx.font = '25px "Georgia", "Garamond", "Times New Roman", serif';
        wrapText(ctx, description, width * 0.13, height * 0.40, width * 0.80, 60);

        // ✅ Add dynamic frontend field values (below description)
        let yDynamic = height * 0.423;
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillStyle = "#222";
        dynamicLines.forEach((line) => {
          wrapText(ctx, line, width * 0.30, yDynamic, width * 0.8, 55);
          yDynamic += 60;
        });

        // Letter ID
        ctx.font = 'bold 35px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.25, height * 0.732);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.843
        );
      }
      else if (course === "Warning for Incomplete Assignment/Project Submissions") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 22px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.202, height * 0.221);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 22px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.113, height * 0.238);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.060, height * 0.302);

        // Dear name,
        ctx.font = 'bold 22px "Poppins"';
        ctx.fillText(name + ",", width * 0.110, height * 0.380);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(subjectName, width * 0.110, height * 0.433);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(projectName, width * 0.310, height * 0.433);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.23, height * 0.708);

        // Footer
        ctx.font = '25px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.860
        );
      }
      else if (course === "Warning for Low Attendance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.186, height * 0.225);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.242);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.040, height * 0.310);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.099, height * 0.383);

        // Desc percentage
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(attendancePercent, width * 0.532, height * 0.420);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.18, height * 0.706);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.855
        );
      }
      else if (course === "Warning for Misconduct or Disrespectful Behavior") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.209, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.115, height * 0.236);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.060, height * 0.299);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.110, height * 0.362);

        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(misconductReason, width * 0.060, height * 0.450);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.23, height * 0.678);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.843
        );
      }
      else if (course === "Warning for Unauthorized Absence from Training Sessions") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.195, height * 0.220);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.099, height * 0.234);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.047, height * 0.295);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.099, height * 0.358);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.22, height * 0.702);

        // Footer
        ctx.font = '40px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.851
        );
      }
      else if (course === "Warning Regarding Punctuality and Professional Discipline") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.169, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.080, height * 0.240);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.023, height * 0.300);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.080, height * 0.372);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.16, height * 0.730);

        // Footer
        ctx.font = '30px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.865
        );
      }
      else if (course === "Concern Letter-Audit Interview Performance") {
        // Top row
        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(`${outwardNo}`, width * 0.201, height * 0.223);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(formattedDate, width * 0.105, height * 0.240);

        // to name
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name, width * 0.053, height * 0.300);

        // Dear name,
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(name + ",", width * 0.099, height * 0.375);

        console.log(auditDate);

        const auditFormattedDate = new Date(issueDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });


        console.log(auditFormattedDate);

        ctx.fillStyle = "#111827";
        ctx.textBaseline = "top";
        ctx.font = `bold 25px "Poppins"`;
        ctx.fillText(auditFormattedDate, width * 0.743, height * 0.408);

        // Letter ID
        ctx.font = 'bold 25px "Poppins"';
        ctx.fillText(`${tempId}`, width * 0.19, height * 0.707);

        // Footer
        ctx.font = '35px "Ovo", serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(
          "https://certificate.nexcorealliance.com/verify-certificate",
          width / 2,
          height * 0.857
        );
      }

      // BVOC
      else if (course === "Appreciation for Best Attendance") { }
      else if (course === "Appreciation for Detecting Errors And Debugging") { }
      else if (course === "Appreciation for Outstanding Performance") { }
      else if (course === "Appreciation for Consistent Performance") { }
      else if (course === "Committee Member") { }
      else if (course === "Committee President") { }
      else if (course === "Committee Vice-President") { }
      else if (course === "Warning for Misconduct or Disrespectful Behavior") { }
      else if (course === "Warning for Punctuality and Professional Discipline") { }
      else if (course === "Warning for Unauthorized Absence from Sessions") { }
      else if (course === "Warning for Incomplete Assignment/Project Submissions") { }
      else if (course === "Warning for Low Attendance") { }
      else if (course === "Concern Letter-Audit Interview Performance") { }
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
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Outward No + Date
      page.drawText(outwardNo, {
        x: width * 0.085,
        y: height * 0.65,
        size: 15,
        font: helveticaBold,
        color: rgb(0.067, 0.094, 0.152),
      });

      page.drawText(formattedDate, {
        x: width * 0.083,
        y: height * 0.90,
        size: 15,
        font: helvetica,
        color: rgb(0.067, 0.094, 0.152),
      });

      // Subject
      const subjectText = subject ? `${subject} – ${name}` : `${course} – ${name}`;
      page.drawText(subjectText, {
        x: width * 0.32,
        y: height * 0.75,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      // Description
      const descLines = wrapPdfText(description, width * 0.8, helvetica, 14);
      let y = height * 0.63;
      descLines.forEach((line) => {
        page.drawText(line, {
          x: width * 0.13,
          y,
          size: 14,
          font: helvetica,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 18;
      });

      // ✅ Dynamic Frontend Values
      dynamicLines.forEach((line) => {
        page.drawText(line, {
          x: width * 0.13,
          y,
          size: 13,
          font: helvetica,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 16;
      });

      // Letter ID + Footer
      page.drawText(tempId, {
        x: width * 0.33,
        y: height * 0.25,
        size: 15,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      const verifyText = "https://certificate.nexcorealliance.com/verify-certificate";
      page.drawText(verifyText, {
        x: width * 0.2,
        y: height * 0.17,
        size: 12,
        font: helvetica,
        color: rgb(0.12, 0.16, 0.22),
      });

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
