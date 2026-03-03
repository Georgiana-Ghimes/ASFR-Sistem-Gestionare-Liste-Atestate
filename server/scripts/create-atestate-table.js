import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createAtestateTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating atestate table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS atestate (
        id SERIAL PRIMARY KEY,
        numar_atestat VARCHAR(255) UNIQUE NOT NULL,
        data_atestat DATE NOT NULL,
        nume_complet VARCHAR(255) NOT NULL,
        cnp VARCHAR(13) NOT NULL,
        functie VARCHAR(255) NOT NULL,
        pdf_url TEXT NOT NULL,
        pdf_filename VARCHAR(255) NOT NULL,
        observatii TEXT,
        created_by_email VARCHAR(255),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Atestate table created');
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_atestate_numar ON atestate(numar_atestat)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_atestate_cnp ON atestate(cnp)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_atestate_data ON atestate(data_atestat)');
    console.log('✅ Indexes created');
    
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAtestateTable();
