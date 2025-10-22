import express from 'express';
import { body, validationResult } from 'express-validator';
import login from '../controllers/auth.controllers.js';

const router = express.Router();

router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], login)

export default router;
