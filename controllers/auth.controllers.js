// File: controllers/auth.controllers.js
import jwt from "jsonwebtoken";
import Admin from "../models/admin.models.js";
import Student from "../models/users.models.js";
import { sendOTPViaWhatsApp, verifyOTP } from "../services/whatsappService.js";

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

// ========== FIXED ADMIN LOGIN ==========
export const adminLogin = async (req, res) => {
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

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // ✅ CRITICAL FIX: Get permissions from ROLE_PERMISSIONS
    const permissions = ROLE_PERMISSIONS[admin.role] || [];

    const token = jwt.sign(
      {
        username: admin.username,
        userId: admin._id,
        role: admin.role,
        permissions: permissions, // ✅ Include in token
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    admin.lastLogin = new Date();
    await admin.save();

   

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        name: admin.name,
        email: admin.email,
        permissions: permissions, // ✅ THIS IS THE KEY FIX
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
      message: "Server error during login",
    });
  }
};

// ========== STUDENT FIRST LOGIN (Username Based - WITH OTP) ==========
export const studentFirstLogin = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username (phone number) is required",
      });
    }

    const formattedPhone = username.startsWith("91")
      ? username
      : `91${username}`;

    const student = await Student.findOne({ phone: formattedPhone }).select(
      "+password"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found. Please contact admin.",
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Please contact admin.",
      });
    }

    if (!student.firstLogin) {
      return res.status(400).json({
        success: false,
        requiresPassword: true,
        message: "Password already set. Please login using password.",
      });
    }

    if (process.env.NODE_ENV !== "production") {
      
    } else {
      const otpResult = await sendOTPViaWhatsApp(formattedPhone, student.name);

      if (!otpResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
        });
      }
    }

    const tempToken = jwt.sign(
      {
        phone: student.phone,
        userId: student._id,
        userType: "user",
        isFirstLogin: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message:
        process.env.NODE_ENV === "production"
          ? "OTP sent to your WhatsApp! Please verify."
          : "OTP sent (DEV MODE - use any 6 digits)",
      tempToken,
      firstLogin: true,
      user: {
        id: student._id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        category: student.category,
        batch: student.batch,
      },
    });
  } catch (error) {
   
    return res.status(500).json({
      success: false,
      message: "Server error during first login",
    });
  }
};

// ========== VERIFY OTP (After First Login) ==========
export const studentVerifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided for OTP verification",
      });
    }

    const tempToken = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "OTP session expired. Please start login again.",
      });
    }

    if (!decoded.isFirstLogin) {
      return res.status(403).json({
        success: false,
        message: "Invalid OTP session",
      });
    }

    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

    if (decoded.phone !== formattedPhone) {
      return res.status(403).json({
        success: false,
        message: "OTP does not belong to this session",
      });
    }

    let result = { success: true };

    if (process.env.NODE_ENV === "production") {
      result = verifyOTP(formattedPhone, otp);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    }

    const student = await Student.findOne({ phone: formattedPhone });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const nextTempToken = jwt.sign(
      {
        userId: student._id,
        phone: student.phone,
        isFirstLogin: true,
        step: "password-setup",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified",
      tempToken: nextTempToken,
      user: {
        id: student._id,
        name: student.name,
        phone: student.phone,
      },
    });
  } catch (err) {
    
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========== STUDENT SET PASSWORD (After OTP Verification) ==========
export const studentSetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const tempToken = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please start the process again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please start the process again.",
      });
    }

    if (!decoded.isFirstLogin || decoded.step !== "password-setup") {
      return res.status(403).json({
        success: false,
        message: "Invalid token for password setup",
      });
    }

    const student = await Student.findById(decoded.userId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!student.firstLogin) {
      return res.status(400).json({
        success: false,
        message: "Password already set. Please login with your password.",
      });
    }

    student.password = password;
    student.firstLogin = false;
    await student.save();

    const token = jwt.sign(
      {
        userId: student._id,
        phone: student.phone,
        userType: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Password set successfully",
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        category: student.category,
        batch: student.batch,
        joinedDate: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Set password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password setup",
    });
  }
};

// ========== STUDENT REGULAR LOGIN (With Password) ==========
export const studentLogin = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone/Email and password are required",
      });
    }

    const formattedLoginId = /^\d+$/.test(loginId)
      ? loginId.startsWith("91")
        ? loginId
        : `91${loginId}`
      : loginId;

    const student = await Student.findOne({
      $or: [{ phone: formattedLoginId }, { email: formattedLoginId }],
    }).select("+password");

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Please contact admin.",
      });
    }

    if (student.firstLogin) {
      return res.status(403).json({
        success: false,
        message: "Please complete first login and set your password",
        requiresFirstLogin: true,
      });
    }

    const isPasswordValid = await student.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        phone: student.phone,
        userId: student._id,
        userType: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        category: student.category,
        batch: student.batch,
        joinedDate: student.createdAt,
      },
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ========== STUDENT CHANGE PASSWORD ==========
export const studentChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const student = await Student.findById(req.user._id).select("+password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const isCurrentPasswordValid = await student.comparePassword(
      currentPassword
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    student.password = newPassword;
    await student.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Server error during password change",
    });
  }
};

// ========== STUDENT REGISTRATION (Admin Creates) ==========
export const studentRegister = async (req, res) => {
  try {
    const { name, email, phone, category, batch } = req.body;

    if (!name || !phone || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and category are required",
      });
    }

    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

    const existingStudent = await Student.findOne({
      $or: [{ email }, { phone: formattedPhone }],
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Student with this email or phone already exists",
      });
    }

    const newStudent = new Student({
      name,
      email: email || null,
      phone: formattedPhone,
      category,
      batch: batch || "",
      firstLogin: true,
      password: undefined,
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message:
        "Student created successfully. They can now complete first login.",
      student: {
        id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        phoneWithoutCode: newStudent.phoneWithoutCode,
        category: newStudent.category,
        batch: newStudent.batch,
        firstLogin: newStudent.firstLogin,
      },
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// ========== VERIFY TOKEN ==========
export const verifyToken = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Token is valid",
      userType: req.userType,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying token",
    });
  }
};

// ========== FORGOT PASSWORD - SEND OTP ==========
export const studentForgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

    const student = await Student.findOne({ phone: formattedPhone });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Please contact admin.",
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `⚠️ DEV MODE: Skipping forgot password OTP send for ${formattedPhone}`
      );
    } else {
      const otpResult = await sendOTPViaWhatsApp(formattedPhone, student.name);

      if (!otpResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
        });
      }
    }

    res.status(200).json({
      success: true,
      message:
        process.env.NODE_ENV === "production"
          ? "OTP sent for password reset"
          : "OTP sent (DEV MODE - use any 6 digits)",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========== FORGOT PASSWORD - VERIFY OTP ==========
export const studentVerifyResetOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

    if (process.env.NODE_ENV === "production") {
      const result = verifyOTP(formattedPhone, otp);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } else {
      console.log(
        `⚠️ DEV MODE: Accepting reset OTP ${otp} without verification`
      );
    }

    const student = await Student.findOne({ phone: formattedPhone });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const resetToken = jwt.sign(
      {
        userId: student._id,
        purpose: "password-reset",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      success: true,
      message: "OTP verified",
      resetToken,
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========== FORGOT PASSWORD - RESET PASSWORD ==========
export const studentResetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No reset token provided",
      });
    }

    const resetToken = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(403).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const student = await Student.findById(decoded.userId).select("+password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    student.password = password;
    await student.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
