import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bgs-transport-secret-2026';

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'BGS@2026#';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign(
    { username: ADMIN_USERNAME, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, username: ADMIN_USERNAME });
});

// GET /api/auth/verify
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

export default router;
