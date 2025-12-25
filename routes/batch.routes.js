import express from 'express';
import { body, validationResult } from 'express-validator';
import Batch from '../models/batch.models.js';
import People from '../models/people.models.js';
import { authenticate } from '../middleware/auth.middleware.js'; // Optional

const router = express.Router();

/**
 * @route   GET /api/batches
 * @desc    Get all batches grouped by category
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;



    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const batches = await Batch.find(filter).sort({ category: 1, name: 1 });

    // Format response as { FSD: ['B-1 (June-2025)', 'B-2 (July-2025)'], BVOC: ['B-1 2025'] }
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
      batches: formattedBatches,
      count: {
        FSD: formattedBatches.FSD.length,
        BVOC: formattedBatches.BVOC.length,
        total: formattedBatches.FSD.length + formattedBatches.BVOC.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching batches:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/batches/list
 * @desc    Get all batches as array (detailed format with IDs)
 * @access  Public
 */
router.get('/list', async (req, res) => {
  try {
    const { category } = req.query;

  

    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const batches = await Batch.find(filter).sort({ category: 1, name: 1 });

    const formattedBatches = batches.map(batch => ({
      id: batch._id,
      category: batch.category,
      name: batch.name,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt
    }));


    res.json({ 
      success: true, 
      batches: formattedBatches,
      count: formattedBatches.length
    });
  } catch (error) {
    console.error('❌ Error fetching batch list:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/batches/:id
 * @desc    Get a single batch by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
   

    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Get count of people in this batch
    const peopleCount = await People.countDocuments({
      category: batch.category,
      batch: batch.name
    });


    res.json({
      success: true,
      batch: {
        id: batch._id,
        category: batch.category,
        name: batch.name,
        peopleCount,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching batch:', error);
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
 * @body    { category: 'FSD' | 'BVOC', batchName: 'B-1 (June-2025)' }
 */
router.post('/', async (req, res) => {
  try {
    const { category, batchName } = req.body;


    // Validate input
    if (!category || !batchName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category and batchName are required'
      });
    }

    if (!['FSD', 'BVOC'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category must be FSD or BVOC' 
      });
    }

    // The batchName should already be formatted from frontend
    // Example: "B-1 (June-2025)" for FSD or "B-1 2025" for BVOC
    const trimmedName = batchName.trim();

    // Check if batch already exists
    const existing = await Batch.findOne({ 
      category, 
      name: trimmedName 
    });

    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: `Batch ${trimmedName} already exists in ${category}` 
      });
    }

    // Create new batch
    const newBatch = new Batch({ 
      category, 
      name: trimmedName 
    });
    
    await newBatch.save();


    res.status(201).json({ 
      success: true,
      message: `Batch ${trimmedName} added to ${category}`,
      batch: {
        id: newBatch._id,
        category: newBatch.category,
        name: newBatch.name,
        createdAt: newBatch.createdAt,
        updatedAt: newBatch.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error creating batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   PUT /api/batches/update-by-name
 * @desc    Update a batch by category and old name
 * @access  Public
 * @body    { category: 'FSD' | 'BVOC', oldBatchName: 'B-1 (June-2025)', newBatchName: 'B-2 (July-2025)' }
 */
router.put('/update-by-name', async (req, res) => {
  try {
    const { category, oldBatchName, newBatchName } = req.body;


    // Validate input
    if (!category || !oldBatchName || !newBatchName) {
      return res.status(400).json({
        success: false,
        message: 'Category, oldBatchName, and newBatchName are required'
      });
    }

    if (!['FSD', 'BVOC'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Category must be FSD or BVOC'
      });
    }

    // Find the old batch
    const batch = await Batch.findOne({ category, name: oldBatchName });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if new name already exists (and is different from old name)
    if (newBatchName !== oldBatchName) {
      const duplicate = await Batch.findOne({
        category,
        name: newBatchName
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Batch ${newBatchName} already exists in ${category}`
        });
      }
    }

    // Update batch name
    batch.name = newBatchName.trim();
    await batch.save();

    // Update all people with this batch
    const updateResult = await People.updateMany(
      { category, batch: oldBatchName },
      { $set: { batch: newBatchName } }
    );

    console.log(`✅ Batch updated: ${oldBatchName} → ${newBatchName}`);
    console.log(`✅ Updated ${updateResult.modifiedCount} people with new batch name`);

    res.json({
      success: true,
      message: `Batch updated successfully. ${updateResult.modifiedCount} people updated.`,
      batch: {
        id: batch._id,
        category: batch.category,
        name: batch.name,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt
      },
      peopleUpdated: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error updating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/batches/:id
 * @desc    Update a batch by ID
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, category } = req.body;
    const batchId = req.params.id;


    if (!name && !category) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or category) is required'
      });
    }

    // Find the batch
    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const oldName = batch.name;
    const oldCategory = batch.category;

    // Update fields if provided
    if (name) batch.name = name.trim();
    if (category) {
      if (!['FSD', 'BVOC'].includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Category must be FSD or BVOC'
        });
      }
      batch.category = category;
    }

    // Check for duplicate after update
    if (name || category) {
      const duplicate = await Batch.findOne({
        _id: { $ne: batchId },
        category: batch.category,
        name: batch.name
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Batch ${batch.name} already exists in ${batch.category}`
        });
      }
    }

    await batch.save();

    // Update all people with this batch
    if (name && name !== oldName) {
      const updateResult = await People.updateMany(
        { category: oldCategory, batch: oldName },
        { $set: { batch: batch.name } }
      );
      console.log(`✅ Updated ${updateResult.modifiedCount} people: ${oldName} → ${batch.name}`);
    }


    res.json({
      success: true,
      message: 'Batch updated successfully',
      batch: {
        id: batch._id,
        category: batch.category,
        name: batch.name,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error updating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/batches/:id
 * @desc    Delete a batch by ID
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const batchId = req.params.id;


    const batch = await Batch.findById(batchId);
    
    if (!batch) {
      return res.status(404).json({ 
        success: false,
        message: 'Batch not found' 
      });
    }

    // Check if any people are using this batch
    const peopleCount = await People.countDocuments({
      category: batch.category,
      batch: batch.name
    });

    if (peopleCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch ${batch.name}. It has ${peopleCount} people assigned. Please reassign or remove them first.`,
        peopleCount
      });
    }

    await Batch.findByIdAndDelete(batchId);


    res.json({ 
      success: true,
      message: `Batch ${batch.name} deleted successfully` 
    });
  } catch (error) {
    console.error('❌ Error deleting batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/batches (with body)
 * @desc    Delete a batch by category and batchName (matches frontend)
 * @access  Public
 * @body    { category: 'FSD' | 'BVOC', batchName: 'B-1 (June-2025)' }
 */
router.delete('/', async (req, res) => {
  try {
    const { category, batchName } = req.body;


    // Validate input
    if (!category || !batchName) {
      return res.status(400).json({
        success: false,
        message: 'Category and batchName are required'
      });
    }

    if (!['FSD', 'BVOC'].includes(category)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category. Must be FSD or BVOC' 
      });
    }

    const batch = await Batch.findOne({ category, name: batchName });
    
    if (!batch) {
      return res.status(404).json({ 
        success: false,
        message: `Batch ${batchName} not found in ${category}` 
      });
    }

    // Check if any people are using this batch
    const peopleCount = await People.countDocuments({
      category: batch.category,
      batch: batch.name
    });

    if (peopleCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch ${batch.name}. It has ${peopleCount} people assigned. Please reassign or remove them first.`,
        peopleCount
      });
    }

    await Batch.findByIdAndDelete(batch._id);


    res.json({ 
      success: true,
      message: `Batch ${batchName} deleted successfully` 
    });
  } catch (error) {
    console.error('❌ Error deleting batch:', error);
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

    // Get people count per batch
    const fsdBatches = await Batch.find({ category: 'FSD' }).sort({ name: 1 });
    const bvocBatches = await Batch.find({ category: 'BVOC' }).sort({ name: 1 });

    // Get detailed stats for each batch
    const fsdStats = await Promise.all(
      fsdBatches.map(async (batch) => {
        const count = await People.countDocuments({
          category: 'FSD',
          batch: batch.name
        });
        const enabledCount = await People.countDocuments({
          category: 'FSD',
          batch: batch.name,
          disabled: false
        });
        const disabledCount = count - enabledCount;

        return {
          id: batch._id,
          name: batch.name,
          peopleCount: count,
          enabled: enabledCount,
          disabled: disabledCount,
          createdAt: batch.createdAt
        };
      })
    );

    const bvocStats = await Promise.all(
      bvocBatches.map(async (batch) => {
        const count = await People.countDocuments({
          category: 'BVOC',
          batch: batch.name
        });
        const enabledCount = await People.countDocuments({
          category: 'BVOC',
          batch: batch.name,
          disabled: false
        });
        const disabledCount = count - enabledCount;

        return {
          id: batch._id,
          name: batch.name,
          peopleCount: count,
          enabled: enabledCount,
          disabled: disabledCount,
          createdAt: batch.createdAt
        };
      })
    );

    const totalFsdPeople = fsdStats.reduce((sum, b) => sum + b.peopleCount, 0);
    const totalBvocPeople = bvocStats.reduce((sum, b) => sum + b.peopleCount, 0);


    res.json({
      success: true,
      stats: {
        batchCount: {
          total,
          FSD: fsdCount,
          BVOC: bvocCount
        },
        peopleCount: {
          FSD: totalFsdPeople,
          BVOC: totalBvocPeople,
          total: totalFsdPeople + totalBvocPeople
        },
        FSD: fsdStats,
        BVOC: bvocStats
      }
    });
  } catch (error) {
    console.error('❌ Error fetching batch stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/batches/category/:category/people
 * @desc    Get all people in a specific category's batches
 * @access  Public
 */
router.get('/category/:category/people', async (req, res) => {
  try {
    const { category } = req.params;



    if (!['FSD', 'BVOC'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be FSD or BVOC'
      });
    }

    const batches = await Batch.find({ category }).sort({ name: 1 });
    
    const batchData = await Promise.all(
      batches.map(async (batch) => {
        const people = await People.find({
          category,
          batch: batch.name
        }).sort({ name: 1 });

        return {
          batchId: batch._id,
          batchName: batch.name,
          peopleCount: people.length,
          people: people.map(p => ({
            id: p._id,
            name: p.name,
            phone: p.phone,
            disabled: p.disabled
          }))
        };
      })
    );


    res.json({
      success: true,
      category,
      batches: batchData,
      totalPeople: batchData.reduce((sum, b) => sum + b.peopleCount, 0)
    });
  } catch (error) {
    console.error('❌ Error fetching category people:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/batches/bulk-create
 * @desc    Create multiple batches at once
 * @access  Public
 */
router.post('/bulk-create', async (req, res) => {
  try {
    const { batches } = req.body;

    if (!Array.isArray(batches) || batches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Batches array is required'
      });
    }


    const results = {
      successful: [],
      failed: []
    };

    for (const batch of batches) {
      try {
        const { category, batchName } = batch;

        if (!['FSD', 'BVOC'].includes(category)) {
          results.failed.push({
            batch,
            error: 'Invalid category'
          });
          continue;
        }

        const existing = await Batch.findOne({ 
          category, 
          name: batchName 
        });

        if (existing) {
          results.failed.push({
            batch,
            error: 'Batch already exists'
          });
          continue;
        }

        const newBatch = new Batch({ 
          category, 
          name: batchName 
        });
        
        await newBatch.save();

        results.successful.push({
          id: newBatch._id,
          category: newBatch.category,
          name: newBatch.name
        });

      } catch (error) {
        results.failed.push({
          batch,
          error: error.message
        });
      }
    }


    res.status(200).json({
      success: true,
      message: `Created ${results.successful.length} batches, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    console.error('❌ Error in bulk create:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;