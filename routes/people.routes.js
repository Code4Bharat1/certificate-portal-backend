import express from 'express';
import { body, validationResult } from 'express-validator';
import People from '../models/people.models.js';
import { authenticate } from '../middleware/auth.middleware.js'; // optional, if you use it

const router = express.Router();
/**
 * @route   PUT /api/people/update-by-name
 * @desc    Update a person by name (instead of ID)
 * @access  Public
 */
router.put(
  '/update-by-name',
  [
    body('originalName').notEmpty().withMessage('Original name is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('category')
      .optional()
      .isIn(['code4bharat', 'marketing-junction', 'FSD', 'BVOC', 'HR'])
      .withMessage('Invalid category'),
    body('phone')
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone must be a 10-digit number'),
    body('parentPhone1')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage('Parent Phone 1 must be a 10-digit number'),
    body('parentPhone2')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage('Parent Phone 2 must be a 10-digit number'),
    body('aadhaarCard')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{12}$/)
      .withMessage('Aadhaar card must be exactly 12 digits'),
    body('address')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Address cannot exceed 100 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { originalName, originalPhone, name, category, batch, phone, parentPhone1, parentPhone2, aadhaarCard, address } = req.body;
      
      console.log('📝 Updating person by name:', { 
        originalName,
        originalPhone,
        newName: name,
        category,
        batch,
        phone,
        parentPhone1,
        parentPhone2,
      });

      // Find person by original name (and optionally phone for extra security)
      const query = {
        name: originalName
      };

      // If original phone is provided, use it as additional filter
      if (originalPhone) {
        query.phone = originalPhone;
      }

      console.log('🔍 Search query:', query);

      // Validate batch requirement for FSD and BVOC
      if (category && ['FSD', 'BVOC'].includes(category) && !batch) {
        console.error('❌ Batch required for category:', category);
        return res.status(400).json({ 
          success: false,
          message: 'Batch is required for FSD and BVOC categories' 
        });
      }

      // Build update object
      const updateData = {};
      
      if (name) updateData.name = name;
      if (category) updateData.category = category;
      if (batch !== undefined) updateData.batch = batch;

      // Update parent phones (handle null/empty)
      if (parentPhone1 !== undefined) {
        updateData.parentPhone1 = parentPhone1 ? '91' + parentPhone1 : null;
      }
      if (parentPhone2 !== undefined) {
        updateData.parentPhone2 = parentPhone2 ? '91' + parentPhone2 : null;
      }

      // Update aadhaar card (handle null/empty)
      if (aadhaarCard !== undefined) {
        updateData.aadhaarCard = aadhaarCard || null;
      }

      // Update address (handle null/empty)
      if (address !== undefined) {
        updateData.address = address ? address.trim() : null;
      }

      const person = await People.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!person) {
        console.error('❌ Person not found with name:', originalName);
        return res.status(404).json({ 
          success: false,
          message: 'Person not found with the given name' 
        });
      }

      res.status(200).json({ 
        success: true,
        message: 'Person updated successfully', 
        person: {
          name: person.name,
          category: person.category,
          batch: person.batch || '',
          phone: person.phone,
          parentPhone1: person.parentPhone1 || null,
          parentPhone2: person.parentPhone2 || null,
          aadhaarCard: person.aadhaarCard || null,
          address: person.address || null,
          disabled: person.disabled || false,
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
        }
      });
    } catch (error) {
      console.error('❌ Error updating person:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: error.message 
      });
    }
  }
);

/**
 * @route   POST /api/people
 * @desc    Add a new person
 * @access  Public
 */
router.post(
  '/',
  // authenticate, // uncomment if you want only logged-in users to add people
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('category')
      .isIn(['code4bharat', 'marketing-junction', 'FSD', 'BVOC', 'HR'])
      .withMessage('Invalid category'),
    body('phone')
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone must be a 10-digit number'),
    body('parentPhone1')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage('Parent Phone 1 must be a 10-digit number'),
    body('parentPhone2')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage('Parent Phone 2 must be a 10-digit number'),
    body('aadhaarCard')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{12}$/)
      .withMessage('Aadhaar card must be exactly 12 digits'),
    body('address')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Address cannot exceed 100 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { name, category, batch, phone, parentPhone1, parentPhone2, aadhaarCard, address } = req.body;
      console.log('📝 Adding new person:', { 
        name, category, batch, phone, 
        hasParentPhone1: !!parentPhone1,
        hasParentPhone2: !!parentPhone2,
        hasAadhaar: !!aadhaarCard,
        hasAddress: !!address
      });

      // Validate batch for FSD and BVOC
      if (['FSD', 'BVOC'].includes(category) && !batch) {
        console.error('❌ Batch required for category:', category);
        return res.status(400).json({ 
          success: false,
          message: 'Batch is required for FSD and BVOC categories' 
        });
      }

      const phoneWithCountryCode = '91' + phone;

      const existing = await People.findOne({ phone: phoneWithCountryCode });
      if (existing) {
        console.error('❌ Duplicate phone number:', phoneWithCountryCode);
        return res.status(400).json({ 
          success: false,
          message: 'Person already exists with this phone number' 
        });
      }

      const newPersonData = { 
        name, 
        category, 
        batch: batch || '', 
        phone: phoneWithCountryCode,
        disabled: false
      };

      // Add optional fields if provided
      if (parentPhone1) {
        newPersonData.parentPhone1 = '91' + parentPhone1;
      }
      if (parentPhone2) {
        newPersonData.parentPhone2 = '91' + parentPhone2;
      }
      if (aadhaarCard) {
        newPersonData.aadhaarCard = aadhaarCard;
      }
      if (address) {
        newPersonData.address = address.trim();
      }

      const newPerson = new People(newPersonData);
      await newPerson.save();

      console.log('✅ Person added successfully:', newPerson._id);
      res.status(201).json({ 
        success: true,
        message: 'Person added successfully', 
        person: newPerson 
      });
    } catch (error) {
      console.error('❌ Error adding person:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error', 
        error: error.message 
      });
    }
  }
);

