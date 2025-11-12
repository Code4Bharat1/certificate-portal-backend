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
        values: ['code4bharat', 'marketing-junction', 'FSD', 'BVOC', 'HR', 'DM', 'OPERTIONS DEPARTMENT'],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    batch: {
      type: String,
      required: function() {
        return ['FSD', 'BVOC'].includes(this.category);
      },
      trim: true,
      match: [/^B-\d+/, 'Batch must start with B- followed by a number'],
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^91[0-9]{10}$/, 'Phone must be in format 91XXXXXXXXXX (12 digits with country code)'],
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
      default: null,
      sparse: true, // Allows multiple null values but enforces uniqueness when present
    },
    parentPhone1: {
      type: String,
      trim: true,
      match: [/^91[0-9]{10}$/, 'Father Phone must be in format 91XXXXXXXXXX (12 digits with country code)'],
      default: null,
    },
    fatherEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid father email address'],
      default: null,
      sparse: true,
    },
    parentPhone2: {
      type: String,
      trim: true,
      match: [/^91[0-9]{10}$/, 'Mother Phone must be in format 91XXXXXXXXXX (12 digits with country code)'],
      default: null,
    },
    motherEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid mother email address'],
      default: null,
      sparse: true,
    },
    aadhaarCard: {
      type: String,
      trim: true,
      match: [/^[0-9]{12}$/, 'Aadhaar card must be exactly 12 digits'],
      default: null,
      sparse: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [100, 'Address cannot exceed 100 characters'],
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { 
    timestamps: true,
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

// Virtual for formatted parent phone 1 (Father)
peopleSchema.virtual('formattedParentPhone1').get(function() {
  if (this.parentPhone1 && this.parentPhone1.startsWith('91')) {
    return `+91 ${this.parentPhone1.substring(2)}`;
  }
  return this.parentPhone1;
});

// Virtual for formatted parent phone 2 (Mother)
peopleSchema.virtual('formattedParentPhone2').get(function() {
  if (this.parentPhone2 && this.parentPhone2.startsWith('91')) {
    return `+91 ${this.parentPhone2.substring(2)}`;
  }
  return this.parentPhone2;
});

// Virtual for status display
peopleSchema.virtual('statusDisplay').get(function() {
  return this.disabled ? 'Disabled' : 'Active';
});

// Index for efficient category-based queries
peopleSchema.index({ category: 1, createdAt: -1 });
peopleSchema.index({ category: 1, batch: 1 });
peopleSchema.index({ category: 1, disabled: 1 });
peopleSchema.index({ batch: 1, disabled: 1 });
peopleSchema.index({ email: 1 });

// Pre-save hook to validate batch requirement and email logic
peopleSchema.pre('save', function(next) {
  // Log disabled status changes
  if (this.isModified('disabled')) {
    console.log(`💾 [PRE-SAVE] ${this.name} - disabled status changing to: ${this.disabled}`);
  }

  // Ensure batch is provided for FSD and BVOC
  if (['FSD', 'BVOC'].includes(this.category) && !this.batch) {
    return next(new Error(`Batch is required for ${this.category} category`));
  }
  
  // Clear batch for categories that don't need it
  if (!['FSD', 'BVOC'].includes(this.category)) {
    this.batch = '';
  }

  // Validate parent emails only for BVOC category
  if (this.category !== 'BVOC') {
    this.fatherEmail = null;
    this.motherEmail = null;
    this.parentPhone1 = null;
    this.parentPhone2 = null;
  }

  // Validate Aadhaar card format if provided
  if (this.aadhaarCard && !/^[0-9]{12}$/.test(this.aadhaarCard)) {
    return next(new Error('Aadhaar card must be exactly 12 digits'));
  }

  // Validate address length if provided
  if (this.address && this.address.length > 100) {
    return next(new Error('Address cannot exceed 100 characters'));
  }

  // Validate email format
  if (this.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.email)) {
    return next(new Error('Invalid email format'));
  }

  // Validate father email format
  if (this.fatherEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.fatherEmail)) {
    return next(new Error('Invalid father email format'));
  }

  // Validate mother email format
  if (this.motherEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.motherEmail)) {
    return next(new Error('Invalid mother email format'));
  }
  
  next();
});

// Post-save hook for logging
peopleSchema.post('save', function(doc) {
  if (doc.disabled !== undefined) {
    console.log(`✅ [POST-SAVE] ${doc.name} saved with status: ${doc.disabled ? 'DISABLED' : 'ACTIVE'}`);
  }
});

