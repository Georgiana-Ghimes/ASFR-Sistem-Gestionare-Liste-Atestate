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

async function checkTable() {
  const client = await pool.connect();
  
  try {
    console.log('Checking atestate table structure...\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'atestate'
      ORDER BY ordinal_position
    `);

    console.log('Columns in atestate table:');
    console.log('─────────────────────────────────────────────────────────');
    result.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | ${col.is_nullable}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();
