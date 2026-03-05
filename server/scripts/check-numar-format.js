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

async function checkNumarFormat() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT id, numar_atestat, numar_atestat_format, data_atestat, nume_complet 
      FROM atestate 
      ORDER BY id
    `);
    
    console.log(`Total atestate: ${result.rows.length}\n`);
    
    result.rows.forEach(a => {
      console.log(`ID: ${a.id}`);
      console.log(`Seria: ${a.numar_atestat}`);
      console.log(`Numărul: ${a.numar_atestat_format || 'NULL'}`);
      console.log(`Data: ${a.data_atestat}`);
      console.log(`Nume: ${a.nume_complet}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkNumarFormat();
