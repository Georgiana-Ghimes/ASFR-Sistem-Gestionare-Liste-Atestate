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

async function createAuditTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating audit_log table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ audit_log table created successfully');
    
    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_log_user_email ON audit_log(user_email);
      CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON audit_log(action_type);
    `);
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('Error creating audit table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAuditTable();
