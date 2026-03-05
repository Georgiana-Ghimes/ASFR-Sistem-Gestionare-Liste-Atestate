import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const users = [
  {
    email: 'cisf.bucuresti@sigurantaferoviara.ro',
    password: 'CisfB2026!',
    role: 'cisf',
    cisf_name: 'CISF București',
    has_atestate_role: false
  },
  {
    email: 'isf.craiova@sigurantaferoviara.ro',
    password: 'IsfCr2026!',
    role: 'isf',
    isf_name: 'ISF Craiova',
    has_atestate_role: false
  },
  {
    email: 'isf.timisoara@sigurantaferoviara.ro',
    password: 'IsfTim2026!',
    role: 'isf',
    isf_name: 'ISF Timișoara',
    has_atestate_role: false
  },
  {
    email: 'isf.cluj@sigurantaferoviara.ro',
    password: 'IsfCj2026!',
    role: 'isf',
    isf_name: 'ISF Cluj',
    has_atestate_role: false
  },
  {
    email: 'cisf.brasov@sigurantaferoviara.ro',
    password: 'CisfBv2026!',
    role: 'cisf',
    cisf_name: 'CISF Brașov',
    has_atestate_role: false
  },
  {
    email: 'isf.iasi@sigurantaferoviara.ro',
    password: 'IsfIs2026!',
    role: 'isf',
    isf_name: 'ISF Iași',
    has_atestate_role: false
  },
  {
    email: 'cisf.galati@sigurantaferoviara.ro',
    password: 'CisfGl2026!',
    role: 'cisf',
    cisf_name: 'CISF Galați',
    has_atestate_role: false
  },
  {
    email: 'isf.constanta@sigurantaferoviara.ro',
    password: 'IsfCt2026!',
    role: 'isf',
    isf_name: 'ISF Constanța',
    has_atestate_role: false
  },
  {
    email: 'controlsc@sigurantaferoviara.ro',
    password: 'CoSc2026!',
    role: 'scsc',
    scsc_name: 'Control SCSC',
    has_atestate_role: false
  },
  {
    email: 'cecilia.mihaila@sigurantaferoviara.ro',
    password: 'CeMih2026!',
    role: 'admin',
    has_atestate_role: true
  },
  {
    email: 'georgianaghimes@sigurantaferoviara.ro',
    password: 'GhGeo2026!',
    role: 'admin',
    has_atestate_role: true
  }
];

async function updateAllUsers() {
  const client = await pool.connect();
  
  try {
    console.log('Starting user update...\n');

    // Delete all existing users
    await client.query('DELETE FROM users');
    console.log('Deleted all existing users\n');

    // Insert all users with correct data
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await client.query(
        `INSERT INTO users (email, password, role, isf_name, cisf_name, scsc_name, has_atestate_role) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.email,
          hashedPassword,
          user.role,
          user.isf_name || null,
          user.cisf_name || null,
          user.scsc_name || null,
          user.has_atestate_role
        ]
      );
      
      console.log(`✓ Created user: ${user.email} (${user.role})`);
    }

    console.log('\n✅ All users updated successfully!');
    console.log('\nUser list:');
    console.log('─────────────────────────────────────────────────────────');
    users.forEach(u => {
      console.log(`${u.email} | ${u.password} | ${u.role}`);
    });
    
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateAllUsers();
