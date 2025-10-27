import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import certificateControllers from '../controllers/certificate.controllers.js';
import {
  sendOTPViaWhatsApp,
  verifyOTP,
  sendCertificateNotification,
  sendBulkCertificateNotification
} from '../services/whatsappService.js';
import Certificate from '../models/certificate.models.js';


const router = express.Router();

// ==================== OTP ROUTES (WhatsApp) ====================

// Send OTP via WhatsApp
router.post('/otp/send', authenticate, async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const result = await sendOTPViaWhatsApp(phone, name || 'Admin');

    if (result.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully to WhatsApp'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Verify OTP
router.post('/otp/verify', authenticate, async (req, res) => {
  try {
    const { otp, phone } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP and phone number are required'
      });
    }

    const result = verifyOTP(phone, otp);

    if (result.success) {
      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// ==================== INTERN MANAGEMENT ====================

// Get interns by category, subcategory and batch
router.get('/interns', authenticate, async (req, res) => {
  try {
    const { category, batch, subCategory } = req.query;

    // TODO: Replace with actual database query
    // const interns = await Intern.find({ category, batch, subCategory });

    // Sample implementation
    const sampleInterns = [
      {
        internId: 'C4B001',
        name: 'Rahul Sharma',
        phone: '919876543210',
        category: 'internship',
        subCategory: 'c4b',
        batch: 'C4B Batch 1',
        email: 'rahul@example.com',
        certificatesCreated: 2,
        certificatesTotal: 5
      },
      {
        internId: 'MJ001',
        name: 'Priya Singh',
        phone: '919876543211',
        category: 'internship',
        subCategory: 'mj',
        batch: 'MJ Batch 1',
        email: 'priya@example.com',
        certificatesCreated: 1,
        certificatesTotal: 5
      },
      {
        internId: 'FSD001',
        name: 'Amit Patel',
        phone: '919876543212',
        category: 'fsd',
        subCategory: null,
        batch: 'FSD1',
        email: 'amit@example.com',
        certificatesCreated: 3,
        certificatesTotal: 5
      }
    ];

    let filteredInterns = sampleInterns;

    if (category) {
      filteredInterns = filteredInterns.filter(intern => intern.category === category);
    }

    if (subCategory) {
      filteredInterns = filteredInterns.filter(intern => intern.subCategory === subCategory);
    }

    if (batch) {
      filteredInterns = filteredInterns.filter(intern => intern.batch === batch);
    }

    res.json({
      success: true,
      interns: filteredInterns
    });
  } catch (error) {
    console.error('Fetch interns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interns'
    });
  }
});

// Get certificate statistics for an intern
router.get('/stats/:internId', authenticate, async (req, res) => {
  try {
    const { internId } = req.params;

    // TODO: Replace with actual database query
    // const stats = await Certificate.aggregate([
    //   { $match: { internId } },
    //   { $group: { _id: null, created: { $sum: 1 } } }
    // ]);

    const stats = {
      created: 2,
      total: 5,
      remaining: 3
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// ==================== EXISTING ROUTES (UPDATED) ====================

// Get all certificates
router.get('/', authenticate, certificateControllers.getAllCertificate);

// ==================== FETCH COURSES (ACTIVE ROUTE) ====================
router.get('/available-courses', authenticate, async (req, res) => {
  try {
    const { category, name } = req.query;

    const coursesByCategory = {
      'marketing-junction': [
        'Certificate of Appreciation',
        'Digital Marketing Specialist Certificate',
        'Advanced SEO Specialist Certificate',
        'Social Media Marketing Expert Certificate',
        'Full Stack Digital Marketer Certificate',
        'AI-Powered Digital Marketing Specialist Certificate',
        'Videography Course'
      ],
      'code4bharat': [
        'Certificate of Appreciation',
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
      'FSD': [
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
      // 'BVOC': [
      //   'Software Development Fundamentals',
      //   'Web Technologies',
      //   'Database Management Systems',
      //   'Project Management',
      //   'Entrepreneurship Development'
      // ],
      // 'BOOTCAMP': [
      //   'Web Development Bootcamp',
      //   'Data Science Bootcamp',
      //   'Mobile App Development',
      //   'UI/UX Design Bootcamp',
      //   'Full Stack JavaScript Bootcamp'
      // ],
      'HR': [
        'Growth Head',
        'Operation and Sales',
        'Human Resource Management',
        // 'Talent Acquisition & Recruitment',
        // 'Performance Management',
        // 'Employee Relations',
        // 'Organizational Behavior',
        // 'HR Analytics'
      ]
    };

    const allCourses = coursesByCategory[category] || [];

    // Aggregate certificate data by name for this category
    const certificateStats = await Certificate.aggregate([
      {
        $match: { category: category }
      },
      {
        $group: {
          _id: '$name',
          totalCertificates: { $sum: 1 },
          courses: { $addToSet: '$course' },
          certificates: {
            $push: {
              certificateId: '$certificateId',
              course: '$course',
              issueDate: '$issueDate',
              status: '$status',
              batch: '$batch',
              _id: '$_id'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          totalCertificates: 1,
          courseCount: { $size: '$courses' },
          completedCourses: '$courses',
          certificates: 1
        }
      },
      {
        $sort: { courseCount: -1, name: 1 }
      }
    ]);

    // Get certificates already created for the selected student (if name is provided)
    let createdCertificates = [];
    let availableCourses = allCourses;
    let studentStats = null;

    if (name) {
      const studentData = certificateStats.find(s => s.name === name);

      if (studentData) {
        createdCertificates = studentData.completedCourses || [];
        studentStats = {
          name: studentData.name,
          totalCertificates: studentData.totalCertificates,
          courseCount: studentData.courseCount,
          completedCourses: studentData.completedCourses,
          certificates: studentData.certificates
        };

        // Filter out already completed courses
        availableCourses = allCourses.filter(
          course => !createdCertificates.includes(course)
        );
      }
    }

    // Get overall statistics
    const totalCertificatesIssued = await Certificate.countDocuments({ category });
    const uniqueStudents = certificateStats.length;

    res.json({
      success: true,
      category,
      courses: availableCourses, // Only courses not yet completed by this student
      allCourses: allCourses, // All available courses in this category
      createdCertificates, // Courses already completed by this student
      statistics: {
        totalCertificatesIssued,
        uniqueStudents,
        averageCertificatesPerStudent: uniqueStudents > 0
          ? (totalCertificatesIssued / uniqueStudents).toFixed(2)
          : 0,
        totalAvailableCourses: allCourses.length
      },
      studentStats, // Stats for the selected student
      studentProgress: certificateStats // All students' progress
    });

  } catch (error) {
    console.error('Fetch available courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available courses',
      error: error.message
    });
  }
});

// Get certificate by ID
router.get('/:id', authenticate, certificateControllers.getCertificateById);

// Create certificate (UPDATED with WhatsApp notification)
router.post('/', [
  authenticate,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').isIn(['FSD', 'BVOC', 'BOOTCAMP', 'marketing-junction', 'code4bharat']).withMessage('Invalid category'),
  body('course').trim().notEmpty().withMessage('Course is required'),
  body('issueDate').notEmpty().withMessage('Issue date is required')
], certificateControllers.createCertificate);

// Bulk certificate creation (NEW)
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { certificates, adminPhone, adminName } = req.body;

    if (!Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certificate data'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    // Process each certificate
    for (const cert of certificates) {
      try {
        // Validate required fields
        if (!cert.name || !cert.category || !cert.course || !cert.issueDate) {
          throw new Error('Missing required fields: name, category, course, or issueDate');
        }

        let certificateId;
        let existingId;

        do {
          certificateId = certificateControllers.generateCertificateId(cert.category);
          existingId = await Certificate.findOne({ certificateId }); // ✅ check in DB
        } while (existingId);

        // Generate unique certificate ID
        // const certificateId = cert.certificateId || `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create certificate document
        const certificateData = {
          certificateId,
          name: cert.name,
          category: cert.category,
          batch: cert.batch || null,
          course: cert.course,
          issueDate: new Date(cert.issueDate),
          status: 'pending',
          downloadCount: 0,
          createdBy: req.user._id || req.user.id
        };

        // Save certificate to database
        const certificate = await Certificate.create(certificateData);

        // Send WhatsApp notification
        if (cert.phone && certificate.certificateId) {
          try {
            const whatsappResponse = await sendCertificateNotification({
              userName: cert.name,
              userPhone: cert.phone,
              certificateId: certificate.certificateId,
              course: cert.course,
              category: cert.category,
              batch: cert.batch,
              issueDate: cert.issueDate
            });
            console.log("Whatsapp Response: ", whatsappResponse);
            
          } catch (notificationError) {
            console.error('WhatsApp notification failed:', notificationError);
            // Don't fail the entire operation if notification fails
          }
        }

        results.successful.push({
          certificateId: certificate.certificateId,
          name: cert.name
        });

      } catch (error) {
        console.error('Certificate creation error:', error);
        results.failed.push({
          name: cert.name || 'Unknown',
          error: error.message
        });
      }
    }

    // Send summary to admin via WhatsApp
    if (adminPhone) {
      try {
        await sendBulkCertificateNotification(adminPhone, adminName || 'Admin', {
          total: certificates.length,
          successful: results.successful.length,
          failed: results.failed.length
        });
      } catch (notificationError) {
        console.error('Admin notification failed:', notificationError);
      }
    }

    res.json({
      success: true,
      message: 'Bulk creation completed',
      results: {
        total: certificates.length,
        successful: results.successful.length,
        failed: results.failed.length
      },
      data: results
    });

  } catch (error) {
    console.error('Bulk creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk creation',
      error: error.message
    });
  }
});

// Verify certificate (PUBLIC - No Auth)
router.post('/verify', certificateControllers.verifyCertificate);

// Verify certificate by ID (PUBLIC - For WhatsApp links)
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    // TODO: Use existing controller or database query
    // const certificate = await Certificate.findOne({ certificateId });

    const mockReq = {
      body: { certificateId },
      params: { id: certificateId }
    };

    const certificate = await certificateControllers.getCertificateById(mockReq, res);

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
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate'
    });
  }
});

// Update download status
router.patch('/:id/download', authenticate, certificateControllers.updateDownloadStatus);

// Delete certificate
router.delete('/:id', authenticate, certificateControllers.deleteCertificate);

// Download Certificate as PDF
router.get('/:id/download/pdf', certificateControllers.downloadCertificateAsPdf);

// Download Certificate as JPG
router.get('/:id/download/jpg', certificateControllers.downloadCertificateAsJpg);

// Download certificate by ID (For WhatsApp links)
router.get('/download/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    // TODO: Find certificate and return file
    // const certificate = await Certificate.findOne({ certificateId });
    // res.download(certificate.filePath);

    // Redirect to existing download route
    const mockReq = {
      params: { id: certificateId }
    };

    return certificateControllers.downloadCertificateAsPdf(mockReq, res);
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download certificate'
    });
  }
});

