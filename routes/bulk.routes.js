import express from 'express';
import multer from 'multer';
import bulkControllers from '../controllers/bulk.controllers.js';


const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// ============ BULK CREATE CERTIFICATES ============
router.post('/create', upload.single('csvFile'), bulkControllers.bulkCreateCertificate)

// ============ BULK DELETE CERTIFICATES ============
router.delete('/delete', bulkControllers.bulkDeleteCertificate)

// ============ BULK DOWNLOAD PDFs ============
router.post('/download-pdf', bulkControllers.bulkDownloadPdfs)

// ============ BULK DOWNLOAD JPGs ============
router.post('/download-jpg', bulkControllers.bulkDownloadJpgs)

// ============ LIST CERTIFICATES ============
router.get('/list-certificates', bulkControllers.listCertificates)

export default router;
