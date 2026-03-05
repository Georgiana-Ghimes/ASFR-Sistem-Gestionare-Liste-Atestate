import express from 'express';
import multer from 'multer';
import path from 'path';
import { format } from 'date-fns';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

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

// Get all lists (ISF/CISF/admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM liste_tiparire';
    const params = [];
    
    // Non-admin users can only see their own ISF/CISF lists
    if (req.user.role !== 'admin') {
      const userIsfCisfScsc = req.user.isf_name || req.user.cisf_name || req.user.scsc_name;
      if (userIsfCisfScsc) {
        query += ' WHERE isf_name = $1';
        params.push(userIsfCisfScsc);
      }
    }
    
    query += ' ORDER BY created_date DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Eroare interna de server' });
  }
});

// Get user's lists (ISF)
router.get('/my-lists', authenticateToken, async (req, res) => {
  try {
    const userIsfCisfScsc = req.user.isf_name || req.user.cisf_name || req.user.scsc_name;
    
    if (!userIsfCisfScsc) {
      return res.json([]);
    }
    
    const result = await pool.query(
      'SELECT * FROM liste_tiparire WHERE isf_name = $1 ORDER BY created_date DESC',
      [userIsfCisfScsc]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get my lists error:', error);
    res.status(500).json({ error: 'Eroare interna de server' });
  }
});

// Create new list (ISF/CISF/SCSC/admin)
router.post('/', authenticateToken, requireRole('isf', 'cisf', 'scsc', 'admin'), upload.single('pdf'), async (req, res) => {
  try {
    const { numar_lista, tip, numar_autorizatii, isf_name } = req.body;

    if (!numar_lista || !tip || !numar_autorizatii || !isf_name || !req.file) {
      return res.status(400).json({ error: 'Câmpuri obligatorii lipsă' });
    }

    if (!['Autorizatii', 'Vize', 'Duplicate', 'Schimbare nume'].includes(tip)) {
      return res.status(400).json({ error: 'Valoare tip invalidă' });
    }

    // Normalize to uppercase for consistency
    const normalizedNumarLista = numar_lista.trim().toUpperCase();

    // Check uniqueness (case-insensitive)
    const existing = await pool.query(
      'SELECT id, created_date, numar_lista, isf_name, created_by_email FROM liste_tiparire WHERE UPPER(numar_lista) = $1',
      [normalizedNumarLista]
    );

    if (existing.rows.length > 0) {
      const existingDate = format(new Date(existing.rows[0].created_date), 'dd.MM.yyyy');
      const canViewLink = existing.rows[0].created_by_email === req.user.email || req.user.role === 'admin';
      
      return res.status(400).json({ 
        error: `Lista cu numărul de comisie ${existing.rows[0].numar_lista} a fost deja încărcată în data de ${existingDate} de ${existing.rows[0].isf_name}`,
        existingId: canViewLink ? existing.rows[0].id : null
      });
    }

    const result = await pool.query(
      `INSERT INTO liste_tiparire 
       (numar_lista, tip, isf_name, numar_autorizatii, pdf_url, pdf_filename, 
        status, created_by_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        normalizedNumarLista,
        tip,
        isf_name,
        parseInt(numar_autorizatii),
        `/uploads/${req.file.filename}`,
        req.file.originalname,
        'PRIMITA',
        req.user.email
      ]
    );

    // Audit log
    await logAudit(
      req.user.email,
      'CREATE_LISTA',
      'liste_tiparire',
      result.rows[0].id,
      { numar_lista: normalizedNumarLista, tip, isf_name, numar_autorizatii },
      req.ip
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Eroare interna de server' });
  }
});

// Update list status (admin only)
router.patch('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PRIMITA', 'VERIFICATA', 'TRIMISA'].includes(status)) {
      return res.status(400).json({ error: 'Status invalid' });
    }

    let updateQuery = 'UPDATE liste_tiparire SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    // Always update timestamp and user when changing to a status
    if (status === 'VERIFICATA') {
      updateQuery += ', verificat_at = CURRENT_TIMESTAMP, verificat_by = $2';
      params.push(req.user.email);
    } else if (status === 'TRIMISA') {
      updateQuery += ', trimis_at = CURRENT_TIMESTAMP, trimis_by = $2';
      params.push(req.user.email);
    } else if (status === 'PRIMITA') {
      // Clear verificat and trimis when going back to PRIMITA
      updateQuery += ', verificat_at = NULL, verificat_by = NULL, trimis_at = NULL, trimis_by = NULL';
    }

    updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lista negasita' });
    }
    
    // Audit log
    await logAudit(
      req.user.email,
      'UPDATE_STATUS',
      'liste_tiparire',
      id,
      { old_status: result.rows[0].status, new_status: status },
      req.ip
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Eroare interna de server' });
  }
});

// Get statistics (ISF/CISF/admin)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { month, year, isf } = req.query;

    let query = 'SELECT * FROM liste_tiparire WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Non-admin users can only see their own ISF/CISF stats
    if (req.user.role !== 'admin') {
      const userIsfCisfScsc = req.user.isf_name || req.user.cisf_name || req.user.scsc_name;
      if (userIsfCisfScsc) {
        query += ` AND isf_name = $${paramCount++}`;
        params.push(userIsfCisfScsc);
      }
    } else if (isf) {
      query += ` AND isf_name = $${paramCount++}`;
      params.push(isf);
    }

    const allLists = await pool.query(query, params);

    // Filter by period for monthly stats
    let monthlyQuery = query;
    const monthlyParams = [...params];

    if (month && year) {
      monthlyParams.push(parseInt(year), parseInt(month));
      monthlyQuery += ` AND EXTRACT(YEAR FROM created_date) = $${paramCount++}`;
      monthlyQuery += ` AND EXTRACT(MONTH FROM created_date) = $${paramCount}`;
    }

    const monthlyLists = await pool.query(monthlyQuery, monthlyParams);

    res.json({
      all: allLists.rows,
      monthly: monthlyLists.rows
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Eroare interna de server' });
  }
});

// Delete list (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM liste_tiparire WHERE id = $1 RETURNING id, numar_lista', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lista negasita' });
    }

    // Audit log
    await logAudit(
      req.user.email,
      'DELETE_LISTA',
      'liste_tiparire',
      id,
      { numar_lista: result.rows[0].numar_lista },
      req.ip
    );

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ error: 'Eroare interna de server' });
  }
});

export default router;
