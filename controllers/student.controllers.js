// File: controllers/student.controller.js
import Student from '../models/student.models.js';
import Letter from '../models/letter.models.js';

// ========== PROFILE MANAGEMENT ==========

// Get Student Profile
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
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
        firstLogin: student.firstLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
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
      aadhaarCard
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
        aadhaarCard
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedStudent
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// ========== DASHBOARD STATISTICS ==========

// Get Student Statistics
export const getStudentStatistics = async (req, res) => {
  try {
    const studentPhone = req.user.phone;

    const student = await Student.findOne({ phone: studentPhone }).select("name");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this phone number",
      });
    }

    // Fetch letters by student name
    const allLetters = await Letter.find({
      name: student.name,
    });

    // Normalize helper
    const normalize = (v) => (v || "").toString().toLowerCase();

    // Calculate statistics
    const statistics = {
      totalLetters: allLetters.length,

      signedUploaded: allLetters.filter(
        (letter) => Boolean(letter.signedUploaded)
      ).length,

      pendingSignature: allLetters.filter((letter) => {
        const type = normalize(letter.letterType);
        const signed = Boolean(letter.signedUploaded);
        return (
          !signed &&
          (type.includes("warning") || type.includes("offer"))
        );
      }).length,

      approved: allLetters.filter(
        (letter) => normalize(letter.status) === "approved"
      ).length,

      rejected: allLetters.filter(
        (letter) => normalize(letter.status) === "rejected"
      ).length,

      inReview: allLetters.filter((letter) => {
        const status = normalize(letter.status);
        return status === "in_review" || status === "in review";
      }).length,
    };

    res.status(200).json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// ========== LETTER MANAGEMENT ==========

// Get Recent Letters
export const getRecentLetters = async (req, res) => {
  try {
    const studentPhone = req.user?.phone;
    // const limit = Number(req.query.limit) || 10;

    if (!studentPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number not found in request'
      });
    }

    // Find student by phone to get name
    const student = await Student.findOne({ phone: studentPhone }).select('name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this phone number'
      });
    }

    console.log('📋 Fetching letters for student:', student.name, '(Phone:', studentPhone, ')');

    // Get recent letters using student name
    const recentLetters = await Letter.find({
      name: student.name
      // isDeleted: false
    })
      .sort({ createdAt: -1 })
      // .limit(limit)
      .select('_id letterType course letterId issueDate status signedUploaded verificationLink downloadLink');

    console.log('✅ Found', recentLetters.length, 'letters');
    
    console.log('🔍 Recent letters raw data:', recentLetters);

    // Format output
    const formattedLetters = recentLetters.map(letter => ({
      id: letter._id,
      letterType: letter.letterType,
      subType: letter.course,
      credentialId: letter.letterId,
      issueDate: letter.issueDate,
      status: letter.status || 'pending',
      signedUploaded: letter.signedUploaded || false,
    }));

    console.log('📄 Formatted letters:', formattedLetters);

    return res.status(200).json({
      success: true,
      letters: formattedLetters,
      count: formattedLetters.length
    });

  } catch (error) {
    console.error('Get recent letters error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching recent letters',
      error: error.message
    });
  }
};

// Get All Student Letters (with pagination, search, filter)
export const getAllStudentLetters = async (req, res) => {
  try {
    const studentPhone = req.user.phone;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const letterType = req.query.letterType || 'all';

    // Find student by phone to get name
    const student = await Student.findOne({ phone: studentPhone }).select('name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this phone number'
      });
    }

    // Build query using student name
    let query = {
      name: student.name
      // isDeleted: false
    };

    // Add search filter
    if (search) {
      query.$or = [
        { letterType: { $regex: search, $options: 'i' } },
        { credentialId: { $regex: search, $options: 'i' } },
        { subType: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Add letter type filter
    if (letterType !== 'all') {
      query.letterType = letterType;
    }

    const totalLetters = await Letter.countDocuments(query);
    const letters = await Letter.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      letters,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLetters / limit),
        totalLetters,
        hasMore: page < Math.ceil(totalLetters / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get all letters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching letters',
      error: error.message
    });
  }
};

// Get Letter Details
export const getLetterDetails = async (req, res) => {
  try {
    const { letterId } = req.params;
    const studentPhone = req.user.phone;

    // Find student by phone to get name
    const student = await Student.findOne({ phone: studentPhone }).select('name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this phone number'
      });
    }

    // Find letter by ID and student name
    const letter = await Letter.findOne({
      _id: letterId,
      name: student.name
      // isDeleted: false
    });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: 'Letter not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      letter: {
        id: letter._id,
        name: letter.name,
        email: letter.email,
        phone: letter.phone,
        letterType: letter.letterType,
        subType: letter.subType,
        category: letter.category,
        batch: letter.batch,
        credentialId: letter.credentialId,
        issueDate: letter.issueDate,
        expiryDate: letter.expiryDate,
        status: letter.status,
        signedUploaded: letter.signedUploaded,
        signedUploadedDate: letter.signedUploadedDate,
        verificationLink: letter.verificationLink,
        downloadLink: letter.downloadLink,
        remarks: letter.remarks,
        approvalNotes: letter.approvalNotes,
        rejectionReason: letter.rejectionReason,
        createdAt: letter.createdAt
      }
    });
  } catch (error) {
    console.error('Get letter details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching letter details',
      error: error.message
    });
  }
};

