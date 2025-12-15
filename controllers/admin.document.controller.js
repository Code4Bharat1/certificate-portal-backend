// File: controllers/admin.document.controller.js
// Version 1: Student.js (capital S)
import Student from "../models/users.models.js";
import path from "path";
import fs from "fs";

/**
 * Get all students with documents
 */
export const getStudentsWithDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 100, verified } = req.query;

    // Build query based on verification filter
    let query = {
      $or: [
        { "documents.aadhaarFront": { $exists: true, $ne: null } },
        { "documents.aadhaarBack": { $exists: true, $ne: null } },
        { "documents.panCard": { $exists: true, $ne: null } },
        { "documents.bankPassbook": { $exists: true, $ne: null } },
      ],
    };

    // Apply verification filter
    if (verified === "verified") {
      query.documentsVerified = true;
    } else if (verified === "pending") {
      query.documentsVerified = { $ne: true };
    }

    const students = await Student.find(query)
      .select(
        "name phone email category batch documents documentsVerified documentsUploadedAt documentStatus"
      )
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ documentsUploadedAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching students with documents:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * View a specific document
 */
export const viewStudentDocument = async (req, res) => {
  try {
    const { studentId, docType } = req.params;

    console.log("📄 Viewing document:", { studentId, docType });

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Map frontend docType to backend field names
    const docFieldMap = {
      aadharFront: "aadhaarFront",
      aadharBack: "aadhaarBack",
      panCard: "panCard",
      bankPassbook: "bankPassbook",
    };

    const backendField = docFieldMap[docType] || docType;
    let documentPath = student.documents?.[backendField];

    if (!documentPath) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // 🔥 FIX: Remove leading slash if present
    const originalPath = documentPath;
    documentPath = documentPath.replace(/^\/+/, "");

    // Resolve absolute file path
    // Handle both "uploads/..." and "uploads-data/..." paths
    let filePath;

    if (documentPath.startsWith("uploads-data/")) {
      // If path already includes uploads-data, use it directly
      filePath = path.join(path.resolve("uploads"), documentPath);
    } else if (documentPath.startsWith("uploads/")) {
      // If path starts with uploads/, resolve normally
      filePath = path.resolve(documentPath);
    } else {
      // Otherwise, assume it's relative to uploads folder
      filePath = path.join(path.resolve("uploads"), documentPath);
    }

    console.log("📂 Document path from DB:", originalPath);
    console.log("📂 Cleaned path:", documentPath);
    console.log("📂 Resolved file path:", filePath);

    const fileExists = fs.existsSync(filePath);
    console.log("📂 File exists?", fileExists);

    // Check if file exists
    if (!fileExists) {
      console.error("❌ File not found at:", filePath);

      // Additional debugging
      const uploadsDir = path.resolve("uploads");
      console.log("📁 Uploads directory:", uploadsDir);
      console.log("📁 Uploads dir exists?", fs.existsSync(uploadsDir));

      try {
        const files = fs.readdirSync(
          path.join(uploadsDir, "uploads-data", "student-documents")
        );
        console.log("📁 Files in directory:", files.slice(0, 5)); // Show first 5 files
      } catch (err) {
        console.error("❌ Cannot read directory:", err.message);
      }

      return res.status(404).json({
        success: false,
        message: "File not found on server",
        debug: {
          expectedPath: filePath,
          uploadsDir: uploadsDir,
        },
      });
    }

    // Get file extension and set content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    // Set headers
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(filePath)}"`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("❌ Error streaming file:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error reading file",
        });
      }
    });
  } catch (error) {
    console.error("❌ Error viewing document:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify all documents for a student
 */
export const verifyStudentDocuments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { verified } = req.body;

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        documentsVerified: verified,
        documentsVerifiedAt: verified ? new Date() : null,
        documentsVerifiedBy: verified ? req.user.userId : null,
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: verified
        ? "Documents verified successfully"
        : "Documents marked as unverified",
      student,
    });
  } catch (error) {
    console.error("❌ Error verifying documents:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update individual document status (approve/reject)
 */
export const updateDocumentStatus = async (req, res) => {
  try {
    const { studentId, docType } = req.params;
    const { status, rejectionReason } = req.body;

    console.log("🔄 Updating document status:", { studentId, docType, status });

    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pending', 'approved', or 'rejected'",
      });
    }

    // If rejecting, require rejection reason
    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Map frontend docType to backend field names
    const docFieldMap = {
      aadharFront: "aadhaarFront",
      aadharBack: "aadhaarBack",
      panCard: "panCard",
      bankPassbook: "bankPassbook",
    };

    const backendField = docFieldMap[docType] || docType;

    // Check if document exists
    if (!student.documents?.[backendField]) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Initialize documentStatus if it doesn't exist
    if (!student.documentStatus) {
      student.documentStatus = {};
    }

    // Update document status
    student.documentStatus[backendField] = {
      status,
      rejectionReason: status === "rejected" ? rejectionReason : null,
      updatedAt: new Date(),
      updatedBy: req.user.userId,
    };

    // Mark the field as modified (important for nested objects)
    student.markModified("documentStatus");

    await student.save();

    res.json({
      success: true,
      message: `Document ${status} successfully`,
      documentStatus: student.documentStatus[backendField],
    });
  } catch (error) {
    console.error("❌ Error updating document status:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
