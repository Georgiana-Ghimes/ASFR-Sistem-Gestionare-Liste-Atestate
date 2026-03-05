import { pool } from '../db.js';

async function addSchimbareNumeTip() {
  try {
    console.log('Updating tip column constraint to include Schimbare nume...');
    
    // Drop existing constraint
    await pool.query(`
      ALTER TABLE liste_tiparire 
      DROP CONSTRAINT IF EXISTS liste_tiparire_tip_check
    `);
    
    // Add new constraint with Schimbare nume
    await pool.query(`
      ALTER TABLE liste_tiparire 
      ADD CONSTRAINT liste_tiparire_tip_check 
      CHECK (tip IN ('Autorizatii', 'Vize', 'Duplicate', 'Schimbare nume'))
    `);
    
    console.log('✅ Updated tip column constraint to include Schimbare nume');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

addSchimbareNumeTip();
