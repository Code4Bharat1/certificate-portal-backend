import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import statsControllers from '../controllers/stats.controllers.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticate, statsControllers.getDashboardStatistics)

// Get activity log
router.get('/activity', authenticate, statsControllers.getActivityLog)

export default router;  