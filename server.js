// ===============================
// Server Setup with MongoDB (Pure ES6)
// ===============================

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Existing Routes
import authRoutes from './routes/auth.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import statsRoutes from './routes/stats.routes.js';
import templateRoutes from './routes/template.routes.js';
import profileRoutes from './routes/profile.routes.js';
import peopleRoutes from './routes/people.routes.js';
import batchRoutes from './routes/batch.routes.js';
import letterRoutes from "./routes/letter.routes.js";
import userAuthRoutes from "./routes/auth.routes.firstlogin.js";

// New Student Routes
import studentRoutes from './routes/student.routes.js';

// Load environment variables
dotenv.config();

// ES6 equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5235;

// ===============================
// ✅ MongoDB Connection
// ===============================
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas');
      console.log(`📊 Database: ${mongoose.connection.name}`);
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    });
} else {
  console.log('⚠️  Running without MongoDB - using in-memory storage');
}

// ===============================
// ✅ CORS Setup
// ===============================
const allowedOrigins = [
  'https://education.code4bharat.com',
  'https://www.education.code4bharat.com',
  'https://education.marketiqjunction.com',
  'https://www.education.marketiqjunction.com',
  'https://certificate.nexcorealliance.com',
  'https://www.certificate.nexcorealliance.com',
  'https://portal.nexcorealliance.com',
  'https://www.portal.nexcorealliance.com',
  'http://localhost:3000', // certificate
  'http://localhost:3010', // c4b
  'http://localhost:3001'  // mj
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ===============================
// ✅ Middleware
// ===============================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Optional Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ===============================
// ✅ Static Files
// ===============================
app.use('/templates', express.static(path.join(__dirname, 'templates')));
app.use('/uploads-data', express.static(path.join(__dirname, 'uploads-data')));

// ===============================
// ✅ CREATE UPLOAD DIRECTORIES
// ===============================
const uploadDirs = [
  'uploads-data/certificates',
  'uploads-data/letters',
  'uploads-data/signed-letters',
  'uploads-data/profiles'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// ===============================
// ✅ API Routes
// ===============================

// Authentication Routes (Admin + Student Login)
app.use('/api/auth', authRoutes);

// Admin Routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', templateRoutes);
app.use('/api/admin', profileRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/batches', batchRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/auth/user", userAuthRoutes); // For student auth


// Student Routes (NEW)
app.use('/api', studentRoutes);

// ===============================
// ✅ Health Check & Root
// ===============================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Certificate & Letter Management Portal API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      docs: '/api/docs',
      templates: '/api/templates',
      certificates: '/api/certificates',
      letters: '/api/letters',
      student: '/api/student',
      admin: '/api/admin'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ===============================
// ✅ API DOCUMENTATION
// ===============================
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Documentation',
    version: '2.0.0',
    endpoints: {
      authentication: {
        adminLogin: 'POST /api/auth/login',
        studentLogin: 'POST /api/auth/user-login',
        studentRegister: 'POST /api/auth/user-register',
        verifyAdmin: 'GET /api/auth/verify-admin',
        verifyStudent: 'GET /api/auth/verify-user'
      },
      admin: {
        certificates: 'GET/POST /api/certificates',
        letters: 'GET/POST /api/letters',
        stats: 'GET /api/stats',
        templates: 'GET/POST /api/templates',
        profile: 'GET/PUT /api/admin/profile',
        people: 'GET/POST /api/people',
        batches: 'GET/POST /api/batches'
      },
      student: {
        profile: {
          get: 'GET /api/student/profile',
          update: 'PUT /api/student/profile',
          updateImage: 'PATCH /api/student/profile/image'
        },
        dashboard: {
          statistics: 'GET /api/student/statistics',
          recentLetters: 'GET /api/student/letters/recent',
          allLetters: 'GET /api/student/letters',
          letterDetails: 'GET /api/student/letters/:id'
        },
        letters: {
          uploadSigned: 'POST /api/student/upload-signed',
          downloadAll: 'GET /api/student/download-all',
          downloadOne: 'GET /api/student/letters/:id/download'
        },
        support: {
          notifications: 'GET /api/student/notifications',
          createTicket: 'POST /api/student/support/ticket',
          getTickets: 'GET /api/student/support/tickets'
        }
      }
    }
  });
});

// ===============================
// ✅ 404 Handler
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// ===============================
// ✅ Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  // Multer error handling
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'File is too large. Max size 50MB.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field'
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || 'File upload error',
      error: err.message
    });
  }

  // MongoDB error handling
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map((e) => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // JWT error handling
  if (['JsonWebTokenError', 'TokenExpiredError'].includes(err.name)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: err.message
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===============================
// ✅ Start Server
// ===============================
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Certificate & Letter Management Portal - Server Started!');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📁 Templates: ${path.join(__dirname, 'templates')}`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'MongoDB Connected' : 'In-Memory'}`);
  console.log('='.repeat(60));
  console.log('\n🔐 Authentication Endpoints:');
  console.log(`   👨‍💼 Admin Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   👨‍🎓 Student Login: POST http://localhost:${PORT}/api/auth/user-login`);
  console.log(`   📝 Student Register: POST http://localhost:${PORT}/api/auth/user-register`);
  console.log('\n📊 Student Dashboard:');
  console.log(`   👤 Profile: GET http://localhost:${PORT}/api/student/profile`);
  console.log(`   📈 Statistics: GET http://localhost:${PORT}/api/student/statistics`);
  console.log(`   📄 Letters: GET http://localhost:${PORT}/api/student/letters`);
  console.log(`   ⬆️  Upload Signed: POST http://localhost:${PORT}/api/student/upload-signed`);
  console.log(`   ⬇️  Download All: GET http://localhost:${PORT}/api/student/download-all`);
  console.log('='.repeat(60) + '\n');
});

// ===============================
// ✅ Graceful Shutdown
// ===============================
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server`);

  server.close(async () => {
    console.log('✅ HTTP server closed');
    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
      }
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;