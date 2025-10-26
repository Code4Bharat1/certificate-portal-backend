// Backend API Routes (ES6) - Auto-loads existing templates on startup
// File: routes/templateRoutes.js

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

// Get __dirname equivalent in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create templates directory if it doesn't exist
const templatesDir = path.join(__dirname, '../templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Configure multer for file upload
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
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|psd|ai/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDF, DOC, PSD, and AI files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: fileFilter
});

// Optional Authentication Middleware (for testing)
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      req.user = {
        id: 'test-user-123',
        email: 'test@example.com',
        isAdmin: true
      };
      console.log('✅ Authenticated user:', req.user.id);
    } else {
      req.user = {
        id: 'anonymous',
        email: 'anonymous@example.com',
        isAdmin: false
      };
      console.log('⚠️  No authentication - using anonymous user');
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    next();
  }
};

// In-memory database
let templatesDB = [];

// 🔥 LOAD EXISTING TEMPLATES FROM FOLDER ON STARTUP
const loadExistingTemplates = () => {
  try {
    console.log('\n📂 Loading existing templates from:', templatesDir);
    
    const files = fs.readdirSync(templatesDir);
    
    files.forEach((filename, index) => {
      const filepath = path.join(templatesDir, filename);
      const stats = fs.statSync(filepath);
      
      // Skip if not a file
      if (!stats.isFile()) return;
      
      // Check if already in database
      const exists = templatesDB.find(t => t.filename === filename);
      if (exists) return;
      
      // Create template entry
      const template = {
        id: `existing-${index}-${Date.now()}`,
        name: filename,
        description: 'Existing template',
        filename: filename,
        originalName: filename,
        filepath: filepath,
        size: stats.size,
        mimetype: getMimeType(filename),
        thumbnail: `/templates/${filename}`,
        uploadedBy: 'system',
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString()
      };
      
      templatesDB.push(template);
      console.log(`✅ Loaded: ${filename}`);
    });
    
    console.log(`✅ Total templates loaded: ${templatesDB.length}\n`);
  } catch (error) {
    console.error('❌ Error loading existing templates:', error);
  }
};

// Helper function to get MIME type from filename
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.psd': 'image/vnd.adobe.photoshop',
    '.ai': 'application/postscript'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Load existing templates when module is loaded
loadExistingTemplates();

// GET: Fetch all templates
router.get('/templates', optionalAuth, async (req, res) => {
  try {
    console.log('📥 GET /api/templates - Fetching templates');
    console.log('Templates count:', templatesDB.length);
    
    res.json({
      success: true,
      data: templatesDB,
      count: templatesDB.length
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

// GET: Reload templates from folder (manual refresh)
router.get('/templates/reload/all', optionalAuth, async (req, res) => {
  try {
    console.log('🔄 Reloading templates from disk...');
    templatesDB = []; // Clear existing
    loadExistingTemplates();
    
    res.json({
      success: true,
      message: 'Templates reloaded successfully',
      count: templatesDB.length,
      data: templatesDB
    });
  } catch (error) {
    console.error('Error reloading templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reload templates',
      error: error.message
    });
  }
});

// GET: Fetch single template by ID
router.get('/templates/:id', optionalAuth, async (req, res) => {
  try {
    console.log('📥 GET /api/templates/:id - Fetching template:', req.params.id);
    
    const template = templatesDB.find(t => t.id === req.params.id);
    
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
router.post('/templates/upload', optionalAuth, upload.single('template'), async (req, res) => {
  try {
    console.log('📤 POST /api/templates/upload - Uploading template');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: req.body.name || req.file.originalname,
      description: req.body.description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      thumbnail: `/templates/${req.file.filename}`,
      uploadedBy: req.user?.id || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    templatesDB.push(newTemplate);
    
    console.log('✅ Template uploaded successfully:', newTemplate.id);
    console.log('Total templates:', templatesDB.length);

    res.status(201).json({
      success: true,
      message: 'Template uploaded successfully',
      data: newTemplate
    });
  } catch (error) {
    console.error('❌ Error uploading template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload template',
      error: error.message
    });
  }
});

// PUT: Update template details
router.put('/templates/:id', optionalAuth, async (req, res) => {
  try {
    console.log('✏️ PUT /api/templates/:id - Updating template:', req.params.id);
    console.log('Update data:', req.body);
    
    const templateIndex = templatesDB.findIndex(t => t.id === req.params.id);
    
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const { name, description } = req.body;
    
    templatesDB[templateIndex] = {
      ...templatesDB[templateIndex],
      name: name || templatesDB[templateIndex].name,
      description: description !== undefined ? description : templatesDB[templateIndex].description,
      updatedAt: new Date().toISOString()
    };

    console.log('✅ Template updated successfully');

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: templatesDB[templateIndex]
    });
  } catch (error) {
    console.error('❌ Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
});

// DELETE: Delete template
router.delete('/templates/:id', optionalAuth, async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/templates/:id - Deleting template:', req.params.id);
    
    const templateIndex = templatesDB.findIndex(t => t.id === req.params.id);
    
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const template = templatesDB[templateIndex];

    // Delete file from filesystem
    if (fs.existsSync(template.filepath)) {
      fs.unlinkSync(template.filepath);
      console.log('✅ File deleted from disk');
    }

    // Remove from database
    templatesDB.splice(templateIndex, 1);
    
    console.log('✅ Template deleted successfully');
    console.log('Remaining templates:', templatesDB.length);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
});

// GET: Download template
router.get('/templates/:id/download', optionalAuth, async (req, res) => {
  try {
    console.log('💾 GET /api/templates/:id/download - Downloading template:', req.params.id);
    
    const template = templatesDB.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    if (!fs.existsSync(template.filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found'
      });
    }

    console.log('✅ Sending file for download');
    res.download(template.filepath, template.originalName);
  } catch (error) {
    console.error('❌ Error downloading template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template',
      error: error.message
    });
  }
});

// Serve template files statically
router.use('/templates', express.static(templatesDir));

export default router;