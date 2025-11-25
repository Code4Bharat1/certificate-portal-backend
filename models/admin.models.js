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
    
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin','code4bharat_admin','marketing_junction_admin','fsd_admin','hr_admin','bootcamp_admin','bvoc_admin'],
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
  permissions: {
  type: [String],
  default: []
}
,
  name: { type: String, trim: true },
  phone: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// =====================================
// 🔐 Password Hashing
// =====================================
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// =====================================
// 🔄 Update timestamp
// =====================================
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// =====================================
// 🔍 Compare passwords
// =====================================
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// =====================================
// 🕒 Update last login
// =====================================
adminSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  return await this.save();
};

// =====================================
// 🧑‍💼 Create Default Admin
// =====================================
adminSchema.statics.createDefaultAdmin = async function() {
  try {
    const count = await this.countDocuments();
    if (count > 0) return;

    const username = process.env.ADMIN_USERNAME || 'C4B';
    const password = process.env.ADMIN_PASSWORD || 'C4B';

    console.log("🔐 No admin found → Creating default admin");

    await this.create({
      username,
      password,
      role: 'superadmin',
      email: 'admin@code4bharat.com',
      name: 'Code 4 Bharat Super Admin',
      isActive: true
    });

    console.log("✅ Default Admin Created:");
    console.log("Username:", username);
    console.log("Password:", password);

  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
  }
};

// Indexes
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });

const Admin = mongoose.model('Admin', adminSchema);

// Auto-create default admin
Admin.createDefaultAdmin().catch(err => {
  console.error("Default Admin Creation Error:", err.message);
});

export default Admin;
