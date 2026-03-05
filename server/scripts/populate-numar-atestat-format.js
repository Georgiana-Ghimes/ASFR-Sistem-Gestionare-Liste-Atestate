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

async function populateNumarAtestatFormat() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Populating numar_atestat_format for existing atestate...');
    
    // Get atestate without numar_atestat_format
    const result = await client.query(`
      SELECT id, numar_atestat, data_atestat 
      FROM atestate 
      WHERE numar_atestat_format IS NULL
    `);
    
    console.log(`Found ${result.rows.length} atestate without numar_atestat_format`);
    
    for (const atestat of result.rows) {
      // Extract year from data_atestat
      const year = new Date(atestat.data_atestat).getFullYear();
      const format = `${atestat.numar_atestat}/${year}`;
      
      await client.query(
        'UPDATE atestate SET numar_atestat_format = $1 WHERE id = $2',
        [format, atestat.id]
      );
      
      console.log(`✅ Updated atestat ID ${atestat.id}: ${format}`);
    }
    
    console.log('✅ All atestate updated successfully');
    
  } catch (error) {
    console.error('Error populating numar_atestat_format:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

populateNumarAtestatFormat();
