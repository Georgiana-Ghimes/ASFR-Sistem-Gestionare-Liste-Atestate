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

async function checkUsers() {
  const client = await pool.connect();
  
  try {
    console.log('Checking users with atestate role...\n');

    const result = await client.query(
      'SELECT email, role, has_atestate_role FROM users ORDER BY email'
    );

    console.log('Users:');
    console.log('─────────────────────────────────────────────────────────────────────');
    result.rows.forEach(user => {
      console.log(`${user.email.padEnd(50)} | ${user.role.padEnd(10)} | has_atestate: ${user.has_atestate_role}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers();
