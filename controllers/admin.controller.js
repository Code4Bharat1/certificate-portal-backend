// controllers/admin.controller.js
import Admin from "../models/admin.models.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-2024";

// ✅ SINGLE SOURCE OF TRUTH - Role to Permission Mapping
// ✅ FIXED: Unified Permission Mapping
const ROLE_PERMISSIONS = {
  superadmin: [
    "it-nexcore",
    "marketing-junction",
    "dm",
    "fsd",
    "hr",
    "bootcamp",
    "bvoc",
    "operations",
    "client",
    "admin_management",
  ],

  admin: [
    "it-nexcore",
    "marketing-junction",
    "dm",
    "fsd",
    "hr",
    "bootcamp",
    "bvoc",
    "operations",
    "client",
    "admin_management", // ✅ Admin can manage other admins
  ],

  // ✅ IT-Nexcore, Code4Bharat, FSD share access
  it_nexcore_admin: ["it-nexcore", "fsd"],
  code4bharat_admin: ["it-nexcore", "fsd"], // Same as IT-Nexcore
  fsd_admin: ["fsd", "it-nexcore"], // Reverse order, same access
  
  // Marketing Junction & DM share access
  marketing_junction_admin: ["marketing-junction", "dm"],
  dm_admin: ["dm", "marketing-junction"],
  
  // Single-category admins
  hr_admin: ["hr"],
  bootcamp_admin: ["bootcamp"],
  bvoc_admin: ["bvoc"],
  operations_admin: ["operations"],
  client_admin: ["client"],
};

// ✅ Role Hierarchy
const roleHierarchy = {
  superadmin: 0,
  admin: 1,
  it_nexcore_admin: 2,
  code4bharat_admin: 2,
  marketing_junction_admin: 2,
  fsd_admin: 2,
  hr_admin: 2,
  bootcamp_admin: 2,
  bvoc_admin: 2,
  dm_admin: 2,
  operations_admin: 2,
  client_admin: 2,
};

// Generate Token with permissions
const generateToken = (admin) => {
  const permissions = ROLE_PERMISSIONS[admin.role] || [];

  return jwt.sign(
    {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      permissions: permissions,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// ==========================
// 🔐 LOGIN - FIXED VERSION
// ==========================
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact administrator.",
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin);

    // ✅ CRITICAL: Get permissions from ROLE_PERMISSIONS mapping
    const permissions = ROLE_PERMISSIONS[admin.role] || [];

   

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: permissions, // ✅ THIS IS THE KEY FIELD
        phone: admin.phone,
        whatsappNumber: admin.whatsappNumber,
        organization: admin.organization,
        designation: admin.designation,
        location: admin.location,
      },
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "An error occurred during login. Please try again.",
    });
  }
};

// ==========================
// 👤 GET PROFILE
// ==========================
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

    const permissions = ROLE_PERMISSIONS[admin.role] || [];

    res.json({
      success: true,
      data: {
        ...admin.toObject(),
        permissions: permissions,
      },
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};

// ==========================
// ✏️ UPDATE PROFILE
// ==========================
export const updateAdminProfile = async (req, res) => {
  try {
    const { password, role, permissions, username, ...updateData } = req.body;

    const admin = await Admin.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: admin,
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// ==========================
// 🔑 CHANGE PASSWORD
// ==========================
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// ==========================
// 🧑‍💼 ADMIN MANAGEMENT
// ==========================

// ✅ Get all admins with role-based filtering
export const getAllAdmins = async (req, res) => {
  try {
    const currentAdminRole = req.user.role;
    let query = {};

    if (currentAdminRole === "superadmin") {
      query = {};
    } else if (currentAdminRole === "admin") {
      query = { role: { $ne: "superadmin" } };
    } else {
      const currentLevel = roleHierarchy[currentAdminRole] || 999;
      const allowedRoles = Object.keys(roleHierarchy).filter(
        (role) => roleHierarchy[role] >= currentLevel
      );
      query = { role: { $in: allowedRoles } };
    }

    const admins = await Admin.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create a new admin with role hierarchy validation
export const createAdmin = async (req, res) => {
  try {
    const { username, name, email, phone, whatsappNumber, password, role } =
      req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, Email, Password & Role are required",
      });
    }

    const currentAdminRole = req.user.role;

    // Permission checks
    if (currentAdminRole === "superadmin") {
      // Can create any role
    } else if (currentAdminRole === "admin") {
      if (role === "superadmin" || role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Admins cannot create Super Admins or other Admins",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create admins",
      });
    }

    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const adminPermissions = ROLE_PERMISSIONS[role] || [];

    const admin = await Admin.create({
      username,
      name,
      email,
      phone,
      whatsappNumber: whatsappNumber || phone,
      password,
      role,
      permissions: adminPermissions,
    });

    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminData,
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Delete admin with authorization
export const deleteAdmin = async (req, res) => {
  try {
    const currentAdminRole = req.user.role;
    const targetAdmin = await Admin.findById(req.params.id);

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const currentLevel = roleHierarchy[currentAdminRole] || 999;
    const targetLevel = roleHierarchy[targetAdmin.role] || 999;

    if (currentAdminRole === "superadmin") {
      if (req.user.id === targetAdmin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete yourself",
        });
      }
    } else if (currentAdminRole === "admin") {
      if (targetAdmin.role === "superadmin" || targetAdmin.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "You cannot delete Super Admins or other Admins",
        });
      }
      if (req.user.id === targetAdmin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete yourself",
        });
      }
    } else {
      if (targetLevel <= currentLevel) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to delete this admin",
        });
      }
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete admin by username
export const deleteAdminByUsername = async (req, res) => {
  try {
    const currentAdminRole = req.user.role;
    const targetAdmin = await Admin.findOne({ username: req.params.username });

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const currentLevel = roleHierarchy[currentAdminRole] || 999;
    const targetLevel = roleHierarchy[targetAdmin.role] || 999;

    if (currentAdminRole === "superadmin") {
      if (req.user.username === targetAdmin.username) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete yourself",
        });
      }
    } else if (currentAdminRole === "admin") {
      if (targetAdmin.role === "superadmin" || targetAdmin.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "You cannot delete Super Admins or other Admins",
        });
      }
      if (req.user.username === targetAdmin.username) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete yourself",
        });
      }
    } else {
      if (targetLevel <= currentLevel) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to delete this admin",
        });
      }
    }

    await Admin.findOneAndDelete({ username: req.params.username });
    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
