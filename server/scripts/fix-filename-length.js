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

async function fixFilenameLength() {
  const client = await pool.connect();
  
  try {
    console.log('Fixing filename column lengths...\n');

    // Increase the length of filename columns to 255 characters
    await client.query(`
      ALTER TABLE atestate 
      ALTER COLUMN pdf1_filename TYPE VARCHAR(255),
      ALTER COLUMN pdf2_filename TYPE VARCHAR(255),
      ALTER COLUMN pdf3_filename TYPE VARCHAR(255)
    `);

    console.log('✅ Filename columns updated to VARCHAR(255)');
    
    // Verify the changes
    const result = await client.query(`
      SELECT column_name, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'atestate' 
      AND column_name LIKE '%filename%'
    `);

    console.log('\nUpdated columns:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: max length = ${col.character_maximum_length}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixFilenameLength();
