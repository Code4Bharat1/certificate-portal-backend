// routes/user.routes.js
import express from "express";
import { 
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  createUser,
  deleteUser
} from "../controllers/user.controller.js";

import { authenticateOld } from "../middleware/auth.middleware.js";

const router = express.Router();

// Auth
router.post("/login", loginUser);

// Profile
router.get("/profile", authenticateOld, getProfile);
router.put("/profile", authenticateOld, updateProfile);
router.post("/change-password", authenticateOld, changePassword);

// Admin Management
router.get("/", authenticateOld, getAllUsers);
router.post("/", authenticateOld, createUser);
router.delete("/:id", authenticateOld, deleteUser);

export default router;
