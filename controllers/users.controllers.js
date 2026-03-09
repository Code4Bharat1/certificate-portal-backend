
import Student from "../models/users.models.js";
import Letter from "../models/letter.models.js";
import fs from "fs";
import { promisify } from "util";
import redisClient from "../config/redisClient.js";
import { getPresignedDocuments } from "../config/wasabi.js"
import { uploadFile } from "../config/wasabi.js";

const unlinkAsync = promisify(fs.unlink);

// ========== PROFILE MANAGEMENT ==========

// Get Student Profile
export const getStudentProfile = async (req, res) => {
  try {
    const cacheKey = `student:${req.user._id}:profile`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        user: JSON.parse(cached),
        source: "cache",
      });
    }

    const student = await Student.findById(req.user._id).select("-password");
    console.log("Student found:", student);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    const data = {
      id: student._id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      category: student.category,
      batch: student.batch,
      joinedDate: student.createdAt,
      address: student.address,
      city: student.city,
      state: student.state,
      pincode: student.pincode,
      aadhaarCard: student.aadhaarCard,
      parentEmail: student.parentEmail,
      parentPhone1: student.parentPhone1,
      parentPhone2: student.parentPhone2,
      disabled: student.disabled,
      firstLogin: student.firstLogin,
      documentsVerified: student.documentsVerified,
      documents: student.documents || {},
      documentStatus: student.documentStatus || {},
    };

    console.log("Student data prepared:", data);

    await redisClient.setEx(cacheKey, 120, JSON.stringify(data));

    res.status(200).json({ success: true, user: data, source: "db" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching profile" });
  }
};

// get student presigned doc
export const getStudentDoc = async (req, res) => {
  try {
    const cacheKey = `student:${req.user._id}:profile`;

    // ⚠️ NOTE: We do NOT cache presigned URLs in Redis because they expire.
    // We still cache the raw profile data (without signed URLs) separately.
    const cachedRaw = await redisClient.get(cacheKey);
    let data;

    if (cachedRaw) {
      // Got raw profile from cache — still need to sign the URLs fresh
      data = JSON.parse(cachedRaw);
    } else {
      // Fetch from DB
      const student = await Student.findById(req.user._id).select("-password");
      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      data = {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        category: student.category,
        batch: student.batch,
        joinedDate: student.createdAt,
        address: student.address,
        city: student.city,
        state: student.state,
        pincode: student.pincode,
        aadhaarCard: student.aadhaarCard,
        parentEmail: student.parentEmail,
        parentPhone1: student.parentPhone1,
        parentPhone2: student.parentPhone2,
        disabled: student.disabled,
        firstLogin: student.firstLogin,
        documentsVerified: student.documentsVerified,
        documents: student.documents || {},       // raw S3 URLs — DO NOT send to client
        documentStatus: student.documentStatus || {},
      };

      // Cache the raw profile (without signed URLs) for 120s
      await redisClient.setEx(cacheKey, 120, JSON.stringify(data));
    }

    // ✅ Generate fresh presigned URLs for each document (valid 1 hour)
    const signedDocuments = await getPresignedDocuments(data.documents);

    // Return profile with presigned URLs instead of raw S3 URLs
    res.status(200).json({
      success: true,
      user: {
        ...data,
        documents: signedDocuments,   // ✅ presigned, browser-openable URLs
      },
      source: cachedRaw ? "cache" : "db",
    });

  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ success: false, message: "Error fetching profile" });
  }
};


// Update Student Profile
export const updateStudentProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      city,
      state,
      pincode,
      category,
      batch,
      parentEmail,
      parentPhone1,
      parentPhone2,
      aadhaarCard,
    } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.user._id,
      {
        name,
        email,
        address,
        city,
        state,
        pincode,
        category,
        batch,
        parentEmail,
        parentPhone1,
        parentPhone2,
        aadhaarCard,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await redisClient.del(`student:${req.user._id}:profile`);
    await redisClient.del(`student:${req.user._id}:stats`);
    await redisClient.del(`student:${req.user._id}:recent_letters`);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedStudent,
    });


  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// ========== DASHBOARD STATISTICS ==========

