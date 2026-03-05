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

async function addTimestamps() {
  const client = await pool.connect();
  
  try {
    console.log('Adding timestamp columns to atestate table...\n');

    await client.query(`
      ALTER TABLE atestate 
      ADD COLUMN IF NOT EXISTS verificat_at TIMESTAMP
    `);

    console.log('✅ Timestamp columns added successfully');
    
    // Set created_date as creat_at for existing records if not set
    await client.query(`
      UPDATE atestate 
      SET created_date = NOW() 
      WHERE created_date IS NULL
    `);

    console.log('✅ Default timestamps set for existing atestate');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addTimestamps();