// ========== UPLOAD & DOWNLOAD ==========

// Upload Signed Letter
export const uploadSignedLetter = async (req, res) => {
  try {
    const { letterId } = req.body;
    const studentPhone = req.user.phone;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit'
      });
    }

    // Find student
    const student = await Student.findOne({ phone: studentPhone }).select('name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this phone number'
      });
    }

    // Find letter
    const letter = await Letter.findOne({
      letterId: letterId,
      name: student.name
    });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: 'Letter not found or access denied'
      });
    }

    // Already uploaded?
    if (letter.signedUploaded) {
      return res.status(400).json({
        success: false,
        message: 'Signed letter already uploaded'
      });
    }

    // Update fields
    letter.signedUploaded = true;
    letter.signedDocumentPath = req.file.path; // ⭐ PATH STORED HERE
    letter.signedUploadedDate = new Date();
    letter.signedstatus = 'in_review'; // your enum allows this

    await letter.save();

    res.status(200).json({
      success: true,
      message: 'Signed letter uploaded successfully',
      letter: {
        id: letter.credentialId,
        signedUploaded: letter.signedUploaded,
        signedUploadedDate: letter.signedUploadedDate,
        status: letter.status,
        signedDocumentPath: letter.signedDocumentPath   // ⭐ sending to frontend
      }
    });

  } catch (error) {
    console.error('Upload signed letter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading signed letter',
      error: error.message
    });
  }
};



// Download All Certificates
export const downloadAllCertificates = async (req, res) => {
  try {
    const studentPhone = req.user.phone;

    // Find student by phone to get name
    const student = await Student.findOne({ phone: studentPhone }).select('name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this phone number'
      });
    }

    // Get all letters for this student by name
    const letters = await Letter.find({ 
      name: student.name
      // isDeleted: false
    }).select('letterType credentialId downloadLink issueDate');

    if (letters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No letters found'
      });
    }

    // Return list of download links
    const downloadLinks = letters.map(letter => ({
      id: letter._id,
      letterType: letter.letterType,
      credentialId: letter.credentialId,
      issueDate: letter.issueDate,
      downloadLink: letter.downloadLink
    }));

    res.status(200).json({
      success: true,
      message: 'Certificate links retrieved successfully',
      certificates: downloadLinks,
      totalCount: letters.length
    });

  } catch (error) {
    console.error('Download all certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading certificates',
      error: error.message
    });
  }
};

// ========== HELPER FUNCTIONS ==========

// Get Letter Statistics by Type
export const getLetterStatisticsByType = async (req, res) => {
  try {
    const studentPhone = req.user.phone;

    // Find student by phone to get name
    const student = await Student.findOne({ phone: studentPhone }).select('name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this phone number'
      });
    }

    // Get all letters by student name
    const letters = await Letter.find({
      name: student.name
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
      statistics: lettersByType
    });
  } catch (error) {
    console.error('Get statistics by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// ========== ADDITIONAL HELPER FUNCTIONS ==========

// Get Student Name by Phone (Helper for debugging)
export const getStudentNameByPhone = async (req, res) => {
  try {
    const studentPhone = req.user.phone;

    const student = await Student.findOne({ phone: studentPhone }).select('name phone email category batch');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      student: {
        name: student.name,
        phone: student.phone,
        email: student.email,
        category: student.category,
        batch: student.batch
      }
    });
  } catch (error) {
    console.error('Get student name error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student name',
      error: error.message
    });
  }
};


export const uploadStudentDocuments = async (req, res) => {
  try {
    const studentId = req.user._id;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const files = req.files;

    student.documents = {
      aadhaarFront: files.aadhaarFront ? `/uploads-data/student-documents/${files.aadhaarFront[0].filename}` : student.documents?.aadhaarFront,
      aadhaarBack: files.aadhaarBack ? `/uploads-data/student-documents/${files.aadhaarBack[0].filename}` : student.documents?.aadhaarBack,
      panCard: files.panCard ? `/uploads-data/student-documents/${files.panCard[0].filename}` : student.documents?.panCard,
      bankPassbook: files.bankPassbook ? `/uploads-data/student-documents/${files.bankPassbook[0].filename}` : student.documents?.bankPassbook
    };

    await student.save();

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      documents: student.documents
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error uploading documents",
      error: error.message
    });
  }
};

export const getStudentDocuments = async (req, res) => {
  try {
    const studentId = req.user._id;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      documents: student.documents || {},
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};

