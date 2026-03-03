import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addAllFilesColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding all_files column...');
    
    await client.query(`
      ALTER TABLE atestate 
      ADD COLUMN IF NOT EXISTS all_files JSONB
    `);
    console.log('✅ all_files column added');
    
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAllFilesColumn();
