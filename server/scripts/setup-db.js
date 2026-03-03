import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up database...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'isf', 'cisf')),
        isf_name VARCHAR(255),
        cisf_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create liste_tiparire table
    await client.query(`
      CREATE TABLE IF NOT EXISTS liste_tiparire (
        id SERIAL PRIMARY KEY,
        numar_lista VARCHAR(255) UNIQUE NOT NULL,
        data_lista DATE NOT NULL,
        isf_name VARCHAR(255) NOT NULL,
        numar_autorizatii INTEGER NOT NULL CHECK (numar_autorizatii >= 1),
        pdf_url TEXT NOT NULL,
        pdf_filename VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'PRIMITA' CHECK (status IN ('PRIMITA', 'VERIFICATA', 'TRIMISA')),
        observatii TEXT,
        created_by_email VARCHAR(255),
        verificat_at TIMESTAMP,
        verificat_by VARCHAR(255),
        trimis_at TIMESTAMP,
        trimis_by VARCHAR(255),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Liste tiparire table created');

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_liste_status ON liste_tiparire(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_liste_isf ON liste_tiparire(isf_name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_liste_data ON liste_tiparire(data_lista)');
    console.log('✅ Indexes created');

    // Insert demo users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await client.query(`
      INSERT INTO users (email, password, role, isf_name, cisf_name) 
      VALUES 
        ($1, $2, 'admin', NULL, NULL),
        ($3, $4, 'cisf', NULL, 'CISF Bucuresti'),
        ($5, $6, 'isf', 'ISF Bucuresti', NULL),
        ($7, $8, 'isf', 'ISF Cluj', NULL)
      ON CONFLICT (email) DO NOTHING
    `, [
      'admin@test.com', hashedPassword,
      'cisf@test.com', hashedPassword,
      'isf.bucuresti@test.com', hashedPassword,
      'isf.cluj@test.com', hashedPassword
    ]);
    console.log('✅ Demo users created');
    console.log('\n📋 Demo credentials:');
    console.log('   Admin: admin@test.com / password123');
    console.log('   CISF: cisf@test.com / password123');
    console.log('   ISF București: isf.bucuresti@test.com / password123');
    console.log('   ISF Cluj: isf.cluj@test.com / password123\n');

    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
