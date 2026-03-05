import { pool } from '../db.js';

async function removeUnusedColumns() {
  try {
    console.log('Removing unused columns from liste_tiparire...');
    
    // Remove data_lista column
    await pool.query('ALTER TABLE liste_tiparire DROP COLUMN IF EXISTS data_lista');
    console.log('✅ Removed data_lista column from liste_tiparire');
    
    // Remove observatii column from liste_tiparire
    await pool.query('ALTER TABLE liste_tiparire DROP COLUMN IF EXISTS observatii');
    console.log('✅ Removed observatii column from liste_tiparire');
    
    console.log('\nRemoving unused columns from atestate...');
    
    // Remove observatii column from atestate
    await pool.query('ALTER TABLE atestate DROP COLUMN IF EXISTS observatii');
    console.log('✅ Removed observatii column from atestate');
    
    console.log('\n✅ All unused columns removed successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

removeUnusedColumns();
