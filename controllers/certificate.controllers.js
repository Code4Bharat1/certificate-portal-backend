import { body, validationResult } from "express-validator";
import Certificate from "../models/certificate.models.js";
import ActivityLog from "../models/activitylog.models.js";
import PDFDocument from "pdfkit";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { sendCertificateNotification } from "../services/whatsappService.js";
import People from "../models/people.models.js";

import { v4 as uuidv4 } from 'uuid';
import Letter from "../models/letter.models.js";

import { wrapText as letterwraptext } from "./letter.controllers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to generate unique certificate ID
// function generateCertificateId(category) {
//   const prefix = category === "marketing-junction" ? "MJ" : "C4B";
//   const numberPart = Math.floor(100 + Math.random() * 900);
//   return `${prefix}-${numberPart}`;
// }

// function generateCertificateId(category) {
//   const prefixMap = {
//     FSD: 'FSD',
//     BVOC: 'BV',
//     BOOTCAMP: 'BC',
//     HR: 'HR',
//     'marketing-junction': 'MJ',
//     code4bharat: 'C4B'
//   };

//   const prefix = prefixMap[category] || 'GEN';
//   const numberPart = Math.floor(1000 + Math.random() * 9000);
//   return `${prefix}-${numberPart}`;
// }


// Updated function to generate certificate IDs
// Certificate of Appreciation will have "COA" prefix

function generateCertificateId(category, course = null) {
  // For Certificate of Appreciation
  if (course && course === "Appreciation Letter") {
    const uniquePart = uuidv4().replace(/-/g, '').substring(0, 4).toUpperCase();
    return `AL-${uniquePart}`;
  }

  if (course && course === "Experience Certificate") {
    const uniquePart = uuidv4().replace(/-/g, '').substring(0, 4).toUpperCase();
    return `EXP-${uniquePart}`;
  }

  // Category-based prefixes
  const prefixMap = {
    FSD: 'FSD',
    BVOC: 'BV',
    BOOTCAMP: 'BC',
    HR: 'HR',
    'marketing-junction': 'MJ',
    code4bharat: 'C4B',
  };

  const prefix = prefixMap[category] || 'GEN';

  // Generate 4 alphanumeric characters
  const uniquePart = uuidv4().replace(/-/g, '').substring(0, 4).toUpperCase();

  return `${prefix}-${uniquePart}`;
}



// Map courses to template filenames
function getCourseTemplateFilename(course, category) {
  const templateMap = {
    code4bharat: {
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      "Full Stack Certificate (MERN Stack)": "c4b-fullstack-mern.jpg",
      "JavaScript Developer Certificate": "c4b-javascript.jpg",
      "Advanced React Developer Certificate": "c4b-react.jpg",
      "Node.js and Express.js Specialist Certificate": "c4b-nodejs.jpg",
      "MongoDB Professional Certificate": "c4b-mongodb.jpg",
      "Git & Version Control Expert Certificate": "c4b-git.jpg",
      "Frontend Development Pro Certificate": "c4b-frontend.jpg",
      "Backend Development Specialist Certificate": "c4b-backend.jpg",
      "Web Development Project Certificate": "c4b-webdev-project.jpg",
      "Advanced Web Development Capstone Certificate": "c4b-capstone.jpg",
    },
    "marketing-junction": {
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      "Digital Marketing Specialist Certificate": "mj-digital-marketing.jpg",
      "Advanced SEO Specialist Certificate": "mj-seo.jpg",
      "Social Media Marketing Expert Certificate": "mj-social-media.jpg",
      "Full Stack Digital Marketer Certificate": "mj-fullstack-marketer.jpg",
      "AI-Powered Digital Marketing Specialist Certificate":
        "mj-ai-marketing.jpg",
      "Videography Course": "mj-videography.jpg",
    },
    FSD: {
      "Appreciation Letter": "Letter.jpg",
      "Experience Certificate": "Letter.jpg",
      "Full Stack Certificate (MERN Stack)": "c4b-fullstack-mern.jpg",
      "JavaScript Developer Certificate": "c4b-javascript.jpg",
      "Advanced React Developer Certificate": "c4b-react.jpg",
      "Node.js and Express.js Specialist Certificate": "c4b-nodejs.jpg",
      "MongoDB Professional Certificate": "c4b-mongodb.jpg",
      "Git & Version Control Expert Certificate": "c4b-git.jpg",
      "Frontend Development Pro Certificate": "c4b-frontend.jpg",
      "Backend Development Specialist Certificate": "c4b-backend.jpg",
      "Web Development Project Certificate": "c4b-webdev-project.jpg",
      "Advanced Web Development Capstone Certificate": "c4b-capstone.jpg",
    },
  };

  return templateMap[category]?.[course] || `${category}-default.jpg`;
}

// Add this helper function to check if it's an appreciation certificate
function isAppreciationCertificate(course) {
  return course === "Appreciation Letter";
}

