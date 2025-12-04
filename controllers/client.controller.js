import PdfPrinter from "pdfmake";
import fs from "fs";
import path from "path";
import clientdataModel from "../models/clientdata.models.js"

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

// clientLetter is for saving the data into db;
const clientLetter = async (req, res) => {
    
  try {
    const { name, issueDate, letterType, projectName, subject, description,category } = req.body;

    console.log("Received Data:", req.body);

    const templatePath = path.join(process.cwd(), "templates/client/TemplateB.jpg");

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
        height: 842
      },

      pageMargins: [50, 200, 50, 200], // Adjust so content doesn't overlap template

      content: [
        {
          text: letterType,
          alignment: "center",
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 20],
        },

        { text: `Date: ${new Date(issueDate).toLocaleDateString("en-IN")}`, margin: [0, 10] },

        { text: "To,", bold: true, margin: [0, 20, 0, 5] },
        { text: name, bold: true },

        { text: `Project Name: ${projectName}`, bold: true, margin: [0, 20] },

        { text: `Subject: ${subject}`, bold: true, margin: [0, 10, 0, 20] },

        { text: "Dear Sir/Madam,", margin: [0, 10, 0, 20] },

        {
          text: description,
          alignment: "justify",
          lineHeight: 1.4,
        },

        {
          margin: [0, 50, 0, 0],
          alignment: "right",
          stack: [
            "Regards,",
            { text: "Nexcore Alliance", bold: true },
          ],
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
        `attachment; filename=${name.replace(/\s+/g, "_")}_${letterType}.pdf"`
      );
      res.send(Buffer.concat(chunks));
    });

    pdfDoc.end();

  } catch (error) {
    console.error("PDF Creation Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// preview function to perform the send to preview that we making

const clientPreview = async (req, res) => {
    
  try {
    const { name, issueDate, letterType, projectName, subject, description, category } = req.body;

    console.log("Received Data:", req.body);

    const templatePath = path.join(process.cwd(), "templates/client/TemplateB.jpg");

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
        height: 842
      },
      pageMargins: [50, 200, 50, 200],
      content: [
        { text: letterType, alignment: "center", fontSize: 18, bold: true, margin: [0, 0, 0, 20] },
        { text: `Date: ${new Date(issueDate).toLocaleDateString("en-IN")}`, margin: [0, 10] },
        { text: "To,", bold: true, margin: [0, 20, 0, 5] },
        { text: name, bold: true },
        { text: `Project Name: ${projectName}`, bold: true, margin: [0, 20] },
        { text: `Subject: ${subject}`, bold: true, margin: [0, 10, 0, 20] },
        { text: "Dear Sir/Madam,", margin: [0, 10, 0, 20] },
        { text: description, alignment: "justify", lineHeight: 1.4 },
        {
          margin: [0, 50, 0, 0],
          alignment: "right",
          stack: ["Regards,", { text: "Nexcore Alliance", bold: true }],
        },
      ],
      defaultStyle: { font: "Helvetica", fontSize: 12 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];

    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      res.setHeader("Content-Type", "application/pdf"); // preview only
      res.send(Buffer.concat(chunks)); // no download mode
    });

    pdfDoc.end();

  } catch (error) {
    console.error("PDF Creation Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export { clientLetter, clientPreview };
