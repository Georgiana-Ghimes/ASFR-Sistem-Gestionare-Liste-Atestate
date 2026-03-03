import express from 'express';
import multer from 'multer';
import path from 'path';
import archiver from 'archiver';
import fs from 'fs';
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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
router.post('/', authenticateToken, requireAtestateRole, upload.fields([
  { name: 'pdf1', maxCount: 1 },
  { name: 'pdf2', maxCount: 1 },
  { name: 'pdf3', maxCount: 1 }
]), async (req, res) => {
  try {
    const { numar_atestat, data_atestat, nume_complet, din_cadrul, functie, observatii } = req.body;

    if (!numar_atestat || !data_atestat || !nume_complet || !din_cadrul || !functie) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if at least one file is uploaded
    if (!req.files || (!req.files.pdf1 && !req.files.pdf2 && !req.files.pdf3)) {
      return res.status(400).json({ error: 'At least one PDF file is required' });
    }

    // Check uniqueness
    const existing = await pool.query(
      'SELECT id FROM atestate WHERE numar_atestat = $1',
      [numar_atestat]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Numărul atestatului există deja' });
    }

    // Get file paths
    const pdf1_url = req.files.pdf1 ? `/uploads/${req.files.pdf1[0].filename}` : null;
    const pdf2_url = req.files.pdf2 ? `/uploads/${req.files.pdf2[0].filename}` : null;
    const pdf3_url = req.files.pdf3 ? `/uploads/${req.files.pdf3[0].filename}` : null;
    
    const pdf1_filename = req.files.pdf1 ? req.files.pdf1[0].originalname : null;
    const pdf2_filename = req.files.pdf2 ? req.files.pdf2[0].originalname : null;
    const pdf3_filename = req.files.pdf3 ? req.files.pdf3[0].originalname : null;

    const result = await pool.query(
      `INSERT INTO atestate 
       (numar_atestat, data_atestat, nume_complet, din_cadrul, functie, 
        pdf1_url, pdf1_filename, pdf2_url, pdf2_filename, pdf3_url, pdf3_filename,
        observatii, created_by_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        numar_atestat,
        data_atestat,
        nume_complet,
        din_cadrul,
        functie,
        pdf1_url,
        pdf1_filename,
        pdf2_url,
        pdf2_filename,
        pdf3_url,
        pdf3_filename,
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

// Download atestat files as ZIP
router.get('/:id/download', authenticateToken, requireAtestateRole, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get atestat
    const result = await pool.query('SELECT * FROM atestate WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Atestat not found' });
    }
    
    const atestat = result.rows[0];
    
    // Check access rights
    if (req.user.role !== 'admin' && atestat.created_by_email !== req.user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.attachment(`atestat_${atestat.numar_atestat}.zip`);
    archive.pipe(res);
    
    // Add files to archive
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const uploadsDir = path.join(__dirname, '..');
    
    if (atestat.pdf1_url && atestat.pdf1_filename) {
      const filePath = path.join(uploadsDir, atestat.pdf1_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `Exemplar_1_${atestat.pdf1_filename}` });
      }
    }
    
    if (atestat.pdf2_url && atestat.pdf2_filename) {
      const filePath = path.join(uploadsDir, atestat.pdf2_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `Exemplar_2_${atestat.pdf2_filename}` });
      }
    }
    
    if (atestat.pdf3_url && atestat.pdf3_filename) {
      const filePath = path.join(uploadsDir, atestat.pdf3_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `Exemplar_3_${atestat.pdf3_filename}` });
      }
    }
    
    archive.finalize();
  } catch (error) {
    console.error('Download atestat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
