import { pool } from '../db.js';

export async function logAudit(userEmail, actionType, entityType, entityId = null, details = {}, ipAddress = null) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_email, action_type, entity_type, entity_id, details, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userEmail, actionType, entityType, entityId, JSON.stringify(details), ipAddress]
    );
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit failures shouldn't break the main operation
  }
}
