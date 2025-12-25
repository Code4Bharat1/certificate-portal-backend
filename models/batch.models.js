import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: {
        values: ['fsd', 'bvoc'],
        message: '{VALUE} is not a valid category. Must be fsd or bvoc',
      },
      required: [true, 'Category is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      validate: {
        validator: function(value) {
          // Allow formats like:
          // - "B-1 (June-2025)" for fsd
          // - "B-1 2025" for bvoc
          // - "B-1", "B-2", etc.
          
          // Check if it starts with B-{number}
          const basicFormat = /^B-\d+/.test(value);
          
          if (!basicFormat) {
            return false;
          }
          
          // If it's fsd format with month and year
          if (value.includes('(') && value.includes(')')) {
            return /^B-\d+\s+\([A-Za-z]+-\d{4}\)$/.test(value);
          }
          
          // If it's bvoc format with just year
          if (/^B-\d+\s+\d{4}$/.test(value)) {
            return true;
          }
          
          // If it's just basic B-{number}
          if (/^B-\d+$/.test(value)) {
            return true;
          }
          
          return false;
        },
        message: 'Batch name must be in format: B-1, B-2 (basic), B-1 (June-2025) (fsd), or B-1 2025 (bvoc)'
      }
    },
  },
  { 
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate batch names within same category
batchSchema.index({ category: 1, name: 1 }, { unique: true });

// Index for efficient category-based queries
batchSchema.index({ category: 1, createdAt: -1 });

// Pre-save validation hook
batchSchema.pre('save', function(next) {
  console.log(`💾 [PRE-SAVE] Saving batch: ${this.category} - ${this.name}`);
  
  // Additional validation based on category
  if (this.category === 'fsd') {
    // fsd batches should have format like "B-1 (June-2025)"
    if (!this.name.includes('(') && !this.name.includes(')')) {
      console.warn(`⚠️ fsd batch ${this.name} doesn't follow recommended format: B-X (Month-Year)`);
    }
  } else if (this.category === 'bvoc') {
    // bvoc batches should have format like "B-1 2025"
    if (this.name.includes('(') || this.name.includes(')')) {
      console.warn(`⚠️ bvoc batch ${this.name} doesn't follow recommended format: B-X Year`);
    }
  }
  
  next();
});

// Post-save hook for logging
batchSchema.post('save', function(doc) {
  console.log(`✅ [POST-SAVE] Batch saved successfully: ${doc.category} - ${doc.name}`);
});

// Pre-update hook
batchSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  console.log(`🔄 [PRE-UPDATE] Updating batch:`, update);
  next();
});

// Post-update hook
batchSchema.post('findOneAndUpdate', function(doc) {
  if (doc) {
    console.log(`✅ [POST-UPDATE] Batch updated: ${doc.category} - ${doc.name}`);
  }
});

// Pre-delete hook
batchSchema.pre('findOneAndDelete', function(next) {
  console.log(`🗑️ [PRE-DELETE] Deleting batch...`);
  next();
});

// Post-delete hook
batchSchema.post('findOneAndDelete', function(doc) {
  if (doc) {
    console.log(`✅ [POST-DELETE] Batch deleted: ${doc.category} - ${doc.name}`);
  }
});

// Static method to find batches by category
batchSchema.statics.findByCategory = function(category) {
  console.log(`🔍 [QUERY] Finding batches for category: ${category}`);
  return this.find({ category }).sort({ name: 1 });
};

// Static method to get batch count by category
batchSchema.statics.countByCategory = async function(category) {
  const count = await this.countDocuments({ category });
  console.log(`📊 [STATS] ${category} batch count: ${count}`);
  return count;
};

// Static method to check if batch exists
batchSchema.statics.batchExists = async function(category, name) {
  const exists = await this.findOne({ category, name });
  return !!exists;
};

// Static method to get all batches grouped by category
batchSchema.statics.getAllGrouped = async function() {
  console.log('📊 [QUERY] Fetching all batches grouped by category...');
  
  const batches = await this.find({}).sort({ category: 1, name: 1 });
  
  const grouped = {
    fsd: [],
    bvoc: []
  };
  
  batches.forEach(batch => {
    if (batch.category === 'fsd' || batch.category === 'bvoc') {
      grouped[batch.category].push(batch.name);
    }
  });
  
  console.log(`✅ [RESULT] fsd: ${grouped.fsd.length}, bvoc: ${grouped.bvoc.length}`);
  
  return grouped;
};

// Instance method to get formatted display name
batchSchema.methods.getDisplayName = function() {
  return `${this.category} - ${this.name}`;
};

// Instance method to extract batch number
batchSchema.methods.getBatchNumber = function() {
  const match = this.name.match(/^B-(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// Instance method to extract year (if present)
batchSchema.methods.getYear = function() {
  // Try to extract year from formats like "B-1 (June-2025)" or "B-1 2025"
  const match = this.name.match(/\d{4}/);
  return match ? parseInt(match[0]) : null;
};

// Instance method to extract month (if present in fsd format)
batchSchema.methods.getMonth = function() {
  if (this.category !== 'fsd') return null;
  
  // Extract month from format "B-1 (June-2025)"
  const match = this.name.match(/\(([A-Za-z]+)-\d{4}\)/);
  return match ? match[1] : null;
};

// Instance method to check if batch format is valid for category
batchSchema.methods.hasValidFormat = function() {
  if (this.category === 'fsd') {
    // Should have format like "B-1 (June-2025)"
    return /^B-\d+\s+\([A-Za-z]+-\d{4}\)$/.test(this.name);
  } else if (this.category === 'bvoc') {
    // Should have format like "B-1 2025"
    return /^B-\d+\s+\d{4}$/.test(this.name);
  }
  return false;
};

// Virtual for full description
batchSchema.virtual('fullDescription').get(function() {
  const batchNum = this.getBatchNumber();
  const year = this.getYear();
  const month = this.getMonth();
  
  if (this.category === 'fsd' && month && year) {
    return `fsd Batch ${batchNum} - ${month} ${year}`;
  } else if (this.category === 'bvoc' && year) {
    return `bvoc Batch ${batchNum} - ${year}`;
  }
  
  return `${this.category} Batch ${batchNum}`;
});

// Error handling for duplicate key
batchSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    console.error('❌ Duplicate batch error:', error);
    next(new Error(`Batch ${this.name} already exists in ${this.category}`));
  } else {
    next(error);
  }
});

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;