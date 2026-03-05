import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addUserTrackingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Adding user tracking columns to atestate table...\n');

    // Add verificat_by column
    await client.query(`
      ALTER TABLE atestate 
      ADD COLUMN IF NOT EXISTS verificat_by VARCHAR(255)
    `);
    console.log('✅ Added verificat_by column');

    // Add trimis_by column
    await client.query(`
      ALTER TABLE atestate 
      ADD COLUMN IF NOT EXISTS trimis_by VARCHAR(255)
    `);
    console.log('✅ Added trimis_by column');

    // Populate verificat_by for existing VERIFICATA/TRIMISA records
    const verificatResult = await client.query(`
      UPDATE atestate 
      SET verificat_by = 'cecilia.mihaila@sigurantaferoviara.ro'
      WHERE status IN ('VERIFICATA', 'TRIMISA') 
      AND verificat_by IS NULL
      RETURNING id, numar_atestat
    `);
    console.log(`✅ Populated verificat_by for ${verificatResult.rowCount} atestate`);

    // Populate trimis_by for existing TRIMISA records
    const trimisResult = await client.query(`
      UPDATE atestate 
      SET trimis_by = 'cecilia.mihaila@sigurantaferoviara.ro'
      WHERE status = 'TRIMISA' 
      AND trimis_by IS NULL
      RETURNING id, numar_atestat
    `);
    console.log(`✅ Populated trimis_by for ${trimisResult.rowCount} atestate`);

    console.log('\n✅ User tracking columns added and populated successfully!');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addUserTrackingColumns();