// Pre-update hook
peopleSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Log update operations
  if (update.$set && update.$set.disabled !== undefined) {
    console.log(`🔄 [PRE-UPDATE] Updating disabled status to: ${update.$set.disabled}`);
  }
  
  // Check if category is being updated
  if (update.category && ['FSD', 'BVOC'].includes(update.category)) {
    if (!update.batch) {
      return next(new Error(`Batch is required for ${update.category} category`));
    }
  }

  // Validate Aadhaar card in update
  if (update.aadhaarCard && !/^[0-9]{12}$/.test(update.aadhaarCard)) {
    return next(new Error('Aadhaar card must be exactly 12 digits'));
  }

  // Validate address length in update
  if (update.address && update.address.length > 100) {
    return next(new Error('Address cannot exceed 100 characters'));
  }

  // Validate email in update
  if (update.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(update.email)) {
    return next(new Error('Invalid email format'));
  }

  // Validate father email in update
  if (update.fatherEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(update.fatherEmail)) {
    return next(new Error('Invalid father email format'));
  }

  // Validate mother email in update
  if (update.motherEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(update.motherEmail)) {
    return next(new Error('Invalid mother email format'));
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

// Static method to find enabled people only
peopleSchema.statics.findEnabled = function(filter = {}) {
  console.log('🔍 [QUERY] Finding enabled people with filter:', filter);
  return this.find({ ...filter, disabled: false }).sort({ createdAt: -1 });
};

// Static method to find disabled people only
peopleSchema.statics.findDisabled = function(filter = {}) {
  console.log('🔍 [QUERY] Finding disabled people with filter:', filter);
  return this.find({ ...filter, disabled: true }).sort({ createdAt: -1 });
};

// Static method to count enabled people
peopleSchema.statics.countEnabled = function(filter = {}) {
  return this.countDocuments({ ...filter, disabled: false });
};

// Static method to count disabled people
peopleSchema.statics.countDisabled = function(filter = {}) {
  return this.countDocuments({ ...filter, disabled: true });
};

// Static method to get category statistics
peopleSchema.statics.getCategoryStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        enabled: { $sum: { $cond: [{ $eq: ['$disabled', false] }, 1, 0] } },
        disabled: { $sum: { $cond: [{ $eq: ['$disabled', true] }, 1, 0] } },
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
        enabled: { $sum: { $cond: [{ $eq: ['$disabled', false] }, 1, 0] } },
        disabled: { $sum: { $cond: [{ $eq: ['$disabled', true] }, 1, 0] } },
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

// Instance method to check if person is active
peopleSchema.methods.isActive = function() {
  return !this.disabled;
};

// Instance method to toggle disabled status
peopleSchema.methods.toggleDisabled = async function() {
  const previousState = this.disabled;
  this.disabled = !this.disabled;
  
  console.log(`🔄 [TOGGLE] ${this.name}: ${previousState ? 'DISABLED' : 'ACTIVE'} → ${this.disabled ? 'DISABLED' : 'ACTIVE'}`);
  
  await this.save();
  return this;
};

// Instance method to enable person
peopleSchema.methods.enable = async function() {
  if (!this.disabled) {
    console.log(`⚠️ [ENABLE] ${this.name} is already enabled`);
    return this;
  }
  
  this.disabled = false;
  console.log(`✅ [ENABLE] Enabling ${this.name}`);
  await this.save();
  return this;
};

// Instance method to disable person
peopleSchema.methods.disable = async function() {
  if (this.disabled) {
    console.log(`⚠️ [DISABLE] ${this.name} is already disabled`);
    return this;
  }
  
  this.disabled = true;
  console.log(`🚫 [DISABLE] Disabling ${this.name}`);
  await this.save();
  return this;
};

// Instance method to get full details
peopleSchema.methods.getFullDetails = function() {
  return {
    name: this.name,
    category: this.category,
    batch: this.batch || 'N/A',
    phone: this.formattedPhone,
    phoneRaw: this.phone,
    email: this.email || 'Not provided',
    parentPhone1: this.formattedParentPhone1,
    fatherEmail: this.fatherEmail || 'Not provided',
    parentPhone2: this.formattedParentPhone2,
    motherEmail: this.motherEmail || 'Not provided',
    aadhaarCard: this.aadhaarCard || 'Not provided',
    address: this.address || 'Not provided',
    disabled: this.disabled,
    status: this.statusDisplay,
    isActive: this.isActive(),
    requiresBatch: this.requiresBatch(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const People = mongoose.model('People', peopleSchema);

export default People;