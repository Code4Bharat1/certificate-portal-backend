import PdfPrinter from "pdfmake";
import fs from "fs";
import path from "path";
import Letter from "../models/letter.models.js";
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

// GET all client letters for authenticated user
export const getClientLetters = async (req, res) => {
  try {
    const { category } = req.query;

    const clientletters = await ClientLetter.find({category}).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      clientletters,
      count: clientletters.length,
    });
  } catch (error) {
    console.error("Error fetching client letters:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching client letters",
      error: error.message,
    });
  }
};

// GET single client letter by ID
export const getClientLetterById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const letter = await Letter.findOne({
      _id: id,
      userId,
    }).lean();

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Client letter not found",
      });
    }

    return res.status(200).json({
      success: true,
      letter,
    });
  } catch (error) {
    console.error("Error fetching client letter:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching client letter",
      error: error.message,
    });
  }
};

// POST - Create new client letter
export const createClientLetter = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, issueDate, letterType, projectName, subject, description } =
      req.body;

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

    // Generate unique letter ID
    const letterCount = await Letter.countDocuments({
      userId,
      category: "client",
    });
    const letterId = `CL${String(letterCount + 1).padStart(4, "0")}`;

    // Create new letter document
    const newLetter = await Letter.create({
      userId,
      category: "client",
      letterId,
      name,
      issueDate,
      letterType,
      projectName,
      subject,
      description,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Client letter created successfully",
      letter: newLetter,
    });
  } catch (error) {
    console.error("Error creating client letter:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating client letter",
      error: error.message,
    });
  }
};

// GET - Download client letter as PDF
export const downloadClientLetterPDF = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Fetch letter from database
    const letter = await Letter.findOne({
      _id: id,
      userId,
    });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Client letter not found",
      });
    }

    const { name, issueDate, letterType, projectName, subject, description } =
      letter;

    // Check if template exists
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

    // Create PDF document definition
    const docDefinition = {
      pageSize: "A4",
      background: {
        image: `data:image/jpeg;base64,${templateBase64}`,
        width: 595,
        height: 842,
      },
      pageMargins: [50, 200, 50, 200],
      content: [
        {
          text: letterType,
          alignment: "center",
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 20],
        },
        {
          text: `Date: ${new Date(issueDate).toLocaleDateString("en-IN")}`,
          margin: [0, 10],
        },
        { text: "To,", bold: true, margin: [0, 20, 0, 5] },
        { text: name, bold: true },
        {
          text: `Project Name: ${projectName}`,
          bold: true,
          margin: [0, 20],
        },
        {
          text: `Subject: ${subject}`,
          bold: true,
          margin: [0, 10, 0, 20],
        },
        { text: "Dear Sir/Madam,", margin: [0, 10, 0, 20] },
        {
          text: description,
          alignment: "justify",
          lineHeight: 1.4,
        },
        {
          margin: [0, 50, 0, 0],
          alignment: "right",
          stack: ["Regards,", { text: "Nexcore Alliance", bold: true }],
        },
      ],
      defaultStyle: {
        font: "Helvetica",
        fontSize: 12,
      },
    };

    // Generate PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];

    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Update status to downloaded
      await Letter.findByIdAndUpdate(id, { status: "downloaded" });

      // Send PDF to frontend
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${name.replace(/\s+/g, "_")}_${letterType}.pdf"`
      );
      res.send(pdfBuffer);
    });

    pdfDoc.on("error", (err) => {
      console.error("PDF Stream Error:", err);
      throw err;
    });

    pdfDoc.end();
  } catch (error) {
    console.error("PDF Creation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating PDF",
      error: error.message,
    });
  }
};

// PUT - Update letter status
export const updateLetterStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "downloaded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const letter = await Letter.findOneAndUpdate(
      { _id: id, userId },
      { status },
      { new: true }
    );

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Client letter not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      letter,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

// DELETE - Delete client letter
export const deleteClientLetter = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const letter = await Letter.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Client letter not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client letter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting letter:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting letter",
      error: error.message,
    });
  }
};
