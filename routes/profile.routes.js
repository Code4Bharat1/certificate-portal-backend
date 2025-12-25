
// File: routes/profile.routes.js 

import express from 'express';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'c4b-secret-key-2024';

// File paths
const DATA_DIR = './data';
const SUPER_ADMIN_FILE = path.join(DATA_DIR, 'superAdmin.json');
const ADMINS_DATA_FILE = path.join(DATA_DIR, 'admins.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

}

// Default Super Admin with C4B credentials
const DEFAULT_SUPER_ADMIN = {
  id: 'super_admin_001',
  username: 'C4B',  // ✅ Original username
  email: 'hr@nexcorealliance.com',
  password: bcrypt.hashSync('C4B', 10),  // ✅ Original password
  profile: {
    username: 'C4B',
    name: 'Super Admin',
    email: 'hr@nexcorealliance.com',
    phone: '9892398976',
    whatsappNumber: '9892398976',
    organization: 'Nexcore Alliance & Code 4 Bharat',
    designation: 'HR Manager',
    location: 'Mumbai, India',
    role: 'Super Admin',
    adminType: 'main',
    permissions: ['marketing-junction', 'code4bharat', 'bootcamp', 'bvoc', 'fsd', 'hr', 'admin_management'],
    joinedDate: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
    profileImage: '',
    status: 'active',
    isSystemAdmin: true
  }
};

// Load or initialize Super Admin
let SUPER_ADMIN = { ...DEFAULT_SUPER_ADMIN };
try {
  if (fs.existsSync(SUPER_ADMIN_FILE)) {
    const savedData = fs.readFileSync(SUPER_ADMIN_FILE, 'utf8');
    SUPER_ADMIN = JSON.parse(savedData);
    // Sync username and email
    SUPER_ADMIN.profile.username = SUPER_ADMIN.username;
    SUPER_ADMIN.profile.email = SUPER_ADMIN.email;
   
  } else {
    // First time setup
    fs.writeFileSync(SUPER_ADMIN_FILE, JSON.stringify(SUPER_ADMIN, null, 2));

  }
} catch (error) {
  console.error('❌ Error loading Super Admin:', error);
  SUPER_ADMIN = { ...DEFAULT_SUPER_ADMIN };
}

// Helper function to save Super Admin
const saveSuperAdmin = () => {
  try {
    SUPER_ADMIN.profile.username = SUPER_ADMIN.username;
    SUPER_ADMIN.profile.email = SUPER_ADMIN.email;
    fs.writeFileSync(SUPER_ADMIN_FILE, JSON.stringify(SUPER_ADMIN, null, 2));
   
    return true;
  } catch (error) {
    console.error('❌ Error saving Super Admin:', error);
    return false;
  }
};

// Load other admins
let adminsDatabase = [];
try {
  if (fs.existsSync(ADMINS_DATA_FILE)) {
    const savedAdmins = fs.readFileSync(ADMINS_DATA_FILE, 'utf8');
    adminsDatabase = JSON.parse(savedAdmins);
  
  } else {
    adminsDatabase = [
      {
        id: 'admin_001',
        name: 'Abhishek Sharma',
        email: 'abhishek@code4bharat.com',
        phone: '9876543210',
        password: bcrypt.hashSync('password123', 10),
        role: 'code4bharat_admin',
        permissions: ['code4bharat'],
        status: 'active',
        lastLogin: '2025-11-08T10:30:00.000Z',
        createdAt: '2024-03-15T08:00:00.000Z',
        createdBy: 'super_admin_001'
      },
      {
        id: 'admin_002',
        name: 'Priya Patel',
        email: 'priya@marketingjunction.com',
        phone: '9876543211',
        password: bcrypt.hashSync('password123', 10),
        role: 'marketing_junction_admin',
        permissions: ['marketing-junction'],
        status: 'active',
        lastLogin: '2025-11-09T11:45:00.000Z',
        createdAt: '2024-04-20T09:30:00.000Z',
        createdBy: 'super_admin_001'
      }
    ];
    fs.writeFileSync(ADMINS_DATA_FILE, JSON.stringify(adminsDatabase, null, 2));
  }
} catch (error) {
  console.error('❌ Error loading admins:', error);
}

const saveAdmins = () => {
  try {
    fs.writeFileSync(ADMINS_DATA_FILE, JSON.stringify(adminsDatabase, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving admins:', error);
    return false;
  }
};

// Configure multer
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
  limits: { fileSize: 5 * 1024 * 1024 },
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

// Auth Middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
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

// Super Admin Check
const isSuperAdmin = (req, res, next) => {
  if (req.user.adminType !== 'main' && req.user.isSystemAdmin !== true) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.'
    });
  }
  next();
};

// ==================== AUTH ROUTES ====================

