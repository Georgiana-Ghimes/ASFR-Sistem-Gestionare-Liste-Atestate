import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function populateUserTracking() {
  const client = await pool.connect();
  
  try {
    console.log('Populating user tracking for existing records...\n');

    // Update liste_tiparire - set verificat_by for VERIFICATA/TRIMISA status
    const listVerificatResult = await client.query(`
      UPDATE liste_tiparire 
      SET verificat_by = 'cecilia.mihaila@sigurantaferoviara.ro'
      WHERE status IN ('VERIFICATA', 'TRIMISA') 
      AND verificat_by IS NULL
      RETURNING id, numar_lista
    `);
    console.log(`✅ Updated ${listVerificatResult.rowCount} liste with verificat_by`);

    // Update liste_tiparire - set trimis_by for TRIMISA status
    const listTrimisResult = await client.query(`
      UPDATE liste_tiparire 
      SET trimis_by = 'cecilia.mihaila@sigurantaferoviara.ro'
      WHERE status = 'TRIMISA' 
      AND trimis_by IS NULL
      RETURNING id, numar_lista
    `);
    console.log(`✅ Updated ${listTrimisResult.rowCount} liste with trimis_by`);

    // Update atestate - set verificat_by for VERIFICATA/TRIMISA status
    const atestateVerificatResult = await client.query(`
      UPDATE atestate 
      SET verificat_by = 'cecilia.mihaila@sigurantaferoviara.ro'
      WHERE status IN ('VERIFICATA', 'TRIMISA') 
      AND verificat_by IS NULL
      RETURNING id, numar_atestat
    `);
    console.log(`✅ Updated ${atestateVerificatResult.rowCount} atestate with verificat_by`);

    // Update atestate - set trimis_by for TRIMISA status
    const atestateTrimisResult = await client.query(`
      UPDATE atestate 
      SET trimis_by = 'cecilia.mihaila@sigurantaferoviara.ro'
      WHERE status = 'TRIMISA' 
      AND trimis_by IS NULL
      RETURNING id, numar_atestat
    `);
    console.log(`✅ Updated ${atestateTrimisResult.rowCount} atestate with trimis_by`);

    console.log('\n✅ User tracking populated successfully!');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

populateUserTracking();
