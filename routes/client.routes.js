import express from "express";
import {
  getClientLetters,
  getClientLetterById,
  createClientLetter,
  downloadClientLetterPDF,
  updateLetterStatus,
  deleteClientLetter,
} from "../controllers/client.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET all client letters (with optional category filter via query params)
router.get("/", getClientLetters);

// POST create new client letter
router.post("/", createClientLetter);

// GET download client letter as PDF (must come before /:id to avoid route conflict)
router.get("/:id/download", downloadClientLetterPDF);

// GET single client letter by ID
router.get("/:id", getClientLetterById);

// PUT update letter status
router.put("/:id/status", updateLetterStatus);

// DELETE client letter
router.delete("/:id", deleteClientLetter);

export default router;