// Utility function to wrap text
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// Utility function to adjust font size based on text length
function getAdjustedFontSize(ctx, text, maxWidth, baseFontSize) {
  let fontSize = baseFontSize;
  ctx.font = `bold ${fontSize}px Arial`;

  while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial`;
  }

  return fontSize;
}

const getAllCertificate = async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { certificateId: { $regex: search, $options: "i" } },
        { course: { $regex: search, $options: "i" } },
      ];
    }

    const certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "username");

    const letters = await Letter.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "username");

    // console.log(letters);

    res.json({
      success: true,
      count: certificates.length,
      data: certificates, letters,
    });
  } catch (error) {
    console.error("Get certificates error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id).populate(
      "createdBy",
      "username"
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("Get certificate error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const createCertificate = async (req, res) => {
  try {
    // ✅ Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, category, batch, course, issueDate } = req.body;

    // ✅ Auto-generate unique certificateId
    let certificateId;
    let existingId;
    do {
      certificateId = generateCertificateId(category, course);
      existingId = await Certificate.findOne({ certificateId });
    } while (existingId);

    // ✅ Optional: find user data (for WhatsApp notification)
    const userData = await People.findOne({ name });
    let userPhone = userData?.phone || null;

    // ✅ Prepare base data
    const certificateData = {
      certificateId,
      name,
      category,
      batch: batch || null,
      course,
      issueDate,
      userPhone,
      // createdBy: req.user.id,
    };

    // ✅ Create new certificate document
    const certificate = await Certificate.create(certificateData);

    // ✅ Optional: send WhatsApp notification
    try {
      if (userPhone && certificateId) {
        await sendCertificateNotification({
          userName: name,
          userPhone,
          certificateId,
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

    // ✅ Log action
    await ActivityLog.create({
      action: "created",
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate created for ${certificate.name}`,
    });

    // ✅ Success response
    return res.status(201).json({
      success: true,
      message: "Certificate created successfully",
      certificate,
    });
  } catch (error) {
    console.error("❌ Create certificate error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create certificate",
      error: error.message,
    });
  }
};


