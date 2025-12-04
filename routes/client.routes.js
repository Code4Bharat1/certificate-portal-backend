import express from "express";
import {
  clientLetter,
  clientPreview,
  getClientLetters,
  getClientLetterById,
} from "../controllers/client.controller.js";
// Import authenticate middleware if you want to protect routes
// import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create client letter (saves to DB and downloads PDF)
router.post("/", clientLetter);

// Preview client letter (no DB save, just PDF preview)
router.post("/preview", clientPreview);

// Get all client letters
router.get("/", getClientLetters);

// Get single client letter by ID or letterId
router.get("/:id", getClientLetterById);

export default router;
