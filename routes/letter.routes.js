import express from "express";
import {
  createLetter,
  previewLetter,
  // getLetters,
} from "../controllers/letter.controllers.js";
import { authenticate } from "../middleware/auth.middleware.js"; 

const router = express.Router();

router.post("/", authenticate, createLetter);
router.post("/preview", authenticate, previewLetter);
// router.get("/", authenticate, getLetters);

export default router;
