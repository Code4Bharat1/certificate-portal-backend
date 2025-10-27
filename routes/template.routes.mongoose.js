// Backend API Routes with MongoDB (ES6)
// File: routes/templateRoutes.mongoose.js

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Template from '../models/Template.js';

const router = express.Router();

// Get __dirname equivalent in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create templates directory
const templatesDir = path.join(__dirname, '../templates');
try {
  await fs.mkdir(templatesDir, { recursive: true });
} catch (error) {
  console.error('Error creating templates directory:', error);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, templatesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Authentication middleware (replace with your actual auth middleware)
const authenticate = (req, res, next) => {
  // Simple mock auth - replace with your JWT verification
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Mock user - replace with actual JWT decode
  req.user = {
    _id: '507f1f77bcf86cd799439011', // Mock user ID
    isAdmin: true
  };
  
  next();
};

// GET: Fetch all templates with pagination and filters
router.get('/templates', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const templates = await Template.find(query)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .populate('uploadedBy', 'name email')
      .select('-__v');

    const total = await Template.countDocuments(query);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
});

// GET: Fetch single template
router.get('/templates/:id', authenticate, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message
    });
  }
});

// POST: Upload new template
router.post('/templates/upload', authenticate, upload.single('template'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const newTemplate = new Template({
      name: req.body.name || req.file.originalname,
      description: req.body.description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      thumbnail: `/templates/${req.file.filename}`,
      category: req.body.category || 'certificate',
      uploadedBy: req.user._id,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    });

    await newTemplate.save();

    res.status(201).json({
      success: true,
      message: 'Template uploaded successfully',
      data: newTemplate
    });
  } catch (error) {
    // Delete uploaded file if database save fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    console.error('Error uploading template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload template',
      error: error.message
    });
  }
});

// PUT: Update template
router.put('/templates/:id', authenticate, async (req, res) => {
  try {
    const { name, description, category, tags } = req.body;
    
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if user owns the template or is admin
    if (template.uploadedBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this template'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;

    const updatedTemplate = await Template.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
});

// DELETE: Delete template
router.delete('/templates/:id', authenticate, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check authorization
    if (template.uploadedBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this template'
      });
    }

    // Delete file from filesystem
    if (existsSync(template.filepath)) {
      await fs.unlink(template.filepath).catch(console.error);
    }

    // Delete from database
    await Template.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
});

// GET: Download template
router.get('/templates/:id/download', authenticate, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    if (!existsSync(template.filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found on server'
      });
    }

    // Increment download count
    await template.incrementDownloadCount();

    // Send file
    res.download(template.filepath, template.originalName);
  } catch (error) {
    console.error('Error downloading template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template',
      error: error.message
    });
  }
});

// GET: Get template statistics
router.get('/templates/stats/summary', authenticate, async (req, res) => {
  try {
    const stats = await Template.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    const totalTemplates = await Template.countDocuments({ isActive: true });
    const totalSizeResult = await Template.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]);

    const totalDownloads = await Template.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalTemplates,
        totalSize: totalSizeResult[0]?.total || 0,
        totalDownloads: totalDownloads[0]?.total || 0,
        byCategory: stats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// GET: Get popular templates
router.get('/templates/popular/top', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const templates = await Template.getPopular(limit);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular templates',
      error: error.message
    });
  }
});

// Serve template files statically
router.use('/templates', express.static(templatesDir));

export default router;