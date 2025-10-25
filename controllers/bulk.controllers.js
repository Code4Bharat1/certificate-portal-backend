import PDFDocument from 'pdfkit';
import { createCanvas, loadImage } from 'canvas';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import Certificate from '../models/certificate.models.js';
import ActivityLog from '../models/activitylog.models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to generate unique certificate ID with UUID
async function generateUniqueCertificateId(category) {
  const prefix = category === 'marketing-junction' ? 'MJ' : 'C4B';
  let certificateId;
  let exists = true;

  while (exists) {
    // Generate a short UUID (first 8 characters)
    const shortUuid = uuidv4().split('-')[0].toUpperCase();
    certificateId = `${prefix}-${shortUuid}`;
    
    // Check if this ID already exists
    const existingCert = await Certificate.findOne({ certificateId });
    exists = !!existingCert;
  }

  return certificateId;
}

// Map courses to template filenames
function getCourseTemplateFilename(course, category) {
  const templateMap = {
    'code4bharat': {
      'Full Stack Certificate (MERN Stack)': 'c4b-fullstack-mern.jpg',
      'JavaScript Developer Certificate': 'c4b-javascript.jpg',
      'Advanced React Developer Certificate': 'c4b-react.jpg',
      'Node.js and Express.js Specialist Certificate': 'c4b-nodejs.jpg',
      'MongoDB Professional Certificate': 'c4b-mongodb.jpg',
      'Git & Version Control Expert Certificate': 'c4b-git.jpg',
      'Frontend Development Pro Certificate': 'c4b-frontend.jpg',
      'Backend Development Specialist Certificate': 'c4b-backend.jpg',
      'Web Development Project Certificate': 'c4b-webdev-project.jpg',
      'Advanced Web Development Capstone Certificate': 'c4b-capstone.jpg'
    },
    'marketing-junction': {
      'Digital Marketing Specialist Certificate': 'mj-digital-marketing.jpg',
      'Advanced SEO Specialist Certificate': 'mj-seo.jpg',
      'Social Media Marketing Expert Certificate': 'mj-social-media.jpg',
      'Full Stack Digital Marketer Certificate': 'mj-fullstack-marketer.jpg',
      'AI-Powered Digital Marketing Specialist Certificate': 'mj-ai-marketing.jpg',
      'Videography Course': 'mj-videography.jpg'
    }
  };

  return templateMap[category]?.[course] || `${category}-default.png`;
}

