// File: routes/auth.routes.js
import express from "express";
import {
  adminLogin,
  studentFirstLogin,
  studentSetPassword,
  studentLogin,
  studentChangePassword,
  studentRegister,
  verifyToken,
  studentVerifyOTP,
} from "../controllers/auth.controllers.js";
import uploadDocuments from "../middleware/uploadDocuments.js";
import {
  uploadStudentDocuments,
  getStudentDocuments,
} from "../controllers/users.controllers.js";
import {
  authenticateStudent,
  authenticateAdmin,
  authenticate,
} from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// ========== RATE LIMITER ==========
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10, // ⛔ only 10 attempts
  message: {
    success: false,
    message: "Too many login attempts — slow down",
  },
});

// ========== ADMIN ROUTES ==========
// POST /api/auth/login - Admin login (existing endpoint - no change)
router.post("/login", adminLogin);

// POST /api/auth/admin/login - Alternative admin login endpoint
router.post("/admin/login", adminLogin);

// GET /api/auth/verify - Verify admin token
router.get("/verify", authenticateAdmin, verifyToken);

// GET /api/auth/verify-admin - Alternative verify endpoint
router.get("/verify-admin", authenticateAdmin, verifyToken);

// ========== STUDENT ROUTES (FIRST LOGIN FLOW WITH OTP) ==========
// POST /api/auth/first-login - Student first login (sends OTP)
router.post("/first-login", loginLimiter, studentFirstLogin);

// POST /api/auth/verify-otp - Verify OTP
router.post("/verify-otp", studentVerifyOTP);

// POST /api/auth/set-password - Set password after OTP verification
router.post("/set-password", studentSetPassword);

// ========== STUDENT ROUTES (REGULAR LOGIN) ==========
// POST /api/auth/user-login - Student login with phone/email + password
router.post("/user-login", loginLimiter, studentLogin);

// POST /api/auth/change-password - Student change password
router.post("/change-password", authenticateStudent, studentChangePassword);

// ========== STUDENT REGISTRATION ==========
// POST /api/auth/register - Student registration (admin creates)
router.post("/register", studentRegister);

// POST /api/auth/user-register - Alternative student registration endpoint
router.post("/user-register", studentRegister);

// ========== STUDENT DOCUMENT UPLOAD ==========
// POST /api/auth/student/upload-documents - Upload Aadhaar / PAN / Passbook
router.post(
  "/student/upload-documents",
  authenticateStudent,
  uploadDocuments,
  uploadStudentDocuments
);

// GET /api/auth/student/upload-documents - Get student documents
router.get(
  "/student/upload-documents",
  authenticateStudent,
  getStudentDocuments
);

// ========== COMBINED VERIFICATION ==========
// GET /api/auth/verify-user - Verify student token
router.get("/verify-user", authenticateStudent, verifyToken);

// GET /api/auth/verify-any - Verify any token (admin or student)
router.get("/verify-any", authenticate, verifyToken);

// ========== LOGOUT (Optional) ==========
// POST /api/auth/logout - Logout (client-side token removal)
router.post("/logout", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