/**
 * @route   GET /api/people
 * @desc    Get all people (with optional category and batch filters)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, batch } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (batch) filter.batch = batch;

    console.log('📊 Fetching with filter:', filter);

    const people = await People.find(filter).sort({ createdAt: -1 });

    if (people.length === 0) {
      console.log('⚠️ No people found with filter:', filter);
      return res.json({ success: true, names: [] });
    }

    // Format data for frontend - include all fields including disabled status
    const names = people.map((p) => ({
      _id: p._id,
      internId: p._id, // For backward compatibility
      name: p.name,
      category: p.category,
      batch: p.batch || '',
      phone: p.phone,
      parentPhone1: p.parentPhone1 || null,
      parentPhone2: p.parentPhone2 || null,
      aadhaarCard: p.aadhaarCard || null,
      address: p.address || null,
      disabled: p.disabled || false,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const enabledCount = names.filter(p => !p.disabled).length;
    const disabledCount = names.filter(p => p.disabled).length;

    console.log('✅ Returning people:', {
      total: names.length,
      enabled: enabledCount,
      disabled: disabledCount
    });

    res.json({ success: true, names });
  } catch (error) {
    console.error('❌ Error fetching people:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/people/:id
 * @desc    Get a single person by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Fetching person by ID:', req.params.id);
    
    const person = await People.findById(req.params.id);
    
    if (!person) {
      console.error('❌ Person not found:', req.params.id);
      return res.status(404).json({ 
        success: false,
        message: 'Person not found' 
      });
    }

    console.log('✅ Person found:', person.name, '- Disabled:', person.disabled);

    res.json({ 
      success: true, 
      person: {
        _id: person._id,
        name: person.name,
        category: person.category,
        batch: person.batch || '',
        phone: person.phone,
        parentPhone1: person.parentPhone1 || null,
        parentPhone2: person.parentPhone2 || null,
        aadhaarCard: person.aadhaarCard || null,
        address: person.address || null,
        disabled: person.disabled || false,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      }
    });
  } catch (error) {
    console.error('❌ Error fetching person:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   PUT /api/people/:id
 * @desc    Edit/update a person
 * @access  Public
 */
router.put(
  '/:id',
  // authenticate, // uncomment if you want only logged-in users to edit people
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('category')
      .optional()
      .isIn(['code4bharat', 'marketing-junction', 'FSD', 'BVOC', 'HR'])
      .withMessage('Invalid category'),
    body('phone')
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone must be a 10-digit number'),
    body('parentPhone1')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage('Parent Phone 1 must be a 10-digit number'),
    body('parentPhone2')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage('Parent Phone 2 must be a 10-digit number'),
    body('aadhaarCard')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{12}$/)
      .withMessage('Aadhaar card must be exactly 12 digits'),
    body('address')
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Address cannot exceed 100 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { name, category, batch, phone, parentPhone1, parentPhone2, aadhaarCard, address } = req.body;
      console.log('📝 Updating person:', req.params.id, { 
        name, category, batch, phone,
        hasParentPhone1: parentPhone1 !== undefined,
        hasParentPhone2: parentPhone2 !== undefined,
        hasAadhaar: aadhaarCard !== undefined,
        hasAddress: address !== undefined
      });

      // Validate batch requirement for FSD and BVOC
      if (category && ['FSD', 'BVOC'].includes(category) && !batch) {
        console.error('❌ Batch required for category:', category);
        return res.status(400).json({ 
          success: false,
          message: 'Batch is required for FSD and BVOC categories' 
        });
      }

      // Build update object
      const updateData = {};

      if (name) updateData.name = name;
      if (category) updateData.category = category;
      if (batch !== undefined) updateData.batch = batch;

      // If phone is being updated, check for duplicates
      if (phone) {
        const phoneWithCountryCode = '91' + phone;
        const existing = await People.findOne({ 
          phone: phoneWithCountryCode,
          _id: { $ne: req.params.id } // Exclude current person
        });
        if (existing) {
          console.error('❌ Duplicate phone number:', phoneWithCountryCode);
          return res.status(400).json({ 
            success: false,
            message: 'Another person already exists with this phone number' 
          });
        }
        updateData.phone = phoneWithCountryCode;
      }

      // Update parent phones (handle null/empty)
      if (parentPhone1 !== undefined) {
        updateData.parentPhone1 = parentPhone1 ? '91' + parentPhone1 : null;
      }
      if (parentPhone2 !== undefined) {
        updateData.parentPhone2 = parentPhone2 ? '91' + parentPhone2 : null;
      }

      // Update aadhaar card (handle null/empty)
      if (aadhaarCard !== undefined) {
        updateData.aadhaarCard = aadhaarCard || null;
      }

      // Update address (handle null/empty)
      if (address !== undefined) {
        updateData.address = address ? address.trim() : null;
      }

      const person = await People.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!person) {
        console.error('❌ Person not found:', req.params.id);
        return res.status(404).json({ 
          success: false,
          message: 'Person not found' 
        });
      }

      console.log('✅ Person updated successfully:', person._id);

      res.status(200).json({ 
        success: true,
        message: 'Person updated successfully', 
        person: {
          _id: person._id,
          name: person.name,
          category: person.category,
          batch: person.batch || '',
          phone: person.phone,
          parentPhone1: person.parentPhone1 || null,
          parentPhone2: person.parentPhone2 || null,
          aadhaarCard: person.aadhaarCard || null,
          address: person.address || null,
          disabled: person.disabled || false,
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
        }
      });
    } catch (error) {
      console.error('❌ Error updating person:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: error.message 
      });
    }
  }
);

