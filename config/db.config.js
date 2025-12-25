import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const URI = process.env.MONGODB_URI;

const connectDb = async () => {
  if (!URI) {
    console.error("❌ MONGODB_URI is not defined in .env file");
    process.exit(1);
  }

  // Prevent multiple connections
  if (mongoose.connection.readyState >= 1) {
    console.log("ℹ️  MongoDB already connected");
    return mongoose.connection; // ✅ Return existing connection
  }

  try {
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 10000, // ✅ Added timeout
      socketTimeoutMS: 45000, // ✅ Added socket timeout
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ MongoDB connected successfully");
      console.log(`📊 Database: ${mongoose.connection.name}`);
    }

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });

    return mongoose.connection; // ✅ Return the connection
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("🔍 Check your MONGODB_URI in .env file");
    console.error(
      "🔍 Ensure MongoDB is running (if local) or accessible (if remote)"
    );
    throw error; // ✅ Throw error instead of process.exit (let server.js handle it)
  }
};

export default connectDb;
