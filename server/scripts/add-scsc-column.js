import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addScscColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding scsc_name column and updating role constraint...');
    
    // Check if column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='scsc_name'
    `);
    
    if (checkColumn.rows.length === 0) {
      await client.query(`
        ALTER TABLE users ADD COLUMN scsc_name VARCHAR(255)
      `);
      console.log('✅ scsc_name column added successfully');
    } else {
      console.log('✅ scsc_name column already exists');
    }
    
    // Update role constraint to include scsc
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
    `);
    
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'isf', 'cisf', 'scsc'))
    `);
    console.log('✅ Role constraint updated to include scsc');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addScscColumn();
