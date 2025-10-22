import { body, validationResult } from 'express-validator';
import Certificate from '../models/certificate.models.js';
import ActivityLog from '../models/activitylog.models.js';
import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
// import fs from 'fs';
// import path from 'path';


// Utility function to generate unique certificate ID
function generateCertificateId(category) {
  const prefix = category === 'marketing-junction' ? 'MJ' : 'C4B';
  const numberPart = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${numberPart}`;
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
    await ActivityLog.create({
      action: 'verify',
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate verified for ${certificate.name}`
    });

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
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }

    certificate.status = 'downloaded';
    certificate.downloadCount += 1;
    certificate.lastDownloaded = new Date();
    await certificate.save();

    // Log download
    await ActivityLog.create({
      action: 'download',
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate downloaded for ${certificate.name}`
    });

    res.json({
      success: true,
      message: 'Download recorded successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Update download error:', error);
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
    const certificate = await Certificate.findById(req.params.id);

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

    // Log download
    await ActivityLog.create({
      action: 'download',
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate PDF downloaded for ${certificate.name}`
    });

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });

    // Set filename as person's name
    const filename = `${certificate.name.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Certificate design
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Border
    doc.lineWidth(10);
    const gradient = doc.linearGradient(0, 0, pageWidth, 0);
    gradient.stop(0, '#3B82F6');
    gradient.stop(0.5, '#8B5CF6');
    gradient.stop(1, '#EC4899');
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40).stroke(gradient);

    doc.lineWidth(3);
    doc.rect(35, 35, pageWidth - 70, pageHeight - 70).stroke('#E5E7EB');

    // Header
    doc.fontSize(40)
       .fillColor('#1F2937')
       .font('Helvetica-Bold')
       .text('CERTIFICATE', 0, 100, { align: 'center' });

    doc.fontSize(20)
       .fillColor('#6B7280')
       .font('Helvetica')
       .text('OF COMPLETION', 0, 150, { align: 'center' });

    // Decorative line
    doc.moveTo(pageWidth / 2 - 150, 190)
       .lineTo(pageWidth / 2 + 150, 190)
       .lineWidth(2)
       .strokeColor('#8B5CF6')
       .stroke();

    // Certificate text
    doc.fontSize(16)
       .fillColor('#374151')
       .font('Helvetica')
       .text('This is to certify that', 0, 230, { align: 'center' });

    // Name (highlighted)
    doc.fontSize(36)
       .fillColor('#3B82F6')
       .font('Helvetica-Bold')
       .text(certificate.name, 0, 270, { align: 'center' });

    // Course info
    if (certificate.course) {
      doc.fontSize(16)
         .fillColor('#374151')
         .font('Helvetica')
         .text('has successfully completed', 0, 330, { align: 'center' });

      doc.fontSize(24)
         .fillColor('#8B5CF6')
         .font('Helvetica-Bold')
         .text(certificate.course, 0, 365, { align: 'center' });
    }

    // Category badge
    const categoryText = certificate.category === 'marketing-junction' 
      ? 'Marketing Junction' 
      : 'Code4Bharat';
    
    doc.fontSize(14)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold');
    
    const badgeWidth = 200;
    const badgeX = (pageWidth - badgeWidth) / 2;
    doc.rect(badgeX, 420, badgeWidth, 30)
       .fill('#8B5CF6');
    
    doc.fillColor('#FFFFFF')
       .text(categoryText, badgeX, 427, { 
         width: badgeWidth, 
         align: 'center' 
       });

    // Date and ID
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(12)
       .fillColor('#6B7280')
       .font('Helvetica')
       .text(`Issue Date: ${issueDate}`, 100, pageHeight - 100);

    doc.text(`Certificate ID: ${certificate.certificateId}`, pageWidth - 300, pageHeight - 100);

    // Signature line
    doc.moveTo(pageWidth / 2 - 100, pageHeight - 80)
       .lineTo(pageWidth / 2 + 100, pageHeight - 80)
       .stroke();

    doc.fontSize(10)
       .text('Authorized Signature', 0, pageHeight - 65, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const downloadCertificateAsJpg = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

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

    // Log download
    await ActivityLog.create({
      action: 'download',
      certificateId: certificate.certificateId,
      userName: certificate.name,
      adminId: req.user._id,
      details: `Certificate JPG downloaded for ${certificate.name}`
    });

    // Create canvas
    const width = 1200;
    const height = 850;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#EFF6FF');
    gradient.addColorStop(0.5, '#F5F3FF');
    gradient.addColorStop(1, '#FDF2F8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 15;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 5;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    // Header
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE', width / 2, 150);

    ctx.fillStyle = '#6B7280';
    ctx.font = '30px Arial';
    ctx.fillText('OF COMPLETION', width / 2, 200);

    // Decorative line
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 230);
    ctx.lineTo(width / 2 + 200, 230);
    ctx.stroke();

    // Certificate text
    ctx.fillStyle = '#374151';
    ctx.font = '24px Arial';
    ctx.fillText('This is to certify that', width / 2, 290);

    // Name
    ctx.fillStyle = '#3B82F6';
    ctx.font = 'bold 50px Arial';
    ctx.fillText(certificate.name, width / 2, 360);

    // Course
    if (certificate.course) {
      ctx.fillStyle = '#374151';
      ctx.font = '22px Arial';
      ctx.fillText('has successfully completed', width / 2, 420);

      ctx.fillStyle = '#8B5CF6';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(certificate.course, width / 2, 470);
    }

    // Category badge
    const categoryText = certificate.category === 'marketing-junction' 
      ? 'Marketing Junction' 
      : 'Code4Bharat';
    
    ctx.fillStyle = '#8B5CF6';
    ctx.fillRect(width / 2 - 150, 520, 300, 50);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(categoryText, width / 2, 552);

    // Date and ID
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    ctx.fillStyle = '#6B7280';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Issue Date: ${issueDate}`, 120, height - 120);

    ctx.textAlign = 'right';
    ctx.fillText(`Certificate ID: ${certificate.certificateId}`, width - 120, height - 120);

    // Signature line
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, height - 90);
    ctx.lineTo(width / 2 + 150, height - 90);
    ctx.stroke();

    ctx.fillStyle = '#6B7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Authorized Signature', width / 2, height - 60);

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
      message: 'Server error' 
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
        'AI-Powered Digital Marketing Specialist Certificate'
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

export default { 
    getAllCertificate,
    getCertificateById,
    createCertificate,
    verifyCertificate,
    updateDownloadStatus,
    deleteCertificate,
    downloadCertificateAsPdf,
    downloadCertificateAsJpg,
    getCoursesByCategory
}
