  import express from 'express';
  import { body, validationResult } from 'express-validator';
  import { authenticate } from '../middleware/auth.middleware.js';
  import certificateControllers from '../controllers/certificate.controllers.js';
  // import Certificate from '../models/certificate.models.js';
  // import ActivityLog from '../models/activitylog.models.js';
  // import PDFDocument from 'pdfkit';
  // import { createCanvas } from 'canvas';
  // import fs from 'fs';
  // import path from 'path';

  const router = express.Router();

  // Get all certificates
  router.get('/', authenticate, certificateControllers.getAllCertificate)

  // Get certificate by ID
  router.get('/:id', authenticate, certificateControllers.getCertificateById)

  // Create certificate
  router.post('/', [
    authenticate,
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').isIn(['marketing-junction', 'code4bharat']).withMessage('Invalid category'),
    body('issueDate').isISO8601().withMessage('Valid date is required')
  ], certificateControllers.createCertificate)
  // isISO8601() : (e.g. YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss.sssZ)

  // Verify certificate
  router.post('/verify', certificateControllers.verifyCertificate)

  // Update download status
  router.patch('/:id/download', authenticate, certificateControllers.updateDownloadStatus)

  // Delete certificate
  router.delete('/:id', authenticate, certificateControllers.deleteCertificate)

  // Download Certificate as PDF
  router.get('/:id/download/pdf', certificateControllers.downloadCertificateAsPdf)

  // Download Certificate as JPG
  router.get('/:id/download/jpg', certificateControllers.downloadCertificateAsJpg)

  // Get courses by category
  router.get('/courses/:category', authenticate, certificateControllers.getCoursesByCategory);

  // Certificate Preview
  router.post('/preview', authenticate, certificateControllers.generateCertificatePreview);

  export default router;
