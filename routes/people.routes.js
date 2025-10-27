import express from 'express';
import { body, validationResult } from 'express-validator';
import People from '../models/people.models.js';
import { authenticate } from '../middleware/auth.middleware.js'; // optional, if you use it

const router = express.Router();

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
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { name, category, batch, phone } = req.body;

      // Validate batch for FSD and BVOC
      if (['FSD', 'BVOC'].includes(category) && !batch) {
        return res.status(400).json({ 
          success: false,
          message: 'Batch is required for FSD and BVOC categories' 
        });
      }

      const phoneWithCountryCode = '91' + phone;

      const existing = await People.findOne({ phone: phoneWithCountryCode });
      if (existing) {
        return res.status(400).json({ 
          success: false,
          message: 'Person already exists with this phone number' 
        });
      }

      const newPerson = new People({ 
        name, 
        category, 
        batch: batch || '', 
        phone: phoneWithCountryCode 
      });
      await newPerson.save();

      res.status(201).json({ 
        success: true,
        message: 'Person added successfully', 
        person: newPerson 
      });
    } catch (error) {
      console.error('Error adding person:', error);
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
      return res.json({ success: true, names: [] });
    }

    // Format data for frontend - include all fields
    const names = people.map((p) => ({
      _id: p._id,
      internId: p._id, // For backward compatibility
      name: p.name,
      category: p.category,
      batch: p.batch || '',
      phone: p.phone,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    console.log('✅ Returning', names.length, 'people');

    res.json({ success: true, names });
  } catch (error) {
    console.error('Error fetching people:', error);
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
    const person = await People.findById(req.params.id);
    
    if (!person) {
      return res.status(404).json({ 
        success: false,
        message: 'Person not found' 
      });
    }

    res.json({ 
      success: true, 
      person: {
        _id: person._id,
        name: person.name,
        category: person.category,
        batch: person.batch || '',
        phone: person.phone,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error fetching person:', error);
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
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array() 
        });
      }

      const { name, category, batch, phone } = req.body;

      // Check if person exists
      const person = await People.findById(req.params.id);
      if (!person) {
        return res.status(404).json({ 
          success: false,
          message: 'Person not found' 
        });
      }

      // Validate batch requirement for FSD and BVOC
      const newCategory = category || person.category;
      if (['FSD', 'BVOC'].includes(newCategory) && !batch) {
        return res.status(400).json({ 
          success: false,
          message: 'Batch is required for FSD and BVOC categories' 
        });
      }

      // If phone is being updated, check for duplicates
      if (phone) {
        const phoneWithCountryCode = '91' + phone;
        const existing = await People.findOne({ 
          phone: phoneWithCountryCode,
          _id: { $ne: req.params.id } // Exclude current person
        });
        if (existing) {
          return res.status(400).json({ 
            success: false,
            message: 'Another person already exists with this phone number' 
          });
        }
        person.phone = phoneWithCountryCode;
      }

      // Update fields if provided
      if (name) person.name = name;
      if (category) person.category = category;
      if (batch !== undefined) person.batch = batch; // Allow empty string/null for non-FSD/BVOC

      await person.save();

      res.status(200).json({ 
        success: true,
        message: 'Person updated successfully', 
        person: {
          _id: person._id,
          name: person.name,
          category: person.category,
          batch: person.batch || '',
          phone: person.phone,
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
        }
      });
    } catch (error) {
      console.error('Error updating person:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: error.message 
      });
    }
  }
);

/**
 * @route   DELETE /api/people/:id
 * @desc    Delete a person
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await People.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Person not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Person deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/people/stats/summary
 * @desc    Get statistics (total people, per category, per batch)
 * @access  Public
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await People.countDocuments();
    
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

    res.json({
      success: true,
      stats: {
        total,
        byCategory: categoryStats.map(s => ({ category: s._id, count: s.count })),
        byBatch: batchStats.map(s => ({ 
          category: s._id.category, 
          batch: s._id.batch, 
          count: s.count 
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;