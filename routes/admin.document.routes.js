// File: routes/admin.document.routes.js
import express from "express";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import {
  getStudentsWithDocuments,
  viewStudentDocument,
  verifyStudentDocuments,
  updateDocumentStatus,
  testCloudinaryConfig,
  getStudentDocumentsRaw,
} from "../controllers/admin.document.controller.js";

const router = express.Router();

// ========== MAIN ROUTES ==========

// GET all students with documents
router.get("/students/documents", authenticateAdmin, getStudentsWithDocuments);

// VIEW a specific document
router.get(
  "/students/:studentId/documents/:docType/view",
  authenticateAdmin,
  viewStudentDocument
);

// VERIFY all documents for a student
router.put(
  "/students/:studentId/documents/verify",
  authenticateAdmin,
  verifyStudentDocuments
);

// UPDATE individual document status
router.put(
  "/students/:studentId/documents/:docType/status",
  authenticateAdmin,
  updateDocumentStatus
);

// ========== DEBUG ROUTES ==========

// Test Cloudinary configuration
router.get("/test-cloudinary", authenticateAdmin, testCloudinaryConfig);

// Get raw student document data
router.get(
  "/debug/student/:studentId/raw",
  authenticateAdmin,
  getStudentDocumentsRaw
);

export default router;
