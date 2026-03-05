import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addNumarAtestatFormat() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding numar_atestat_format column to atestate table...');
    
    // Check if column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='atestate' AND column_name='numar_atestat_format'
    `);
    
    if (checkColumn.rows.length === 0) {
      await client.query(`
        ALTER TABLE atestate 
        ADD COLUMN numar_atestat_format VARCHAR(50) UNIQUE
      `);
      console.log('✅ numar_atestat_format column added successfully');
    } else {
      console.log('✅ numar_atestat_format column already exists');
    }
    
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addNumarAtestatFormat();
