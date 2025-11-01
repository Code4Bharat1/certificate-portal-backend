import mongoose from "mongoose";

const letterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["code4bharat", "marketing-junction", "FSD", "HR"],
    },
    batch: {
      type: String,
      default: "",
    },
    course: {
      type: String,
      required: true,
      enum: ["Appreciation Letter", "Experience Certificate"],
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            