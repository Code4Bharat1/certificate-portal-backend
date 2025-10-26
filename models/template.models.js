// MongoDB Schema for Templates (ES6)
// File: models/Template.js

import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    unique: true
  },
  originalName: {
    type: String,
    required: [true, 'Original name is required']
  },
  filepath: {
    type: String,
    required: [true, 'File path is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required']
  },
  thumbnail: {
    type: String
  },
  category: {
    type: String,
    enum: ['certificate', 'letterhead', 'form', 'id-card', 'other'],
    default: 'certificate'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    width: Number,
    height: Number,
    format: String
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Add indexes for better query performance
templateSchema.index({ name: 1 });
templateSchema.index({ uploadedBy: 1 });
templateSchema.index({ category: 1 });
templateSchema.index({ createdAt: -1 });
templateSchema.index({ isActive: 1 });
templateSchema.index({ tags: 1 });

// Compound index for common queries
templateSchema.index({ isActive: 1, category: 1, createdAt: -1 });

// Virtual for URL
templateSchema.virtual('url').get(function() {
  return `/templates/${this.filename}`;
});

// Virtual for formatted size
templateSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
});

// Ensure virtuals are included when converting to JSON
templateSchema.set('toJSON', { virtuals: true });
templateSchema.set('toObject', { virtuals: true });

// Instance method to increment download count
templateSchema.methods.incrementDownloadCount = async function() {
  this.downloadCount += 1;
  return await this.save();
};

// Static method to find templates by user
templateSchema.statics.findByUser = function(userId) {
  return this.find({ uploadedBy: userId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find templates by category
templateSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ createdAt: -1 });
};

// Static method to get popular templates
templateSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ downloadCount: -1 })
    .limit(limit);
};

// Pre-save middleware
templateSchema.pre('save', function(next) {
  // Add any pre-save logic here
  next();
});

// Pre-remove middleware (for cleanup)
templateSchema.pre('remove', async function(next) {
  // Add cleanup logic here (e.g., delete file from disk)
  next();
});

const Template = mongoose.model('Template', templateSchema);

export default Template;