import mongoose from "mongoose";

const clientLetterSchema = new mongoose.Schema(
  {
    letterId: {
      type: String,
      required: true,
      unique: true,
      // Format: CLA-YYYY-MM-DD-XX, CLM-YYYY-MM-DD-XX, or CLP-YYYY-MM-DD-XX
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["Client"],
      default: "Client",
    },

    issueDate: {
      type: Date,
      required: true,
    },

    letterType: {
      type: String,
      required: true,
      enum: ["Agenda", "MOM (Minutes of Meeting)", "Project Progress"],
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
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Outward number tracking (same as letter system)
    outwardNo: {
      type: String,
      required: true,
      unique: true,
      // Format: NEX/YYYY/MM/DD/SerialNumber
    },

    outwardSerial: {
      type: Number,
      required: true,
      // Continuous serial number across all client letters
    },

    // Optional: Link to stored/generated PDF
    pdfUrl: {
      type: String,
      default: null,
    },

    // Status tracking for admin dashboard
    status: {
      type: String,
      enum: ["Generated", "Pending Approval", "Sent to Client"],
      default: "Generated",
    },

    // Email & WhatsApp tracking
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

    // Download tracking (optional, similar to letter system)
    downloadCount: {
      type: Number,
      default: 0,
    },

    lastDownloaded: {
      type: Date,
    },

    // Created by user reference (optional)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // createdAt & updatedAt auto-managed
  }
);

const ClientLetter = mongoose.model("ClientLetter", clientLetterSchema);

export default ClientLetter;
