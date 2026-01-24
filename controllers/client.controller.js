//client.controllers.js - FIXED TO RETURN PDF + UPDATE STATUS
import nodemailer from "nodemailer";
import axios from "axios";
import PdfPrinter from "pdfmake";
import fs from "fs";
import path from "path";
import ClientLetter from "../models/clientdata.models.js";
import { generateUnifiedOutwardNo } from "../utils/outwardNumberGenerator.js";
import parseMarkdown from "../utils/ParseMarkdown.js";
import redisClient from "../config/redisClient.js"; // ✅ ADD THIS

async function clearStatsCache() {
  try {
    await redisClient.del("dashboard:stats");
    await redisClient.del("activitylog:50");
    // console.log("✅ Stats cache cleared");
  } catch (error) {
    console.error("⚠️ Failed to clear cache:", error);
  }
}
// Dev mode check
const IS_DEV_MODE =
  process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER_C4B,
    pass: process.env.EMAIL_PASSWORD_C4B,
  },
});

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

/* -------------------------
   Helper: Convert parsed markdown to pdfmake format
------------------------- */
function markdownToPdfMake(text) {
  if (!text) return { text: "" };

  const parts = parseMarkdown(text);

  // Convert to pdfmake's text array format
  const textContent = parts.map((part) => ({
    text: part.text,
    bold: part.bold,
  }));

  return { text: textContent };
}

/* -------------------------
   Helper: generateClientLetterId - FIXED
------------------------- */
async function generateClientLetterId(letterType) {
  const typeMap = {
    Agenda: "CLA",
    "MOM (Minutes of Meeting)": "CLM",
    "Project Progress": "CLP",
    "Project Communication": "CLPC",
  };

  const typeAbbr = typeMap[letterType] || "CL";

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const regex = new RegExp(`^${typeAbbr}-${dateStr}-(\\d+)$`);

  const last = await ClientLetter.find({
    letterId: { $regex: `^${typeAbbr}-${dateStr}-` },
  })
    .select("letterId")
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  let nextNum = 1;

  if (last.length) {
    const match = last[0].letterId.match(regex);
    if (match && match[1]) nextNum = parseInt(match[1], 10) + 1;
  }

  const padded = String(nextNum).padStart(2, "0");
  return `${typeAbbr}-${dateStr}-${padded}`;
}

