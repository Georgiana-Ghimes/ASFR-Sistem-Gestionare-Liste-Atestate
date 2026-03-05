import express from 'express';
import multer from 'multer';
import path from 'path';
import archiver from 'archiver';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    cb(null, uploadDir);
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
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word files are allowed'));
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
router.post('/', authenticateToken, requireAtestateRole, upload.array('files', 20), async (req, res) => {
  try {
    const { numar_atestat, numar_atestat_format, data_atestat, nume_complet, din_cadrul, functie, organization_type, organization_name } = req.body;

    if (!numar_atestat || !numar_atestat_format || !data_atestat || !nume_complet || !din_cadrul || !functie || !organization_type || !organization_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate format: number/year
    const formatRegex = /^\d+\/\d{4}$/;
    if (!formatRegex.test(numar_atestat_format.trim())) {
      return res.status(400).json({ error: 'Numărul trebuie să fie în formatul: număr/an (ex: 67/2026)' });
    }

    // Check if at least one file is uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' });
    }

    // Check uniqueness by numar_atestat_format
    const existing = await pool.query(
      'SELECT id, created_date FROM atestate WHERE numar_atestat_format = $1',
      [numar_atestat_format.trim()]
    );

    if (existing.rows.length > 0) {
      const existingDate = new Date(existing.rows[0].created_date).toLocaleDateString('ro-RO');
      return res.status(400).json({ error: `Atestatul a fost deja încărcat în data de ${existingDate}` });
    }

    // Get file paths (up to 3 files for backward compatibility)
    const pdf1_url = req.files[0] ? `/uploads/${req.files[0].filename}` : null;
    const pdf2_url = req.files[1] ? `/uploads/${req.files[1].filename}` : null;
    const pdf3_url = req.files[2] ? `/uploads/${req.files[2].filename}` : null;
    
    const pdf1_filename = req.files[0] ? req.files[0].originalname : null;
    const pdf2_filename = req.files[1] ? req.files[1].originalname : null;
    const pdf3_filename = req.files[2] ? req.files[2].originalname : null;
    
    // Store all file paths as JSON
    const allFiles = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname
    }));

    const result = await pool.query(
      `INSERT INTO atestate 
       (numar_atestat, numar_atestat_format, data_atestat, nume_complet, din_cadrul, functie, 
        pdf1_url, pdf1_filename, pdf2_url, pdf2_filename, pdf3_url, pdf3_filename,
        all_files, created_by_email, organization_type, organization_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
       RETURNING *`,
      [
        numar_atestat,
        numar_atestat_format.trim(),
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
        JSON.stringify(allFiles),
        req.user.email,
        organization_type,
        organization_name
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create atestat error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ error: 'Internal server error', message: error.message });
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

// Update atestat status (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    // Only admins can change status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['PRIMITA', 'VERIFICATA', 'TRIMISA'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let updateQuery = 'UPDATE atestate SET status = $1, updated_at = NOW()';
    const params = [status];

    // Always update timestamp and user when changing to a status
    if (status === 'VERIFICATA') {
      updateQuery += ', verificat_at = NOW(), verificat_by = $2';
      params.push(req.user.email);
    } else if (status === 'TRIMISA') {
      updateQuery += ', trimis_at = NOW(), trimis_by = $2';
      params.push(req.user.email);
    } else if (status === 'PRIMITA') {
      // Clear verificat and trimis when going back to PRIMITA
      updateQuery += ', verificat_at = NULL, verificat_by = NULL, trimis_at = NULL, trimis_by = NULL';
    }

    updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Atestat not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update atestat status error:', error);
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
    
    // Use organization name as ZIP filename (sanitize for filesystem)
    const sanitizedName = (atestat.organization_name || 'atestat').replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Set response headers
    res.attachment(`${sanitizedName}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    
    // Pipe archive to response
    archive.pipe(res);
    
    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });
    
    // Add files to archive from all_files JSONB (already parsed by pg)
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (atestat.all_files && Array.isArray(atestat.all_files)) {
      atestat.all_files.forEach((fileInfo, index) => {
        const filename = path.basename(fileInfo.url);
        const filePath = path.join(uploadsDir, filename);
        
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `Exemplar_${index + 1}_${fileInfo.filename}` });
        } else {
          console.warn(`File not found: ${filePath}`);
        }
      });
    }
    
    // Finalize the archive
    await archive.finalize();
    
  } catch (error) {
    console.error('Download atestat error:', error);
    console.error('Error message:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
});

export default router;
