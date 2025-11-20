// File: middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.models.js';
import Student from '../models/student.models.js';

// Admin Authentication Middleware
export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's admin token (has username)
    if (!decoded.username) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const admin = await Admin.findOne({ username: decoded.username }).select('-password');
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin token' 
      });
    }

    req.user = admin;
    req.userType = 'admin';
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Student/User Authentication Middleware (Phone Number based)
export const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's student token (has phone)
    if (!decoded.phone) {
      return res.status(403).json({ 
        success: false, 
        message: 'Student access required' 
      });
    }
    
    // Fetch student by phone number
    const student = await Student.findOne({ phone: decoded.phone }).select('-password');
    
    if (!student) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user not found' 
      });
    }

    // Check if student is active
    if (!student.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been deactivated' 
      });
    }

    req.user = student;
    req.userType = 'student';
    next();
  } catch (error) {
    console.error('Student authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message 
    });
  }
};

// Combined Authentication (Admin or Student)
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;
    let userType;

    // Check if it's admin
    if (decoded.username) {
      user = await Admin.findOne({ username: decoded.username }).select('-password');
      userType = 'admin';
    } 
    // Check if it's student
    else if (decoded.phone) {
      user = await Student.findOne({ phone: decoded.phone }).select('-password');
      userType = 'student';
      
      // Check if student is active
      if (user && !user.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account has been deactivated' 
        });
      }
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    req.user = user;
    req.userType = userType;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Backward compatibility - maps to authenticateAdmin
export const authenticateOld = authenticateAdmin;