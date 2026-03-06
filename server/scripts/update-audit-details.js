import { pool } from '../db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

async function updateAuditDetails() {
  try {
    console.log('Starting audit log details update...');

    // Get all UPDATE_STATUS audit logs
    const auditLogs = await pool.query(`
      SELECT id, entity_type, entity_id, details 
      FROM audit_log 
      WHERE action_type = 'UPDATE_STATUS'
    `);

    console.log(`Found ${auditLogs.rows.length} UPDATE_STATUS audit logs to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const log of auditLogs.rows) {
      try {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        
        // Skip if already has numar_lista or numar_atestat_format
        if (details.numar_lista || details.numar_atestat_format) {
          skippedCount++;
          continue;
        }

        let updatedDetails = { ...details };

        if (log.entity_type === 'liste_tiparire') {
          // Get numar_lista from liste_tiparire table
          const lista = await pool.query(
            'SELECT numar_lista FROM liste_tiparire WHERE id = $1',
            [log.entity_id]
          );

          if (lista.rows.length > 0) {
            updatedDetails.numar_lista = lista.rows[0].numar_lista;
            
            await pool.query(
              'UPDATE audit_log SET details = $1 WHERE id = $2',
              [JSON.stringify(updatedDetails), log.id]
            );
            
            updatedCount++;
            console.log(`Updated audit log ${log.id} with numar_lista: ${lista.rows[0].numar_lista}`);
          } else {
            console.log(`Lista with id ${log.entity_id} not found, skipping audit log ${log.id}`);
            skippedCount++;
          }
        } else if (log.entity_type === 'atestate') {
          // Get numar_atestat_format from atestate table
          const atestat = await pool.query(
            'SELECT numar_atestat_format FROM atestate WHERE id = $1',
            [log.entity_id]
          );

          if (atestat.rows.length > 0) {
            updatedDetails.numar_atestat_format = atestat.rows[0].numar_atestat_format;
            
            await pool.query(
              'UPDATE audit_log SET details = $1 WHERE id = $2',
              [JSON.stringify(updatedDetails), log.id]
            );
            
            updatedCount++;
            console.log(`Updated audit log ${log.id} with numar_atestat_format: ${atestat.rows[0].numar_atestat_format}`);
          } else {
            console.log(`Atestat with id ${log.entity_id} not found, skipping audit log ${log.id}`);
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`Error updating audit log ${log.id}:`, error);
        skippedCount++;
      }
    }

    console.log('\n=== Update Complete ===');
    console.log(`Total logs processed: ${auditLogs.rows.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);

  } catch (error) {
    console.error('Error updating audit details:', error);
  } finally {
    await pool.end();
  }
}

updateAuditDetails();
