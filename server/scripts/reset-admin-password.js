import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function resetPassword() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Resetting admin password...');
    
    const hashedPassword = await bcrypt.hash('GhGeo2026!', 10);
    
    await client.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, 'georgianaghimes@sigurantaferoviara.ro']
    );
    
    console.log('✅ Password reset successfully!');
    console.log('📧 Email: georgianaghimes@sigurantaferoviara.ro');
    console.log('🔑 Password: GhGeo2026!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetPassword();
