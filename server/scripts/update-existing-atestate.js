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

async function updateExistingAtestate() {
  const client = await pool.connect();
  
  try {
    console.log('Updating existing atestate with organization info...\n');

    // Get all atestate without organization info
    const atestate = await client.query(
      'SELECT id, numar_atestat, created_by_email FROM atestate WHERE organization_name IS NULL'
    );

    if (atestate.rows.length === 0) {
      console.log('No atestate to update');
      return;
    }

    console.log(`Found ${atestate.rows.length} atestate to update\n`);

    for (const atestat of atestate.rows) {
      // Get user info
      const userResult = await client.query(
        'SELECT role, isf_name, cisf_name, scsc_name FROM users WHERE email = $1',
        [atestat.created_by_email]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const orgName = user.isf_name || user.cisf_name || user.scsc_name;
        const orgType = user.role;

        if (orgName) {
          await client.query(
            'UPDATE atestate SET organization_type = $1, organization_name = $2 WHERE id = $3',
            [orgType, orgName, atestat.id]
          );
          console.log(`✓ Updated atestat ${atestat.numar_atestat} with ${orgName}`);
        } else {
          console.log(`⚠ No organization found for user ${atestat.created_by_email}`);
        }
      } else {
        console.log(`⚠ User not found: ${atestat.created_by_email}`);
      }
    }

    console.log('\n✅ Update complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateExistingAtestate();
