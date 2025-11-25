import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Create output PDF
const doc = new PDFDocument();

// Save file
doc.pipe(fs.createWriteStream("output.pdf"));

// Register Poppins Regular
doc.registerFont(
  "Poppins",
  path.resolve("fonts/Poppins-Regular.ttf")
);

// Register Poppins Bold
doc.registerFont(
  "Poppins-Bold",
  path.resolve("fonts/Poppins-Bold.ttf")
);

// Use Poppins Regular
doc.font("Poppins")
   .fontSize(25)
   .text("Hello from Poppins Regular!", 50, 50);

// Use Poppins Bold
doc.font("Poppins-Bold")
   .fontSize(25)
   .text("Hello from Poppins Bold!", 50, 100);

// Finish PDF
doc.end();
