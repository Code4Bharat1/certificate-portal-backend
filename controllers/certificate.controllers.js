//certificate.controllers.js
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

import { v4 as uuidv4 } from "uuid";
import Letter from "../models/letter.models.js";

import { wrapText as letterwraptext } from "../bin/letter.controllers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ FIX 3 — Template image cache
const templateCache = new Map();

async function loadTemplateImage(templatePath) {
  if (templateCache.has(templatePath)) {
    return templateCache.get(templatePath);
  }

  const image = await loadImage(templatePath);
  templateCache.set(templatePath, image);
  return image;
}

export async function generateCertificateId(category) {
  const catMap = {
    "it-nexcore": "NEX",
    "marketing-junction": "MJ",
    fsd: "fsd",
    hr: "hr",
    bvoc: "bvoc",
    BOOTCAMP: "BC",
  };

  const catAbbr = catMap[category] || category.toUpperCase().slice(0, 4);

  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Regex: fsd-YYYY-MM-DD-XX
  const regex = new RegExp(`^${catAbbr}-${dateStr}-(\\d+)$`);

  // Find last certificateId generated today for this category
  const last = await Certificate.find({
    certificateId: { $regex: `^${catAbbr}-${dateStr}-` },
  })
    .select("certificateId")
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  let nextNum = 1;

  if (last.length) {
    const match = last[0].certificateId.match(regex);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNum).padStart(2, "0");

  return `${catAbbr}-${dateStr}-${padded}`;
}

