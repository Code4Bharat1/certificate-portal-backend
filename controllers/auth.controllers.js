// import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
// import User from '../models/user.models.js';

// Helper: admin creds from env with fallback to 'C4B'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'C4B';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'C4B';
// const ADMIN_ID = process.env.ADMIN_ID || 'static-admin-id';

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // 1) Static admin check (env-configurable, fallback to 'C4B')
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // create admin token
      const token = jwt.sign(
        { username: ADMIN_USERNAME, role: 'C4B admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Login successful (admin)',
        token,
        user: {
          username: ADMIN_USERNAME,
          role: 'admin'
        }
      });
    }

    // 2) Normal user lookup in DB
    // const user = await User.findOne({ username });
    // if (!user) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid credentials'
    //   });
    // }

    // const isPasswordValid = await user.comparePassword(password);
    // if (!isPasswordValid) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid credentials'
    //   });
    // }

    // const token = jwt.sign(
    //   { userId: user._id, username: user.username, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: '24h' }
    // );

    // res.json({
    //   success: true,
    //   message: 'Login successful',
    //   token,
    //   user: {
    //     id: user._id,
    //     username: user.username,
    //     role: user.role
    //   }
    // });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export default login;