// File: routes/admin.document.routes.js
import express from "express";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import {
  getStudentsWithDocuments,
  viewStudentDocument,
  verifyStudentDocuments,
  approveDocument,
  rejectDocument
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

router.put("/students/:studentId/documents/:docType/approve", approveDocument);
router.put("/students/:studentId/documents/:docType/reject", rejectDocument);

export default router;
