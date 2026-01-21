// ===============================
// Server Setup with MongoDB (Pure ES6)
// ===============================

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import rateLimit from "express-rate-limit";

dotenv.config();

// -------------------- PATH FIX --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5235;

// ===============================
// RATE LIMITERS
// ===============================

// 🌍 Global limiter (very light)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔐 Auth limiter (VERY STRICT)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 👤 User API limiter
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛡️ Admin API limiter
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "Admin rate limit exceeded. Please wait.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});




app.set("trust proxy", 1); // Railway / Nginx
app.use(globalLimiter);

// ===============================
// CORS
// ===============================
const allowedOrigins = [
  "https://education.code4bharat.com",
  "https://www.education.code4bharat.com",
  "https://education.marketiqjunction.com",
  "https://www.education.marketiqjunction.com",
  "https://certificate.nexcorealliance.com",
  "https://www.certificate.nexcorealliance.com",
  "https://portal.nexcorealliance.com",
  "https://www.portal.nexcorealliance.com",
  "http://localhost:3000", // certificate
  "http://localhost:3010", // c4b
  "http://localhost:3001", // mj
];

app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS")),
    credentials: true,
  })
);



app.use((req, res, next) => {
  // HTTPS only
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // No MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Referrer protection
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // ✅ FIXED CSP - Allow iframe for document preview
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' https:; connect-src 'self' https:; object-src 'self'; frame-src 'self'; frame-ancestors 'none';"
  );
  // Disable browser features
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );

  // Legacy XSS block
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Cache-Control
  if (req.url.startsWith("/templates") || req.url.startsWith("/uploads-data")) {
    res.setHeader("Cache-Control", "public, max-age=31536000");
  } else {
    res.setHeader("Cache-Control", "no-store");
  }

  // Cross-origin protections (PDF friendly)
  if (
    req.url.startsWith("/api/documents/students/") &&
    req.url.includes("/view")
  ) {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  } else {
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  }
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  next();
});

// ===============================
// Middleware
// ===============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logger (dev only or API routes only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const safeUrl = req.originalUrl.split("?")[0]; // Remove query params
    console.log(`${new Date().toISOString()} - ${req.method} ${safeUrl}`);
    next();
  });
}

// ===============================
// Static Files
// ===============================
app.use("/templates", express.static(path.join(__dirname, "templates")));
app.use("/uploads-data", express.static(path.join(__dirname, "uploads-data")));

// Auto-create upload folders
function ensureDirs() {
  const dirs = [
    "uploads-data/certificates",
    "uploads-data/letters",
    "uploads-data/signed-letters",
    "uploads-data/profiles",
    "uploads-data/student-documents",
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}
ensureDirs();

// ===============================
// ROUTES — FIXED & CLEANED
// ===============================

// Auth (Admin + Student)
import authRoutes from "./routes/auth.routes.js";
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/auth/user", authLimiter,  authRoutes);

// Admin System (MongoDB Based)
import adminRoutes from "./routes/admin.routes.js";
app.use("/api/admin", adminLimiter,  adminRoutes);

import adminDocumentRoutes from "./routes/admin.document.routes.js";
app.use("/api/documents", adminLimiter, adminDocumentRoutes);

// Misc Admin Routes
import certificateRoutes from "./routes/certificate.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import templateRoutes from "./routes/template.routes.js";
import peopleRoutes from "./routes/people.routes.js";
import batchRoutes from "./routes/batch.routes.js";
// import letterRoutes from "./routes/letter.routes.js";
import onboardingRoutes from "./routes/onboardingRequest.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import clientRoutes from "./routes/client.routes.js";
import codeLetterRoutes from "./routes/codeletter.routes.js";

// Attach Routes
app.use("/api/certificates", adminLimiter, certificateRoutes);
app.use("/api/stats", adminLimiter, statsRoutes);
app.use("/api/templates", adminLimiter, templateRoutes);
app.use("/api/people", adminLimiter, peopleRoutes);
app.use("/api/batches", adminLimiter, batchRoutes);
// app.use("/api/letters", letterRoutes);
app.use("/api/categories", adminLimiter, categoryRoutes);
app.use("/api/onboarding-request", adminLimiter, onboardingRoutes);
app.use("/api/clientletters", adminLimiter, clientRoutes);
app.use("/api/codeletters", adminLimiter, codeLetterRoutes);

// Student
import studentRoutes from "./routes/users.routes.js";
app.use("/api/student", userLimiter, studentRoutes);

// ===============================
// Health Check
// ===============================
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ===============================
// Debug: Log all registered routes (FIXED)
// ===============================
if (process.env.NODE_ENV !== "production" && app._router) {
  console.log("\n📋 Registered Routes:");
  app._router.stack.forEach(function (r) {
    if (r.route && r.route.path) {
      console.log(
        `  ${Object.keys(r.route.methods).join(", ").toUpperCase()} ${
          r.route.path
        }`
      );
    }
  });
  console.log("\n");
}

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: "Route not found", url: req.url });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
  });

  // Multer errors (file upload issues)
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Custom status codes (from controllers)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Default 500
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ===============================
// MongoDB Connection & Server Start
// ===============================
import connectDb from "./config/db.config.js";

const startServer = async () => {
  try {
    // ✅ Wait for MongoDB connection first
    await connectDb();
    console.log("✅ MongoDB connected successfully");

    // ✅ Create default admin AFTER connection is established
    await createDefaultAdmin();

    // ✅ Start server only after DB is ready
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};



// ===============================
// Default Admin Creation
// ===============================
const createDefaultAdmin = async () => {
  try {
    const Admin = (await import("./models/admin.models.js")).default;

    const adminCount = await Admin.countDocuments();

    if (adminCount === 0) {
      const defaultAdmin = new Admin({
        username: "admin",
        password: "admin123", // ⚠️ Change this in production!
        permissions: ["admin_management"],
      });

      await defaultAdmin.save();
      console.log(
        "✅ Default admin created (username: admin, password: admin123)"
      );
      console.log("⚠️  IMPORTANT: Change default password immediately!");
    } else {
      console.log(`ℹ️  ${adminCount} admin user(s) already exist`);
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
    // Don't exit - server can still run without default admin
  }
};

// ===============================
// Graceful Shutdown
// ===============================
process.on("SIGTERM", async () => {
  console.log("👋 SIGTERM received, closing server gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("👋 SIGINT received, closing server gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

// ✅ Start the application
startServer();

export default app;