// Map courses to template filenames
function getCourseTemplateFilename(course, category) {
  const templateMap = {
    "it-nexcore": {
      "Full Stack Certificate (MERN Stack)":
        "certificates/c4b-fullstack-mern.jpg",
      "JavaScript Developer Certificate": "certificates/c4b-javascript.jpg",
      "Advanced React Developer Certificate": "certificates/c4b-react.jpg",
      "Node.js and Express.js Specialist Certificate":
        "certificates/c4b-nodejs.jpg",
      "MongoDB Professional Certificate": "certificates/c4b-mongodb.jpg",
      "Git & Version Control Expert Certificate": "certificates/c4b-git.jpg",
      "Frontend Development Pro Certificate": "certificates/c4b-frontend.jpg",
      "Backend Development Specialist Certificate":
        "certificates/c4b-backend.jpg",
      "Web Development Project Certificate":
        "certificates/c4b-webdev-project.jpg",
      "Advanced Web Development Capstone Certificate":
        "certificates/c4b-capstone.jpg",
    },
    "marketing-junction": {
      "Digital Marketing Specialist Certificate":
        "certificates/mj-digital-marketing.jpg",
      "Advanced SEO Specialist Certificate": "certificates/mj-seo.jpg",
      "Social Media Marketing Expert Certificate":
        "certificates/mj-social-media.jpg",
      "Full Stack Digital Marketer Certificate":
        "certificates/mj-fullstack-marketer.jpg",
      "AI-Powered Digital Marketing Specialist Certificate":
        "certificates/mj-ai-marketing.jpg",
      "Videography Course": "certificates/mj-videography.jpg",
    },
    fsd: {
      "Full Stack Certificate (MERN Stack)":
        "certificates/c4b-fullstack-mern.jpg",
      "JavaScript Developer Certificate": "certificates/c4b-javascript.jpg",
      "Advanced React Developer Certificate": "certificates/c4b-react.jpg",
      "Node.js and Express.js Specialist Certificate":
        "certificates/c4b-nodejs.jpg",
      "MongoDB Professional Certificate": "certificates/c4b-mongodb.jpg",
      "Git & Version Control Expert Certificate": "certificates/c4b-git.jpg",
      "Frontend Development Pro Certificate": "certificates/c4b-frontend.jpg",
      "Backend Development Specialist Certificate":
        "certificates/c4b-backend.jpg",
      "Web Development Project Certificate":
        "certificates/c4b-webdev-project.jpg",
      "Advanced Web Development Capstone Certificate":
        "certificates/c4b-capstone.jpg",
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
    const { categories, status, search } = req.query;

    let query = {};
    let categoryFilter = {};

    if (categories) {
      categoryFilter.category = {
        $in: categories.split(","),
      };
    }

    // Normal category filter (for certificates)

    if (status) {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { certificateId: { $regex: search, $options: "i" } },
        { course: { $regex: search, $options: "i" } },
      ];
    }

    
    // Fetch CERTIFICATES
  // Build final query ONCE
const finalQuery = {
  ...query,
  ...categoryFilter,
};

// Fetch certificates
const certificates = await Certificate.find(finalQuery)
  .sort({ createdAt: -1 })
  .populate("createdBy", "username");

// Fetch letters (same logic)
const letters = await Letter.find(finalQuery)
  .sort({ createdAt: -1 })
  .populate("createdBy", "username");


     
    // Final response (same structure as you wanted)
    return res.json({
      success: true,
      count: certificates.length,
      data: certificates,
      letters: letters,
    });
  } catch (error) {
    
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
    
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const createCertificate = async (req, res) => {
  try {
    // ✅ Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // ✅ Extract ALL fields including description
    const { name, category, batch, course, issueDate, description } = req.body;

    // ✅ FIX 1 — Generate certificateId ONCE (no loop)
    const certificateId = await generateCertificateId(category);

    // ✅ Find user data (for notifications)
    const userData = await People.findOne({ name });
    const userPhone = userData?.phone || null;
    const userEmail = userData?.email || null;

    // ✅ Prepare certificate data
    const certificateData = {
      certificateId,
      name,
      category,
      batch: batch || null,
      course,
      issueDate,
      description: description || "",
      createdBy: req.user?._id || null,
    };

    let certificate;

    try {
      // ✅ Create certificate document ONCE
      // MongoDB will enforce unique constraint
      certificate = await Certificate.create(certificateData);
    } catch (err) {
      // ✅ Handle duplicate key error (race condition)
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Certificate ID conflict. Please try again.",
          error: "Duplicate certificate ID",
        });
      }
      throw err; // Re-throw other errors
    }

    // ✅ FIX 2 — Move PDF generation and notifications to background
    setImmediate(async () => {
      try {
        const emailService = await import("../services/emailService.js");

        if (certificateId) {
          let pdfBuffer = null;
          try {
            const templateFilename = getCourseTemplateFilename(
              course,
              category
            );
            const templatePath = path.join(
              __dirname,
              "../templates",
              templateFilename
            );

            if (!fs.existsSync(templatePath)) {
              throw new Error(`Template not found: ${course}`);
            }

            // ✅ FIX 3 — Use cached template
            const templateImage = await loadTemplateImage(templatePath);
            const width = templateImage.width;
            const height = templateImage.height;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(templateImage, 0, 0);

            const formattedDate = new Date(issueDate).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            );

            const id = certificateId.split("-")[0];
            const isAppreciation = isAppreciationCertificate(course);

            // Apply the same rendering logic as downloadCertificateAsPdf
            if (isAppreciation || course === "Experience Certificate") {
              ctx.fillStyle = "#111827";
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.font = 'bold 40px "Times New Roman", serif';
              ctx.fillText(formattedDate, width * 0.78, height * 0.253);

              const subject = `${course} – ${certificate.name}`;
              ctx.font = '50px "Times New Roman", serif';
              ctx.fillText(subject, width * 0.32, height * 0.313);

              ctx.fillStyle = "#1a1a1a";
              ctx.font =
                '45px "Georgia", "Garamond", "Merriweather", "Times New Roman", serif';
              const topY = height * 0.4;
              const bottomY = height * 0.7;
              const availableHeight = bottomY - topY;
              const descMaxWidth = width * 0.8;

              const paragraphs = (description || "")
                .split(/\n\s*\n/)
                .map((p) => p.replace(/\n/g, " ").trim())
                .filter((p) => p.length > 0)
                .slice(0, 3);

              const lineHeight = 66;
              const paraSpacing =
                paragraphs.length > 1
                  ? availableHeight / (paragraphs.length + 1)
                  : availableHeight / 2;

              paragraphs.forEach((p, i) => {
                const y = topY + i * paraSpacing;
                wrapText(ctx, p, width * 0.13, y, descMaxWidth, lineHeight);
              });

              ctx.textAlign = "left";
              ctx.font = 'bold 60px "Poppins"';
              ctx.fillText(`${certificateId}`, width * 0.33, height * 0.761);

              ctx.font = '60px "Ovo", serif';
              ctx.fillStyle = "#1F2937";
              ctx.textAlign = "center";
              ctx.fillText(
                "https://portal.nexcorealliance.com/verify-certificate",
                width / 2,
                height * 0.83
              );
            } else if (id === "NEX" || id === "fsd") {
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

              ctx.fillStyle = "#1F2937";
              ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
              ctx.textAlign = "left";
              ctx.fillText(formattedDate, width * 0.595, height * 0.66);

              ctx.font = '40px "Times New Roman", "Ovo", serif';
              ctx.fillText(certificateId, width * 0.42, height * 0.8);
            } else {
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

              ctx.fillStyle = "#1F2937";
              ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
              ctx.textAlign = "left";
              ctx.fillText(formattedDate, width * 0.48, height * 0.669);

              ctx.font = '42px "Times New Roman", "Ovo", serif';
              ctx.fillText(certificateId, width * 0.42, height * 0.815);
            }

            // Convert canvas to PDF
            const imageBuffer = canvas.toBuffer("image/png");
            const doc = new PDFDocument({ size: [width, height], margin: 0 });

            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => {
              pdfBuffer = Buffer.concat(chunks);
            });

            doc.image(imageBuffer, 0, 0, { width, height });
            doc.end();

            await new Promise((resolve) => doc.on("end", resolve));
          } catch (pdfError) {
            
          }

          // Send email WITH actual certificate PDF
          if (userEmail) {
            await emailService.default.sendCertificateNotification({
              userName: name,
              userEmail: userEmail,
              certificateId,
              course,
              category,
              batch: batch || null,
              issueDate,
              description: description || "",
              pdfBuffer,
            });
          }

          // Send WhatsApp notification
          if (userPhone) {
            await sendCertificateNotification({
              userName: name,
              userPhone,
              certificateId,
              course,
              category,
              batch: batch || null,
              issueDate,
            });
          }
        }
      } catch (notificationError) {
        console.error(
          "⚠️ Notification error (non-critical):",
          notificationError
        );
      }
    });

    // ✅ Log action
    await ActivityLog.create({
      action: "created",
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate created for ${certificate.name}`,
    });

    // ✅ Success response (sent IMMEDIATELY)
    return res.status(201).json({
      success: true,
      message: "Certificate created successfully",
      certificate,
      notifications: {
        email: userEmail ? "queued" : "no email available",
        whatsapp: userPhone ? "queued" : "no phone available",
      },
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
        type:
          certificate.modelName ||
          (certificate.course ? "Certificate" : "Letter"),
      },
    });
  } catch (error) {
    
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

    // ✅ FIX 4 — Single optimized query
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isValidObjectId) {
      // Try both collections with single query each
      certificate = await Certificate.findById(identifier);
      if (!certificate) {
        certificate = await Letter.findById(identifier);
        type = "Letter";
      }
    } else {
      // Search by certificateId/authCode with single $or query
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

    // ✅ Update stats
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
        message: `Certificate template not found for course: ${certificate.course}`,
      });
    }

    // ✅ FIX 3 — Use cached template
    const templateImage = await loadTemplateImage(templatePath);
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

    const tempId =
      type === "Certificate" ? certificate.certificateId : certificate.letterId;

    const id = tempId.split("-")[0];
    const isAppreciation = isAppreciationCertificate(certificate.course);

    const filename = `${certificate.name.replace(/\s+/g, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    if (isAppreciation || certificate.course === "Experience Certificate") {
      ctx.fillStyle = "#111827";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      ctx.font = 'bold 40px "Times New Roman", serif';
      ctx.fillText(issueDate, width * 0.78, height * 0.253);

      const subject = `${certificate.course} – ${certificate.name}`;
      ctx.font = '50px "Times New Roman", serif';
      ctx.fillText(subject, width * 0.32, height * 0.313);

      ctx.fillStyle = "#1a1a1a";
      ctx.font =
        '45px "Georgia", "Garamond", "Merriweather", "Times New Roman", serif';
      ctx.textAlign = "left";

      const topY = height * 0.4;
      const bottomY = height * 0.7;
      const availableHeight = bottomY - topY;
      const descMaxWidth = width * 0.8;

      const paragraphs = certificate.description
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\n/g, " ").trim())
        .filter((p) => p.length > 0)
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

      ctx.textAlign = "left";
      ctx.font = 'bold 60px "Poppins"';
      ctx.fillText(`${tempId}`, width * 0.33, height * 0.761);

      ctx.font = '60px "Ovo", serif';
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.fillText(
        "https://portal.nexcorealliance.com/verify-certificate",
        width / 2,
        height * 0.83
      );

      const imageBuffer = canvas.toBuffer("image/png");

      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });

      doc.pipe(res);
      doc.image(imageBuffer, 0, 0, { width, height });

      doc.link(width / 2 - 250, height * 0.87, 500, 40, verifyURL);

      doc.end();
    } else if (id === "NEX" || id === "fsd") {
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
      ctx.fillText(issueDate, width * 0.595, height * 0.66);

      ctx.font = '40px "Times New Roman", "Ovo", serif';
      ctx.fillText(certificate.certificateId, width * 0.42, height * 0.8);

      const imageBuffer = canvas.toBuffer("image/png");

      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });

      doc.pipe(res);
      doc.image(imageBuffer, 0, 0, { width, height });

      doc.end();
    } else {
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
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const downloadCertificateAsJpg = async (req, res) => {
  try {
    const identifier = req.params.id;
    let certificate;
    let type = "Certificate";

    // ✅ FIX 4 — Single optimized query
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isValidObjectId) {
      certificate = await Certificate.findById(identifier);
      if (!certificate) {
        certificate = await Letter.findById(identifier);
        if (certificate) type = "Letter";
      }
    } else {
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

    // ✅ FIX 3 — Use cached template
    const templateImage = await loadTemplateImage(templatePath);
    const width = templateImage.width;
    const height = templateImage.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);

    const issueDate = new Date(certificate.issueDate).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );

    const tempId =
      type === "Certificate" ? certificate.certificateId : certificate.letterId;
    const id = tempId.split("-")[0];
    const isAppreciation = isAppreciationCertificate(certificate.course);

    if (isAppreciation || certificate.course === "Experience Certificate") {
      ctx.fillStyle = "#111827";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      ctx.font = 'bold 40px "Times New Roman", serif';
      ctx.fillStyle = "#111827";
      ctx.textAlign = "left";
      ctx.fillText(issueDate, width * 0.78, height * 0.253);

      const subject = `${certificate.course} – ${certificate.name}`;
      ctx.font = '50px "Times New Roman", serif';
      ctx.fillText(subject, width * 0.32, height * 0.313);

      ctx.fillStyle = "#1a1a1a";
      ctx.font =
        '45px "Georgia", "Garamond", "Merriweather", "Times New Roman", serif';

      const topY = height * 0.4;
      const bottomY = height * 0.7;
      const availableHeight = bottomY - topY;
      const descMaxWidth = width * 0.8;

      const paragraphs = certificate.description
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\n/g, " ").trim())
        .filter((p) => p.length > 0)
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

      ctx.textAlign = "left";
      ctx.font = 'bold 60px "Poppins"';
      ctx.fillText(`${tempId}`, width * 0.33, height * 0.761);

      ctx.font = '60px "Ovo", serif';
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.fillText(
        "https://portal.nexcorealliance.com/verify-certificate",
        width / 2,
        height * 0.83
      );
    } else if (id == "NEX") {
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
      ctx.textBaseline = "alphabetic";
      ctx.fillText(issueDate, width * 0.595, height * 0.665);

      ctx.fillStyle = "#1F2937";
      ctx.font = '40px "Times New Roman", "Ovo", serif';
      ctx.fillText(certificate.certificateId, width * 0.42, height * 0.806);
    } else {
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
      ctx.textBaseline = "alphabetic";
      ctx.fillText(issueDate, width * 0.48, height * 0.675);

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
      "it-nexcore": [
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
          'Invalid category. Must be either "it-nexcore" or "marketing-junction"',
      });
    }

    res.json({
      success: true,
      category,
      courses: courses[category],
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const generateCertificatePreview = async (req, res) => {
  try {
    const { name, category, issueDate, course, batch } = req.body;

    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for preview",
      });
    }

    const tempCertificateId = await generateCertificateId(category);

    const templateFilename = getCourseTemplateFilename(course, category);
    const templatePath = path.join(__dirname, "../templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      
      return res.status(500).json({
        success: false,
        message: `Certificate template not found for course: ${course}`,
      });
    }

    // ✅ FIX 3 — Use cached template
    const templateImage = await loadTemplateImage(templatePath);
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

    if (isAppreciation) {
      ctx.fillStyle = "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const nameFontSize = getAdjustedFontSize(
        ctx,
        name.toUpperCase(),
        width * 0.7,
        56
      );
      ctx.font = `bold ${nameFontSize}px "Times New Roman", serif`;
      ctx.fillText(name.toUpperCase(), width / 2, height * 0.515);

      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 36px "Times New Roman", serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(issueDate, width * 0.25, height * 0.88);

      ctx.fillStyle = "#1F2937";
      ctx.font = '36px "Times New Roman", serif';
      ctx.textAlign = "left";
      ctx.fillText(tempCertificateId, width * 0.29, height * 0.94);
    } else if (category == "it-nexcore" || category == "fsd") {
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

      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(formattedDate, width * 0.595, height * 0.665);

      ctx.fillStyle = "#1F2937";
      ctx.font = '40px "Times New Roman", "Ovo", serif';
      ctx.fillText(tempCertificateId, width * 0.42, height * 0.806);
    } else {
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

      ctx.fillStyle = "#1F2937";
      ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(formattedDate, width * 0.47, height * 0.675);

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

    // ✅ FIX 5 — Limit bulk size to prevent memory issues
    const MAX_BULK_SIZE = 20;

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Certificate IDs array is required",
      });
    }

    if (certificateIds.length > MAX_BULK_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Bulk download limited to ${MAX_BULK_SIZE} certificates at a time. Please split your request.`,
      });
    }

    const results = {
      successful: [],
      failed: [],
    };

    const certificateBuffers = [];

    const { createCanvas, loadImage } = await import("canvas");
    const PDFDocument = (await import("pdfkit")).default;

    for (const certId of certificateIds) {
      try {
        const certificate = await Certificate.findOne({
          certificateId: certId,
        });

        if (!certificate) {
          throw new Error("Certificate not found");
        }

        const templateFilename = getCourseTemplateFilename(
          certificate.course,
          certificate.category
        );
        const templatePath = path.join(
          __dirname,
          "../templates",
          templateFilename
        );

        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template not found: ${certificate.course}`);
        }

        // ✅ FIX 3 — Use cached template
        const templateImage = await loadTemplateImage(templatePath);
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

        const id = certificate.certificateId.split("-")[0];

        if (id === "NEX" || id === "fsd") {
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
          ctx.fillText(
            certificate.name.toUpperCase(),
            width / 2,
            height * 0.46
          );

          ctx.fillStyle = "#1F2937";
          ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(issueDate, width * 0.595, height * 0.665);

          ctx.fillStyle = "#1F2937";
          ctx.font = '40px "Times New Roman", "Ovo", serif';
          ctx.fillText(certificate.certificateId, width * 0.42, height * 0.806);
        } else {
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
          ctx.fillText(
            certificate.name.toUpperCase(),
            width / 2,
            height * 0.44
          );

          ctx.fillStyle = "#1F2937";
          ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(issueDate, width * 0.48, height * 0.675);

          ctx.fillStyle = "#1F2937";
          ctx.font = '42px "Times New Roman", "Ovo", serif';
          ctx.fillText(certificate.certificateId, width * 0.42, height * 0.82);
        }

        const imageBuffer = canvas.toBuffer("image/png");

        certificateBuffers.push({
          buffer: imageBuffer,
          width,
          height,
          name: certificate.name,
          certificateId: certificate.certificateId,
          course: certificate.course,
        });

        results.successful.push({
          certificateId: certificate.certificateId,
          name: certificate.name,
          course: certificate.course,
          category: certificate.category,
          batch: certificate.batch,
        });
      } catch (error) {
        
        results.failed.push({
          certificateId: certId,
          error: error.message,
        });
      }
    }

    if (certificateBuffers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No certificates could be processed",
        results: {
          total: certificateIds.length,
          successful: 0,
          failed: results.failed.length,
        },
        data: {
          failed: results.failed,
        },
      });
    }

    // ✅ FIX 5 — Stream PDF directly to response (no memory accumulation)
    const doc = new PDFDocument({ autoFirstPage: false });

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `certificates_bulk_${timestamp}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream directly to response
    doc.pipe(res);

    for (const cert of certificateBuffers) {
      doc.addPage({ size: [cert.width, cert.height], margin: 0 });
      doc.image(cert.buffer, 0, 0, { width: cert.width, height: cert.height });
    }

    doc.end();

    await ActivityLog.create({
      action: "bulk_downloaded",
      count: results.successful.length,
      adminId: req.user._id,
      details: "Bulk downloaded",
    });
  } catch (error) {
    console.error("Bulk download error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to process bulk download",
        error: error.message,
      });
    }
  }
};

const downloadBulkCertificateInfo = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    // ✅ FIX 5 — Limit bulk size
    const MAX_BULK_SIZE = 20;

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Certificate IDs array is required",
      });
    }

    if (certificateIds.length > MAX_BULK_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Bulk download limited to ${MAX_BULK_SIZE} certificates at a time.`,
      });
    }

    const results = {
      successful: [],
      failed: [],
    };

    const certificateBuffers = [];
    const { createCanvas, loadImage } = await import("canvas");
    const PDFDocument = (await import("pdfkit")).default;

    function getAdjustedFontSize(ctx, text, maxWidth, baseFontSize) {
      let fontSize = baseFontSize;
      ctx.font = `bold ${fontSize}px Arial`;

      while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial`;
      }

      return fontSize;
    }

    for (const certId of certificateIds) {
      try {
        const certificate = await Certificate.findOne({
          certificateId: certId,
        });

        if (!certificate) {
          throw new Error("Certificate not found");
        }

        const templateFilename = getCourseTemplateFilename(
          certificate.course,
          certificate.category
        );
        const templatePath = path.join(
          __dirname,
          "../templates",
          templateFilename
        );

        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template not found: ${certificate.course}`);
        }

        // ✅ FIX 3 — Use cached template
        const templateImage = await loadTemplateImage(templatePath);
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

        const id = certificate.certificateId.split("-")[0];

        if (id === "NEX") {
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
          ctx.fillText(
            certificate.name.toUpperCase(),
            width / 2,
            height * 0.46
          );

          ctx.fillStyle = "#1F2937";
          ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(issueDate, width * 0.595, height * 0.665);

          ctx.fillStyle = "#1F2937";
          ctx.font = '40px "Times New Roman", "Ovo", serif';
          ctx.fillText(certificate.certificateId, width * 0.42, height * 0.806);
        } else {
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
          ctx.fillText(
            certificate.name.toUpperCase(),
            width / 2,
            height * 0.44
          );

          ctx.fillStyle = "#1F2937";
          ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(issueDate, width * 0.48, height * 0.675);

          ctx.fillStyle = "#1F2937";
          ctx.font = '42px "Times New Roman", "Ovo", serif';
          ctx.fillText(certificate.certificateId, width * 0.42, height * 0.82);
        }

        const imageBuffer = canvas.toBuffer("image/png");

        certificateBuffers.push({ buffer: imageBuffer, width, height });

        results.successful.push({
          certificateId: certificate.certificateId,
          name: certificate.name,
          course: certificate.course,
          category: certificate.category,
          batch: certificate.batch,
        });
      } catch (error) {
        
        results.failed.push({
          certificateId: certId,
          error: error.message,
        });
      }
    }

    if (certificateBuffers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No certificates could be processed",
        results: {
          total: certificateIds.length,
          successful: 0,
          failed: results.failed.length,
        },
        data: {
          failed: results.failed,
        },
      });
    }

    const doc = new PDFDocument({ autoFirstPage: false });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64Pdf = pdfBuffer.toString("base64");

      res.json({
        success: true,
        message: "Bulk download completed",
        results: {
          total: certificateIds.length,
          successful: results.successful.length,
          failed: results.failed.length,
        },
        data: {
          successful: results.successful,
          failed: results.failed,
          pdf: base64Pdf,
          filename: `certificates_bulk_${
            new Date().toISOString().split("T")[0]
          }.pdf`,
        },
      });
    });

    for (const cert of certificateBuffers) {
      doc.addPage({ size: [cert.width, cert.height], margin: 0 });
      doc.image(cert.buffer, 0, 0, { width: cert.width, height: cert.height });
    }

    doc.end();
  } catch (error) {
    console.error("Bulk download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bulk download",
      error: error.message,
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
