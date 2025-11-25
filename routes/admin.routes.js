// File: routes/admin.routes.js
import express from "express";
import {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  deleteAdminByUsername   
} from "../controllers/admin.controller.js";

import { authenticateAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin Login
router.post("/login", loginAdmin);

// Profile Routes
router.get("/profile", authenticateAdmin, getAdminProfile);
router.put("/profile", authenticateAdmin, updateAdminProfile);
router.post("/change-password", authenticateAdmin, changeAdminPassword);

// Admin CRUD
router.get("/", authenticateAdmin, getAllAdmins);
router.post("/", authenticateAdmin, createAdmin);
router.delete("/:id", authenticateAdmin, deleteAdmin);
router.get("/admins", authenticateAdmin, getAllAdmins);
router.post("/admins", authenticateAdmin, createAdmin);
router.delete("/admins/:id", authenticateAdmin, deleteAdmin);
router.delete("/admins/username/:username", authenticateAdmin, deleteAdminByUsername);


export default router;