// Get courses by category
router.get('/courses/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;

    // TODO: Replace with database query or use existing controller
    const coursesByCategory = {
      'internship': [
        'Full Stack Web Development',
        'Python Programming',
        'Data Structures & Algorithms',
        'React.js Development',
        'Node.js Backend Development',
        'Digital Marketing Fundamentals',
        'Social Media Marketing',
        'Content Marketing'
      ],
      'marketing-junction': [
        'Digital Marketing Fundamentals',
        'Social Media Marketing',
        'SEO & Content Marketing',
        'Email Marketing',
        'Marketing Analytics'
      ],
      'code4bharat': [
        'Full Stack Web Development',
        'Python Programming',
        'Data Structures & Algorithms',
        'React.js Development',
        'Node.js Backend Development'
      ],
      'fsd': [
        'MERN Stack Development',
        'Advanced JavaScript',
        'Database Design & Management',
        'API Development & Integration',
        'DevOps Basics',
        'Cloud Computing Fundamentals'
      ],
      'bvoc': [
        'Software Development Fundamentals',
        'Web Technologies',
        'Database Management Systems',
        'Project Management',
        'Entrepreneurship Development'
      ],
      'bootcamp': [
        'Web Development Bootcamp',
        'Data Science Bootcamp',
        'Mobile App Development',
        'UI/UX Design Bootcamp',
        'Full Stack JavaScript Bootcamp'
      ]
    };

    const courses = coursesByCategory[category] || [];

    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
});




// Certificate Preview
router.post('/preview', authenticate, certificateControllers.generateCertificatePreview);

// ==================== ANALYTICS ====================

// Get certificate analytics (NEW)
router.get('/analytics', authenticate, async (req, res) => {
  try {
    // TODO: Implement actual analytics from database
    const analytics = {
      totalCertificates: 1234,
      certificatesByCategory: {
        'internship': {
          'c4b': 450,
          'mj': 320
        },
        'fsd': 280,
        'bvoc': 134,
        'bootcamp': 50
      },
      recentActivity: [
        { date: '2025-10-25', count: 45 },
        { date: '2025-10-24', count: 38 },
        { date: '2025-10-23', count: 52 }
      ],
      topCourses: [
        { course: 'Full Stack Web Development', count: 156 },
        { course: 'Digital Marketing Fundamentals', count: 134 },
        { course: 'Python Programming', count: 98 }
      ],
      notificationStats: {
        sent: 1150,
        delivered: 1120,
        failed: 30
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

export default router;