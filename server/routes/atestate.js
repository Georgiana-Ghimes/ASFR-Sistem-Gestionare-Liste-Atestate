import express from 'express';
import multer from 'multer';
import path from 'path';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware to check if user has atestate role
const requireAtestateRole = (req, res, next) => {
  if (!req.user.has_atestate_role && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Atestate role required.' });
  }
  next();
};

// Get all atestate (admin only)
router.get('/', authenticateToken, requireAtestateRole, async (req, res) => {
  try {
    let query = 'SELECT * FROM atestate';
    const params = [];
    
    // Non-admin users can only see their own atestate
    if (req.user.role !== 'admin') {
      query += ' WHERE created_by_email = $1';
      params.push(req.user.email);
    }
    
    query += ' ORDER BY created_date DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get atestate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's atestate
router.get('/my-atestate', authenticateToken, requireAtestateRole, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM atestate WHERE created_by_email = $1 ORDER BY created_date DESC',
      [req.user.email]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get my atestate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new atestat
router.post('/', authenticateToken, requireAtestateRole, upload.single('pdf'), async (req, res) => {
  try {
    const { numar_atestat, data_atestat, nume_complet, cnp, functie, observatii } = req.body;

    if (!numar_atestat || !data_atestat || !nume_complet || !cnp || !functie || !req.file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check uniqueness
    const existing = await pool.query(
      'SELECT id FROM atestate WHERE numar_atestat = $1',
      [numar_atestat]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Numărul atestatului există deja' });
    }

    const result = await pool.query(
      `INSERT INTO atestate 
       (numar_atestat, data_atestat, nume_complet, cnp, functie, pdf_url, pdf_filename, 
        observatii, created_by_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        numar_atestat,
        data_atestat,
        nume_complet,
        cnp,
        functie,
        `/uploads/${req.file.filename}`,
        req.file.originalname,
        observatii || null,
        req.user.email
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create atestat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete atestat (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;

    const result = await pool.query('DELETE FROM atestate WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Atestat not found' });
    }

    res.json({ message: 'Atestat deleted successfully' });
  } catch (error) {
    console.error('Delete atestat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
