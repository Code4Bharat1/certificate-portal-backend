import express from "express";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import {
  getStudentsWithDocuments,
  viewStudentDocument,
  verifyStudentDocuments
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

// Verify documents
router.put(
  "/students/:studentId/documents/verify",
  authenticateAdmin,
  verifyStudentDocuments
);

export default router;
