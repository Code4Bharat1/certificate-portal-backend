import express from 'express';
import { body, validationResult } from 'express-validator';
import Batch from '../models/batch.models.js';
import { authenticate } from '../middleware/auth.middleware.js'; // optional

const router = express.Router();

/**
 * @route   GET /api/batches
 * @desc    Get all batches
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    let filter = {};
    if (category) filter.category = category;

    const batches = await Batch.find(filter).sort({ category: 1, name: 1 });

    // Format response as { FSD: ['B-1', 'B-2'], BVOC: ['B-1'] }
    const formattedBatches = {
      FSD: [],
      BVOC: []
    };

    batches.forEach(batch => {
      if (batch.category === 'FSD' || batch.category === 'BVOC') {
        formattedBatches[batch.category].push(batch.name);
      }
    });

    res.json({ 
      success: true, 
      batches: formattedBatches 
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/batches/list
 * @desc    Get all batches as array (detailed format)
 * @access  Public
 */
router.get('/list', async (req, res) => {
  try {
    const { category } = req.query;

    let filter = {};
    if (category) filter.category = category;

    const batches = await Batch.find(filter).sort({ category: 1, name: 1 });

    const formattedBatches = batches.map(batch => ({
      id: batch._id,
      category: batch.category,
      name: batch.name,
      createdAt: batch.createdAt,
    }));

    res.json({ 
      success: true, 
      batches: formattedBatches 
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/batches
 * @desc    Create a new batch
 * @access  Public
 */
router.post(
  '/',
  [
    body('category')
      .isIn(['FSD', 'BVOC'])
      .withMessage('Category must be FSD or BVOC'),
    body('name')
      .matches(/^B-\d+$/)
      .withMessage('Batch name must be in format B-1, B-2, etc.'),
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

      const { category, name } = req.body;

      // Check if batch already exists
      const existing = await Batch.findOne({ category, name });
      if (existing) {
        return res.status(400).json({ 
          success: false,
          message: 'This batch already exists' 
        });
      }

      const newBatch = new Batch({ category, name });
      await newBatch.save();

      res.status(201).json({ 
        success: true,
        message: `Batch ${name} added to ${category}`,
        batch: {
          id: newBatch._id,
          category: newBatch.category,
          name: newBatch.name,
          createdAt: newBatch.createdAt,
        }
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: error.message 
      });
    }
  }
);

/**
 * @route   DELETE /api/batches/:id
 * @desc    Delete a batch by ID
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ 
        success: false,
        message: 'Batch not found' 
      });
    }

    res.json({ 
      success: true,
      message: `Batch ${batch.name} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/batches/by-name/:category/:name
 * @desc    Delete a batch by category and name
 * @access  Public
 */
router.delete('/by-name/:category/:name', async (req, res) => {
  try {
    const { category, name } = req.params;

    // Validate category
    if (!['FSD', 'BVOC'].includes(category)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category. Must be FSD or BVOC' 
      });
    }

    const batch = await Batch.findOneAndDelete({ category, name });
    
    if (!batch) {
      return res.status(404).json({ 
        success: false,
        message: 'Batch not found' 
      });
    }

    res.json({ 
      success: true,
      message: `Batch ${name} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/batches/stats
 * @desc    Get batch statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const fsdCount = await Batch.countDocuments({ category: 'FSD' });
    const bvocCount = await Batch.countDocuments({ category: 'BVOC' });
    const total = fsdCount + bvocCount;

    res.json({
      success: true,
      stats: {
        total,
        FSD: fsdCount,
        BVOC: bvocCount,
      }
    });
  } catch (error) {
    console.error('Error fetching batch stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;