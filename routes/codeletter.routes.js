import express from "express";
import {
  createCodeLetter,
  previewCodeLetter,
  getCodeLetters,
  getCodeLetterById,
  downloadCodeLetterAsPdf,
} from "../controllers/codeletter.controllers.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create Code Letter
router.post("/", authenticate, createCodeLetter);

// Preview Code Letter (no DB save)
router.post("/preview", previewCodeLetter);

// List all code letters
router.get("/", authenticate, getCodeLetters);

// Get single code letter
router.get("/:id", authenticate, getCodeLetterById);

// Download PDF
router.get("/:id/download.pdf", downloadCodeLetterAsPdf);

export default router;