/* -------------------------
   Utility: load template
------------------------- */
function loadTemplateBase64(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${filePath}`);
  }
  return fs.readFileSync(filePath).toString("base64");
}

/* -------------------------
   buildDocDefinition - WITH MARKDOWN SUPPORT
------------------------- */
function buildDocDefinition({
  templateABase64,
  outwardNo,
  letterType,
  issueDate,
  name,
  subject,
  description,
  letterIdOrEmpty,
}) {
  const descriptionContent = markdownToPdfMake(
    description ||
      "This is to inform you regarding the above-mentioned subject.",
  );

  const subjectParts = parseMarkdown(subject);
  const subjectContent = subjectParts.map((part) => ({
    text: part.text,
    bold: true,
    fontSize: 11,
  }));

  return {
    pageSize: "A4",
    pageMargins: [50, 242, 50, 200],

    background: (currentPage, pageSize) => ({
      image: `data:image/jpeg;base64,${templateABase64}`,
      width: pageSize.width,
      height: pageSize.height,
    }),

    content: [
      {
        text: letterType || "",
        bold: true,
        fontSize: 14,
        alignment: "center",
        margin: [0, -50, 0, 40],
      },

      {
        text: `Outward No: ${outwardNo}`,
        fontSize: 11,
        bold: true,
        alignment: "left",
        margin: [0, -8, 0, 3],
      },

      {
        text: `Date: ${new Date(issueDate).toLocaleDateString("en-IN")}`,
        fontSize: 11,
        alignment: "left",
        margin: [0, 0, 0, 20],
      },

      {
        text: `To,\n${name}`,
        fontSize: 11,
        bold: true,
        alignment: "left",
        margin: [0, 0, 0, 15],
      },

      {
        text: [
          { text: "Subject: ", bold: true, fontSize: 11 },
          ...subjectContent,
        ],
        alignment: "left",
        margin: [0, 0, 0, 20],
      },

      {
        stack: [
          {
            ...descriptionContent,
            fontSize: 11,
            lineHeight: 1.5,
            alignment: "justify",
          },
          { text: "", margin: [0, -80, 0, 120] },
        ],
      },

      {
        alignment: "left",
        margin: [0, 0, 0, 0],
        stack: [
          { text: "Regards,", fontSize: 11, margin: [0, 0, 0, 3] },
          { text: "Nexcore Alliance", bold: true, fontSize: 11 },
        ],
      },
    ],

    footer: (currentPage, pageCount) => {
      if (currentPage === pageCount) {
        return {
          margin: [16, 81, 50, 30],
          columns: [
            {
              text: `Credential ID: ${letterIdOrEmpty}`,
              fontSize: 14,
              bold: true,
              alignment: "left",
            },
          ],
        };
      }
      return null;
    },

    defaultStyle: {
      font: "Helvetica",
      fontSize: 11,
    },
  };
}

/* -------------------------
   Helper: Send PDF via Email
------------------------- */
async function sendEmailWithPDF(clientEmail, clientName, pdfBuffer, letterId) {
  const mailOptions = {
    from: process.env.EMAIL_USER_C4B,
    to: clientEmail,
    subject: `Client Letter - ${letterId}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Dear ${clientName},</h2>
        <p>Please find attached your client letter.</p>
        <p>Letter ID: <strong>${letterId}</strong></p>
        <br/>
        <p>Best Regards,<br/>Nexcore Alliance</p>
      </div>
    `,
    attachments: [
      {
        filename: `${clientName.replace(/\s+/g, "_")}_${letterId}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

/* -------------------------
   Helper: Send PDF via WhatsApp
------------------------- */
async function sendWhatsAppWithPDF(
  phoneNumber,
  clientName,
  pdfBase64,
  letterId,
) {
  try {
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;

    let cleanPhone = phoneNumber.replace(/^\+/, "");
    if (!cleanPhone.startsWith("91")) {
      cleanPhone = "91" + cleanPhone;
    }

    const message = `Dear ${clientName},

Your client letter has been created successfully! 📄

Letter ID: ${letterId}

The PDF has been sent to your email.

Best Regards,
Nexcore Alliance`;

    const payload = {
      number: cleanPhone,
      type: "text",
      message: message,
      instance_id: instanceId,
    };

    const response = await axios.post(
      `${whatsappApiUrl}?access_token=${whatsappAccessToken}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("❌ WhatsApp send failed:", error.message);
    throw error;
  }
}

/* -------------------------
   Helper: Get Client Details (Phone & Email)
------------------------- */
async function getClientDetails(clientName) {
  try {
    const People = (await import("../models/people.models.js")).default;

    const client = await People.findOne({
      name: clientName,
      category: "client",
    });

    if (!client) {
      console.error("❌ Client not found:", clientName);
      throw new Error("Client not found");
    }

    return {
      phone: client.clientPhone1 || client.clientPhone2 || client.phone || null,
      email: client.clientEmail1 || client.clientEmail2 || client.email || null,
    };
  } catch (error) {
    console.error("❌ Get client details error:", error);
    return { phone: null, email: null };
  }
}

/* -------------------------
   clientLetter (SAVE + GENERATE PDF) - ✅ FIXED TO RETURN PDF
------------------------- */
const clientLetter = async (req, res) => {
  try {
    const {
      name,
      issueDate,
      letterType,
      projectName,
      subject,
      description,
      category,
    } = req.body;

    // Validation
    if (
      !name ||
      !issueDate ||
      !letterType ||
      !projectName ||
      !subject ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        missingFields: {
          name: !name,
          issueDate: !issueDate,
          letterType: !letterType,
          projectName: !projectName,
          subject: !subject,
          description: !description,
        },
      });
    }

    const validLetterTypes = [
      "Agenda",
      "MOM (Minutes of Meeting)",
      "Project Progress",
      "Project Communication",
    ];

    if (!validLetterTypes.includes(letterType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid letter type. Must be one of: ${validLetterTypes.join(
          ", ",
        )}`,
        receivedType: letterType,
      });
    }

    if (category && category !== "client") {
      return res.status(400).json({
        success: false,
        message: "Category must be 'client'",
        receivedCategory: category,
      });
    }

    // Generate unique Letter ID
    let letterId;
    let exists;

    do {
      letterId = await generateClientLetterId(letterType);
      exists = await ClientLetter.findOne({ letterId });
    } while (exists);

    const { outwardNo, outwardSerial } =
      await generateUnifiedOutwardNo(issueDate);

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "client",
      "TemplateA.jpg",
    );
    const templateABase64 = loadTemplateBase64(templatePath);

    // Build PDF doc definition
    const docDefinition = buildDocDefinition({
      templateABase64,
      outwardNo,
      letterType,
      issueDate,
      name,
      subject,
      description,
      letterIdOrEmpty: letterId,
    });

    // Generate PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on("data", (chunk) => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      pdfDoc.on("end", resolve);
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Save PDF to filesystem
    const uploadsDir = path.join(process.cwd(), "uploads", "client-letters");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${name.replace(/\s+/g, "_")}_${letterId}.pdf`;
    const pdfPath = path.join(uploadsDir, filename);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // ✅ Save to database with "pending" status (will be updated to "downloaded" when downloaded)
    const letter = await ClientLetter.create({
      letterId,
      name,
      category: category || "client", // ✅ This should always be "client"
      issueDate: new Date(issueDate),
      letterType,
      projectName,
      subject,
      description,
      outwardNo,
      outwardSerial,
      pdfUrl: `/uploads/client-letters/${filename}`,
      status: "pending",
      createdBy: req.user?._id || null,
    });

    // console.log("✅ Client letter saved to DB:", letterId, "- Status: pending");

    // ✅ Log activity to ActivityLog
    try {
      const ActivityLog = (await import("../models/activitylog.models.js"))
        .default;

      await ActivityLog.create({
        action: "created", // ✅ Must be one of the enum values
        certificateId: letterId,
        userName: name, // ✅ Uses userName, NOT user
        category: "client", // ✅ Must match your model enum
        adminId: req.user?._id || null,
        timestamp: new Date(),
      });

      // console.log("✅ Activity logged for client letter:", letterId);
    } catch (logError) {
      console.error("⚠️ Failed to log activity:", logError);
      console.error("⚠️ Error details:", logError.message);
    }
    await clearStatsCache();
    // Get client contact details
    const { phone, email } = await getClientDetails(name);

    // Send notifications (don't block response)
    const notificationPromises = [];

    if (email) {
      notificationPromises.push(
        sendEmailWithPDF(email, name, pdfBuffer, letterId).catch((err) =>
          console.error("Email send failed:", err),
        ),
      );
    }

    if (phone) {
      const pdfBase64 = pdfBuffer.toString("base64");
      notificationPromises.push(
        sendWhatsAppWithPDF(phone, name, pdfBase64, letterId).catch((err) =>
          console.error("WhatsApp send failed:", err),
        ),
      );
    }

    // Don't await notifications - let them run in background
    Promise.all(notificationPromises).catch((err) =>
      console.error("Some notifications failed:", err),
    );

    // ✅ FIXED: Return PDF blob with letter ID in header (like before)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Letter-Id", letterId);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name.replace(/\s+/g, "_")}_${letterId}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ clientLetter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create client letter",
      error: error.message,
    });
  }
};

/* -------------------------
   clientPreview - FIXED to show Letter ID in preview
------------------------- */
const clientPreview = async (req, res) => {
  try {
    const { name, issueDate, letterType, projectName, subject, description } =
      req.body;

    if (!name || !issueDate || !letterType || !projectName || !subject) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for preview",
        missingFields: {
          name: !name,
          issueDate: !issueDate,
          letterType: !letterType,
          projectName: !projectName,
          subject: !subject,
        },
      });
    }

    const validLetterTypes = [
      "Agenda",
      "MOM (Minutes of Meeting)",
      "Project Progress",
      "Project Communication",
    ];

    if (!validLetterTypes.includes(letterType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid letter type. Must be one of: ${validLetterTypes.join(
          ", ",
        )}`,
        receivedType: letterType,
      });
    }

    const tempLetterId = await generateClientLetterId(letterType);
    const { outwardNo } = await generateUnifiedOutwardNo(issueDate);

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "client",
      "TemplateA.jpg",
    );
    const templateABase64 = loadTemplateBase64(templatePath);

    const docDefinition = buildDocDefinition({
      templateABase64,
      outwardNo,
      letterType,
      issueDate,
      name,
      subject,
      description,
      letterIdOrEmpty: tempLetterId,
    });

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on("data", (chunk) => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      pdfDoc.on("end", resolve);
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Letter-Id-Preview", tempLetterId);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ clientPreview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate preview",
      error: error.message,
    });
  }
};

