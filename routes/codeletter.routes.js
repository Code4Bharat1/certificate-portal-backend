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


router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { default: Letter } = await import("../models/letter.models.js");
    const { default: ActivityLog } =
      await import("../models/activitylog.models.js");
    const { default: redisClient } = await import("../config/redisClient.js");

    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let letter = isObjectId
      ? await Letter.findById(identifier)
      : await Letter.findOne({ letterId: identifier });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    // Log delete activity
    try {
      await ActivityLog.create({
        action: "deleted",
        certificateId: letter.letterId,
        userName: letter.name,
        category: letter.category,
        adminId: req.user?._id || null,
        timestamp: new Date(),
      });
      // console.log("✅ Delete activity logged for letter:", letter.letterId);
    } catch (logError) {
      console.error("⚠️ Failed to log delete activity:", logError);
    }

    await Letter.findByIdAndDelete(letter._id);

    // Clear cache
    await redisClient.del("dashboard:stats");
    await redisClient.del("activitylog:50");
    // console.log("✅ Stats cache cleared after delete");

    res.status(200).json({
      success: true,
      message: "Letter deleted successfully",
      deletedLetter: {
        id: letter._id,
        letterId: letter.letterId,
        name: letter.name,
      },
    });
  } catch (error) {
    console.error("❌ Delete letter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete letter",
      error: error.message,
    });
  }
});

export default router;
