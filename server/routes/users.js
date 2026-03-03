import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get ISF/CISF names for dropdown (authenticated users)
router.get('/isf-cisf-list', authenticateToken, async (req, res) => {
  try {
    let query = `SELECT DISTINCT 
        COALESCE(isf_name, cisf_name, scsc_name) as name 
       FROM users 
       WHERE isf_name IS NOT NULL OR cisf_name IS NOT NULL OR scsc_name IS NOT NULL`;
    
    const params = [];
    
    // Non-admin users can only see their own ISF/CISF/SCSC
    if (req.user.role !== 'admin') {
      const userIsfCisfScsc = req.user.isf_name || req.user.cisf_name || req.user.scsc_name;
      if (userIsfCisfScsc) {
        query += ` AND (isf_name = $1 OR cisf_name = $1 OR scsc_name = $1)`;
        params.push(userIsfCisfScsc);
      }
    }
    
    query += ` ORDER BY name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows.map(r => r.name));
  } catch (error) {
    console.error('Get ISF/CISF list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, isf_name, cisf_name, scsc_name, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, role, isf_name, cisf_name, scsc_name } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password and role are required' });
    }

    if (!['admin', 'isf', 'cisf', 'scsc'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'isf' && !isf_name) {
      return res.status(400).json({ error: 'ISF name is required for ISF role' });
    }

    if (role === 'cisf' && !cisf_name) {
      return res.status(400).json({ error: 'CISF name is required for CISF role' });
    }

    if (role === 'scsc' && !scsc_name) {
      return res.status(400).json({ error: 'SCSC name is required for SCSC role' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, role, isf_name, cisf_name, scsc_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, isf_name, cisf_name, scsc_name, created_at',
      [
        email, 
        hashedPassword, 
        role, 
        role === 'isf' ? isf_name : null,
        role === 'cisf' ? cisf_name : null,
        role === 'scsc' ? scsc_name : null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.patch('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, isf_name, cisf_name, scsc_name, password } = req.body;

    if (role && !['admin', 'isf', 'cisf', 'scsc'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (role) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (role === 'isf' && isf_name !== undefined) {
      updates.push(`isf_name = $${paramCount++}`);
      values.push(isf_name);
      updates.push(`cisf_name = NULL`);
      updates.push(`scsc_name = NULL`);
    } else if (role === 'cisf' && cisf_name !== undefined) {
      updates.push(`cisf_name = $${paramCount++}`);
      values.push(cisf_name);
      updates.push(`isf_name = NULL`);
      updates.push(`scsc_name = NULL`);
    } else if (role === 'scsc' && scsc_name !== undefined) {
      updates.push(`scsc_name = $${paramCount++}`);
      values.push(scsc_name);
      updates.push(`isf_name = NULL`);
      updates.push(`cisf_name = NULL`);
    } else if (role && role === 'admin') {
      updates.push(`isf_name = NULL`);
      updates.push(`cisf_name = NULL`);
      updates.push(`scsc_name = NULL`);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, role, isf_name, cisf_name, scsc_name, created_at`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