/* -------------------------
   GET ALL LETTERS
------------------------- */
const getClientLetters = async (req, res) => {
  try {
    const letters = await ClientLetter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: letters });
  } catch (error) {
    console.error("getClientLetters error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch client letters" });
  }
};

/* -------------------------
   GET SINGLE LETTER
------------------------- */
const getClientLetterById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let letter = isObjectId
      ? await ClientLetter.findById(identifier)
      : await ClientLetter.findOne({ letterId: identifier });

    if (!letter) {
      return res
        .status(404)
        .json({ success: false, message: "Client letter not found" });
    }

    res.status(200).json({ success: true, data: letter });
  } catch (error) {
    console.error("getClientLetterById error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch client letter" });
  }
};

/* -------------------------
   DOWNLOAD PDF - ✅ FIXED TO UPDATE STATUS TO "downloaded"
------------------------- */
const downloadClientLetter = async (req, res) => {
  try {
    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let letter = isObjectId
      ? await ClientLetter.findById(identifier)
      : await ClientLetter.findOne({ letterId: identifier });

    if (!letter) {
      return res
        .status(404)
        .json({ success: false, message: "Client letter not found" });
    }

    if (!letter.pdfUrl) {
      return res.status(404).json({ success: false, message: "PDF not found" });
    }

    const filePath = path.join(process.cwd(), letter.pdfUrl);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "PDF file not found on server" });
    }

    // ✅ FIXED: Update status to "downloaded" and track download
    letter.status = "downloaded";
    letter.downloadCount = (letter.downloadCount || 0) + 1;
    letter.lastDownloaded = new Date();
    await letter.save();

    // console.log(
    //   "✅ Client letter downloaded:",
    //   letter.letterId,
    //   "- Status updated to: downloaded",
    // );

    // ✅ Log download activity

    try {
      const ActivityLog = (await import("../models/activitylog.models.js"))
        .default;

      await ActivityLog.create({
        action: "downloaded", // ✅ Must be one of the enum values
        certificateId: letter.letterId,
        userName: letter.name, // ✅ Uses userName, NOT user
        category: "client", // ✅ Must match your model enum
        adminId: req.user?._id || null,
        timestamp: new Date(),
      });

      // console.log(
      //   "✅ Download activity logged for client letter:",
      //   letter.letterId,
      // );
    } catch (logError) {
      console.error("⚠️ Failed to log download activity:", logError);
      console.error("⚠️ Error details:", logError.message);
    }
await clearStatsCache();
    
    res.download(
      filePath,
      `${letter.name.replace(/\s+/g, "_")}_${letter.letterId}.pdf`,
    );
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ success: false, message: "Failed to download PDF" });
  }
};

export {
  clientLetter,
  clientPreview,
  getClientLetters,
  getClientLetterById,
  downloadClientLetter,
};
