import express from "express";
import {
  clientLetter,
  clientPreview,
  getClientLetters,
  getClientLetterById,
  downloadClientLetter,
} from "../controllers/client.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// ============================================
// CLIENT LETTER ROUTES
// ============================================

/**
 * @route   POST /api/clientletters/preview
 * @desc    Generate preview PDF (no DB save)
 * @access  Public (no auth for preview)
 */
router.post("/preview", clientPreview);

/**
 * @route   POST /api/clientletters
 * @desc    Create client letter (save to DB, send email/WhatsApp, return PDF)
 * @access  Protected
 */
router.post("/", authenticate, clientLetter);

/**
 * @route   GET /api/clientletters
 * @desc    Get all client letters
 * @access  Protected
 */
router.get("/", authenticate, getClientLetters);

/**
 * @route   GET /api/clientletters/:id
 * @desc    Get single client letter by ID or letterId
 * @access  Protected
 */
router.get("/:id", authenticate, getClientLetterById);

/**
 * @route   GET /api/clientletters/:id/download
 * @desc    Download client letter PDF
 * @access  Protected
 */
router.get("/:id/download.pdf", authenticate, downloadClientLetter);

/**
 * @route   PUT /api/clientletters/:id/status
 * @desc    Update client letter status
 * @access  Protected
 */
router.put("/:id/status", authenticate, async (req, res) => {
  try {
    const { default: ClientLetter } = await import(
      "../models/clientdata.models.js"
    );

    const { status } = req.body;
    const identifier = req.params.id;

    if (
      !status ||
      ![
        "pending",
        "downloaded",
        "Generated",
        "Pending Approval",
        "Sent to client",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid status required",
      });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let letter = isObjectId
      ? await ClientLetter.findById(identifier)
      : await ClientLetter.findOne({ letterId: identifier });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Client letter not found",
      });
    }

    letter.status = status;
    await letter.save();

    // console.log(
    //   "✅ Client letter status updated:",
    //   letter.letterId,
    //   "->",
    //   status
    // );

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: letter,
    });
  } catch (error) {
    console.error("❌ Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/clientletters/:id
 * @desc    Delete client letter
 * @access  Protected
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { default: ClientLetter } = await import(
      "../models/clientdata.models.js"
    );
    const fs = await import("fs");
    const path = await import("path");

    const identifier = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let letter = isObjectId
      ? await ClientLetter.findById(identifier)
      : await ClientLetter.findOne({ letterId: identifier });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Client letter not found",
      });
    }

    // Delete PDF file if exists
    if (letter.pdfUrl) {
      try {
        const filePath = path.join(process.cwd(), letter.pdfUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          // console.log("✅ PDF file deleted:", filePath);
        }
      } catch (fileError) {
        console.error("⚠️ Error deleting PDF file:", fileError);
        // Continue with DB deletion even if file deletion fails
      }
    }

    await ClientLetter.findByIdAndDelete(letter._id);

    // console.log("✅ Client letter deleted from DB:", letter.letterId);

    res.status(200).json({
      success: true,
      message: "Client letter deleted successfully",
      deletedLetter: {
        id: letter._id,
        letterId: letter.letterId,
        name: letter.name,
      },
    });
  } catch (error) {
    console.error("❌ Delete client letter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete client letter",
      error: error.message,
    });
  }
});

export default router;
