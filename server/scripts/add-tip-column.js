import { pool } from '../db.js';

async function addTipColumn() {
  try {
    console.log('Adding tip column to liste_tiparire...');
    
    await pool.query(`
      ALTER TABLE liste_tiparire 
      ADD COLUMN IF NOT EXISTS tip VARCHAR(50) DEFAULT 'Autorizatii' 
      CHECK (tip IN ('Autorizatii', 'Vize', 'Duplicate'))
    `);
    
    console.log('✅ Added tip column to liste_tiparire');
    
    // Update existing records to have default value
    await pool.query(`
      UPDATE liste_tiparire 
      SET tip = 'Autorizatii' 
      WHERE tip IS NULL
    `);
    
    console.log('✅ Updated existing records with default tip value');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

addTipColumn();
