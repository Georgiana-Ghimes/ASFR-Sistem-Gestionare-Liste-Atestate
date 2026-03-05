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

async function checkRecords() {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT * FROM atestate ORDER BY created_date DESC');
    
    console.log(`Total atestate: ${result.rows.length}\n`);
    
    if (result.rows.length > 0) {
      console.log('Recent atestate:');
      result.rows.slice(0, 5).forEach(a => {
        console.log(`- ${a.numar_atestat} | ${a.nume_complet} | ${a.created_by_email}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRecords();
