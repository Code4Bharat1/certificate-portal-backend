import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateId: {
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
    enum: ["FSD", "BVOC", "BOOTCAMP", "HR", "marketing-junction", "IT-Nexcore"],
  },
  batch: {
    type: String,
    trim: true,
  },
  course: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    // ✅ Only required if the course is "Certificate of Appreciation"
    required: function () {
      return this.course === "Certificate of Appreciation";
    },
  },
  issueDate: {
    type: Date,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
certificateSchema.index({ category: 1, batch: 1 });
certificateSchema.index({ category: 1, course: 1 });

// Update timestamps
certificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Certificate', certificateSchema);
