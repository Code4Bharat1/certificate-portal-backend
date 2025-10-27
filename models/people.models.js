import mongoose from 'mongoose';

const peopleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ['code4bharat', 'marketing-junction', 'FSD', 'BVOC', 'HR'],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    batch: {
      type: String,
      required: function() {
        // Batch is required only for FSD and BVOC categories
        return ['FSD', 'BVOC'].includes(this.category);
      },
      trim: true,
      match: [/^B-\d+$/, 'Batch must be in format B-1, B-2, etc.'],
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^91[0-9]{10}$/, 'Phone must be in format 91XXXXXXXXXX (12 digits with country code)'],
      index: true, // Add index for faster queries
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted phone number (without country code for display)
peopleSchema.virtual('phoneWithoutCode').get(function() {
  if (this.phone && this.phone.startsWith('91')) {
    return this.phone.substring(2);
  }
  return this.phone;
});

// Virtual for formatted phone with +
peopleSchema.virtual('formattedPhone').get(function() {
  if (this.phone && this.phone.startsWith('91')) {
    return `+91 ${this.phone.substring(2)}`;
  }
  return this.phone;
});

// Index for efficient category-based queries
peopleSchema.index({ category: 1, createdAt: -1 });

// Compound index for category + batch queries
peopleSchema.index({ category: 1, batch: 1 });

// Pre-save hook to validate batch requirement
peopleSchema.pre('save', function(next) {
  // Ensure batch is provided for FSD and BVOC
  if (['FSD', 'BVOC'].includes(this.category) && !this.batch) {
    return next(new Error(`Batch is required for ${this.category} category`));
  }
  
  // Clear batch for categories that don't need it
  if (!['FSD', 'BVOC'].includes(this.category)) {
    this.batch = '';
  }
  
  next();
});

// Pre-update hook
peopleSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Check if category is being updated
  if (update.category && ['FSD', 'BVOC'].includes(update.category)) {
    if (!update.batch) {
      return next(new Error(`Batch is required for ${update.category} category`));
    }
  }
  
  next();
});

// Static method to find by category
peopleSchema.statics.findByCategory = function(category) {
  return this.find({ category }).sort({ createdAt: -1 });
};

// Static method to find by category and batch
peopleSchema.statics.findByCategoryAndBatch = function(category, batch) {
  return this.find({ category, batch }).sort({ createdAt: -1 });
};

// Static method to get category statistics
peopleSchema.statics.getCategoryStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

// Static method to get batch statistics
peopleSchema.statics.getBatchStats = async function() {
  return await this.aggregate([
    {
      $match: {
        category: { $in: ['FSD', 'BVOC'] },
        batch: { $exists: true, $ne: '' },
      },
    },
    {
      $group: {
        _id: { category: '$category', batch: '$batch' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.category': 1, '_id.batch': 1 },
    },
  ]);
};

// Instance method to check if batch is required
peopleSchema.methods.requiresBatch = function() {
  return ['FSD', 'BVOC'].includes(this.category);
};

// Instance method to get full details
peopleSchema.methods.getFullDetails = function() {
  return {
    id: this._id,
    name: this.name,
    category: this.category,
    batch: this.batch || 'N/A',
    phone: this.formattedPhone,
    phoneRaw: this.phone,
    requiresBatch: this.requiresBatch(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const People = mongoose.model('People', peopleSchema);

export default People;