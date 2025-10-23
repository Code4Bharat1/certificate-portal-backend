import { body, validationResult } from 'express-validator';
import Certificate from '../models/certificate.models.js';
import ActivityLog from '../models/activitylog.models.js';
import PDFDocument from 'pdfkit';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to generate unique certificate ID
function generateCertificateId(category) {
  const prefix = category === 'marketing-junction' ? 'MJ' : 'C4B';
  const numberPart = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${numberPart}`;
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

// Utility function to wrap text
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
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

const getAllCertificate = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
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
      data: certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }

    res.json({
      success: true,
      data: certificate
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const createCertificate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, category, issueDate, course } = req.body;

    // Validate that course is provided
    if (!course) {
      return res.status(400).json({
        success: false,
        message: 'Course is required'
      });
    }

    // Generate a unique certificateId automatically
    let certificateId;
    let existingCert;

    do {
      certificateId = generateCertificateId(category);
      existingCert = await Certificate.findOne({ certificateId });
    } while (existingCert);

    const certificate = new Certificate({
      name,
      course,
      category,
      issueDate,
      certificateId,
      createdBy: req.user._id
    });

    await certificate.save();

    // Log activity
    await ActivityLog.create({
      action: 'create',
      certificateId: certificate.certificateId,
      userName: name,
      adminId: req.user._id,
      details: `Certificate created for ${name} - ${course}`
    });

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Create certificate error:', error);
    
    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.body;

    if (!certificateId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate ID is required' 
      });
    }

    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      // Log failed verification
      await ActivityLog.create({
        action: 'verify',
        certificateId,
        adminId: req.user._id,
        details: `Failed verification attempt for ${certificateId}`
      });

      return res.json({
        success: true,
        valid: false,
        message: 'Certificate not found'
      });
    }

    // Log successful verification
    // await ActivityLog.create({
    //   action: 'verify',
    //   certificateId: certificate.certificateId,
    //   userName: certificate.name,
    //   // adminId: req.user._id,
    //   details: `Certificate verified for ${certificate.name}`
    // });

    res.json({
      success: true,
      valid: true,
      data: {
        certificateId: certificate.certificateId,
        name: certificate.name,
        course: certificate.course,
        issueDate: certificate.issueDate,
        category: certificate.category,
        status: certificate.status
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const updateDownloadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'downloaded'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }

    certificate.status = status;
    await certificate.save();

    // Log status update
    await ActivityLog.create({
      action: 'update',
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate status updated to ${status}`
    });

    res.json({
      success: true,
      message: 'Certificate status updated',
      data: certificate
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }

    // Log deletion
    await ActivityLog.create({
      action: 'delete',
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate deleted for ${certificate.name}`
    });

    await Certificate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const downloadCertificateAsPdf = async (req, res) => {
  try {
    const identifier = req.params.id;
    let certificate;

    // Check if the identifier is a valid ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isValidObjectId) {
      // Try to find by _id first if it's a valid ObjectId
      certificate = await Certificate.findById(identifier);
    }

    // If not found or not a valid ObjectId, search by certificateId or authCode
    if (!certificate) {
      certificate = await Certificate.findOne({
        $or: [
          { certificateId: identifier.toUpperCase() },
          { authCode: identifier.toUpperCase() }
        ]
      });
    }

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }

    // Rest of your code remains the same...
    certificate.status = 'downloaded';
    certificate.downloadCount += 1;
    certificate.lastDownloaded = new Date();
    await certificate.save();

    // await ActivityLog.create({
    //   action: 'download',
    //   certificateId: certificate.certificateId,
    //   userName: certificate.name,
    //   details: `Certificate PDF downloaded for ${certificate.name}`
    // });

    const templateFilename = getCourseTemplateFilename(certificate.course, certificate.category);
    const templatePath = path.join(__dirname, '../templates', templateFilename);

    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      return res.status(500).json({
        success: false,
        message: `Certificate template not found for course: ${certificate.course}`
      });
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

    const imageBuffer = canvas.toBuffer('image/png');

    const doc = new PDFDocument({
      size: [width, height],
      margin: 0
    });

    const filename = `${certificate.name.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);
    doc.image(imageBuffer, 0, 0, { width, height });
    doc.end();

  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

const downloadCertificateAsJpg = async (req, res) => {
  try {
    // const certificate = await Certificate.findById(req.params.id);

    const identifier = req.params.id;
    let certificate;

    // Check if the identifier is a valid ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isValidObjectId) {
      // Try to find by _id first if it's a valid ObjectId
      certificate = await Certificate.findById(identifier);
    }

    // If not found or not a valid ObjectId, search by certificateId or authCode
    if (!certificate) {
      certificate = await Certificate.findOne({
        $or: [
          { certificateId: identifier.toUpperCase() },
          { authCode: identifier.toUpperCase() }
        ]
      });
    }

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }

    // Update download status
    certificate.status = 'downloaded';
    certificate.downloadCount += 1;
    certificate.lastDownloaded = new Date();
    await certificate.save();

    // // Log download
    // await ActivityLog.create({
    //   action: 'download',
    //   certificateId: certificate.certificateId,
    //   userName: certificate.name,
    //   adminId: req.user._id,
    //   details: `Certificate JPG downloaded for ${certificate.name}`
    // });

    // Load the PNG template based on category and course
    const templateFilename = getCourseTemplateFilename(certificate.course, certificate.category);
    const templatePath = path.join(__dirname, '../templates', templateFilename);

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      return res.status(500).json({
        success: false,
        message: `Certificate template not found for course: ${certificate.course}`
      });
    }

    // Load the image
    const templateImage = await loadImage(templatePath);
    const width = templateImage.width;
    const height = templateImage.height;

    // Create canvas and draw template
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(templateImage, 0, 0);

    // Format date
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // NAME - Centered on certificate between "This certificate is awarded to" and course description
    ctx.fillStyle = '#1F2937'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameFontSize = getAdjustedFontSize(ctx, certificate.name.toUpperCase(), width * 0.65, 50);
    ctx.font = `bold ${nameFontSize}px Arial`;
    ctx.fillText(certificate.name.toUpperCase(), width / 2, height * 0.46);

    // DATE - Bottom left area, right after "Awarded on:" text in template  
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(issueDate, width * 0.595, height * 0.665);

    // CREDENTIAL ID - Positioned after "CREDENTIAL ID:" label in template
    ctx.fillStyle = '#1F2937';
    ctx.font = '40px "Times New Roman", "Ovo", serif';
    ctx.fillText(certificate.certificateId, width * 0.420, height * 0.806);


    // Convert to buffer and send
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    const filename = `${certificate.name.replace(/\s+/g, '_')}.jpg`;
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Download JPG error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

const getCoursesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const courses = {
      'code4bharat': [
        'Full Stack Certificate (MERN Stack)',
        'JavaScript Developer Certificate',
        'Advanced React Developer Certificate',
        'Node.js and Express.js Specialist Certificate',
        'MongoDB Professional Certificate',
        'Git & Version Control Expert Certificate',
        'Frontend Development Pro Certificate',
        'Backend Development Specialist Certificate',
        'Web Development Project Certificate',
        'Advanced Web Development Capstone Certificate'
      ],
      'marketing-junction': [
        'Digital Marketing Specialist Certificate',
        'Advanced SEO Specialist Certificate',
        'Social Media Marketing Expert Certificate',
        'Full Stack Digital Marketer Certificate',
        'AI-Powered Digital Marketing Specialist Certificate',
        'Videography Course'
      ]
    };

    if (!courses[category]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be either "code4bharat" or "marketing-junction"'
      });
    }

    res.json({
      success: true,
      category,
      courses: courses[category]
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const generateCertificatePreview = async (req, res) => {
  try {
    const { name, category, issueDate, course } = req.body;

    // Validate required fields
    if (!name || !category || !issueDate || !course) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required for preview'
      });
    }

    // Generate a temporary certificate ID for preview
    const tempCertificateId = generateCertificateId(category);

    const templateFilename = getCourseTemplateFilename(course, category);
    const templatePath = path.join(__dirname, '../templates', templateFilename);

    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      return res.status(500).json({
        success: false,
        message: `Certificate template not found for course: ${course}`
      });
    }

    const templateImage = await loadImage(templatePath);
    const width = templateImage.width;
    const height = templateImage.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(templateImage, 0, 0);

    const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // NAME
    ctx.fillStyle = '#1F2937'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameFontSize = getAdjustedFontSize(ctx, name.toUpperCase(), width * 0.65, 50);
    ctx.font = `bold ${nameFontSize}px Arial`;
    ctx.fillText(name.toUpperCase(), width / 2, height * 0.46);

    // DATE
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 40px "Times New Roman", "Roboto Slab", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(formattedDate, width * 0.595, height * 0.665);

    // CERTIFICATE ID (temporary for preview)
    ctx.fillStyle = '#1F2937';
    ctx.font = '40px "Times New Roman", "Ovo", serif';
    ctx.fillText(tempCertificateId, width * 0.420, height * 0.806);

    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buffer);

  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

export default { 
    getAllCertificate,
    getCertificateById,
    createCertificate,
    verifyCertificate,
    updateDownloadStatus,
    deleteCertificate,
    downloadCertificateAsPdf,
    downloadCertificateAsJpg,
    getCoursesByCategory,
    generateCertificatePreview
}