// Get Student Statistics
export const getStudentStatistics = async (req, res) => {
  try {
    const cacheKey = `student:${req.user._id}:stats`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        statistics: JSON.parse(cached),
        source: "cache",
      });
    }

    const student = await Student.findOne({ phone: req.user.phone }).select(
      "name"
    );
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    const letters = await Letter.find({ name: student.name });

    // const normalize = (v) => (v || "").toLowerCase();
    const normalize = (v) => (v || "").toLowerCase().trim();

    const statistics = {
      totalLetters: letters.length,
      signedUploaded: letters.filter((l) => l.signedUploaded === true).length,

      pendingSignature: letters.filter(
        (l) =>
          !l.signedUploaded &&
          ["warning", "offer"].some((t) => normalize(l.letterType).includes(t))
      ).length,

      approved: letters.filter((l) => normalize(l.status) === "approved")
        .length,
      rejected: letters.filter((l) => normalize(l.status) === "rejected")
        .length,
      inReview: letters.filter((l) =>
        ["in_review", "in review"].includes(normalize(l.status))
      ).length,
    };

    console.log("Computed statistics:", statistics);

    await redisClient.setEx(cacheKey, 120, JSON.stringify(statistics));

    res.json({ success: true, statistics, source: "db" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching statistics" });
  }
};


// ========== LETTER MANAGEMENT ==========

// Get Recent Letters
export const getRecentLetters = async (req, res) => {
  try {
    const cacheKey = `student:${req.user._id}:recent_letters`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        letters: JSON.parse(cached),
        source: "cache",
      });
    }

    const student = await Student.findOne({ phone: req.user.phone }).select(
      "name"
    );
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    const letters = await Letter.find({ name: student.name })
      .sort({ createdAt: -1 })
      .select("_id letterType course letterId issueDate status signedUploaded");

    const formatted = letters.map((l) => ({
      id: l._id,
      letterType: l.letterType,
      subType: l.course,
      credentialId: l.letterId,
      issueDate: l.issueDate,
      status: l.status || "pending",
      signedUploaded: l.signedUploaded || false,
    }));

    await redisClient.setEx(cacheKey, 60, JSON.stringify(formatted));

    res.json({ success: true, letters: formatted, source: "db" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching recent letters" });
  }
};


// Get All Student Letters (with pagination, search, filter)
export const getAllStudentLetters = async (req, res) => {
  try {
    if (!req.user?.phone) {
      return res.status(400).json({
        success: false,
        message: "Student authentication missing",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const letterType = req.query.letterType || "all";

    const cacheKey = `student:${req.user._id}:letters:${page}:${limit}:${search}:${status}:${letterType}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const student = await Student.findOne({ phone: req.user.phone }).select(
      "name"
    );
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this phone number",
      });
    }

    let query = { name: student.name };

    if (search) {
      query.$or = [
        { letterType: { $regex: search, $options: "i" } },
        { credentialId: { $regex: search, $options: "i" } },
        { subType: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== "all") query.status = status;
    if (letterType !== "all") query.letterType = letterType;

    const totalLetters = await Letter.countDocuments(query);
    const letters = await Letter.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const response = {
      success: true,
      letters,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLetters / limit),
        totalLetters,
        hasMore: page < Math.ceil(totalLetters / limit),
        limit,
      },
      source: "db",
    };

    await redisClient.setEx(cacheKey, 60, JSON.stringify(response));

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching letters",
    });
  }
};

// Get Letter Details
export const getLetterDetails = async (req, res) => {
  try {
    const { letterId } = req.params;

    const cacheKey = `student:${req.user._id}:letter:${letterId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        letter: JSON.parse(cached),
        source: "cache",
      });
    }

    const student = await Student.findOne({ phone: req.user.phone }).select(
      "name"
    );
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const letter = await Letter.findOne({
      _id: letterId,
      name: student.name,
    });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found or access denied",
      });
    }
    await redisClient.setEx(cacheKey, 120, JSON.stringify(letter.toObject()));

    res.status(200).json({
      success: true,
      letter,
      source: "db",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching letter details",
    });
  }
};


