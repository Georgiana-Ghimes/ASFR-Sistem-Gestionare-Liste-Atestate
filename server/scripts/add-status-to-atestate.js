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

async function addStatusColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding status column to atestate table...\n');

    await client.query(`
      ALTER TABLE atestate 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PRIMITA',
      ADD COLUMN IF NOT EXISTS trimis_at TIMESTAMP
    `);

    console.log('✅ Status columns added successfully');
    
    // Set default status for existing records
    await client.query(`
      UPDATE atestate 
      SET status = 'PRIMITA' 
      WHERE status IS NULL
    `);

    console.log('✅ Default status set for existing atestate');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addStatusColumn();
