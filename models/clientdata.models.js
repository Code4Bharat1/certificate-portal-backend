import mongoose from "mongoose";

const clientLetterSchema = new mongoose.Schema(
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
      default: "client",
    },

    issueDate: {
      type: Date,
      required: true,
    },

    letterType: {
      type: String,
      required: true,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },

    description: {
      type: String,
      required: true,
      trim: true,
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

    pdfUrl: {
      type: String,
      default: null,
    },

    // ✅ ONLY CHANGE: Changed default from "Generated" to "pending"
    // This matches what Certificate and Letter models use
    status: {
      type: String,
      default: "pending", // Changed from "Generated"
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
    },

    whatsappSent: {
      type: Boolean,
      default: false,
    },

    whatsappSentAt: {
      type: Date,
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
  },
  {
    timestamps: true,
  },
);

const ClientLetter = mongoose.model("ClientLetter", clientLetterSchema);

export default ClientLetter;
