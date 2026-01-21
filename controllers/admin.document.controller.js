// File: controllers/admin.document.controller.js
import Student from "../models/users.models.js";
import cloudinary from "../config/cloudinary.config.js";

/**
 * Get all students with documents
 */
export const getStudentsWithDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 100, verified } = req.query;

    let query = {
      $or: [
        { "documents.aadhaarFront": { $exists: true, $ne: null } },
        { "documents.aadhaarBack": { $exists: true, $ne: null } },
        { "documents.panCard": { $exists: true, $ne: null } },
        { "documents.bankPassbook": { $exists: true, $ne: null } },
      ],
    };

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

    const transformedStudents = students.map((student) => {
      const studentObj = student.toObject();

      if (studentObj.documents) {
        Object.keys(studentObj.documents).forEach((docKey) => {
          if (studentObj.documents[docKey]) {
            const docPath = studentObj.documents[docKey];
            studentObj.documents[docKey] = {
              path: docPath,
              url: docPath,
              status: studentObj.documentStatus?.[docKey]?.status || "pending",
              rejectionReason:
                studentObj.documentStatus?.[docKey]?.rejectionReason || null,
              updatedAt: studentObj.documentStatus?.[docKey]?.updatedAt || null,
            };
          }
        });
      }

      return studentObj;
    });

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      students: transformedStudents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * View a specific document - Returns Cloudinary URL
 */
export const viewStudentDocument = async (req, res) => {
  try {
    const { studentId, docType } = req.params;

    

    const student = await Student.findById(studentId);

    if (!student) {
      
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    

    const docFieldMap = {
      aadharFront: "aadhaarFront",
      aadharBack: "aadhaarBack",
      panCard: "panCard",
      bankPassbook: "bankPassbook",
    };

    const backendField = docFieldMap[docType] || docType;
    

    const documentPath = student.documents?.[backendField];

    if (!documentPath) {
      
      // console.log("Available documents:", Object.keys(student.documents || {}));
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // console.log("\n📂 DOCUMENT PATH ANALYSIS");
    // console.log("==========================================");
    // console.log("Raw path from DB:", documentPath);
    // console.log("Path type:", typeof documentPath);
    // console.log("Path length:", documentPath.length);
    // console.log("Starts with http:", documentPath.startsWith("http"));
    // console.log(
    //   "Contains cloudinary.com:",
    //   documentPath.includes("cloudinary.com")
    // );

    // The document path should already be a full Cloudinary URL
    // Just return it as-is
    const finalUrl = documentPath;
    const isCloudinary = finalUrl.includes("cloudinary.com");

    // console.log("\n✅ FINAL RESPONSE");
    // console.log("==========================================");
    // console.log("Final URL:", finalUrl);
    // console.log("Is Cloudinary:", isCloudinary);
    // console.log("==========================================\n");

    res.json({
      success: true,
      url: finalUrl,
      docType: backendField,
      isCloudinary: isCloudinary,
    });
  } catch (error) {
    console.error("\n❌ ERROR in viewStudentDocument:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
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

    

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pending', 'approved', or 'rejected'",
      });
    }

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

    const docFieldMap = {
      aadharFront: "aadhaarFront",
      aadharBack: "aadhaarBack",
      panCard: "panCard",
      bankPassbook: "bankPassbook",
    };

    const backendField = docFieldMap[docType] || docType;

    if (!student.documents?.[backendField]) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (!student.documentStatus) {
      student.documentStatus = {};
    }

    student.documentStatus[backendField] = {
      status,
      rejectionReason: status === "rejected" ? rejectionReason : null,
      updatedAt: new Date(),
      updatedBy: req.user.userId,
    };

    student.markModified("documentStatus");
    await student.save();

    res.json({
      success: true,
      message: `Document ${status} successfully`,
      documentStatus: student.documentStatus[backendField],
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DEBUG: Test Cloudinary configuration
 */
export const testCloudinaryConfig = async (req, res) => {
  try {
    const config = cloudinary.config();

    res.json({
      success: true,
      cloudinary: {
        configured: !!config.cloud_name,
        cloud_name: config.cloud_name,
        has_api_key: !!config.api_key,
        has_api_secret: !!config.api_secret,
      },
      note: "If any value is false or undefined, check your .env file",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DEBUG: Get raw student document data
 */
export const getStudentDocumentsRaw = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      studentId: student._id,
      name: student.name,
      documents: student.documents,
      documentStatus: student.documentStatus,
      documentsUploadedAt: student.documentsUploadedAt,
      documentsVerified: student.documentsVerified,
      rawDocumentsJSON: JSON.stringify(student.documents, null, 2),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