// ========== UPLOAD & DOWNLOAD ==========

// Upload Signed Letter
export const uploadSignedLetter = async (req, res) => {
  try {
    const { letterId } = req.body;

    if (!letterId) {
      return res.status(400).json({
        success: false,
        message: "Letter ID required",
      });
    }

    const studentPhone = req.user.phone;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 10MB limit",
      });
    }

    // Find student
    const student = await Student.findOne({ phone: studentPhone }).select(
      "name"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this phone number",
      });
    }

    // Find letter
    const letter = await Letter.findOne({
      letterId: letterId,
      name: student.name,
    });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found or access denied",
      });
    }

    // Already uploaded?
    if (letter.signedUploaded) {
      return res.status(400).json({
        success: false,
        message: "Signed letter already uploaded",
      });
    }

    // Update fields
    letter.signedUploaded = true;
    letter.signedDocumentPath = req.file.path; // ⭐ PATH STORED HERE
    letter.signedUploadedDate = new Date();
    letter.signedstatus = "in_review"; // your enum allows this

    await letter.save();

    await redisClient.del(`student:${req.user._id}:stats`);
    await redisClient.del(`student:${req.user._id}:recent_letters`);
    res.status(200).json({
      success: true,
      message: "Signed letter uploaded successfully",
      letter: {
        id: letter.credentialId,
        signedUploaded: letter.signedUploaded,
        signedUploadedDate: letter.signedUploadedDate,
        status: letter.status,
        signedDocumentPath: letter.signedDocumentPath, // ⭐ sending to frontend
      },
    });
  } catch (error) {
    console.error("Upload signed letter error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading signed letter",
      error: error.message,
    });
  }
};

// Download All Certificates
export const downloadAllCertificates = async (req, res) => {
  try {
    const studentPhone = req.user.phone;

    // Find student by phone to get name
    const student = await Student.findOne({ phone: studentPhone }).select(
      "name"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this phone number",
      });
    }

    // Get all letters for this student by name
    const letters = await Letter.find({
      name: student.name,
      // isDeleted: false
    }).select("letterType credentialId downloadLink issueDate");

    if (letters.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No letters found",
      });
    }

    // Return list of download links
    const downloadLinks = letters.map((letter) => ({
      id: letter._id,
      letterType: letter.letterType,
      credentialId: letter.credentialId,
      issueDate: letter.issueDate,
      downloadLink: letter.downloadLink,
    }));

    res.status(200).json({
      success: true,
      message: "Certificate links retrieved successfully",
      certificates: downloadLinks,
      totalCount: letters.length,
    });
  } catch (error) {
    console.error("Download all certificates error:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading certificates",
      error: error.message,
    });
  }
};

// ========== HELPER FUNCTIONS ==========

// Get Letter Statistics by Type
export const getLetterStatisticsByType = async (req, res) => {
  try {
    const studentPhone = req.user.phone;

    // Find student by phone to get name
    const student = await Student.findOne({ phone: studentPhone }).select(
      "name"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this phone number",
      });
    }

    // Get all letters by student name
    const letters = await Letter.find({
      name: student.name,
      // isDeleted: false
    });

    // Group by letter type
    const lettersByType = letters.reduce((acc, letter) => {
      const type = letter.letterType;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      statistics: lettersByType,
    });
  } catch (error) {
    console.error("Get statistics by type error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// ========== ADDITIONAL HELPER FUNCTIONS ==========

// Get Student Name by Phone (Helper for debugging)
export const getStudentNameByPhone = async (req, res) => {
  try {
    const studentPhone = req.user.phone;

    const student = await Student.findOne({ phone: studentPhone }).select(
      "name phone email category batch"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      student: {
        name: student.name,
        phone: student.phone,
        email: student.email,
        category: student.category,
        batch: student.batch,
      },
    });
  } catch (error) {
    console.error("Get student name error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student name",
      error: error.message,
    });
  }
};

