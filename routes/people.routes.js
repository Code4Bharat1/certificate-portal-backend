import express from 'express';
import { body, validationResult } from 'express-validator';
import People from '../models/people.models.js';
import { authenticate } from '../middleware/auth.middleware.js'; // optional, if you use it

const router = express.Router();

/**
 * @route   POST /api/people
 * @desc    Add a new person
 * @access  Private (if auth enabled)
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
    //   const errors = validationResult(req);
    //   if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    //   }

      const { name, category, batch, phone } = req.body;

      const phoneWithCountryCode = '91' + phone;
      // console.log(phoneWithCountryCode);
      

      const existing = await People.findOne({ phone: phoneWithCountryCode });
      if (existing) {
        return res.status(400).json({ message: 'Person already exists with this phone number' });
      }

      const newPerson = new People({ name, category, batch, phone: phoneWithCountryCode });
      await newPerson.save();

      res.status(201).json({ message: 'Person added successfully', person: newPerson });
    } catch (error) {
      console.error('Error adding person:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/people
 * @desc    Get all people
 * @access  Private (optional)
 */
router.get('/', async (req, res) => {
  try {
    const { category, batch } = req.query; // ✅ Use req.query, not req.params

    let filter = {};
    if (category) filter.category = category;
    if (batch) filter.batch = batch;

    const people = await People.find(filter).sort({ createdAt: -1 });

    if (people.length === 0) {
      return res.json({ success: true, names: [] });
    }

    // Format data for frontend
    const names = people.map((p) => ({
    //   internId: p._id,
      name: p.name,
      phone: p.phone,
    }));

    res.json({ success: true, names });
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/people/:id
 * @desc    Edit/update a person
 * @access  Private (optional)
 */
router.put(
  '/edit',
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
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, category, batch, phone } = req.body;

      // Check if person exists
      // const person = await People.findById(req.params.id);
      const person = await People.findone({ name });
      if (!person) {
        return res.status(404).json({ message: 'Person not found' });
      }

      // If phone is being updated, check for duplicates
      if (phone) {
        const phoneWithCountryCode = '91' + phone;
        const existing = await People.findOne({ 
          phone: phoneWithCountryCode,
          _id: { $ne: req.params.id } // Exclude current person
        });
        if (existing) {
          return res.status(400).json({ message: 'Another person already exists with this phone number' });
        }
        person.phone = phoneWithCountryCode;
      }

      // Update fields if provided
      if (name) person.name = name;
      if (category) person.category = category;
      if (batch !== undefined) person.batch = batch; // Allow empty string/null

      await person.save();

      res.status(200).json({ message: 'Person updated successfully', person });
    } catch (error) {
      console.error('Error updating person:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/people/:id
 * @desc    Delete a person
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await People.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Person not found' });

    res.status(200).json({ message: 'Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;