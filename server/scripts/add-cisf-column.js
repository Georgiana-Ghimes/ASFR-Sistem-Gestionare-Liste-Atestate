import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addCisfColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding cisf_name column...');
    
    // Check if column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='cisf_name'
    `);
    
    if (checkColumn.rows.length === 0) {
      await client.query(`
        ALTER TABLE users ADD COLUMN cisf_name VARCHAR(255)
      `);
      console.log('✅ cisf_name column added successfully');
    } else {
      console.log('✅ cisf_name column already exists');
    }
    
    // Update existing CISF user
    await client.query(`
      UPDATE users 
      SET cisf_name = 'CISF Bucuresti' 
      WHERE role = 'cisf' AND cisf_name IS NULL
    `);
    console.log('✅ Updated existing CISF users');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addCisfColumn();
