import mongoose from "mongoose";

const letterSchema = new mongoose.Schema(
  {
    letterId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["code4bharat", "marketing-junction", "FSD", "HR", "BVOC"],
    },

    batch: {
      type: String,
      default: "",
    },

    letterType: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    role: {
      type: String,
      trim: true,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    duration: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    committeeType: {
      type: String,
      enum: ["Technical", "Sports", "Cultural", ""],
      default: "",
    },

    attendancePercent: {
      type: Number,
      min: 0,
      max: 99,
    },

    subjectName: {
      type: String,
      maxlength: 10,
    },

    projectName: {
      type: String,
      maxlength: 15,
    },

    misconductReason: {
      type: String,
      maxlength: 50,
    },

    attendanceMonth: {
      type: String,
      maxlength: 15,
    },

    attendanceYear: {
      type: String,
      maxlength: 4,
    },

    performanceMonth: {
      type: String,
      maxlength: 15,
    },

    performanceYear: {
      type: String,
      maxlength: 4,
    },

    testingPhase: {
      type: String,
      maxlength: 15,
    },

    uncover: {
      type: String,
      maxlength: 15,
    },

    auditDate: {
      type: Date,
      required: false,
    },

    issueDate: {
      type: Date,
      required: true,
    },

    outwardNo: {
      type: String,
      required: true,
      unique: true,
    },

    outwardSerial: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "downloaded"],
      default: "pending",
    },

    downloadCount: {
      type: Number,
      default: 0,
    },

    lastDownloaded: {
      type: Date,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    previewUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Auto generate outward number & serial
// letterSchema.pre("validate", async function (next) {
//   if (this.isNew) {
//     const year = new Date().getFullYear();
//     const prefix = "C4B"; // can be dynamic if needed per category

//     // Find last letter to increment outwardSerial
//     const last = await mongoose.model("Letter").findOne().sort({ outwardSerial: -1 });

//     const nextSerial = last ? last.outwardSerial + 1 : 1;
//     this.outwardSerial = nextSerial;

//     // Generate outwardNo: C4B-001-YYYY format
//     this.outwardNo = `${prefix}-${String(nextSerial).padStart(3, "0")}-${year}`;

//     // Generate unique letterId if missing
//     if (!this.letterId) {
//       this.letterId = `${this.category}-${Date.now()}`;
//     }
//   }
//   next();
// });

export default mongoose.model("Letter", letterSchema);
