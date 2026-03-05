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

async function checkVarcharLengths() {
  const client = await pool.connect();
  
  try {
    console.log('Checking VARCHAR column lengths in atestate table...\n');

    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'atestate' 
      AND data_type LIKE '%character%'
      ORDER BY ordinal_position
    `);

    console.log('VARCHAR columns:');
    console.log('─────────────────────────────────────────────────────────');
    result.rows.forEach(col => {
      const length = col.character_maximum_length || 'unlimited';
      console.log(`${col.column_name.padEnd(30)} | ${col.data_type.padEnd(25)} | max: ${length}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkVarcharLengths();
