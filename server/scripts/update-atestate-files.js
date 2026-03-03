import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateAtestateFiles() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Updating atestate table for multiple files...');
    
    // Rename existing columns
    await client.query(`
      ALTER TABLE atestate RENAME COLUMN pdf_url TO pdf1_url
    `);
    await client.query(`
      ALTER TABLE atestate RENAME COLUMN pdf_filename TO pdf1_filename
    `);
    console.log('✅ Renamed existing columns to pdf1_url and pdf1_filename');
    
    // Add new columns for pdf2 and pdf3
    await client.query(`
      ALTER TABLE atestate 
      ADD COLUMN IF NOT EXISTS pdf2_url TEXT,
      ADD COLUMN IF NOT EXISTS pdf2_filename VARCHAR(255),
      ADD COLUMN IF NOT EXISTS pdf3_url TEXT,
      ADD COLUMN IF NOT EXISTS pdf3_filename VARCHAR(255)
    `);
    console.log('✅ Added columns for pdf2 and pdf3');
    
    // Make pdf1_url and pdf1_filename nullable
    await client.query(`
      ALTER TABLE atestate 
      ALTER COLUMN pdf1_url DROP NOT NULL,
      ALTER COLUMN pdf1_filename DROP NOT NULL
    `);
    console.log('✅ Made pdf columns nullable');
    
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateAtestateFiles();
