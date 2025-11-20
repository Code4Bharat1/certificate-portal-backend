// File: controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.models.js';
import Student from '../models/student.models.js';

// ========== ADMIN LOGIN ==========
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      { 
        username: admin.username,
        userId: admin._id,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// ========== STUDENT FIRST LOGIN (Username Based) ==========
export const studentFirstLogin = async (req, res) => {
  try {
    const { username } = req.body; // Username is phone number without country code

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username (phone number) is required'
      });
    }

    // Format phone: add 91 prefix if not present
    const formattedPhone = username.startsWith('91') ? username : `91${username}`;

    // Find student by phone
    const student = await Student.findOne({ phone: formattedPhone }).select('+password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found. Please contact admin.'
      });
    }

    // Check if student is disabled
    if (student.disabled) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact admin.'
      });
    }

    // Check if this is first login
    if (!student.firstLogin) {
      return res.status(400).json({
        success: false,
        message: 'Account already activated. Please use regular login with password.',
        requiresPassword: true
      });
    }

    // Generate temporary token for password setup
    const tempToken = jwt.sign(
      { 
        phone: student.phone,
        userId: student._id,
        userType: 'user',
        isFirstLogin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // 15 minutes to set password
    );

    res.status(200).json({
      success: true,
      message: 'First login verified. Please set your password.',
      tempToken,
      firstLogin: true,
      user: {
        id: student._id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        category: student.category,
        batch: student.batch
      }
    });

  } catch (error) {
    console.error('First login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during first login',
      error: error.message
    });
  }
};

// ========== STUDENT SET PASSWORD (After First Login) ==========
export const studentSetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirm password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify temp token
    const tempToken = req.headers.authorization?.split(' ')[1];
    
    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

    if (!decoded.isFirstLogin) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token for password setup'
      });
    }

    // Find student
    const student = await Student.findById(decoded.userId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!student.firstLogin) {
      return res.status(400).json({
        success: false,
        message: 'Password already set'
      });
    }

    // Set new password
    student.password = password;
    student.firstLogin = false;
    await student.save();

    // Generate regular token
    const token = jwt.sign(
      { 
        phone: student.phone,
        userId: student._id,
        userType: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Password set successfully. You can now login.',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        category: student.category,
        batch: student.batch,
        joinedDate: student.createdAt
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please start first login again.'
      });
    }
    
    console.error('Set password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password setup',
      error: error.message
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
        message: 'Phone/Email and password are required'
      });
    }

    // Format phone if it's a number
    const formattedLoginId = /^\d+$/.test(loginId) 
      ? (loginId.startsWith('91') ? loginId : `91${loginId}`)
      : loginId;

    // Find student by phone or email
    const student = await Student.findOne({
      $or: [{ phone: formattedLoginId }, { email: formattedLoginId }]
    }).select('+password');

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if student is disabled
    if (student.disabled) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact admin.'
      });
    }

    // Check if first login
    if (student.firstLogin) {
      return res.status(403).json({
        success: false,
        message: 'Please complete first login and set your password',
        requiresFirstLogin: true
      });
    }

    // Verify password
    const isPasswordValid = await student.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        phone: student.phone,
        userId: student._id,
        userType: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        category: student.category,
        batch: student.batch,
        joinedDate: student.createdAt
      }
    });

  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
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
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Get student with password
    const student = await Student.findById(req.user._id).select('+password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await student.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    student.password = newPassword;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change',
      error: error.message
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
        message: 'Name, phone, and category are required'
      });
    }

    // Format phone
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ email }, { phone: formattedPhone }]
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email or phone already exists'
      });
    }

    // Create new student (no password, firstLogin = true)
    const newStudent = new Student({
      name,
      email: email || null,
      phone: formattedPhone,
      category,
      batch: batch || '',
      firstLogin: true,
      password: undefined // No password initially
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message: 'Student created successfully. They can now complete first login.',
      student: {
        id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        phoneWithoutCode: newStudent.phoneWithoutCode,
        category: newStudent.category,
        batch: newStudent.batch,
        firstLogin: newStudent.firstLogin
      }
    });

  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// ========== VERIFY TOKEN ==========
export const verifyToken = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      userType: req.userType,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying token'
    });
  }
};