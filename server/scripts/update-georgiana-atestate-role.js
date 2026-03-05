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

async function updateGeorgianaAtestateRole() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Updating Georgiana\'s atestate role...');
    
    const result = await client.query(
      `UPDATE users 
       SET has_atestate_role = false 
       WHERE email = $1 
       RETURNING email, role, has_atestate_role`,
      ['georgiana.ghimes@sigurantaferoviara.ro']
    );

    if (result.rows.length === 0) {
      console.log('⚠️  User not found, trying alternate email...');
      
      const altResult = await client.query(
        `UPDATE users 
         SET has_atestate_role = false 
         WHERE email = $1 
         RETURNING email, role, has_atestate_role`,
        ['georgianaghimes@sigurantaferoviara.ro']
      );
      
      if (altResult.rows.length > 0) {
        console.log('✅ Updated successfully!');
        console.log(altResult.rows[0]);
      } else {
        console.log('❌ User not found with either email');
      }
    } else {
      console.log('✅ Updated successfully!');
      console.log(result.rows[0]);
    }
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateGeorgianaAtestateRole();
