// ===============================
// Server Setup with MongoDB (Pure ES6)
// ===============================

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import statsRoutes from './routes/stats.routes.js';
import bulkRoutes from './routes/bulk.routes.js';
import templateRoutes from './routes/template.routes.js';
import profileRoutes from './routes/profile.routes.js';
import peopleRoutes from './routes/people.routes.js';
import batchRoutes from './routes/batch.routes.js';

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
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
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

// ===============================
// ✅ API Routes
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/stats', statsRoutes);
// app.use('/api/certificates/bulk', bulkRoutes);
app.use('/api', templateRoutes);
app.use('/api/admin', profileRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/batches', batchRoutes);
// ===============================
// ✅ Health Check & Root
// ===============================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Template Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      templates: '/api/templates',
      upload: '/api/templates/upload',
      stats: '/api/templates/stats/summary'
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
    environment: process.env.NODE_ENV || 'development'
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

  if (['JsonWebTokenError', 'TokenExpiredError'].includes(err.name)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: err.message
    });
  }

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
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Server Started Successfully!');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`📁 Templates Directory: ${path.join(__dirname, 'templates')}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'MongoDB Connected' : 'In-Memory'}`);
  console.log('='.repeat(50) + '\n');
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
