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

async function testInsert() {
  const client = await pool.connect();
  
  try {
    console.log('Testing atestat insert...\n');

    const testData = {
      numar_atestat: 'TEST123',
      data_atestat: '2024-01-01',
      nume_complet: 'Test User',
      din_cadrul: 'Test Company',
      functie: 'Test Function',
      pdf1_url: '/uploads/test.pdf',
      pdf1_filename: 'test.pdf',
      pdf2_url: null,
      pdf2_filename: null,
      pdf3_url: null,
      pdf3_filename: null,
      all_files: JSON.stringify([{ url: '/uploads/test.pdf', filename: 'test.pdf' }]),
      observatii: 'Test observation',
      created_by_email: 'test@test.com'
    };

    console.log('Attempting to insert:', testData);

    const result = await client.query(
      `INSERT INTO atestate 
       (numar_atestat, data_atestat, nume_complet, din_cadrul, functie, 
        pdf1_url, pdf1_filename, pdf2_url, pdf2_filename, pdf3_url, pdf3_filename,
        all_files, observatii, created_by_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [
        testData.numar_atestat,
        testData.data_atestat,
        testData.nume_complet,
        testData.din_cadrul,
        testData.functie,
        testData.pdf1_url,
        testData.pdf1_filename,
        testData.pdf2_url,
        testData.pdf2_filename,
        testData.pdf3_url,
        testData.pdf3_filename,
        testData.all_files,
        testData.observatii,
        testData.created_by_email
      ]
    );

    console.log('\n✅ Insert successful!');
    console.log('Inserted record:', result.rows[0]);

    // Clean up
    await client.query('DELETE FROM atestate WHERE numar_atestat = $1', ['TEST123']);
    console.log('\n✅ Test record deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testInsert();