/**
 * @route   PATCH /api/people/:id
 * @desc    Toggle disable/enable status of a person
 * @access  Public
 */
router.patch('/:id', async (req, res) => {
  try {
    const { disabled } = req.body;
    const personId = req.params.id;

    console.log('🔄 Toggle disable request:', {
      personId,
      newDisabledState: disabled
    });

    // Validate disabled field
    if (typeof disabled !== 'boolean') {
      console.error('❌ Invalid disabled value:', disabled);
      return res.status(400).json({
        success: false,
        message: 'disabled field must be a boolean value'
      });
    }

    const action = disabled ? 'disabled' : 'enabled';

    // Update disabled status
    const person = await People.findByIdAndUpdate(
      personId,
      { $set: { disabled } },
      { new: true, runValidators: true }
    );

    if (!person) {
      console.error('❌ Person not found:', personId);
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    console.log(`✅ Person ${action} successfully:`, {
      id: person._id,
      name: person.name,
      disabled: person.disabled
    });

    res.status(200).json({
      success: true,
      message: `Person ${action} successfully`,
      person: {
        _id: person._id,
        name: person.name,
        category: person.category,
        batch: person.batch || '',
        phone: person.phone,
        parentPhone1: person.parentPhone1 || null,
        parentPhone2: person.parentPhone2 || null,
        aadhaarCard: person.aadhaarCard || null,
        address: person.address || null,
        disabled: person.disabled,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      }
    });
  } catch (error) {
    console.error('❌ Error toggling disable status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/people/:id
 * @desc    Delete a person
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting person:', req.params.id);
    
    const deleted = await People.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.error('❌ Person not found:', req.params.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Person not found' 
      });
    }

    console.log('✅ Person deleted successfully:', deleted.name);

    res.status(200).json({ 
      success: true,
      message: 'Person deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting person:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/people/stats/summary
 * @desc    Get statistics (total people, per category, per batch, disabled count)
 * @access  Public
 */
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 Fetching statistics...');
    
    const total = await People.countDocuments();
    const totalDisabled = await People.countDocuments({ disabled: true });
    const totalEnabled = total - totalDisabled;
    
    // Count by category
    const categoryStats = await People.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count by batch (only for FSD and BVOC)
    const batchStats = await People.aggregate([
      { $match: { category: { $in: ['FSD', 'BVOC'] }, batch: { $exists: true, $ne: '' } } },
      { $group: { _id: { category: '$category', batch: '$batch' }, count: { $sum: 1 } } },
      { $sort: { '_id.category': 1, '_id.batch': 1 } }
    ]);

    // Count disabled people by category
    const disabledByCategory = await People.aggregate([
      { $match: { disabled: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count people with Aadhaar cards
    const withAadhaar = await People.countDocuments({ 
      aadhaarCard: { $exists: true, $ne: null } 
    });

    // Count people with addresses
    const withAddress = await People.countDocuments({ 
      address: { $exists: true, $ne: null } 
    });

    const stats = {
      total,
      totalEnabled,
      totalDisabled,
      withAadhaar,
      withAddress,
      byCategory: categoryStats.map(s => ({ category: s._id, count: s.count })),
      byBatch: batchStats.map(s => ({ 
        category: s._id.category, 
        batch: s._id.batch, 
        count: s.count 
      })),
      disabledByCategory: disabledByCategory.map(s => ({ 
        category: s._id, 
        count: s.count 
      }))
    };

    console.log('✅ Statistics fetched:', {
      total: stats.total,
      enabled: stats.totalEnabled,
      disabled: stats.totalDisabled,
      withAadhaar: stats.withAadhaar,
      withAddress: stats.withAddress
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;