// Utility function to adjust font size based on text length
function getAdjustedFontSize(ctx, text, maxWidth, baseFontSize) {
  let fontSize = baseFontSize;
  ctx.font = `bold ${fontSize}px Arial`;

  while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial`;
  }

  return fontSize;
}

// ============ BULK CREATE CERTIFICATES ============
const bulkCreateCertificate = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category || !['code4bharat', 'marketing-junction'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Valid category is required (code4bharat or marketing-junction)'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    // Parse CSV file (format: name,course,issueDate)
    const csvData = await fs.readFile(req.file.path, 'utf-8');
    const lines = csvData.split('\n').slice(1); // Skip header

    const createdCertificates = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const [name, course, issueDate] = line.split(',').map(s => s.trim());

        if (!name || !course) {
          errors.push({
            line: i + 2,
            error: 'Missing name or course'
          });
          continue;
        }

        // Generate unique certificate ID
        const certificateId = await generateUniqueCertificateId(category);

        const certificate = new Certificate({
          certificateId,
          name,
          course,
          category,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          createdBy: req.user._id
        });

        await certificate.save();
        createdCertificates.push(certificate);

        // Log activity
        await ActivityLog.create({
          action: 'create',
          certificateId: certificate.certificateId,
          userName: name,
          adminId: req.user._id,
          details: `Bulk certificate created for ${name} - ${course}`
        });
      } catch (error) {
        errors.push({
          line: i + 2,
          error: error.message
        });
      }
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      count: createdCertificates.length,
      certificates: createdCertificates,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============ BULK DELETE CERTIFICATES ============
const bulkDeleteCertificate = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'certificateIds array is required'
      });
    }

    const deletedIds = [];
    const notFoundIds = [];

    for (const id of certificateIds) {
      const certificate = await Certificate.findById(id);

      if (certificate) {
        // Log deletion
        await ActivityLog.create({
          action: 'delete',
          certificateId: certificate.certificateId,
          userName: certificate.name,
          adminId: req.user._id,
          details: `Bulk certificate deleted for ${certificate.name}`
        });

        await Certificate.findByIdAndDelete(id);
        deletedIds.push(id);
      } else {
        notFoundIds.push(id);
      }
    }

    res.json({
      success: true,
      deleted: deletedIds.length,
      deletedIds,
      notFoundIds
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============ GENERATE CERTIFICATE IMAGE ============
async function generateCertificateImage(certificate) {
  const templateFilename = getCourseTemplateFilename(certificate.course, certificate.category);
  const templatePath = path.join(__dirname, '../templates', templateFilename);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const templateImage = await loadImage(templatePath);
  const width = templateImage.width;
  const height = templateImage.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(templateImage, 0, 0);

  const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const id = certificate.certificateId.split("-")[0];

  if (id === "C4B") {
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameFontSize = getAdjustedFontSize(ctx, certificate.name.toUpperCase(), width * 0.65, 50);
    ctx.font = `bold ${nameFontSize}px Arial`;
    ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.46);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(issueDate, width * 0.595, height * 0.665);

    ctx.fillStyle = '#1F2937';
    ctx.font = '40px "Times New Roman", "Ovo", serif';
    ctx.fillText(certificate.certificateId, width * 0.420, height * 0.806);
  } else {
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameFontSize = getAdjustedFontSize(ctx, certificate.name.toUpperCase(), width * 0.65, 50);
    ctx.font = `bold ${nameFontSize}px Arial`;
    ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.44);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 42px "Times New Roman", "Roboto Slab", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(issueDate, width * 0.480, height * 0.675);

    ctx.fillStyle = '#1F2937';
    ctx.font = '42px "Times New Roman", "Ovo", serif';
    ctx.fillText(certificate.certificateId, width * 0.420, height * 0.820);
  }

  return { canvas, width, height };
}

// ============ BULK DOWNLOAD PDFs ============
const bulkDownloadPdfs = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide certificate IDs'
      });
    }

    const zip = new JSZip();
    let processedCount = 0;

    for (const id of certificateIds) {
      const certificate = await Certificate.findById(id);
      
      if (certificate) {
        try {
          const { canvas, width, height } = await generateCertificateImage(certificate);
          const imageBuffer = canvas.toBuffer('image/png');

          const doc = new PDFDocument({
            size: [width, height],
            margin: 0
          });

          const chunks = [];
          doc.on('data', chunk => chunks.push(chunk));
          
          await new Promise((resolve, reject) => {
            doc.on('end', resolve);
            doc.on('error', reject);
            doc.image(imageBuffer, 0, 0, { width, height });
            doc.end();
          });

          const pdfBuffer = Buffer.concat(chunks);
          const filename = `${certificate.name.replace(/\s+/g, '_')}_${certificate.certificateId}.pdf`;
          zip.file(filename, pdfBuffer);
          
          // Update download status
          certificate.downloadCount += 1;
          certificate.lastDownloaded = new Date();
          await certificate.save();
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing certificate ${id}:`, error);
        }
      }
    }

    if (processedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid certificates found'
      });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=certificates.zip');
    res.send(zipBuffer);
  } catch (error) {
    console.error('Bulk download PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============ BULK DOWNLOAD JPGs ============
const bulkDownloadJpgs = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide certificate IDs'
      });
    }

    const zip = new JSZip();
    let processedCount = 0;

    for (const id of certificateIds) {
      const certificate = await Certificate.findById(id);
      
      if (certificate) {
        try {
          const { canvas } = await generateCertificateImage(certificate);
          const jpgBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
          const filename = `${certificate.name.replace(/\s+/g, '_')}_${certificate.certificateId}.jpg`;
          zip.file(filename, jpgBuffer);
          
          // Update download status
          certificate.downloadCount += 1;
          certificate.lastDownloaded = new Date();
          await certificate.save();
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing certificate ${id}:`, error);
        }
      }
    }

    if (processedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid certificates found'
      });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=certificates.zip');
    res.send(zipBuffer);
  } catch (error) {
    console.error('Bulk download JPG error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============ LIST CERTIFICATES ============
const listCertificates = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { certificateId: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } }
      ];
    }

    const certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');

    res.json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    console.error('List certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export default {
  bulkCreateCertificate,
  bulkDeleteCertificate,
  bulkDownloadPdfs,
  bulkDownloadJpgs,
  listCertificates
};