// File: routes/auth.routes.js
import express from 'express';
import { 
  adminLogin,      // For existing admin login
  studentLogin,    // For new student login
  studentRegister, // For new student registration
  verifyToken 
} from '../controllers/auth.controllers.js';
import { 
  authenticateAdmin,   // For admin routes
  authenticateStudent, // For student routes
  authenticate         // For both
} from '../middleware/auth.middleware.js';
import { uploadStudentDocuments } from "../controllers/student.controllers.js";
import uploadDocuments from "../middleware/uploadDocuments.js";
// import { authenticateStudent } from "../middleware/auth.middleware.js";

const router = express.Router();

// ========== ADMIN AUTHENTICATION ==========
// POST /api/auth/login - Admin login (existing endpoint - no change)
router.post('/login', adminLogin);

// GET /api/auth/verify - Verify admin token
router.get('/verify', authenticateAdmin, verifyToken);

// GET /api/auth/verify-admin - Alternative verify endpoint
router.get('/verify-admin', authenticateAdmin, verifyToken);

// ========== STUDENT AUTHENTICATION ==========
// POST /api/auth/user-login - Student login with phone number
router.post('/user-login', studentLogin);

// POST /api/auth/user-register - Student registration
router.post('/user-register', studentRegister);

// GET /api/auth/verify-user - Verify student token
router.get('/verify-user', authenticateStudent, verifyToken);

// ========== COMBINED VERIFICATION ==========
// GET /api/auth/verify-any - Verify any token (admin or student)
router.get('/verify-any', authenticate, verifyToken);

router.post(
  "/student/upload-documents",
  authenticateStudent,
  uploadDocuments,
  uploadStudentDocuments
);

// ========== LOGOUT (Optional) ==========
// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;