import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['FSD', 'BVOC'],
        message: '{VALUE} is not a valid category. Must be FSD or BVOC',
      },
    },
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      match: [/^B-\d+$/, 'Batch name must be in format B-1, B-2, etc.'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique batch names per category
batchSchema.index({ category: 1, name: 1 }, { unique: true });

// Static method to find batches by category
batchSchema.statics.findByCategory = function(category) {
  return this.find({ category }).sort({ name: 1 });
};

// Static method to get all batches formatted
batchSchema.statics.getAllBatchesFormatted = async function() {
  const batches = await this.find().sort({ category: 1, name: 1 });
  
  const formatted = {
    FSD: [],
    BVOC: []
  };

  batches.forEach(batch => {
    if (batch.category === 'FSD' || batch.category === 'BVOC') {
      formatted[batch.category].push(batch.name);
    }
  });

  return formatted;
};

// Instance method to get formatted output
batchSchema.methods.getFormatted = function() {
  return {
    id: this._id,
    category: this.category,
    name: this.name,
    createdAt: this.createdAt,
  };
};

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;