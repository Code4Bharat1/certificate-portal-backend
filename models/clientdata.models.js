import mongoose from "mongoose";

const clientLetterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["Client"], // expandable later
    },

    issueDate: {
      type: Date,
      required: true,
    },

    letterType: {
      type: String,
      required: true,
      enum: [
        "Agenda",
        "MOM (Minutes of Meeting)",
        "Project Progress",
      ],
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
      trim: true, // keeps formatting clean
    },

    // Optional but useful: Link to stored/generated PDF
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
  },
  {
    timestamps: true, // createdAt & updatedAt auto-managed
  }
);

const ClientLetter = mongoose.model("ClientLetter", clientLetterSchema);

export default ClientLetter;
