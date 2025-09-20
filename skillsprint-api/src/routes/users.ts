import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import jwt from 'jsonwebtoken';


const router = Router();

// 🧪 Validation schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// 📝 Register new user
router.post('/', async (req, res) => {
  try {
    const { email, password } = RegisterSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(`
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, created_at
    `, [email, hashedPassword]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === '23505') { // Unique violation
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// 🔐 Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    res.json({ success: true, message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});


// 🚪 Logout (placeholder)
router.post('/logout', authenticate, (req:AuthenticatedRequest, res) => {
  // In a real app, you'd blacklist the token or let it expire
  res.json({ success: true, message: 'Logged out successfully', userId: req.user?.userId });
});


// 🔍 Get user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT id, email, created_at FROM users WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// 🔢 Get total XP across all sprints
router.get('/xp/total', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      'SELECT COALESCE(SUM(xp_earned), 0) AS total_xp FROM xp_logs WHERE user_id = $1',
      [userId]
    );

    res.json({ success: true, totalXp: parseInt(result.rows[0].total_xp) });
  } catch (error) {
    console.error('Error fetching total XP:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch total XP' });
  }
});

// 📦 Get XP for a specific sprint
router.get('/xp/sprint/:sprintId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { sprintId } = req.params;

    const result = await pool.query(
      'SELECT COALESCE(SUM(xp_earned), 0) AS sprint_xp FROM xp_logs WHERE user_id = $1 AND sprint_id = $2',
      [userId, sprintId]
    );

    res.json({ success: true, sprintXp: parseInt(result.rows[0].sprint_xp) });
  } catch (error) {
    console.error('Error fetching sprint XP:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sprint XP' });
  }
});

export default router;