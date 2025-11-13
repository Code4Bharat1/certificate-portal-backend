import express from "express";
import {
  createLetter,
  previewLetter,
  getLetters,
  getLetterById,
  // downloadLetterAsJpg,
  downloadLetterAsPdf
} from "../controllers/letter.controllers.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create Letter
router.post("/", authenticate, createLetter);

// Preview Letter (no DB save)
router.post("/preview", previewLetter);

// List all letters
router.get("/", authenticate, getLetters);

// Get single letter
router.get("/:id", authenticate, getLetterById);

// Download JPG
// router.get("/:id/download.jpg", authenticate, downloadLetterAsJpg);

// Download PDF
router.get("/:id/download.pdf", downloadLetterAsPdf);

export default router;
