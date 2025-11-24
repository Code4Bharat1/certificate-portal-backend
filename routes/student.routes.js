// File: routes/student.routes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateStudent } from '../middleware/auth.middleware.js';
import {
  getStudentProfile,
  updateStudentProfile,
  getStudentStatistics,
  getRecentLetters,
  getAllStudentLetters,
  uploadSignedLetter,
  downloadAllCertificates,
  getLetterDetails
} from '../controllers/student.controllers.js';
import uploadDocuments from "../middleware/uploadDocuments.js";
// import { authenticateStudent } from "../middleware/auth.middleware.js";
import { uploadStudentDocuments } from "../controllers/student.controllers.js";


const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads-data/signed-letters/');
  },
  // filename: (req, file, cb) => {
  //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  //   cb(null, 'signed-' + uniqueSuffix + path.extname(file.originalname));
  // }
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    // const letterId = req.body.letterId || "unknown";
    const letterId = req.query.letterId || req.body.letterId;

    const uniqueSuffix = Date.now();

    cb(null, `signed_${letterId}_${uniqueSuffix}.${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

// ========== PROFILE ROUTES ==========
// GET /api/student/profile - Get student profile
router.get('/student/profile', authenticateStudent, getStudentProfile);

// PUT /api/student/profile - Update student profile
router.put('/student/profile', authenticateStudent, updateStudentProfile);

// PATCH /api/student/profile/image - Update profile image
router.patch('/student/profile/image', authenticateStudent, upload.single('profileImage'), (req, res) => {
  // Handle profile image update
  if (req.file) {
    req.body.profileImage = `/uploads/profiles/${req.file.filename}`;
  }
  updateStudentProfile(req, res);
});

// ========== DASHBOARD ROUTES ==========
// GET /api/student/statistics - Get student dashboard statistics
router.get('/student/statistics', authenticateStudent, getStudentStatistics);

// GET /api/student/letters/recent - Get recent letters (default: 10)
router.get('/student/letters/recent', authenticateStudent, getRecentLetters);

// GET /api/student/letters - Get all letters with pagination, search, and filters
router.get('/student/letters', authenticateStudent, getAllStudentLetters);

// GET /api/student/letters/:letterId - Get specific letter details
router.get('/student/letters/:letterId', authenticateStudent, getLetterDetails);

// ========== LETTER MANAGEMENT ROUTES ==========
// POST /api/student/upload-signed - Upload signed letter
router.post('/student/upload-signed', authenticateStudent, upload.single('signedFile'), uploadSignedLetter);
// router.post(
//   "/student/upload-signed",
//   upload.single("signedFile"),
//   uploadSignedLetter
// );


// GET /api/student/download-all - Download all certificates
router.get('/student/download-all', authenticateStudent, downloadAllCertificates);

// GET /api/student/letters/:letterId/download - Download specific letter
router.get('/student/letters/:letterId/download', authenticateStudent, async (req, res) => {
  try {
    const { letterId } = req.params;
    const letter = await Letter.findOne({
      _id: letterId,
      phone: req.user.phone
    });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: 'Letter not found'
      });
    }

    // Redirect to download link
    res.redirect(letter.downloadLink);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading letter'
    });
  }
});

// ========== NOTIFICATION ROUTES ==========
// GET /api/student/notifications - Get student notifications
router.get('/student/notifications', authenticateStudent, async (req, res) => {
  try {
    // Implement notification logic
    res.status(200).json({
      success: true,
      notifications: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// ========== SUPPORT ROUTES ==========
// POST /api/student/support/ticket - Create support ticket
router.post('/student/support/ticket', authenticateStudent, async (req, res) => {
  try {
    const { subject, message } = req.body;
    
    // Implement support ticket logic
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating support ticket'
    });
  }
});

// GET /api/student/support/tickets - Get student's support tickets
router.get('/student/support/tickets', authenticateStudent, async (req, res) => {
  try {
    // Implement get tickets logic
    res.status(200).json({
      success: true,
      tickets: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets'
    });
  }
});
// Upload Aadhaar / PAN / Passbook
router.post(
  '/student/upload-documents',
  authenticateStudent,
  uploadDocuments,
  uploadStudentDocuments
);


export default router;