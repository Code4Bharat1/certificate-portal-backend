// File: routes/admin.document.routes.js
import express from "express";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import {
  getStudentsWithDocuments,
  viewStudentDocument,
  verifyStudentDocuments,
  updateDocumentStatus
} from "../controllers/admin.document.controller.js";

const router = express.Router();

// Get all students with documents
router.get("/students/documents", authenticateAdmin, getStudentsWithDocuments);

// View a specific document
router.get(
  "/students/:studentId/documents/:docType/view",
  authenticateAdmin,
  viewStudentDocument
);

// Verify all documents for a student
router.put(
  "/students/:studentId/documents/verify",
  authenticateAdmin,
  verifyStudentDocuments
);

// Update individual document status (approve/reject)
router.put(
  "/students/:studentId/documents/:docType/status",
  authenticateAdmin,
  updateDocumentStatus
);

export default router;