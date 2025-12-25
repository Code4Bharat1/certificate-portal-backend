// import express from "express";
// import multer from "multer";
// import path from "path";
// import OnboardingRequest from "../models/onboardingRequest.model.js";

// const router = express.Router();

// // STORAGE CONFIG
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/signatures"); // folder path
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });

// // CREATE onboarding request with file upload
// router.post("/", upload.single("signature"), async (req, res) => {
//   try {
//     const { name, email } = req.body;

//     if (!name || !email || !req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing fields or signature file",
//       });
//     }

//     const filePath = `/uploads/signatures/${req.file.filename}`;

//     const newReq = await OnboardingRequest.create({
//       name,
//       email,
//       signature: filePath,
//       status: "pending",
//       createdAt: new Date(),
//     });

//     res.json({ success: true, request: newReq });
//   } catch (error) {
//     console.error("Error saving onboarding request:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // GET onboarding requests with optional filter
// router.get("/", async (req, res) => {
//   try {
//     const { status } = req.query;

//     let query = {};
//     if (status && status !== "all") {
//       query.status = status;
//     }

//     const requests = await OnboardingRequest.find(query)
//       .sort({ createdAt: -1 });

//     res.json({ success: true, requests });
//   } catch (error) {
//     console.error("Error fetching onboarding requests:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
    
// // APPROVE onboarding request
// router.post("/approve/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { department, joiningDate, notes } = req.body; // extra admin info

//     const request = await OnboardingRequest.findById(id);

//     if (!request) {
//       return res.status(404).json({ success: false, message: "Request not found" });
//     }

//     if (request.status === "approved") {
//       return res.status(400).json({ success: false, message: "Already approved" });
//     }

//     request.status = "approved";
//     request.approvedAt = new Date();
//     request.department = department || null;
//     request.joiningDate = joiningDate || null;
//     request.notes = notes || "";

//     await request.save();

//     res.json({ success: true, message: "Request approved", request });
//   } catch (error) {
//     console.error("Error approving onboarding request:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// export default router;
import express from "express";
import multer from "multer";
import path from "path";
import OnboardingRequest from "../models/onboardingRequest.model.js";

const router = express.Router();

// STORAGE CONFIG
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/signatures"); // folder path
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// CREATE onboarding request with file upload
router.post("/", upload.single("signature"), async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Missing fields or signature file",
      });
    }

    const filePath = `/uploads/signatures/${req.file.filename}`;

    const newReq = await OnboardingRequest.create({
      name,
      email,
      signature: filePath,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ success: true, request: newReq });
  } catch (error) {
    console.error("Error saving onboarding request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET onboarding requests with optional filter
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const requests = await OnboardingRequest.find(query).sort({
      createdAt: -1,
    });

    res.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching onboarding requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// APPROVE onboarding request
router.post("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { department, joiningDate, notes } = req.body; // extra admin info

    const request = await OnboardingRequest.findById(id);

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (request.status === "approved") {
      return res
        .status(400)
        .json({ success: false, message: "Already approved" });
    }

    request.status = "approved";
    request.approvedAt = new Date();
    request.department = department || null;
    request.joiningDate = joiningDate || null;
    request.notes = notes || "";

    await request.save();

    res.json({ success: true, message: "Request approved", request });
  } catch (error) {
    console.error("Error approving onboarding request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
