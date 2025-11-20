// File: models/Admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username must not exceed 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  name: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  // Only hash if password is modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt rounds of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp on modification
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to update last login
adminSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  return await this.save();
};

// Static method to find active admin
adminSchema.statics.findActiveAdmin = function(username) {
  return this.findOne({ username, isActive: true });
};

// Create default admin if none exists
adminSchema.statics.createDefaultAdmin = async function() {
  try {
    const adminCount = await this.countDocuments();
    
    if (adminCount === 0) {
      const defaultUsername = process.env.ADMIN_USERNAME || 'C4B';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'C4B';
      
      console.log('📝 No admin users found. Creating default admin...');
      
      const defaultAdmin = new this({
        username: defaultUsername,
        password: defaultPassword,
        role: 'admin',
        name: 'Code4Bharat Admin',
        email: 'admin@code4bharat.com',
        isActive: true
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin created successfully!');
      console.log('Username:', defaultUsername);
      console.log('Password:', defaultPassword);
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
};

// Indexes for better performance
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });

const Admin = mongoose.model('Admin', adminSchema);

// Auto-create default admin on model initialization
Admin.createDefaultAdmin().catch(err => {
  console.error('Error in auto-create admin:', err.message);
});

export default Admin;