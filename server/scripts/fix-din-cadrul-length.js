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

async function fixDinCadrulLength() {
  const client = await pool.connect();
  
  try {
    console.log('Fixing din_cadrul column length...\n');

    await client.query(`
      ALTER TABLE atestate 
      ALTER COLUMN din_cadrul TYPE VARCHAR(255)
    `);

    console.log('✅ din_cadrul column updated to VARCHAR(255)');
    
    // Verify the change
    const result = await client.query(`
      SELECT column_name, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'atestate' 
      AND column_name = 'din_cadrul'
    `);

    console.log(`\nVerified: din_cadrul max length = ${result.rows[0].character_maximum_length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDinCadrulLength();
