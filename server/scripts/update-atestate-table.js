import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateAtestateTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Updating atestate table...');
    
    // Check if cnp column exists
    const checkCnp = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='atestate' AND column_name='cnp'
    `);
    
    if (checkCnp.rows.length > 0) {
      // Rename cnp to din_cadrul
      await client.query(`
        ALTER TABLE atestate RENAME COLUMN cnp TO din_cadrul
      `);
      console.log('✅ Column renamed from cnp to din_cadrul');
    } else {
      console.log('ℹ️  cnp column does not exist, checking for din_cadrul...');
      
      const checkDinCadrul = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='atestate' AND column_name='din_cadrul'
      `);
      
      if (checkDinCadrul.rows.length > 0) {
        console.log('✅ din_cadrul column already exists');
      } else {
        console.log('⚠️  Neither column exists, creating din_cadrul...');
        await client.query(`
          ALTER TABLE atestate ADD COLUMN din_cadrul VARCHAR(255) NOT NULL DEFAULT ''
        `);
        console.log('✅ din_cadrul column created');
      }
    }
    
    // Drop old index on cnp if exists
    await client.query(`
      DROP INDEX IF EXISTS idx_atestate_cnp
    `);
    console.log('✅ Old cnp index dropped');
    
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateAtestateTable();
