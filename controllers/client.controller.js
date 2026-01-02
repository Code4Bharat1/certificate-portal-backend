//client.controllers.js
import nodemailer from "nodemailer";
import axios from "axios";
import PdfPrinter from "pdfmake";
import fs from "fs";
import path from "path";
import ClientLetter from "../models/clientdata.models.js";
import { generateUnifiedOutwardNo } from "../utils/outwardNumberGenerator.js";

// Dev mode check
const IS_DEV_MODE = process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true';

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
   Helper: generateClientLetterId
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
   UPDATED buildDocDefinition - Footer on LAST PAGE ONLY
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
  return {
    pageSize: "A4",

    // FIX 1: More bottom margin to avoid stamp/sign overlap
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
        text: `Subject: ${subject}`,
        fontSize: 11,
        bold: true,
        alignment: "left",
        margin: [0, 0, 0, 20],
      },

      // FIX 2: Safe area to avoid overlapping stamps
      {
        stack: [
          {
            text:
              description ||
              "This is to inform you regarding the above-mentioned subject.",
            fontSize: 11,
            lineHeight: 1.5,
            alignment: "justify",
          },

          // reserving 120px space above stamp area
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

    // FIX 3: Footer ONLY on last page
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
    subject: `client Letter - ${letterId}`,
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
  letterId
) {
  try {
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;

    // Ensure phone has 91 prefix
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
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ WhatsApp send failed:", error.message);
    throw error;
  }
}

/* -------------------------
   Helper: Get client Details (Phone & Email)
------------------------- */
async function getClientDetails(clientName) {
  try {
    const People = (await import("../models/people.models.js")).default;

    const client = await People.findOne({
      name: clientName,
      category: "client",
    });

    if (!client) {
      console.error("❌ client not found:", clientName);
      throw new Error("client not found");
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
   clientLetter (SAVE + GENERATE PDF)
------------------------- */
/* -------------------------
   clientLetter (SAVE + GENERATE PDF)
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

    // ✅ Enhanced validation
    if (!name || !issueDate || !letterType || !projectName || !subject || !description) {
      
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

    // ✅ Validate letter type
    const validLetterTypes = [
      "Agenda",
      "MOM (Minutes of Meeting)",
      "Project Progress",
      "Project Communication",
    ];

    if (!validLetterTypes.includes(letterType)) {
      
      return res.status(400).json({
        success: false,
        message: `Invalid letter type. Must be one of: ${validLetterTypes.join(", ")}`,
        receivedType: letterType,
      });
    }

    // ✅ Validate category
    if (category && category !== "client") {
      
      return res.status(400).json({
        success: false,
        message: "Category must be 'client'",
        receivedCategory: category,
      });
    }


    let letterId;
    let exists;

    do {
      letterId = await generateClientLetterId(letterType);
      exists = await ClientLetter.findOne({ letterId });
    } while (exists);


    const { outwardNo, outwardSerial } = await generateUnifiedOutwardNo(issueDate);

    // ... rest of your existing code ...

  } catch (error) {
    console.error("❌ clientLetter error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to create client letter",
      error: error.message,
    });
  }
};

/* -------------------------
   clientPreview
------------------------- */
const clientPreview = async (req, res) => {
  try {
    

    const { name, issueDate, letterType, projectName, subject, description } = req.body;

    // ✅ Enhanced validation
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

    // ✅ Validate letter type
    const validLetterTypes = [
      "Agenda",
      "MOM (Minutes of Meeting)",
      "Project Progress",
      "Project Communication",
    ];

    if (!validLetterTypes.includes(letterType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid letter type. Must be one of: ${validLetterTypes.join(", ")}`,
        receivedType: letterType,
      });
    }


    const tempLetterId = await generateClientLetterId(letterType);
    const { outwardNo } = await generateUnifiedOutwardNo(issueDate);

   

    // ... rest of your existing code ...

  } catch (error) {
    console.error("❌ clientPreview error:", error);
    return res.status(500).json({
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
        .json({ success: false, message: "client letter not found" });
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
   DOWNLOAD PDF
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
        .json({ success: false, message: "client letter not found" });
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

    // Update download tracking
    letter.downloadCount = (letter.downloadCount || 0) + 1;
    letter.lastDownloaded = new Date();
    await letter.save();

    res.download(
      filePath,
      `${letter.name.replace(/\s+/g, "_")}_${letter.letterId}.pdf`
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
