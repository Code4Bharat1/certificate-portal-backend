import Student from "../models/student.models.js";
import path from "path";
import fs from "fs";

// 1️⃣ Get all students with documents
export const getStudentsWithDocuments = async (req, res) => {
  try {
    let { page = 1, limit = 20, verified = "all" } = req.query;

    // Convert page & limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // Base filter: Only students who uploaded any document
    let filter = {
      $or: [
        { "documents.aadhaarFront": { $ne: null } },
        { "documents.aadhaarBack": { $ne: null } },
        { "documents.panCard": { $ne: null } },
        { "documents.bankPassbook": { $ne: null } }
      ]
    };

    // Verified filter
    if (verified === "true") filter.documentsVerified = true;
    if (verified === "false") filter.documentsVerified = false;

    // Count total students
    const total = await Student.countDocuments(filter);

    // Paginate
    const students = await Student.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch students with documents",
      error: error.message
    });
  }
};


// 2️⃣ View / Download a specific document
export const viewStudentDocument = async (req, res) => {
  try {
    const { studentId, docType } = req.params;

    const student = await Student.findById(studentId);

    if (!student || !student.documents[docType]) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const filePath = path.join(process.cwd(), student.documents[docType]);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File missing on server" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3️⃣ Verify or Unverify Documents
export const verifyStudentDocuments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { verified } = req.body;

    const student = await Student.findByIdAndUpdate(
      studentId,
      { documentsVerified: verified },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.status(200).json({
      success: true,
      message: verified ? "Documents verified" : "Verification removed",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
