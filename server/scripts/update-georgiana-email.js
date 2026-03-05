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

async function updateGeorgianaEmail() {
  const client = await pool.connect();
  
  try {
    console.log('Updating Georgiana email...\n');

    const result = await client.query(
      `UPDATE users 
       SET email = $1 
       WHERE email = $2
       RETURNING email, role`,
      ['georgiana.ghimes@sigurantaferoviara.ro', 'georgianaghimes@sigurantaferoviara.ro']
    );

    if (result.rows.length > 0) {
      console.log('✅ Email updated successfully!');
      console.log(`New email: ${result.rows[0].email}`);
      console.log(`Role: ${result.rows[0].role}`);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error updating email:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateGeorgianaEmail();