const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.body;

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: "Certificate ID is required",
      });
    }

    // First try to find in Certificate collection
    let certificate = await Certificate.findOne({ certificateId });

    // If not found, try to find in Letter collection
    if (!certificate) {
      certificate = await Letter.findOne({ letterId: certificateId });
    }

    // If still not found
    if (!certificate) {
      return res.json({
        success: true,
        valid: false,
        message: "No record found for this ID",
      });
    }

    // Successful verification response
    return res.json({
      success: true,
      valid: true,
      data: {
        certificateId: certificate.certificateId || certificate.letterId,
        name: certificate.name,
        course: certificate.course,
        issueDate: certificate.issueDate,
        category: certificate.category,
        status: certificate.status,
        type: certificate.modelName || (certificate.course ? "Certificate" : "Letter"),
      },
    });

  } catch (error) {
    console.error("Verify certificate error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const updateDownloadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "downloaded"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    certificate.status = status;
    await certificate.save();

    // Log status update
    await ActivityLog.create({
      action: "update",
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate status updated to ${status}`,
    });

    res.json({
      success: true,
      message: "Certificate status updated",
      data: certificate,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteCertificate = async (req, res) => {
  try {
    const id = req.params.id;

    // Try to find in Certificate collection
    let record = await Certificate.findById(id);
    let type = "Certificate";

    // If not found, try Letter collection
    if (!record) {
      record = await Letter.findById(id);
      type = "Letter";
    }

    // If still not found
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // Log deletion
    await ActivityLog.create({
      action: "deleted",
      certificateId: record.certificateId,
      userName: record.name,
      adminId: req.user._id,
      details: `${type} deleted for ${record.name}`,
    });

    // Delete from correct collection
    if (type === "Certificate") {
      await Certificate.findByIdAndDelete(id);
    } else {
      await Letter.findByIdAndDelete(id);
    }

    return res.json({
      success: true,
      message: `${type} deleted successfully`,
    });

  } catch (error) {
    console.error("Delete certificate/letter error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const downloadCertificateAsPdf = async (req, res) => {
  try {
    const identifier = req.params.id;
    let certificate;
    let type = "Certificate";

    console.log("PDF download started for:", identifier);

    // Check valid ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isValidObjectId) {
      // Try Certificate first
      certificate = await Certificate.findById(identifier);
      if (!certificate) {
        certificate = await Letter.findById(identifier);
        type = "Letter";
      }
    }

    // If not found, search by certificateId / authCode
    if (!certificate) {
      // Check Certificate
      certificate = await Certificate.findOne({
        $or: [
          { certificateId: identifier.toUpperCase() },
          { authCode: identifier.toUpperCase() },
        ],
      });

      // If still not found, check Letter
      if (!certificate) {
        certificate = await Letter.findOne({
          $or: [
            { letterId: identifier.toUpperCase() },
            { authCode: identifier.toUpperCase() },
          ],
        });
        if (certificate) type = "Letter";
      }
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`,
      });
    }

    // ✅ Update stats only for certificates
    if (type === "Certificate") {
      certificate.status = "downloaded";
      certificate.downloadCount += 1;
      certificate.lastDownloaded = new Date();
      await certificate.save();
    }

    // ✅ If it's a letter, use a different template logic
    if (type === "Letter") {
      // return generateLetterPdf(certificate, res); // we'll implement this next
      certificate.status = "downloaded";
      certificate.downloadCount += 1;
      certificate.lastDownloaded = new Date();
      await certificate.save();
    }

    // ------------------------
    // BELOW IS EXISTING CERTIFICATE LOGIC
    // ------------------------

    const templateFilename = getCourseTemplateFilename(
      certificate.course,
      certificate.category
    );

    const templatePath = path.join(__dirname, "../templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      return res.status(500).json({
        success: false,
        message: `Certificate template not found for course: ${certificate.course}`,
      });
    }

    const templateImage = await loadImage(templatePath);
    const width = templateImage.width;
    const height = templateImage.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);

    const issueDate = new Date(certificate.issueDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const verifyURL = "https://portal.nexcorealliance.com/verify-certificate";

    const tempId = type === "Certificate" ? certificate.certificateId : certificate.letterId
    // console.log(tempId);

    const id = tempId.split("-")[0];
    const isAppreciation = isAppreciationCertificate(certificate.course);

    const filename = `${certificate.name.replace(/\s+/g, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    if (isAppreciation || certificate.course === "Experience Certificate" ) {
      // =================== STYLES ===================
      ctx.fillStyle = "#111827";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      // ==============================================

      // ---- DATE ----
      ctx.font = 'bold 40px "Times New Roman", serif';
      ctx.fillText(issueDate, width * 0.78, height * 0.253);

      // ---- SUBJECT ----
      const subject = `${certificate.course} – ${certificate.name}`;
      ctx.font = '50px "Times New Roman", serif';
      ctx.fillText(subject, width * 0.32, height * 0.313);

      // ---- DESCRIPTION ----
      ctx.fillStyle = "#1a1a1a"; // slightly softer black for a printed look
      ctx.font = '45px "Georgia", "Garamond", "Merriweather", "Times New Roman", serif';
      ctx.textAlign = "left";

      // Dynamic area between greeting and “Warm Regards”
      const topY = height * 0.40;
      const bottomY = height * 0.70;
      const availableHeight = bottomY - topY;
      const descMaxWidth = width * 0.80;

      console.log(certificate.description);


      // Split into paragraphs based on blank lines
      const paragraphs = certificate.description
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
        letterwraptext(ctx, p, width * 0.13, y, descMaxWidth, lineHeight);
      });

      // ---- LETTER ID ----
      ctx.textAlign = "left";
      ctx.font = 'bold 60px "Poppins"';
      ctx.fillText(`${tempId}`, width * 0.33, height * 0.761);

      // ---- FOOTER INFO ----
      ctx.font = '60px "Ovo", serif';
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.fillText(
        "https://portal.nexcorealliance.com/verify-certificate",
        width / 2,
        height * 0.830
      );

      const imageBuffer = canvas.toBuffer("image/png");

      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });

      doc.pipe(res);
      doc.image(imageBuffer, 0, 0, { width, height });

      // ✅ Clickable link in PDF
      doc.link(width / 2 - 250, height * 0.87, 500, 40, verifyURL);

      doc.end();
    }
    else if (id === "C4B" || id === "FSD") {
      // -----------------------------
      // C4B CERTIFICATE LAYOUT
      // -----------------------------
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const nameFontSize = getAdjustedFontSize(
        ctx,
        certificate.name.toUpperCase(),
        width * 0.65,
        50
      );
      ctx.font = `bold ${nameFontSize}px Arial`;
      ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.46);

      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
      ctx.textAlign = "left";
      ctx.fillText(issueDate, width * 0.595, height * 0.660);

      ctx.font = '40px "Times New Roman", "Ovo", serif';
      ctx.fillText(certificate.certificateId, width * 0.42, height * 0.800);

      const imageBuffer = canvas.toBuffer("image/png");

      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });

      doc.pipe(res);
      doc.image(imageBuffer, 0, 0, { width, height });

      doc.end();

    } else {
      // -----------------------------
      // OTHER CERTIFICATE LAYOUT
      // -----------------------------
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const nameFontSize = getAdjustedFontSize(
        ctx,
        certificate.name.toUpperCase(),
        width * 0.65,
        50
      );
      ctx.font = `bold ${nameFontSize}px Arial`;
      ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.44);

      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
      ctx.textAlign = "left";
      ctx.fillText(issueDate, width * 0.48, height * 0.669);

      ctx.font = '42px "Times New Roman", "Ovo", serif';
      ctx.fillText(certificate.certificateId, width * 0.42, height * 0.815);

      const imageBuffer = canvas.toBuffer("image/png");

      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });

      doc.pipe(res);
      doc.image(imageBuffer, 0, 0, { width, height });

      doc.end();
    }

  } catch (error) {
    console.error("Download PDF error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



// const downloadCertificateAsJpg = async (req, res) => {
//   try {
//     // const certificate = await Certificate.findById(req.params.id);

//     const identifier = req.params.id;
//     let certificate;

//     // Check if the identifier is a valid ObjectId format
//     const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

//     if (isValidObjectId) {
//       // Try to find by _id first if it's a valid ObjectId
//       certificate = await Certificate.findById(identifier);
//     }

//     // If not found or not a valid ObjectId, search by certificateId or authCode
//     if (!certificate) {
//       certificate = await Certificate.findOne({
//         $or: [
//           { certificateId: identifier.toUpperCase() },
//           { authCode: identifier.toUpperCase() },
//         ],
//       });
//     }

//     if (!certificate) {
//       return res.status(404).json({
//         success: false,
//         message: "Certificate not found",
//       });
//     }

//     // Update download status
//     certificate.status = "downloaded";
//     certificate.downloadCount += 1;
//     certificate.lastDownloaded = new Date();
//     await certificate.save();

//     // // Log download
//     // await ActivityLog.create({
//     //   action: 'download',
//     //   certificateId: certificate.certificateId,
//     //   userName: certificate.name,
//     //   adminId: req.user._id,
//     //   details: `Certificate JPG downloaded for ${certificate.name}`
//     // });

//     // Load the PNG template based on category and course
//     const templateFilename = getCourseTemplateFilename(
//       certificate.course,
//       certificate.category
//     );
//     const templatePath = path.join(__dirname, "../templates", templateFilename);

//     // Check if template exists
//     if (!fs.existsSync(templatePath)) {
//       console.error(`Template not found: ${templatePath}`);
//       return res.status(500).json({
//         success: false,
//         message: `Certificate template not found for course: ${certificate.course}`,
//       });
//     }

//     // Load the image
//     const templateImage = await loadImage(templatePath);
//     const width = templateImage.width;
//     const height = templateImage.height;

//     // Create canvas and draw template
//     const canvas = createCanvas(width, height);
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(templateImage, 0, 0);

//     // Format date
//     const issueDate = new Date(certificate.issueDate).toLocaleDateString(
//       "en-US",
//       {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//       }
//     );

//     const tempId = type === "Certificate" ? certificate.certificateId : certificate.letterId
//     console.log(tempId);

//     const id = tempId.split("-")[0];
//     // console.log(id);
//     const isAppreciation = isAppreciationCertificate(certificate.course);
//     // console.log(isAppreciation);


//     if (isAppreciation) {
//       // =================== STYLES ===================
//       ctx.fillStyle = "#111827";
//       ctx.textAlign = "left";
//       ctx.textBaseline = "top";
//       // ==============================================

//       // ---- SUBJECT ----
//       const subject = `${certificate.course} – ${certificate.name}`;
//       ctx.font = '50px "Times New Roman", serif';
//       ctx.fillText(subject, width * 0.32, height * 0.313);

//       // ---- DESCRIPTION ----
//       ctx.fillStyle = "#1a1a1a";
//       ctx.font = '45px "Georgia", "Garamond", "Merriweather", "Times New Roman", serif';

//       const topY = height * 0.40;
//       const bottomY = height * 0.70;
//       const availableHeight = bottomY - topY;
//       const descMaxWidth = width * 0.80;

//       // Split into paragraphs based on blank lines
//       const paragraphs = certificate.description
//         .split(/\n\s*\n/)
//         .map(p => p.replace(/\n/g, " ").trim())
//         .filter(p => p.length > 0)
//         .slice(0, 3);

//       const lineHeight = 66;

//       const paraSpacing =
//         paragraphs.length > 1
//           ? availableHeight / (paragraphs.length + 1)
//           : availableHeight / 2;

//       paragraphs.forEach((p, i) => {
//         const y = topY + i * paraSpacing;
//         letterwraptext(ctx, p, width * 0.13, y, descMaxWidth, lineHeight);
//       });

//       // ---- CERTIFICATE / LETTER ID ----
//       ctx.textAlign = "left";
//       ctx.font = 'bold 60px "Poppins"';
//       ctx.fillText(`${tempId}`, width * 0.33, height * 0.761);

//       // ---- FOOTER VERIFY LINK ----
//       ctx.font = '60px "Ovo", serif';
//       ctx.fillStyle = "#1F2937";
//       ctx.textAlign = "center";
//       ctx.fillText(
//         "https://portal.nexcorealliance.com/verify-certificate",
//         width / 2,
//         height * 0.830
//       );

//       // (Existing canvas export code continues...)
//     }
//     else if (id == "C4B") {
//       // NAME - Centered on certificate between "This certificate is awarded to" and course description
//       ctx.fillStyle = "#1F2937";
//       ctx.textAlign = "center";
//       ctx.textBaseline = "middle";
//       const nameFontSize = getAdjustedFontSize(
//         ctx,
//         certificate.name.toUpperCase(),
//         width * 0.65,
//         50
//       );
//       ctx.font = `bold ${nameFontSize}px Arial`;
//       ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.46);

//       // DATE - Bottom left area, right after "Awarded on:" text in template
//       ctx.fillStyle = "#1F2937";
//       ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
//       ctx.textAlign = "left";
//       ctx.textBaseline = "alphabetic";
//       ctx.fillText(issueDate, width * 0.595, height * 0.665);

//       // CREDENTIAL ID - Positioned after "CREDENTIAL ID:" label in template
//       ctx.fillStyle = "#1F2937";
//       ctx.font = '40px "Times New Roman", "Ovo", serif';
//       ctx.fillText(certificate.certificateId, width * 0.42, height * 0.806);
//     } else {
//       // NAME - Centered on certificate between "This certificate is awarded to" and course description
//       ctx.fillStyle = "#1F2937";
//       ctx.textAlign = "center";
//       ctx.textBaseline = "middle";
//       const nameFontSize = getAdjustedFontSize(
//         ctx,
//         certificate.name.toUpperCase(),
//         width * 0.65,
//         50
//       );
//       ctx.font = `bold ${nameFontSize}px Arial`;
//       ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.44);

//       // DATE - Bottom left area, right after "Awarded on:" text in template
//       ctx.fillStyle = "#1F2937";
//       ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
//       ctx.textAlign = "left";
//       ctx.textBaseline = "alphabetic";
//       ctx.fillText(issueDate, width * 0.48, height * 0.675);

//       // CREDENTIAL ID - Positioned after "CREDENTIAL ID:" label in template
//       ctx.fillStyle = "#1F2937";
//       ctx.font = '42px "Times New Roman", "Ovo", serif';
//       ctx.fillText(certificate.certificateId, width * 0.42, height * 0.82);
//     }

//     // Convert to buffer and send
//     const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
//     const filename = `${certificate.name.replace(/\s+/g, "_")}.jpg`;

//     res.setHeader("Content-Type", "image/jpeg");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (error) {
//     console.error("Download JPG error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

const downloadCertificateAsJpg = async (req, res) => {
  try {
    const identifier = req.params.id;
    let certificate;
    let type = "Certificate";

    // Check if valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isValidObjectId) {
      certificate = await Certificate.findById(identifier);
      if (!certificate) {
        certificate = await Letter.findById(identifier);
        if (certificate) type = "Letter";
      }
    }

    // If not found by ID, search by certificateId / authCode
    if (!certificate) {
      certificate = await Certificate.findOne({
        $or: [
          { certificateId: identifier.toUpperCase() },
          { authCode: identifier.toUpperCase() },
        ],
      });

      if (!certificate) {
        certificate = await Letter.findOne({
          $or: [
            { letterId: identifier.toUpperCase() },
            { authCode: identifier.toUpperCase() },
          ],
        });
        if (certificate) type = "Letter";
      }
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`,
      });
    }

    // ✅ Update stats for both
    certificate.status = "downloaded";
    certificate.downloadCount += 1;
    certificate.lastDownloaded = new Date();
    await certificate.save();

    const templateFilename = getCourseTemplateFilename(
      certificate.course,
      certificate.category
    );
    const templatePath = path.join(__dirname, "../templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: `Template not found for course: ${certificate.course}`,
      });
    }

    const templateImage = await loadImage(templatePath);
    const width = templateImage.width;
    const height = templateImage.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);

    const issueDate = new Date(certificate.issueDate).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );

    const tempId = type === "Certificate" ? certificate.certificateId : certificate.letterId;
    const id = tempId.split("-")[0];
    const isAppreciation = isAppreciationCertificate(certificate.course);

    if (isAppreciation || certificate.course === "Experience Certificate" ) {
      // =================== STYLES ===================
      ctx.fillStyle = "#111827";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      // ==============================================

      // ---- DATE ----
      ctx.font = 'bold 40px "Times New Roman", serif';
      ctx.fillStyle = "#111827";
      ctx.textAlign = "left";
      ctx.fillText(issueDate, width * 0.78, height * 0.253);


      // ---- SUBJECT ----
      const subject = `${certificate.course} – ${certificate.name}`;
      ctx.font = '50px "Times New Roman", serif';
      ctx.fillText(subject, width * 0.32, height * 0.313);

      // ---- DESCRIPTION ----
      ctx.fillStyle = "#1a1a1a";
      ctx.font = '45px "Georgia", "Garamond", "Merriweather", "Times New Roman", serif';

      const topY = height * 0.40;
      const bottomY = height * 0.70;
      const availableHeight = bottomY - topY;
      const descMaxWidth = width * 0.80;

      const paragraphs = certificate.description
        .split(/\n\s*\n/)
        .map(p => p.replace(/\n/g, " ").trim())
        .filter(p => p.length > 0)
        .slice(0, 3);

      const lineHeight = 66;

      const paraSpacing =
        paragraphs.length > 1
          ? availableHeight / (paragraphs.length + 1)
          : availableHeight / 2;

      paragraphs.forEach((p, i) => {
        const y = topY + i * paraSpacing;
        letterwraptext(ctx, p, width * 0.13, y, descMaxWidth, lineHeight);
      });

      // ---- LETTER / CERTIFICATE ID ----
      ctx.textAlign = "left";
      ctx.font = 'bold 60px "Poppins"';
      ctx.fillText(`${tempId}`, width * 0.33, height * 0.761);

      // ---- PRINTED VERIFY LINK ----
      ctx.font = '60px "Ovo", serif';
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.fillText(
        "https://portal.nexcorealliance.com/verify-certificate",
        width / 2,
        height * 0.830
      );

    }
    else if (id == "C4B") {
      // NAME - Centered on certificate between "This certificate is awarded to" and course description
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const nameFontSize = getAdjustedFontSize(
        ctx,
        certificate.name.toUpperCase(),
        width * 0.65,
        50
      );
      ctx.font = `bold ${nameFontSize}px Arial`;
      ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.46);

      // DATE - Bottom left area, right after "Awarded on:" text in template
      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(issueDate, width * 0.595, height * 0.665);

      // CREDENTIAL ID - Positioned after "CREDENTIAL ID:" label in template
      ctx.fillStyle = "#1F2937";
      ctx.font = '40px "Times New Roman", "Ovo", serif';
      ctx.fillText(certificate.certificateId, width * 0.42, height * 0.806);
    } else {
      // NAME - Centered on certificate between "This certificate is awarded to" and course description
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const nameFontSize = getAdjustedFontSize(
        ctx,
        certificate.name.toUpperCase(),
        width * 0.65,
        50
      );
      ctx.font = `bold ${nameFontSize}px Arial`;
      ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.44);

      // DATE - Bottom left area, right after "Awarded on:" text in template
      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(issueDate, width * 0.48, height * 0.675);

      // CREDENTIAL ID - Positioned after "CREDENTIAL ID:" label in template
      ctx.fillStyle = "#1F2937";
      ctx.font = '42px "Times New Roman", "Ovo", serif';
      ctx.fillText(certificate.certificateId, width * 0.42, height * 0.82);
    }

    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
    const filename = `${certificate.name.replace(/\s+/g, "_")}.jpg`;

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error("Download JPG error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const getCoursesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const courses = {
      code4bharat: [
        "Full Stack Certificate (MERN Stack)",
        "JavaScript Developer Certificate",
        "Advanced React Developer Certificate",
        "Node.js and Express.js Specialist Certificate",
        "MongoDB Professional Certificate",
        "Git & Version Control Expert Certificate",
        "Frontend Development Pro Certificate",
        "Backend Development Specialist Certificate",
        "Web Development Project Certificate",
        "Advanced Web Development Capstone Certificate",
      ],
      "marketing-junction": [
        "Digital Marketing Specialist Certificate",
        "Advanced SEO Specialist Certificate",
        "Social Media Marketing Expert Certificate",
        "Full Stack Digital Marketer Certificate",
        "AI-Powered Digital Marketing Specialist Certificate",
        "Videography Course",
      ],
    };

    if (!courses[category]) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid category. Must be either "code4bharat" or "marketing-junction"',
      });
    }

    res.json({
      success: true,
      category,
      courses: courses[category],
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const generateCertificatePreview = async (req, res) => {
  try {
    const { name, category, issueDate, course, batch } = req.body;

    // Validate required fields
    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for preview",
      });
    }

    // Generate a temporary certificate ID for preview
    const tempCertificateId = generateCertificateId(category, course);

    const templateFilename = getCourseTemplateFilename(course, category);
    const templatePath = path.join(__dirname, "../templates", templateFilename);

    console.log(templateFilename, templatePath);

    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      return res.status(500).json({
        success: false,
        message: `Certificate template not found for course: ${course}`,
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

    const isAppreciation = isAppreciationCertificate(course);
    // console.log(isAppreciation);

    if (isAppreciation) {
      // APPRECIATION CERTIFICATE LAYOUT

      // NAME - Positioned above the golden line, centered
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom"; // Changed to bottom so text sits above the line
      const nameFontSize = getAdjustedFontSize(
        ctx,
        name.toUpperCase(),
        width * 0.7,
        56
      );
      ctx.font = `bold ${nameFontSize}px "Times New Roman", serif`;
      ctx.fillText(name.toUpperCase(), width / 2, height * 0.515); // Adjusted position

      // DATE - Bottom left, aligned with template
      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 36px "Times New Roman", serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(issueDate, width * 0.25, height * 0.88);

      // CERTIFICATE ID - Bottom center area
      ctx.fillStyle = "#1F2937";
      ctx.font = '36px "Times New Roman", serif';
      ctx.textAlign = "left";
      ctx.fillText(tempCertificateId, width * 0.29, height * 0.94);

    } else if (category == "code4bharat" || category == "FSD") {
      // NAME
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const nameFontSize = getAdjustedFontSize(
        ctx,
        name.toUpperCase(),
        width * 0.65,
        50
      );
      ctx.font = `bold ${nameFontSize}px Arial`;
      ctx.fillText(name.toUpperCase(), width / 2, height * 0.46);

      // DATE
      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(formattedDate, width * 0.595, height * 0.665);

      // CERTIFICATE ID (temporary for preview)
      ctx.fillStyle = "#1F2937";
      ctx.font = '40px "Times New Roman", "Ovo", serif';
      ctx.fillText(tempCertificateId, width * 0.42, height * 0.806);
    } else {
      // NAME
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const nameFontSize = getAdjustedFontSize(
        ctx,
        name.toUpperCase(),
        width * 0.65,
        50
      );
      ctx.font = `bold ${nameFontSize}px Arial`;
      ctx.fillText(name.toUpperCase(), width / 2, height * 0.44);

      // DATE
      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(formattedDate, width * 0.47, height * 0.675);

      // CERTIFICATE ID (temporary for preview)
      ctx.fillStyle = "#1F2937";
      ctx.font = '42px "Times New Roman", "Ovo", serif';
      ctx.fillText(tempCertificateId, width * 0.415, height * 0.821);
    }

    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });

    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (error) {
    console.error("Preview generation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const downloadBulkCertificate = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    // Validate input
    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Certificate IDs array is required'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    const certificateBuffers = [];

    // Import required libraries (ensure they're at the top of your file)
    const { createCanvas, loadImage } = await import('canvas');
    const PDFDocument = (await import('pdfkit')).default;

    // Process each certificate
    for (const certId of certificateIds) {
      try {
        // Find certificate
        const certificate = await Certificate.findOne({ certificateId: certId });

        if (!certificate) {
          throw new Error('Certificate not found');
        }

        // Get template path
        const templateFilename = getCourseTemplateFilename(
          certificate.course,
          certificate.category
        );
        const templatePath = path.join(__dirname, '../templates', templateFilename);

        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template not found: ${certificate.course}`);
        }

        // Load template and create canvas
        const templateImage = await loadImage(templatePath);
        const width = templateImage.width;
        const height = templateImage.height;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(templateImage, 0, 0);

        // Format date
        const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const id = certificate.certificateId.split('-')[0];

        // Draw certificate content based on category
        if (id === 'C4B' || id === "FSD") {
          // NAME
          ctx.fillStyle = '#1F2937';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const nameFontSize = getAdjustedFontSize(ctx, certificate.name.toUpperCase(), width * 0.65, 50);
          ctx.font = `bold ${nameFontSize}px Arial`;
          ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.46);

          // DATE
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(issueDate, width * 0.595, height * 0.665);

          // CERTIFICATE ID
          ctx.fillStyle = '#1F2937';
          ctx.font = '40px "Times New Roman", "Ovo", serif';
          ctx.fillText(certificate.certificateId, width * 0.42, height * 0.806);
        } else {
          // NAME
          ctx.fillStyle = '#1F2937';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const nameFontSize = getAdjustedFontSize(ctx, certificate.name.toUpperCase(), width * 0.65, 50);
          ctx.font = `bold ${nameFontSize}px Arial`;
          ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.44);

          // DATE
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(issueDate, width * 0.48, height * 0.675);

          // CERTIFICATE ID
          ctx.fillStyle = '#1F2937';
          ctx.font = '42px "Times New Roman", "Ovo", serif';
          ctx.fillText(certificate.certificateId, width * 0.42, height * 0.82);
        }

        // Convert canvas to buffer
        const imageBuffer = canvas.toBuffer('image/png');

        // Store buffer with certificate info
        certificateBuffers.push({
          buffer: imageBuffer,
          width,
          height,
          name: certificate.name,
          certificateId: certificate.certificateId,
          course: certificate.course
        });

        results.successful.push({
          certificateId: certificate.certificateId,
          name: certificate.name,
          course: certificate.course,
          category: certificate.category,
          batch: certificate.batch
        });

      } catch (error) {
        console.error(`Failed to process certificate ${certId}:`, error);
        results.failed.push({
          certificateId: certId,
          error: error.message
        });
      }
    }

    // If no certificates were successfully processed
    if (certificateBuffers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No certificates could be processed',
        results: {
          total: certificateIds.length,
          successful: 0,
          failed: results.failed.length
        },
        data: {
          failed: results.failed
        }
      });
    }

    // Create merged PDF
    const doc = new PDFDocument({ autoFirstPage: false });

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `certificates_bulk_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add each certificate as a page
    for (const cert of certificateBuffers) {
      doc.addPage({ size: [cert.width, cert.height], margin: 0 });
      doc.image(cert.buffer, 0, 0, { width: cert.width, height: cert.height });
    }

    // Finalize PDF
    doc.end();

    // Log activity (optional)
    console.log('Bulk download completed:', {
      total: certificateIds.length,
      successful: results.successful.length,
      failed: results.failed.length
    });

    await ActivityLog.create({
      action: "bulk_downloaded",
      count: results.successful.length,
      adminId: req.user._id,
      details: 'Bulk downloaded',
    });

  } catch (error) {
    console.error('Bulk download error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to process bulk download',
        error: error.message
      });
    }
  }
};

const downloadBulkCertificateInfo = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Certificate IDs array is required'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    const certificateBuffers = [];
    const { createCanvas, loadImage } = await import('canvas');
    const PDFDocument = (await import('pdfkit')).default;

    // Helper function to get adjusted font size (from your controller)
    function getAdjustedFontSize(ctx, text, maxWidth, baseFontSize) {
      let fontSize = baseFontSize;
      ctx.font = `bold ${fontSize}px Arial`;

      while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial`;
      }

      return fontSize;
    }

    // Helper function to get course template filename (from your controller)
    // function getCourseTemplateFilename(course, category) {
    //   const templateMap = {
    //     code4bharat: {
    //       "Full Stack Certificate (MERN Stack)": "c4b-fullstack-mern.jpg",
    //       "JavaScript Developer Certificate": "c4b-javascript.jpg",
    //       "Advanced React Developer Certificate": "c4b-react.jpg",
    //       "Node.js and Express.js Specialist Certificate": "c4b-nodejs.jpg",
    //       "MongoDB Professional Certificate": "c4b-mongodb.jpg",
    //       "Git & Version Control Expert Certificate": "c4b-git.jpg",
    //       "Frontend Development Pro Certificate": "c4b-frontend.jpg",
    //       "Backend Development Specialist Certificate": "c4b-backend.jpg",
    //       "Web Development Project Certificate": "c4b-webdev-project.jpg",
    //       "Advanced Web Development Capstone Certificate": "c4b-capstone.jpg",
    //     },
    //     "marketing-junction": {
    //       "Digital Marketing Specialist Certificate": "mj-digital-marketing.jpg",
    //       "Advanced SEO Specialist Certificate": "mj-seo.jpg",
    //       "Social Media Marketing Expert Certificate": "mj-social-media.jpg",
    //       "Full Stack Digital Marketer Certificate": "mj-fullstack-marketer.jpg",
    //       "AI-Powered Digital Marketing Specialist Certificate": "mj-ai-marketing.jpg",
    //       "Videography Course": "mj-videography.jpg",
    //     },
    //   };

    //   return templateMap[category]?.[course] || `${category}-default.png`;
    // }

    // Process each certificate
    for (const certId of certificateIds) {
      try {
        const certificate = await Certificate.findOne({ certificateId: certId });

        if (!certificate) {
          throw new Error('Certificate not found');
        }

        const templateFilename = getCourseTemplateFilename(certificate.course, certificate.category);
        const templatePath = path.join(__dirname, '../templates', templateFilename);

        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template not found: ${certificate.course}`);
        }

        const templateImage = await loadImage(templatePath);
        const width = templateImage.width;
        const height = templateImage.height;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(templateImage, 0, 0);

        const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const id = certificate.certificateId.split('-')[0];

        if (id === 'C4B') {
          ctx.fillStyle = '#1F2937';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const nameFontSize = getAdjustedFontSize(ctx, certificate.name.toUpperCase(), width * 0.65, 50);
          ctx.font = `bold ${nameFontSize}px Arial`;
          ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.46);

          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(issueDate, width * 0.595, height * 0.665);

          ctx.fillStyle = '#1F2937';
          ctx.font = '40px "Times New Roman", "Ovo", serif';
          ctx.fillText(certificate.certificateId, width * 0.42, height * 0.806);
        } else {
          ctx.fillStyle = '#1F2937';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const nameFontSize = getAdjustedFontSize(ctx, certificate.name.toUpperCase(), width * 0.65, 50);
          ctx.font = `bold ${nameFontSize}px Arial`;
          ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.44);

          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(issueDate, width * 0.48, height * 0.675);

          ctx.fillStyle = '#1F2937';
          ctx.font = '42px "Times New Roman", "Ovo", serif';
          ctx.fillText(certificate.certificateId, width * 0.42, height * 0.82);
        }

        const imageBuffer = canvas.toBuffer('image/png');

        certificateBuffers.push({ buffer: imageBuffer, width, height });

        results.successful.push({
          certificateId: certificate.certificateId,
          name: certificate.name,
          course: certificate.course,
          category: certificate.category,
          batch: certificate.batch
        });

      } catch (error) {
        console.error(`Failed to process certificate ${certId}:`, error);
        results.failed.push({
          certificateId: certId,
          error: error.message
        });
      }
    }

    if (certificateBuffers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No certificates could be processed',
        results: {
          total: certificateIds.length,
          successful: 0,
          failed: results.failed.length
        },
        data: {
          failed: results.failed
        }
      });
    }

    // Create merged PDF
    const doc = new PDFDocument({ autoFirstPage: false });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64Pdf = pdfBuffer.toString('base64');

      // Return JSON with results and PDF
      res.json({
        success: true,
        message: 'Bulk download completed',
        results: {
          total: certificateIds.length,
          successful: results.successful.length,
          failed: results.failed.length
        },
        data: {
          successful: results.successful,
          failed: results.failed,
          pdf: base64Pdf,
          filename: `certificates_bulk_${new Date().toISOString().split('T')[0]}.pdf`
        }
      });
    });

    // Add each certificate as a page
    for (const cert of certificateBuffers) {
      doc.addPage({ size: [cert.width, cert.height], margin: 0 });
      doc.image(cert.buffer, 0, 0, { width: cert.width, height: cert.height });
    }

    doc.end();

  } catch (error) {
    console.error('Bulk download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk download',
      error: error.message
    });
  }
};

export default {
  getAllCertificate,
  getCertificateById,
  createCertificate,
  verifyCertificate,
  updateDownloadStatus,
  deleteCertificate,
  downloadCertificateAsPdf,
  downloadCertificateAsJpg,
  getCoursesByCategory,
  generateCertificatePreview,
  generateCertificateId,
  getCourseTemplateFilename,
  downloadBulkCertificate,
  downloadBulkCertificateInfo,
};
