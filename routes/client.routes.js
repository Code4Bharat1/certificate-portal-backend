import express from "express";
import {
  clientLetter,
  clientPreview,
  getClientLetters,
  getClientLetterById,
  downloadClientLetter,
} from "../controllers/client.controller.js";

const router = express.Router();

router.post("/", clientLetter);
router.post("/preview", clientPreview);
router.get("/", getClientLetters);
router.get("/:id", getClientLetterById);
router.get("/:id/download", downloadClientLetter);

export default router;
