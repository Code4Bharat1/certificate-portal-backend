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

dotenv.config();

// -------------------- PATH FIX --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5235;

// ===============================
// MongoDB Connection
// ===============================
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
      console.error('❌ MongoDB error:', err.message);
      process.exit(1);
    });
} else {
  console.log('⚠️ Running without MongoDB - using memory storage');
}

// ===============================
// CORS
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
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS')),
    credentials: true
  })
);

// ===============================
// Middleware
// ===============================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ===============================
// Static Files
// ===============================
app.use('/templates', express.static(path.join(__dirname, 'templates')));
app.use('/uploads-data', express.static(path.join(__dirname, 'uploads-data')));

// Auto-create upload folders
[
  'uploads-data/certificates',
  'uploads-data/letters',
  'uploads-data/signed-letters',
  'uploads-data/profiles',
  'uploads-data/student-documents'
].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ===============================
// ROUTES — FIXED & CLEANED
// ===============================

// Auth (Admin + Student)
import authRoutes from './routes/auth.routes.js';
app.use('/api/auth', authRoutes);

// Admin System (MongoDB Based)
import adminRoutes from './routes/admin.routes.js';
app.use('/api/admin', adminRoutes);

// Admin Document Management
import adminDocumentRoutes from './routes/admin.document.routes.js';
app.use('/api/documents', adminDocumentRoutes);

// Misc Admin Routes
import certificateRoutes from './routes/certificate.routes.js';
import statsRoutes from './routes/stats.routes.js';
import templateRoutes from './routes/template.routes.js';
import peopleRoutes from './routes/people.routes.js';
import batchRoutes from './routes/batch.routes.js';
import letterRoutes from './routes/letter.routes.js';
import userAuthRoutes from './routes/auth.routes.firstlogin.js';
import onboardingRoutes from './routes/onboardingRequest.routes.js';
import categoryRoutes from './routes/category.routes.js';
import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js'


// Attach Routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth/user', userAuthRoutes);
app.use('/api/onboarding-request', onboardingRoutes);
app.use('/api/client', clientRoutes);


// Student
import studentRoutes from './routes/student.routes.js';
app.use('/api/student', studentRoutes);

// ===============================
// Health Check
// ===============================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', url: req.url });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