// new
export const uploadStudentDocuments = async (req, res) => {
  try {
    const studentId = req.user._id;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    // Supported doc fields
    const docFields = ["aadhaarFront", "aadhaarBack", "panCard", "bankPassbook"];

    const uploadPromises = docFields
      .filter((docType) => files[docType]?.[0])
      .map(async (docType) => {
        const file = files[docType][0];
        const key = `student-documents/${studentId}-${docType}-${Date.now()}-${file.originalname}`;

        const url = await uploadFile(file.buffer, key, file.mimetype);

        student.documents[docType] = url;

        if (!student.documentStatus) student.documentStatus = {};
        student.documentStatus[docType] = { status: "pending", updatedAt: new Date() };
      });

    await Promise.all(uploadPromises);

    if (!student.documentsUploadedAt) {
      student.documentsUploadedAt = new Date();
    }

    student.markModified("documents");
    student.markModified("documentStatus");
    await student.save();

    await redisClient.del(`student:${req.user._id}:documents`);

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      documents: student.documents,
      documentStatus: student.documentStatus,
    });
  } catch (error) {
    console.error("\n❌ UPLOAD ERROR:", error);
    res.status(500).json({ success: false, message: "Error uploading documents", error: error.message });
  }
};

// new
export const uploadSingleStudentDocument = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { docType } = req.body;

    const allowedDocTypes = ["aadhaarFront", "aadhaarBack", "panCard", "bankPassbook"];

    if (!docType) {
      return res.status(400).json({ success: false, message: "Document type is required" });
    }

    if (!allowedDocTypes.includes(docType)) {
      return res.status(400).json({ success: false, message: "Invalid document type" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const key = `student-documents/${studentId}-${docType}-${Date.now()}-${req.file.originalname}`;
    const fileUrl = await uploadFile(req.file.buffer, key, req.file.mimetype);

    student.documents[docType] = fileUrl;

    if (!student.documentStatus) student.documentStatus = {};
    student.documentStatus[docType] = { status: "pending", updatedAt: new Date() };

    student.documentsUploadedAt = new Date();
    student.markModified("documents");
    student.markModified("documentStatus");
    await student.save();

    await redisClient.del(`student:${studentId}:documents`);

    res.status(200).json({
      success: true,
      message: `${docType} uploaded successfully`,
      document: { type: docType, url: fileUrl, status: "pending" },
    });
  } catch (error) {
    console.error("❌ Single Upload Error:", error);
    res.status(500).json({ success: false, message: "Error uploading document", error: error.message });
  }
};


export const getStudentDocuments = async (req, res) => {
  try {
    const cacheKey = `student:${req.user._id}:documents`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        documents: JSON.parse(cached),
        source: "cache",
      });
    }

    const student = await Student.findById(req.user._id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    await redisClient.setEx(
      cacheKey,
      120,
      JSON.stringify(student.documents || {})
    );

    res.json({
      success: true,
      documents: student.documents || {},
      source: "db",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};

// View/Download Document
export const viewStudentDocument = async (req, res) => {
  try {
    const { studentId, docType } = req.params;

    // Find student
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get document URL from database
    const documentUrl = student.documents?.[docType];

    if (!documentUrl) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }


    // Return the Cloudinary URL directly
    res.status(200).json({
      success: true,
      url: documentUrl,
      isCloudinary: documentUrl.includes("cloudinary.com"),
    });

  } catch (error) {
    console.error("View document error:", error);
    res.status(500).json({
      success: false,
      message: "Error viewing document",
      error: error.message,
    });
  }
};

export const studentForgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const student = await Student.findOne({ phone });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    student.resetOtp = otp;
    student.resetOtpExpires = Date.now() + 10 * 60 * 1000;

    await student.save();


    res.status(200).json({
      success: true,
      message: "OTP sent to phone",
      otp, // remove in production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Reset Password
export const studentResetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP and new password are required",
      });
    }

    const student = await Student.findOne({
      phone,
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() },
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    student.password = newPassword;
    student.resetOtp = undefined;
    student.resetOtpExpires = undefined;

    await student.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
