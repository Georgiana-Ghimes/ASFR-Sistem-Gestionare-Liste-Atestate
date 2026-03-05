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

async function addOrganizationColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding organization columns to atestate table...\n');

    // Add columns for organization type and name
    await client.query(`
      ALTER TABLE atestate 
      ADD COLUMN IF NOT EXISTS organization_type VARCHAR(10),
      ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255)
    `);

    console.log('✅ Organization columns added successfully');
    
    // Verify the changes
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'atestate' 
      AND column_name IN ('organization_type', 'organization_name')
    `);

    console.log('\nAdded columns:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addOrganizationColumn();
