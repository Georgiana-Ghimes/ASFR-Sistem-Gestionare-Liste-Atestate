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
    // Get password from command line argument
    const newPassword = process.argv[2];
    const email = process.argv[3] || 'georgiana.ghimes@sigurantaferoviara.ro';
    
    if (!newPassword) {
      console.error('❌ Usage: node reset-admin-password.js <new_password> [email]');
      console.error('Example: node reset-admin-password.js MyNewPassword123! georgiana.ghimes@sigurantaferoviara.ro');
      process.exit(1);
    }
    
    console.log('🔧 Resetting admin password...');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await client.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );
    
    console.log('✅ Password reset successfully!');
    console.log(`📧 Email: ${email}`);
    console.log('🔑 Password: [hidden for security]');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetPassword();
