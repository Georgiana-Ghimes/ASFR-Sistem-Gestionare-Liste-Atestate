import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0, user_email, action_type, entity_type } = req.query;
    
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (user_email) {
      query += ` AND user_email = $${paramCount++}`;
      params.push(user_email);
    }
    
    if (action_type) {
      query += ` AND action_type = $${paramCount++}`;
      params.push(action_type);
    }
    
    if (entity_type) {
      query += ` AND entity_type = $${paramCount++}`;
      params.push(entity_type);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM audit_log WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;
    
    if (user_email) {
      countQuery += ` AND user_email = $${countParamCount++}`;
      countParams.push(user_email);
    }
    
    if (action_type) {
      countQuery += ` AND action_type = $${countParamCount++}`;
      countParams.push(action_type);
    }
    
    if (entity_type) {
      countQuery += ` AND entity_type = $${countParamCount++}`;
      countParams.push(entity_type);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete all audit logs (admin only)
router.delete('/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM audit_log RETURNING id');
    res.json({ message: 'All audit logs deleted', count: result.rows.length });
  } catch (error) {
    console.error('Delete all audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete selected audit logs (admin only)
router.delete('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No audit log IDs provided' });
    }
    
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(
      `DELETE FROM audit_log WHERE id IN (${placeholders}) RETURNING id`,
      ids
    );
    
    res.json({ message: 'Selected audit logs deleted', count: result.rows.length });
  } catch (error) {
    console.error('Delete selected audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
