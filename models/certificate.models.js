import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // internId: {
  //   type: String,
  //   trim: true,
  //   index: true
  // },
  category: {
    type: String,
    required: true,
    enum: ['fsd', 'bvoc', 'bootcamp', 'marketing-junction', 'code4bharat']
  },
  batch: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  // userPhone: {
  //   type: String,
  //   trim: true
  // },
  status: {
    type: String,
    enum: ['pending', 'downloaded'],
    default: 'pending'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

certificateSchema.index({ category: 1, batch: 1, internId: 1 });
certificateSchema.index({ category: 1, internId: 1, course: 1 });

certificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Certificate', certificateSchema);