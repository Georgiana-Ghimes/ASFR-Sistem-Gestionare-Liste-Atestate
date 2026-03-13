import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

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
router.post('/', authenticateToken, async (req, res) => {
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
      infrastructura_practic
    } = req.body;
    
    // Validate required fields
    if (!nr_declaratie || !nume_examinator || !tip_declaratie || !limba_evaluare || !data_emitere || !data_expirare) {
      return res.status(400).json({ error: 'Toate câmpurile obligatorii trebuie completate' });
    }
    
    // Check if declaration number already exists
    const existingDre = await pool.query(
      'SELECT id FROM DRE WHERE nr_declaratie = $1',
      [nr_declaratie]
    );
    
    if (existingDre.rows.length > 0) {
      return res.status(400).json({ error: 'Numărul de declarație există deja' });
    }
    
    // Insert DRE declaration
    const result = await pool.query(
      `INSERT INTO DRE 
        (nr_declaratie, nume_examinator, tip_declaratie, limba_evaluare, 
         data_emitere, data_expirare, material_rulant_teoretic, material_rulant_practic, 
         infrastructura_teoretic, infrastructura_practic, created_by_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id`,
      [
        nr_declaratie,
        nume_examinator.toUpperCase(),
        tip_declaratie,
        limba_evaluare,
        data_emitere,
        data_expirare,
        material_rulant_teoretic || false,
        material_rulant_practic || false,
        infrastructura_teoretic || false,
        infrastructura_practic || false,
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
      { nr_declaratie, nume_examinator },
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

export default router;
