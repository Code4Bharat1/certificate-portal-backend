import PdfPrinter from "pdfmake";
import fs from "fs";
import path from "path";
import ClientLetter from "../models/clientdata.models.js";

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
   Format: CLA-YYYY-MM-DD-XX (Agenda)
           CLM-YYYY-MM-DD-XX (MOM)
           CLP-YYYY-MM-DD-XX (Project Progress)
   ------------------------- */
async function generateClientLetterId(letterType) {
  const typeMap = {
    Agenda: "CLA",
    "MOM (Minutes of Meeting)": "CLM",
    "Project Progress": "CLP",
  };

  const typeAbbr = typeMap[letterType] || "CL";

  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Regex to match: CLA-YYYY-MM-DD-XX
  const regex = new RegExp(`^${typeAbbr}-${dateStr}-(\\d+)$`);

  // Find last ID for today's date
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
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNum).padStart(2, "0");

  return `${typeAbbr}-${dateStr}-${padded}`;
}

/* -------------------------
   Helper: generateClientOutwardNo
   Format: NEX/YYYY/MM/DD/SerialNumber
   Continuous serial across all client letters
   ------------------------- */
async function generateClientOutwardNo(issueDate) {
  const issue = issueDate ? new Date(issueDate) : new Date();

  const yyyy = issue.getFullYear();
  const mm = String(issue.getMonth() + 1).padStart(2, "0");
  const dd = String(issue.getDate()).padStart(2, "0");
  const datePart = `${yyyy}/${mm}/${dd}`;

  // Get the last client letter globally
  let lastLetter = await ClientLetter.findOne({})
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

  // Continuous outward serial for all client letters
  let nextSerial = maxSerial + 1;

  // Ensure numbering starts from 5 if no previous letters
  if (nextSerial < 5) {
    nextSerial = 5;
  }

  const outwardNo = `NEX/${datePart}/${nextSerial}`;

  return { outwardNo, outwardSerial: nextSerial };
}

/* -------------------------
   clientLetter - Saves to DB and generates PDF
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

    console.log("Received Data:", req.body);

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
      });
    }

    // Generate Letter ID
    let letterId;
    let exists;
    do {
      letterId = await generateClientLetterId(letterType);
      exists = await ClientLetter.findOne({ letterId });
    } while (exists);

    // Generate outward number
    const { outwardNo, outwardSerial } = await generateClientOutwardNo(
      issueDate
    );

    // Save to database
    const clientLetterData = {
      letterId,
      name,
      category: category || "Client",
      issueDate: new Date(issueDate),
      letterType,
      projectName,
      subject,
      description,
      outwardNo,
      outwardSerial,
      status: "Generated",
    };

    const savedLetter = await ClientLetter.create(clientLetterData);

    // Generate PDF
    const templatePath = path.join(
      process.cwd(),
      "templates/client/TemplateB.jpg"
    );

    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        message: "TemplateB image not found",
      });
    }

    const templateBase64 = fs.readFileSync(templatePath).toString("base64");

    const docDefinition = {
      pageSize: "A4",
      background: {
        image: `data:image/jpeg;base64,${templateBase64}`,
        width: 595,
        height: 842,
      },
      pageMargins: [50, 240, 50, 150],
      content: [
        // Outward No at top left
        {
          text: `Outward No.:- ${outwardNo}`,
          fontSize: 10,
          bold: true,
          alignment: "left",
          absolutePosition: { x: 50, y: 205 },
        },

        {
          text: letterType,
          alignment: "center",
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 15],
        },

        {
          text: `Date: ${new Date(issueDate).toLocaleDateString("en-IN")}`,
          margin: [0, 0, 0, 15],
          bold: true,
        },

        { text: "To,", bold: true, margin: [0, 0, 0, 3] },
        { text: name, bold: true, margin: [0, 0, 0, 15] },

        { text: `Subject: ${subject}`, bold: true, margin: [0, 0, 0, 10] },

        {
          text: `Project Name: ${projectName}`,
          bold: true,
          margin: [0, 0, 0, 15],
        },

        { text: "Dear Sir/Madam,", margin: [0, 0, 0, 15] },

        {
          text: description,
          alignment: "justify",
          lineHeight: 1.4,
          margin: [0, 0, 0, 30],
        },

        {
          alignment: "right",
          stack: [
            { text: "Regards,", margin: [0, 0, 0, 5] },
            { text: "Nexcore Alliance", bold: true },
          ],
        },

        // Letter ID at bottom left
        {
          text: `CREDENTIAL ID: ${letterId}`,
          fontSize: 10,
          bold: true,
          alignment: "left",
          absolutePosition: { x: 50, y: 760 },
        },
      ],
      defaultStyle: {
        font: "Helvetica",
        fontSize: 12,
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];

    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${name.replace(/\s+/g, "_")}_${letterId}.pdf"`
      );
      res.send(Buffer.concat(chunks));
    });

    pdfDoc.end();

    console.log("Client letter created successfully:", savedLetter);
  } catch (error) {
    console.error("PDF Creation Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------
   clientPreview - Preview without saving to DB
   ------------------------- */
