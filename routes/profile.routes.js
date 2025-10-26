// Backend API Routes for Profile Management - FIXED VERSION
// File: routes/profileRoutes.js (ES6)

import express from 'express';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const router = express.Router();

// Fixed Admin Data
const FIXED_ADMIN = {
  email: 'hr@nexcorealliance.com',
  password: bcrypt.hashSync('admin123', 10), // Default password
  profile: {
    name: 'Admin',
    email: 'hr@nexcorealliance.com',
    phone: '9892398976',
    whatsappNumber: '9892398976',
    organization: 'Nexcore Alliance & Code 4 Bharat',
    designation: 'HR',
    location: 'Mumbai, India',
    role: 'Admin',
    joinedDate: '2024-01-01T00:00:00.000Z',
    profileImage: ''
  }
};

// File to store profile updates
const PROFILE_DATA_FILE = './data/adminProfile.json';

// Ensure data directory exists
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

// Load saved profile or use fixed data
let currentProfile = { ...FIXED_ADMIN.profile };
try {
  if (fs.existsSync(PROFILE_DATA_FILE)) {
    const savedData = fs.readFileSync(PROFILE_DATA_FILE, 'utf8');
    currentProfile = JSON.parse(savedData);
    console.log('✅ Loaded saved profile from file');
  } else {
    // Save initial profile
    fs.writeFileSync(PROFILE_DATA_FILE, JSON.stringify(currentProfile, null, 2));
    console.log('📋 Created initial profile file');
  }
} catch (error) {
  console.error('Error loading profile:', error);
  currentProfile = { ...FIXED_ADMIN.profile };
}

// Configure multer for profile image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('⚠️ No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Helper function to save profile
const saveProfile = (profileData) => {
  try {
    fs.writeFileSync(PROFILE_DATA_FILE, JSON.stringify(profileData, null, 2));
    currentProfile = { ...profileData };
    console.log('✅ Profile saved to file');
    return true;
  } catch (error) {
    console.error('❌ Error saving profile:', error);
    return false;
  }
};

// GET: Fetch Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('📥 GET /api/admin/profile - Fetching profile');
    
    res.json({
      success: true,
      data: currentProfile
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// PUT: Update Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('✏️ PUT /api/admin/profile - Updating profile');
    console.log('Update data:', req.body);
    
    // Update allowed fields
    const allowedFields = [
      'name', 
      'phone', 
      'whatsappNumber', 
      'organization', 
      'designation', 
      'location'
    ];

    const updatedProfile = { ...currentProfile };

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updatedProfile[field] = req.body[field];
      }
    });

    // Save to file
    if (saveProfile(updatedProfile)) {
      console.log('✅ Profile updated successfully');
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } else {
      throw new Error('Failed to save profile');
    }
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// POST: Upload Profile Image
router.post('/profile/image', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    console.log('📤 POST /api/admin/profile/image - Uploading profile image');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // Save image URL
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    const updatedProfile = { ...currentProfile, profileImage: imageUrl };

    if (saveProfile(updatedProfile)) {
      console.log('✅ Profile image uploaded successfully');
      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        imageUrl: imageUrl
      });
    } else {
      throw new Error('Failed to save profile image');
    }
    
  } catch (error) {
    console.error('❌ Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    });
  }
});

// POST: Change Password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    console.log('🔑 POST /api/admin/change-password - Changing password');
    
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, FIXED_ADMIN.password);

    if (!isPasswordValid) {
      console.log('❌ Current password is incorrect');
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash and update new password
    FIXED_ADMIN.password = await bcrypt.hash(newPassword, 10);

    // Save password to file
    try {
      const passwordFile = './data/adminPassword.json';
      fs.writeFileSync(passwordFile, JSON.stringify({ 
        password: FIXED_ADMIN.password 
      }, null, 2));
      console.log('✅ Password saved to file');
    } catch (saveError) {
      console.error('⚠️ Could not save password to file:', saveError);
    }

    console.log('✅ Password changed successfully');

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// POST: Reset Profile to Default
router.post('/profile/reset', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 POST /api/admin/profile/reset - Resetting to default');
    
    // Reset to fixed admin data
    const resetProfile = { ...FIXED_ADMIN.profile };
    
    if (saveProfile(resetProfile)) {
      console.log('✅ Profile reset to default');
      res.json({
        success: true,
        message: 'Profile reset to default successfully',
        data: resetProfile
      });
    } else {
      throw new Error('Failed to reset profile');
    }
    
  } catch (error) {
    console.error('❌ Error resetting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset profile',
      error: error.message
    });
  }
});

// GET: Get Fixed Admin Data (for reference)
router.get('/profile/default', authMiddleware, async (req, res) => {
  try {
    console.log('📋 GET /api/admin/profile/default - Getting default profile');
    
    res.json({
      success: true,
      data: FIXED_ADMIN.profile
    });
  } catch (error) {
    console.error('❌ Error getting default profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get default profile',
      error: error.message
    });
  }
});

export default router;