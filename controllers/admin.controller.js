// controllers/admin.controller.js
import Admin from "../models/admin.models.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-2024";

// Generate Token
const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// ==========================
// 🔐 LOGIN
// ==========================
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res
        .status(400)
        .json({ success: false, message: "Username and password required" });

    const admin = await Admin.findOne({ username });
    if (!admin)
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });

    const token = generateToken(admin);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================
// 👤 GET PROFILE
// ==========================
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================
// ✏️ UPDATE PROFILE
// ==========================
export const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================
// 🔑 CHANGE PASSWORD
// ==========================
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.user.id);
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Current password incorrect" });

    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================
// 🧑‍💼 ADMIN MANAGEMENT
// ==========================

// Get all admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new admin
export const createAdmin = async (req, res) => {
  try {
    const { username, name, email, phone, password, role, permissions } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, Email, Password & Role are required"
      });
    }

    // Check duplicate username
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists"
      });
    }

    // Check duplicate email
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    const admin = await Admin.create({
      username,
      name,
      email,
      phone,
      password,
      role,
      permissions: permissions || []
    });

    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminData
    });

  } catch (error) {
    console.error("Admin creation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Admin deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const deleteAdminByUsername = async (req, res) => {
  try {
    const admin = await Admin.findOneAndDelete({ username: req.params.username });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.json({ success: true, message: "Admin deleted by username" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
