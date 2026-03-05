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

async function showDetails() {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT * FROM atestate');
    
    console.log(`Total atestate: ${result.rows.length}\n`);
    
    result.rows.forEach(a => {
      console.log('─────────────────────────────────────────');
      console.log(`ID: ${a.id}`);
      console.log(`Seria: ${a.numar_atestat}`);
      console.log(`Nume: ${a.nume_complet}`);
      console.log(`Organization Type: ${a.organization_type || 'NULL'}`);
      console.log(`Organization Name: ${a.organization_name || 'NULL'}`);
      console.log(`Created by: ${a.created_by_email}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

showDetails();
