import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addAtestateColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding has_atestate_role column...');
    
    // Check if column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='has_atestate_role'
    `);
    
    if (checkColumn.rows.length === 0) {
      await client.query(`
        ALTER TABLE users ADD COLUMN has_atestate_role BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ has_atestate_role column added successfully');
    } else {
      console.log('✅ has_atestate_role column already exists');
    }
    
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAtestateColumn();
