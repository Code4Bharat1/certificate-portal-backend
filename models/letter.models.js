import mongoose from "mongoose";

const letterSchema = new mongoose.Schema(
  {
    letterId: {
      type: String,
      required: true,
      unique: true
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

    course: {
      type: String,
      required: true,
      enum: [
        "Appreciation Letter",
        "Experience Certificate",
        "Internship Joining Letter",
        "Memo",
        "Non-Disclosure Agreement",
        "Offer Letter",
        "Warning Letter",
        "Live Project Agreement",
        "Community Letter"
      ],
    },

    /* ✅ NEW FIELDS TO SUPPORT FRONTEND */

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

    issueDate: {
      type: Date,
      required: true,
    },

    /* ✅ NEW FIELDS REQUESTED */
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

export default mongoose.model("Letter", letterSchema);
