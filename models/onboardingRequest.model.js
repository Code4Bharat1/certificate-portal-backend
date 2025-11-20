import mongoose from "mongoose";

const OnboardingRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  signature: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("OnboardingRequest", OnboardingRequestSchema);
