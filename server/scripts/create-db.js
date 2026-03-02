import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connect to postgres database to create our database
const connectionString = process.env.DATABASE_URL.replace('/lista_tiparire', '/postgres');

const pool = new Pool({ connectionString });

async function createDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating database...');
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'lista_tiparire'"
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Database already exists');
    } else {
      await client.query('CREATE DATABASE lista_tiparire');
      console.log('✅ Database created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createDatabase();
