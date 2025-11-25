// controllers/user.controller.js
import User from "../models/user.models.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-2024";

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// ===============================
// 🔐 LOGIN (username + password)
// ===============================
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password required" });

    const user = await User.findOne({ username });

    if (!user)
      return res.status(401).json({ success: false, message: "Invalid username or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid username or password" });

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

// ===============================
// 👤 GET PROFILE
// ===============================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

// ===============================
// ✏️ UPDATE PROFILE
// ===============================
export const updateProfile = async (req, res) => {
  try {
    const { username, role } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (username) user.username = username;
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated",
      data: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

// ===============================
// 🔑 CHANGE PASSWORD
// ===============================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Current password incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Password update failed" });
  }
};

// ===============================
// 🧑‍💼 ADMIN CRUD
// ===============================

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ success: true, count: users.length, data: users });
};

// CREATE USER
export const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(409).json({ success: false, message: "Username already exists" });

    const user = await User.create({ username, password, role });

    res.status(201).json({ success: true, message: "User created", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Create failed" });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
