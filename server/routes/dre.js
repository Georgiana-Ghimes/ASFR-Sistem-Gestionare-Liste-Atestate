import express from 'express';
import multer from 'multer';
import path from 'path';
import archiver from 'archiver';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

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

// Get all DRE declarations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nr_declaratie,
        nume_examinator,
        tip_declaratie,
        limba_evaluare,
        material_rulant_teoretic,
        material_rulant_practic,
        infrastructura_teoretic,
        infrastructura_practic,
        data_emitere,
        data_expirare,
        all_files,
        organization_name,
        created_by_email,
        created_at
      FROM DRE
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get DRE error:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

// Get my DRE declarations
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nr_declaratie,
        nume_examinator,
        tip_declaratie,
        limba_evaluare,
        material_rulant_teoretic,
        material_rulant_practic,
        infrastructura_teoretic,
        infrastructura_practic,
        data_emitere,
        data_expirare,
        all_files,
        organization_name,
        created_by_email,
        created_at
      FROM DRE
      WHERE created_by_email = $1
      ORDER BY created_at DESC
    `, [req.user.email]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get my DRE error:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

// Create DRE declaration
router.post('/', authenticateToken, upload.array('files', 20), async (req, res) => {
  try {
    const {
      nr_declaratie,
      nume_examinator,
      tip_declaratie,
      limba_evaluare,
      data_emitere,
      data_expirare,
      material_rulant_teoretic,
      material_rulant_practic,
      infrastructura_teoretic,
      infrastructura_practic,
      organization_name
    } = req.body;
    
    // Validate required fields
    const missingFields = [];
    if (!nr_declaratie?.trim()) missingFields.push('nr_declaratie');
    if (!nume_examinator?.trim()) missingFields.push('nume_examinator');
    if (!tip_declaratie?.trim()) missingFields.push('tip_declaratie');
    if (!limba_evaluare?.trim()) missingFields.push('limba_evaluare');
    if (!data_emitere?.trim()) missingFields.push('data_emitere');
    if (!data_expirare?.trim()) missingFields.push('data_expirare');
    if (!organization_name?.trim()) missingFields.push('organization_name');
    
    if (missingFields.length > 0) {
      console.log('Validation failed - missing fields:', missingFields);
      return res.status(400).json({ 
        error: `Câmpuri obligatorii lipsă: ${missingFields.join(', ')}` 
      });
    }
    
    // Check if declaration number already exists
    const existingDre = await pool.query(
      'SELECT id, nr_declaratie, organization_name, created_by_email, created_at FROM DRE WHERE nr_declaratie = $1',
      [nr_declaratie]
    );
    
    if (existingDre.rows.length > 0) {
      const existingDate = new Date(existingDre.rows[0].created_at).toLocaleDateString('ro-RO');
      const userOrg = req.user.isf_name || req.user.cisf_name || req.user.scsc_name;
      const canViewLink = existingDre.rows[0].created_by_email === req.user.email || 
                          req.user.role === 'admin' || 
                          req.user.email === 'florin.hritcu@sigurantaferoviara.ro' ||
                          existingDre.rows[0].organization_name === userOrg;
      
      return res.status(400).json({ 
        error: `DRE cu nr. ${existingDre.rows[0].nr_declaratie} a fost deja încărcat în data de ${existingDate} de ${existingDre.rows[0].organization_name}`,
        existingId: canViewLink ? existingDre.rows[0].id : null
      });
    }
    
    // Store all file paths as JSON (if files were uploaded)
    let allFiles = null;
    if (req.files && req.files.length > 0) {
      allFiles = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.originalname
      }));
    }
    
    // Insert DRE declaration
    const result = await pool.query(
      `INSERT INTO DRE 
        (nr_declaratie, nume_examinator, tip_declaratie, limba_evaluare, 
         data_emitere, data_expirare, material_rulant_teoretic, material_rulant_practic, 
         infrastructura_teoretic, infrastructura_practic, all_files, organization_name, created_by_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING id`,
      [
        nr_declaratie,
        nume_examinator.toUpperCase(),
        tip_declaratie,
        limba_evaluare,
        data_emitere,
        data_expirare,
        material_rulant_teoretic === 'true' || material_rulant_teoretic === true,
        material_rulant_practic === 'true' || material_rulant_practic === true,
        infrastructura_teoretic === 'true' || infrastructura_teoretic === true,
        infrastructura_practic === 'true' || infrastructura_practic === true,
        allFiles ? JSON.stringify(allFiles) : null,
        organization_name,
        req.user.email
      ]
    );
    
    const id = result.rows[0].id;
    
    // Audit log
    await logAudit(
      req.user.email,
      'CREATE_DRE',
      'DRE',
      id,
      { nr_declaratie, nume_examinator, files_count: allFiles ? allFiles.length : 0 },
      req.ip
    );
    
    res.status(201).json({ id, message: 'DRE creat cu succes' });
    
  } catch (error) {
    console.error('Create DRE error:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

// Delete DRE declaration
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM DRE WHERE id = $1 RETURNING nr_declaratie',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'DRE negăsit' });
    }
    
    // Audit log
    await logAudit(
      req.user.email,
      'DELETE_DRE',
      'DRE',
      id,
      { nr_declaratie: result.rows[0].nr_declaratie },
      req.ip
    );
    
    res.json({ message: 'DRE șters cu succes' });
  } catch (error) {
    console.error('Delete DRE error:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

// TODO: Future endpoint - Move DRE to archive (vechi)
// router.patch('/:id/archive', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     
//     const result = await pool.query(
//       'UPDATE DRE SET is_archived = true, archived_at = NOW() WHERE id = $1 RETURNING nr_declaratie',
//       [id]
//     );
//     
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'DRE negăsit' });
//     }
//     
//     // Audit log
//     await logAudit(
//       req.user.email,
//       'ARCHIVE_DRE',
//       'DRE',
//       id,
//       { nr_declaratie: result.rows[0].nr_declaratie },
//       req.ip
//     );
//     
//     res.json({ message: 'DRE arhivat cu succes' });
//   } catch (error) {
//     console.error('Archive DRE error:', error);
//     res.status(500).json({ error: 'Eroare internă de server' });
//   }
// });

// TODO: Future endpoint - Restore DRE from archive
// router.patch('/:id/restore', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     
//     const result = await pool.query(
//       'UPDATE DRE SET is_archived = false, archived_at = NULL WHERE id = $1 RETURNING nr_declaratie',
//       [id]
//     );
//     
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'DRE negăsit' });
//     }
//     
//     // Audit log
//     await logAudit(
//       req.user.email,
//       'RESTORE_DRE',
//       'DRE',
//       id,
//       { nr_declaratie: result.rows[0].nr_declaratie },
//       req.ip
//     );
//     
//     res.json({ message: 'DRE restaurat cu succes' });
//   } catch (error) {
//     console.error('Restore DRE error:', error);
//     res.status(500).json({ error: 'Eroare internă de server' });
//   }
// });

// Download DRE files as ZIP
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get DRE
    const result = await pool.query('SELECT * FROM DRE WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'DRE negăsit' });
    }
    
    const dre = result.rows[0];
    
    // Use nr_declaratie as ZIP filename (sanitize for filesystem)
    const sanitizedName = (dre.nr_declaratie || 'dre').replace(/[^a-zA-Z0-9_-]/g, '_');
    
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
    
    if (dre.all_files && Array.isArray(dre.all_files)) {
      dre.all_files.forEach((fileInfo, index) => {
        const filename = path.basename(fileInfo.url);
        const filePath = path.join(uploadsDir, filename);
        
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: fileInfo.filename });
        } else {
          console.warn(`File not found: ${filePath}`);
        }
      });
    }
    
    // Finalize the archive
    await archive.finalize();
    
  } catch (error) {
    console.error('Download DRE error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Eroare internă de server' });
    }
  }
});

export default router;
