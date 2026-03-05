import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setOrganization() {
  const client = await pool.connect();
  
  try {
    // Get atestate without organization
    const result = await client.query(
      'SELECT id, numar_atestat, nume_complet FROM atestate WHERE organization_name IS NULL'
    );

    if (result.rows.length === 0) {
      console.log('No atestate to update');
      return;
    }

    console.log('Atestate without organization:');
    result.rows.forEach(a => {
      console.log(`- ID: ${a.id} | Seria: ${a.numar_atestat} | Nume: ${a.nume_complet}`);
    });

    // Get available organizations
    const orgs = await client.query(
      'SELECT DISTINCT isf_name, cisf_name, scsc_name, role FROM users WHERE isf_name IS NOT NULL OR cisf_name IS NOT NULL OR scsc_name IS NOT NULL'
    );

    console.log('\nOrganizații disponibile:');
    const orgList = [];
    orgs.rows.forEach(o => {
      const name = o.isf_name || o.cisf_name || o.scsc_name;
      if (name && !orgList.find(x => x.name === name)) {
        orgList.push({ name, type: o.role });
        console.log(`${orgList.length}. ${name} (${o.role})`);
      }
    });

    // For now, let's set the first atestat to ISF Craiova as an example
    // You can modify this based on which organization it should belong to
    const defaultOrg = orgList[0]; // ISF Craiova
    
    await client.query(
      'UPDATE atestate SET organization_type = $1, organization_name = $2 WHERE organization_name IS NULL',
      [defaultOrg.type, defaultOrg.name]
    );

    console.log(`\n✅ Updated all atestate to: ${defaultOrg.name}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
    rl.close();
  }
}

setOrganization();
