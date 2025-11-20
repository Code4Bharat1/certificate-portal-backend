// routes/auth.routes.js
import express from 'express';
import {
  adminLogin,
  studentFirstLogin,
  studentSetPassword,
  studentLogin,
  studentChangePassword,
  studentRegister,
  verifyToken
} from '../controllers/auth.controller.firstlogin.js';
import { authenticateStudent } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin
router.post('/login', adminLogin);

// Student First Login
router.post('/first-login', studentFirstLogin);
router.post('/set-password', studentSetPassword);

// Student Regular Login
router.post('/user-login', studentLogin);
router.post('/change-password', authenticateStudent, studentChangePassword);

// Register
router.post('/register', studentRegister);

// Verify
router.get('/verify', authenticateStudent, verifyToken);

export default router;