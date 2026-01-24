  //activitylog.models.js
  import mongoose from "mongoose";

  const activityLogSchema = new mongoose.Schema({
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "verified",
        "downloaded",
        "deleted",
        "updated",
        "bulk_created",
        "bulk_downloaded",
      ],
    },
    certificateId: {
      type: String,
    },
    userName: {
      type: String,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    count: {
      type: Number,
      default: 1,
    },
    category: {
      type: String,
      enum: [
        "internship",
        "fsd",
        "bvoc",
        "bootcamp",
        "marketing-junction",
        "it-nexcore",
        "client",
        "hr",
        "dm",
        "operations",
      ], // ✅ Added client and other categories
    },
    details: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  });

  // Index for faster queries
  activityLogSchema.index({ timestamp: -1 });
  activityLogSchema.index({ action: 1 });
  activityLogSchema.index({ adminId: 1 });

  // Static method to log activity
  activityLogSchema.statics.logActivity = async function ({
    action,
    certificateId,
    userName,
    adminId,
    count = 1,
    category,
    details,
  }) {
    try {
      await this.create({
        action,
        certificateId,
        userName,
        adminId,
        count,
        category,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Static method to log bulk activity
  activityLogSchema.statics.logBulkActivity = async function ({
    action,
    adminId,
    count,
    category,
    details,
  }) {
    try {
      await this.create({
        action,
        adminId,
        count,
        category,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error logging bulk activity:", error);
    }
  };

  export default mongoose.model("ActivityLog", activityLogSchema);
