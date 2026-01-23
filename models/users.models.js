// File: models/users.models.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
  {
    // -------------------------
    // SAME FIELDS AS PEOPLE
    // -------------------------

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    category: {
      type: String,
      // enum: {
      //   values: [
      //     "it-nexcore",
      //     "marketing-junction",
      //     "fsd",
      //     "bvoc",
      //     "hr",
      //     "dm",
      //     "operations",
      //     "client",
      //   ],
      //   message: "{VALUE} is not a valid category",
      // },
      required: [true, "Category is required"],
    },

    batch: {
      type: String,
      required: function () {
        return ["fsd", "bvoc"].includes(this.category);
      },
      trim: true,
      default: "",
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      index: true,
      // default: null,
    },

    parentEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid parent email address"],
      required: function () {
        return this.category === "bvoc";
      },
      default: null,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^91[0-9]{10}$/, "Phone must be in 10 digits"],
      index: true,
    },

    parentPhone1: {
      type: String,
      trim: true,
      match: [
        /^91[0-9]{10}$/,
        "Parent Phone 1 must be in format 91XXXXXXXXXX (12 digits with country code)",
      ],
      default: null,
    },

    parentPhone2: {
      type: String,
      trim: true,
      match: [
        /^91[0-9]{10}$/,
        "Parent Phone 2 must be in format 91XXXXXXXXXX (12 digits with country code)",
      ],
      default: null,
    },

    aadhaarCard: {
      type: String,
      trim: true,
      match: [/^[0-9]{12}$/, "Aadhaar card must be exactly 12 digits"],
      default: null,
      sparse: true,
    },

    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
      default: null,
    },

    disabled: {
      type: Boolean,
      default: false,
      index: true,
    },

    // -------------------------
    // EXTRA STUDENT FIELDS
    // -------------------------

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetOtp: Number,
    resetOtpExpires: Date,

    firstLogin: {
      type: Boolean,
      default: true,
    },
    //     status: {
    //   type: String,
    //   enum: ["pending", "approved", "rejected","downloaded","in_review"],   // ❌ "in_review" missing
    //   default: "pending"
    // },

    otp: {
      type: String,
      select: false,
    },

    otpExpiry: {
      type: Date,
      select: false,
    },
    documents: {
    aadhaarFront: { type: String },
    aadhaarBack: { type: String },
    panCard: { type: String },
    bankPassbook: { type: String },
  },
  
  // Document verification (overall)
  documentsVerified: { 
    type: Boolean, 
    default: false 
  },
  documentsVerifiedAt: { 
    type: Date 
  },
  documentsVerifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  documentsUploadedAt: { 
    type: Date 
  },

  // ✅ NEW: Individual document status
  documentStatus: {
    aadhaarFront: {
      status: { 
        type: String, 
        enum: ["pending", "approved", "rejected"], 
        default: "pending" 
      },
      rejectionReason: String,
      updatedAt: Date,
      updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
    },
    aadhaarBack: {
      status: { 
        type: String, 
        enum: ["pending", "approved", "rejected"], 
        default: "pending" 
      },
      rejectionReason: String,
      updatedAt: Date,
      updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
    },
    panCard: {
      status: { 
        type: String, 
        enum: ["pending", "approved", "rejected"], 
        default: "pending" 
      },
      rejectionReason: String,
      updatedAt: Date,
      updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
    },
    bankPassbook: {
      status: { 
        type: String, 
        enum: ["pending", "approved", "rejected"], 
        default: "pending" 
      },
      rejectionReason: String,
      updatedAt: Date,
      updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
    },
  },

  },
  {
    timestamps: true,
  }
);



// -------------------------
// VIRTUALS (EXACT SAME)
// -------------------------

studentSchema.virtual("phoneWithoutCode").get(function () {
  if (this.phone && this.phone.startsWith("91")) {
    return this.phone.substring(2);
  }
  return this.phone;
});

studentSchema.virtual("formattedPhone").get(function () {
  if (this.phone && this.phone.startsWith("91")) {
    return `+91 ${this.phone.substring(2)}`;
  }
  return this.phone;
});

studentSchema.virtual("formattedParentPhone1").get(function () {
  if (this.parentPhone1 && this.parentPhone1.startsWith("91")) {
    return `+91 ${this.parentPhone1.substring(2)}`;
  }
  return this.parentPhone1;
});

studentSchema.virtual("formattedParentPhone2").get(function () {
  if (this.parentPhone2 && this.parentPhone2.startsWith("91")) {
    return `+91 ${this.parentPhone2.substring(2)}`;
  }
  return this.parentPhone2;
});

