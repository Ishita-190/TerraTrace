const express = require('express');
const { pool } = require('../utils/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function createToken(user) {
  const payload = { id: user.id, email: user.email, name: user.name };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Add authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    console.log('[Auth] Token verified for user:', payload.id);
    next();
  } catch (err) {
    console.log('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = createToken(user);
    return res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Missing email or password' });
    }

    const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = createToken(user);
    return res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/me (verify token and return user profile)
router.get('/me', authenticate, async (req, res) => {
  try {
    const idNum = parseInt(req.user.id, 10);
    const result = await pool.query('SELECT id, name, email, created_at, survey_completed, survey_data FROM users WHERE id = $1', [idNum]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = result.rows[0];
    return res.json({ success: true, user });
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/survey - submit user survey
router.post('/survey', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const surveyData = req.body;
    
    if (!surveyData) {
      return res.status(400).json({ success: false, error: 'Survey data is required' });
    }

    // Store survey data in JSON format
    const result = await pool.query(
      `UPDATE users 
       SET survey_data = $1, survey_completed = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, survey_completed, survey_data`,
      [JSON.stringify(surveyData), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updatedUser = result.rows[0];
    return res.json({ 
      success: true, 
      message: 'Survey submitted successfully',
      user: updatedUser 
    });
  } catch (err) {
    console.error('[Auth] Survey error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;