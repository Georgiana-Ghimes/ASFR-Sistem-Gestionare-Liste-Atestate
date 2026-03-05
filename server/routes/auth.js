import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parolă sunt obligatorii' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        isf_name: user.isf_name,
        cisf_name: user.cisf_name,
        scsc_name: user.scsc_name,
        has_atestate_role: user.has_atestate_role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    await logAudit(
      user.email,
      'LOGIN',
      'auth',
      user.id,
      { role: user.role },
      req.ip
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isf_name: user.isf_name,
        cisf_name: user.cisf_name,
        scsc_name: user.scsc_name,
        has_atestate_role: user.has_atestate_role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, isf_name, cisf_name, scsc_name, has_atestate_role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Audit log
    await logAudit(
      req.user.email,
      'LOGOUT',
      'auth',
      req.user.id,
      { role: req.user.role },
      req.ip
    );

    res.json({ message: 'Deconectat cu succes' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

export default router;
