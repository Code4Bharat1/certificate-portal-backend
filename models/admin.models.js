// File: models/admin.models.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    role: {
      type: String,
      enum: [
        "admin",
        "superadmin",
        "it_nexcore_admin", // ✅ Changed from "it-nexcore"
        "code4bharat_admin", // ✅ Kept (same as it-nexcore)
        "marketing_junction_admin",
        "fsd_admin",
        "hr_admin",
        "bootcamp_admin",
        "bvoc_admin",
        "dm_admin",
        "operations_admin",
        "client_admin",
      ],
      default: "admin",
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    permissions: {
      type: [String],
      default: [],
    },

    name: { type: String, trim: true },
    phone: { type: String, trim: true },

    whatsappNumber: {
      type: String,
      trim: true,
      default: "",
    },

    organization: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: { type: Boolean, default: true },

    lastLogin: { type: Date },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// =====================================
// 🔐 Password Hashing Before Save
// =====================================
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// =====================================
// 🔍 Compare Password Method
// =====================================
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// =====================================
// 🕒 Update Last Login
// =====================================
adminSchema.methods.updateLastLogin = async function () {
  this.lastLogin = Date.now();
  return await this.save();
};

// =====================================
// 🧑‍💼 Create Default Admin
// =====================================
adminSchema.statics.createDefaultAdmin = async function () {
  try {
    const count = await this.countDocuments();
    if (count > 0) return;

    // console.log("🔐 No admin found → Creating default admin");

    const username = process.env.ADMIN_USERNAME || "C4B";
    const password = process.env.ADMIN_PASSWORD || "C4B123"; // FIXED: at least 6 chars

    await this.create({
      username,
      password,
      role: "superadmin",
      email: "admin@code4bharat.com",
      name: "Code 4 Bharat Super Admin",
      isActive: true,
    });

    
  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
  }
};

// =====================================
// 📌 Important Index (Only keep needed ones)
// =====================================
adminSchema.index({ isActive: 1 }); // Removed duplicate username/email indexes

const Admin = mongoose.model("Admin", adminSchema);

// Auto-create default admin once DB is connected
Admin.createDefaultAdmin().catch((err) => {
  console.error("Default Admin Creation Error:", err.message);
});

export default Admin;
