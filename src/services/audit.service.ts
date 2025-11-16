import db from '../database';
import { AuditLogEntry } from '../types';

class AuditService {
  async log(entry: Partial<AuditLogEntry>): Promise<void> {
    const query = `
      INSERT INTO audit_log (
        actor_id,
        action_type,
        resource_type,
        resource_id,
        previous_value,
        new_value,
        context,
        justification,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const values = [
      entry.actorId || null,
      entry.actionType,
      entry.resourceType,
      entry.resourceId,
      entry.previousValue ? JSON.stringify(entry.previousValue) : null,
      entry.newValue ? JSON.stringify(entry.newValue) : null,
      entry.context ? JSON.stringify(entry.context) : null,
      entry.justification || null,
      entry.ipAddress || null,
      entry.userAgent || null,
    ];

    await db.query(query, values);
  }

  async getAuditTrail(
    resourceType?: string,
    resourceId?: string,
    actorId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (resourceType) {
      query += ` AND resource_type = $${paramCount++}`;
      values.push(resourceType);
    }

    if (resourceId) {
      query += ` AND resource_id = $${paramCount++}`;
      values.push(resourceId);
    }

    if (actorId) {
      query += ` AND actor_id = $${paramCount++}`;
      values.push(actorId);
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramCount++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramCount++}`;
      values.push(endDate);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    return result.rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      actorId: row.actor_id,
      actionType: row.action_type,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      previousValue: row.previous_value,
      newValue: row.new_value,
      context: row.context,
      justification: row.justification,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
    }));
  }
}

export const auditService = new AuditService();