const clientPreview = async (req, res) => {
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

    console.log("Preview Data:", req.body);

    // Generate temporary IDs for preview
    const tempLetterId = await generateClientLetterId(letterType);
    const { outwardNo } = await generateClientOutwardNo(issueDate);

    const templatePath = path.join(
      process.cwd(),
      "templates/client/TemplateB.jpg"
    );

    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        message: "TemplateB image not found",
      });
    }

    const templateBase64 = fs.readFileSync(templatePath).toString("base64");

    const docDefinition = {
      pageSize: "A4",
      background: {
        image: `data:image/jpeg;base64,${templateBase64}`,
        width: 595,
        height: 842,
      },
      pageMargins: [50, 240, 50, 150],
      content: [
        // Outward No at top left
        {
          text: `Outward No.:- ${outwardNo}`,
          fontSize: 10,
          bold: true,
          alignment: "left",
          absolutePosition: { x: 50, y: 205 },
        },

        {
          text: letterType,
          alignment: "center",
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 15],
        },
        {
          text: `Date: ${new Date(issueDate).toLocaleDateString("en-IN")}`,
          margin: [0, 0, 0, 15],
          bold: true,
        },
        { text: "To,", bold: true, margin: [0, 0, 0, 3] },
        { text: name, bold: true, margin: [0, 0, 0, 15] },
        { text: `Subject: ${subject}`, bold: true, margin: [0, 0, 0, 10] },
        {
          text: `Project Name: ${projectName}`,
          bold: true,
          margin: [0, 0, 0, 15],
        },
        { text: "Dear Sir/Madam,", margin: [0, 0, 0, 15] },
        {
          text: description,
          alignment: "justify",
          lineHeight: 1.4,
          margin: [0, 0, 0, 30],
        },
        {
          alignment: "right",
          stack: [
            { text: "Regards,", margin: [0, 0, 0, 5] },
            { text: "Nexcore Alliance", bold: true },
          ],
        },

        // Letter ID at bottom left
        {
          text: `CREDENTIAL ID: ${tempLetterId}`,
          fontSize: 10,
          bold: true,
          alignment: "left",
          absolutePosition: { x: 50, y: 760 },
        },
      ],
      defaultStyle: { font: "Helvetica", fontSize: 12 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];

    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      res.setHeader("Content-Type", "application/pdf");
      res.send(Buffer.concat(chunks));
    });

    pdfDoc.end();
  } catch (error) {
    console.error("PDF Preview Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------
   Additional utility functions
   ------------------------- */

// Get all client letters
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

// Get single client letter by ID
const getClientLetterById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    let letter;

    if (isObjectId) {
      letter = await ClientLetter.findById(identifier);
    } else {
      letter = await ClientLetter.findOne({ letterId: identifier });
    }

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

export { clientLetter, clientPreview, getClientLetters, getClientLetterById };