// POST: Login - Support for both username/email
router.post('/login', async (req, res) => {
  try {
   
    const {  username, password } = req.body;
    
    // Accept either username or email
    const loginIdentifier = username || email;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required'
      });
    }
    
  
    
    // Check if Super Admin (by username or email)
    const isSuperAdminLogin = 
      loginIdentifier.toUpperCase() === SUPER_ADMIN.username.toUpperCase() ||
      loginIdentifier.toLowerCase() === SUPER_ADMIN.email.toLowerCase();
    
    if (isSuperAdminLogin) {
   
      
      const isPasswordValid = await bcrypt.compare(password, SUPER_ADMIN.password);
      
      if (!isPasswordValid) {
     
     
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Update last login
      SUPER_ADMIN.profile.lastLogin = new Date().toISOString();
      saveSuperAdmin();
      
      // Generate token
      const token = jwt.sign(
        { 
          id: SUPER_ADMIN.id,
          username: SUPER_ADMIN.username,
          email: SUPER_ADMIN.email,
          adminType: 'main',
          isSystemAdmin: true
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      
      
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: SUPER_ADMIN.profile
      });
    }
    
    // Check other admins by email
    const admin = adminsDatabase.find(a => a.email.toLowerCase() === loginIdentifier.toLowerCase());
    
    if (!admin) {
     
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    

    
    if (admin.status !== 'active') {
   
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact Super Admin.'
      });
    }
    
    
    
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    
    
    if (!isPasswordValid) {
   
      
      // Fallback: Direct comparison (if password not hashed properly)
      if (admin.password === password) {
        
        // Hash it properly
        admin.password = await bcrypt.hash(password, 10);
        saveAdmins();
      
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }
    
    // Update last login
    admin.lastLogin = new Date().toISOString();
    saveAdmins();
    
    // Generate token
    const token = jwt.sign(
      { 
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const { password: _, ...adminData } = admin;
    
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: adminData
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// ==================== PROFILE ROUTES ====================

// GET: Fetch Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.adminType === 'main' || req.user.isSystemAdmin) {
      res.json({
        success: true,
        data: SUPER_ADMIN.profile
      });
    } else {
      const admin = adminsDatabase.find(a => a.id === req.user.id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
      const { password, ...adminData } = admin;
      res.json({
        success: true,
        data: adminData
      });
    }
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
    
    
    if (req.user.adminType === 'main' || req.user.isSystemAdmin) {
      const allowedFields = [
        'name',
        'username',  // ✅ Can change username
        'email',     // ✅ Can change email
        'phone', 
        'whatsappNumber', 
        'organization', 
        'designation', 
        'location',
        'profileImage'
      ];
      
      // Check if username is being changed
      if (req.body.username && req.body.username !== SUPER_ADMIN.username) {
        
        SUPER_ADMIN.username = req.body.username;
      }
      
      // Check if email is being changed
      if (req.body.email && req.body.email !== SUPER_ADMIN.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }
        
        const emailExists = adminsDatabase.some(a => a.email.toLowerCase() === req.body.email.toLowerCase());
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'This email is already in use'
          });
        }
        
        
        SUPER_ADMIN.email = req.body.email;
      }

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          SUPER_ADMIN.profile[field] = req.body[field];
        }
      });
      
      // Ensure protected fields
      SUPER_ADMIN.profile.username = SUPER_ADMIN.username;
      SUPER_ADMIN.profile.email = SUPER_ADMIN.email;
      SUPER_ADMIN.profile.role = 'Super Admin';
      SUPER_ADMIN.profile.adminType = 'main';
      SUPER_ADMIN.profile.isSystemAdmin = true;
      SUPER_ADMIN.profile.permissions = DEFAULT_SUPER_ADMIN.profile.permissions;
      
      if (saveSuperAdmin()) {
        
        
        // Generate new token with updated credentials
        const newToken = jwt.sign(
          { 
            id: SUPER_ADMIN.id,
            username: SUPER_ADMIN.username,
            email: SUPER_ADMIN.email,
            adminType: 'main',
            isSystemAdmin: true
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({
          success: true,
          message: 'Profile updated successfully',
          data: SUPER_ADMIN.profile,
          newToken: (req.body.username !== req.user.username || req.body.email !== req.user.email) ? newToken : undefined
        });
      } else {
        throw new Error('Failed to save profile');
      }
    } else {
      const admin = adminsDatabase.find(a => a.id === req.user.id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
      
      const allowedFields = ['name', 'phone'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          admin[field] = req.body[field];
        }
      });
      
      if (saveAdmins()) {
        const { password, ...adminData } = admin;
        res.json({
          success: true,
          message: 'Profile updated successfully',
          data: adminData
        });
      } else {
        throw new Error('Failed to save profile');
      }
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

// POST: Change Password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 3 characters'
      });
    }
    
    if (req.user.adminType === 'main' || req.user.isSystemAdmin) {
      const isPasswordValid = await bcrypt.compare(currentPassword, SUPER_ADMIN.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      SUPER_ADMIN.password = await bcrypt.hash(newPassword, 10);
      
      if (saveSuperAdmin()) {
        
        return res.json({
          success: true,
          message: 'Password changed successfully'
        });
      }
    } else {
      const admin = adminsDatabase.find(a => a.id === req.user.id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
      
      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      admin.password = await bcrypt.hash(newPassword, 10);
      
      if (saveAdmins()) {
       
        return res.json({
          success: true,
          message: 'Password changed successfully'
        });
      }
    }
    
    throw new Error('Failed to change password');
    
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// POST: Upload Image
router.post('/profile/image', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }
    
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    if (req.user.adminType === 'main' || req.user.isSystemAdmin) {
      SUPER_ADMIN.profile.profileImage = imageUrl;
      
      if (saveSuperAdmin()) {
        res.json({
          success: true,
          message: 'Profile image uploaded',
          imageUrl,
          data: SUPER_ADMIN.profile
        });
      }
    } else {
      const admin = adminsDatabase.find(a => a.id === req.user.id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
      
      admin.profileImage = imageUrl;
      
      if (saveAdmins()) {
        const { password, ...adminData } = admin;
        res.json({
          success: true,
          message: 'Profile image uploaded',
          imageUrl,
          data: adminData
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// POST: Reset to Default C4B credentials
router.post('/profile/reset', authMiddleware, isSuperAdmin, async (req, res) => {
  try {

    
    SUPER_ADMIN = { ...DEFAULT_SUPER_ADMIN };
    
    if (saveSuperAdmin()) {
   
      
      res.json({
        success: true,
        message: 'Profile reset to default. Username: C4B, Password: C4B',
        data: SUPER_ADMIN.profile
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset profile',
      error: error.message
    });
  }
});

// ==================== ADMIN MANAGEMENT ====================

// GET: All Admins
router.get('/admins', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const adminsWithoutPassword = adminsDatabase.map(admin => {
      const { password, ...adminData } = admin;
      return adminData;
    });
    
    res.json({
      success: true,
      data: adminsWithoutPassword,
      count: adminsWithoutPassword.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
      error: error.message
    });
  }
});

// POST: Create Admin
router.post('/admins', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, role, permissions } = req.body;
    
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    if (email.toLowerCase() === SUPER_ADMIN.email.toLowerCase()) {
      return res.status(409).json({
        success: false,
        message: 'This email is used by Super Admin'
      });
    }
    
    const emailExists = adminsDatabase.some(a => a.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    if (password.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 3 characters'
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = {
      id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      permissions: permissions || [],
      status: 'active',
      lastLogin: null,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    };
    
    adminsDatabase.push(newAdmin);
    
    if (saveAdmins()) {
      const { password: _, ...adminData } = newAdmin;
     
      
      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: adminData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error.message
    });
  }
});

// PUT: Update Admin Status
router.put('/admins/:id/status', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const adminId = req.params.id;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status required'
      });
    }
    
    const admin = adminsDatabase.find(a => a.id === adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    admin.status = status;
    admin.updatedAt = new Date().toISOString();
    
    if (saveAdmins()) {
      const { password: _, ...adminData } = admin;
      res.json({
        success: true,
        message: `Admin ${status}d successfully`,
        data: adminData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

// DELETE: Delete Admin
router.delete('/admins/:id', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const adminIndex = adminsDatabase.findIndex(a => a.id === req.params.id);
    
    if (adminIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    const deletedAdmin = adminsDatabase[adminIndex];
    adminsDatabase.splice(adminIndex, 1);
    
    if (saveAdmins()) {
      res.json({
        success: true,
        message: 'Admin deleted successfully',
        deletedAdmin: {
          id: deletedAdmin.id,
          name: deletedAdmin.name,
          email: deletedAdmin.email
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin',
      error: error.message
    });
  }
});

// POST: Reset Admin Password (Super Admin Only)
router.post('/admins/:id/reset-password', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
   
    
    const { newPassword } = req.body;
    const adminId = req.params.id;
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }
    
    if (newPassword.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 3 characters'
      });
    }
    
    const admin = adminsDatabase.find(a => a.id === adminId);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Hash new password
    admin.password = await bcrypt.hash(newPassword, 10);
    admin.updatedAt = new Date().toISOString();
    
    if (saveAdmins()) {
      
      
      res.json({
        success: true,
        message: 'Password reset successfully',
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        },
        newPassword: newPassword
      });
    } else {
      throw new Error('Failed to save password');
    }
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// GET: Stats
router.get('/stats', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const stats = {
      totalAdmins: adminsDatabase.length,
      activeAdmins: adminsDatabase.filter(a => a.status === 'active').length,
      inactiveAdmins: adminsDatabase.filter(a => a.status === 'inactive').length,
      roleDistribution: {},
      recentLogins: adminsDatabase
        .filter(a => a.lastLogin)
        .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
        .slice(0, 5)
        .map(a => ({ id: a.id, name: a.name, email: a.email, lastLogin: a.lastLogin }))
    };
    
    adminsDatabase.forEach(admin => {
      stats.roleDistribution[admin.role] = (stats.roleDistribution[admin.role] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

// Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'C4B Super Admin API Running',
    timestamp: new Date().toISOString(),
    superAdmin: {
      username: SUPER_ADMIN.username,
      email: SUPER_ADMIN.email,
      role: 'Super Admin',
      defaultCredentials: {
        username: 'C4B',
        password: 'C4B'
      }
    }
  });
});

export default router;