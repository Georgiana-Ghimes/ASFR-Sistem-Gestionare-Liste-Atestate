import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function renameColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Renaming cscs_name column to scsc_name...');
    
    // Check if old column exists
    const checkOldColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='cscs_name'
    `);
    
    if (checkOldColumn.rows.length > 0) {
      // Rename column
      await client.query(`
        ALTER TABLE users RENAME COLUMN cscs_name TO scsc_name
      `);
      console.log('✅ Column renamed from cscs_name to scsc_name');
      
      // Update any existing cscs roles to scsc BEFORE updating constraint
      const updateResult = await client.query(`
        UPDATE users SET role = 'scsc' WHERE role = 'cscs'
      `);
      
      if (updateResult.rowCount > 0) {
        console.log(`✅ Updated ${updateResult.rowCount} user(s) from cscs to scsc role`);
      } else {
        console.log('ℹ️  No users with cscs role found');
      }
    } else {
      console.log('ℹ️  cscs_name column does not exist, checking for scsc_name...');
      
      const checkNewColumn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='scsc_name'
      `);
      
      if (checkNewColumn.rows.length > 0) {
        console.log('✅ scsc_name column already exists');
        
        // Still need to update roles from cscs to scsc
        const updateResult = await client.query(`
          UPDATE users SET role = 'scsc' WHERE role = 'cscs'
        `);
        
        if (updateResult.rowCount > 0) {
          console.log(`✅ Updated ${updateResult.rowCount} user(s) from cscs to scsc role`);
        } else {
          console.log('ℹ️  No users with cscs role found');
        }
      } else {
        console.log('⚠️  Neither column exists, creating scsc_name...');
        await client.query(`
          ALTER TABLE users ADD COLUMN scsc_name VARCHAR(255)
        `);
        console.log('✅ scsc_name column created');
      }
    }
    
    // Update role constraint to use scsc instead of cscs
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
    `);
    
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'isf', 'cisf', 'scsc'))
    `);
    console.log('✅ Role constraint updated to include scsc');
    
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

renameColumn();