studentSchema.virtual("statusDisplay").get(function () {
  return this.disabled ? "Disabled" : "Active";
});


// -------------------------
// INDEXES (EXACT SAME)
// -------------------------
studentSchema.index({ category: 1, createdAt: -1 });
studentSchema.index({ category: 1, batch: 1 });
studentSchema.index({ category: 1, disabled: 1 });
studentSchema.index({ batch: 1, disabled: 1 });


// -------------------------
// PASSWORD HASHING
// -------------------------

studentSchema.pre("save", async function (next) {
  // if (!this.password) {
  //   const randomPass = Math.random().toString(36).slice(-8);
  //   this.autoGeneratedPassword = randomPass;
  //   this.password = randomPass;
  // }

  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

studentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// -------------------------
// PRE-SAVE HOOK (SAME AS PEOPLE)
// -------------------------

studentSchema.pre("save", function (next) {
  if (["fsd", "bvoc"].includes(this.category) && !this.batch) {
    return next(new Error(`Batch is required for ${this.category} category`));
  }

  if (!["fsd", "bvoc"].includes(this.category)) {
    this.batch = "";
  }

  if (this.aadhaarCard && !/^[0-9]{12}$/.test(this.aadhaarCard)) {
    return next(new Error("Aadhaar card must be exactly 12 digits"));
  }

  if (this.address && this.address.length > 200) {
    return next(new Error("Address cannot exceed 200 characters"));
  }

  next();
});


// -------------------------
// POST-SAVE HOOK (SAME)
// -------------------------

studentSchema.post("save", function (doc) {
  // console.log(
  //   `✔️ [STUDENT SAVED] ${doc.name} → ${doc.disabled ? "DISABLED" : "ACTIVE"}`
  // );
});


// -------------------------
// PRE-UPDATE HOOK (SAME)
// -------------------------

studentSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.category && ["fsd", "bvoc"].includes(update.category)) {
    if (!update.batch) {
      return next(new Error(`Batch is required for ${update.category} category`));
    }
  }

  if (update.aadhaarCard && !/^[0-9]{12}$/.test(update.aadhaarCard)) {
    return next(new Error("Aadhaar card must be exactly 12 digits"));
  }

  if (update.address && update.address.length > 200) {
    return next(new Error("Address cannot exceed 200 characters"));
  }

  next();
});


// -------------------------
// STATIC METHODS (ALL SAME)
// -------------------------

studentSchema.statics.findByCategory = function (category) {
  return this.find({ category }).sort({ createdAt: -1 });
};

studentSchema.statics.findByCategoryAndBatch = function (category, batch) {
  return this.find({ category, batch }).sort({ createdAt: -1 });
};

studentSchema.statics.findEnabled = function (filter = {}) {
  return this.find({ ...filter, disabled: false }).sort({ createdAt: -1 });
};

studentSchema.statics.findDisabled = function (filter = {}) {
  return this.find({ ...filter, disabled: true }).sort({ createdAt: -1 });
};

studentSchema.statics.countEnabled = function (filter = {}) {
  return this.countDocuments({ ...filter, disabled: false });
};

studentSchema.statics.countDisabled = function (filter = {}) {
  return this.countDocuments({ ...filter, disabled: true });
};

studentSchema.statics.getCategoryStats = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

studentSchema.statics.getBatchStats = async function () {
  return await this.aggregate([
    {
      $match: {
        category: { $in: ["fsd", "bvoc"] },
        batch: { $exists: true, $ne: "" },
      },
    },
    {
      $group: {
        _id: { category: "$category", batch: "$batch" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.category": 1, "_id.batch": 1 } },
  ]);
};


// -------------------------
// INSTANCE METHODS (SAME AS PEOPLE)
// -------------------------

studentSchema.methods.requiresBatch = function () {
  return ["fsd", "bvoc"].includes(this.category);
};

studentSchema.methods.isActive = function () {
  return !this.disabled;
};

studentSchema.methods.toggleDisabled = async function () {
  this.disabled = !this.disabled;
  await this.save();
  return this;
};

studentSchema.methods.enable = async function () {
  this.disabled = false;
  await this.save();
  return this;
};

studentSchema.methods.disable = async function () {
  this.disabled = true;
  await this.save();
  return this;
};

studentSchema.methods.getFullDetails = function () {
  return {
    name: this.name,
    category: this.category,
    batch: this.batch || "N/A",
    phone: this.formattedPhone,
    phoneRaw: this.phone,
    parentPhone1: this.formattedParentPhone1,
    parentPhone2: this.formattedParentPhone2,
    aadhaarCard: this.aadhaarCard || "Not provided",
    address: this.address || "Not provided",
    disabled: this.disabled,
    status: this.statusDisplay,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
