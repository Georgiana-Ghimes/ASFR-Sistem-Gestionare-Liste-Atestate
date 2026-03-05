import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDownload() {
  const client = await pool.connect();
  
  try {
    console.log('Testing download functionality...\n');

    // Get an atestat
    const result = await client.query('SELECT * FROM atestate LIMIT 1');
    
    if (result.rows.length === 0) {
      console.log('No atestate found in database');
      return;
    }
    
    const atestat = result.rows[0];
    console.log('Found atestat:', atestat.numar_atestat);
    console.log('ID:', atestat.id);
    console.log('all_files:', atestat.all_files);
    
    if (atestat.all_files) {
      const allFiles = JSON.parse(atestat.all_files);
      console.log('\nChecking files:');
      
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      console.log('Uploads directory:', uploadsDir);
      console.log('Directory exists:', fs.existsSync(uploadsDir));
      
      allFiles.forEach((fileInfo, index) => {
        const filename = path.basename(fileInfo.url);
        const filePath = path.join(uploadsDir, filename);
        const exists = fs.existsSync(filePath);
        
        console.log(`\nFile ${index + 1}:`);
        console.log(`  URL: ${fileInfo.url}`);
        console.log(`  Filename: ${fileInfo.filename}`);
        console.log(`  Path: ${filePath}`);
        console.log(`  Exists: ${exists}`);
        
        if (exists) {
          const stats = fs.statSync(filePath);
          console.log(`  Size: ${stats.size} bytes`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDownload();
