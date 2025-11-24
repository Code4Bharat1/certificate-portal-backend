// File: routes/auth.routes.js
import express from 'express';
import {
  adminLogin,
  studentFirstLogin,
  studentSetPassword,
  studentLogin,
  studentChangePassword,
  studentRegister,
  verifyToken,
studentVerifyOTP
} from '../controllers/auth.controller.firstlogin.js';
import uploadDocuments from "../middleware/uploadDocuments.js";
import { uploadStudentDocuments } from "../controllers/student.controllers.js";
import { authenticateStudent } from '../middleware/auth.middleware.js';
import { getStudentDocuments } from "../controllers/student.controllers.js";

const router = express.Router();

// ========== ADMIN ROUTES (if using /api/auth base) ==========
router.post('/admin/login', adminLogin);  // /api/auth/admin/login

// ========== STUDENT ROUTES (if using /api/auth/user base) ==========
router.post('/first-login', studentFirstLogin);
router.post('/verify-otp', studentVerifyOTP);
router.post('/set-password', studentSetPassword);
router.post('/user-login', studentLogin);
router.post('/change-password', authenticateStudent, studentChangePassword);
router.post('/register', studentRegister);
router.get('/verify', verifyToken);
// Upload Aadhaar / PAN / Passbook
router.post(
  '/student/upload-documents',
  authenticateStudent,
  uploadDocuments,
  uploadStudentDocuments
);
router.get(
  "/student/upload-documents",
  authenticateStudent,
  getStudentDocuments
);


export default router;