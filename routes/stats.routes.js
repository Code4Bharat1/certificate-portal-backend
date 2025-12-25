//stats.routes.js
import express from 'express';
import { getDashboardStatistics, getActivityLog } from '../controllers/stats.controllers.js';
import { authenticate } from '../middleware/auth.middleware.js'; // If needed

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', authenticate, getDashboardStatistics);

// Activity log
router.get('/activity', authenticate, getActivityLog);

export default router;