import db from '../database';
import { ProcessDefinition, CreateProcessRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

class ProcessService {
  async createProcess(data: CreateProcessRequest, createdBy: string): Promise<ProcessDefinition> {
    const { name, key, description, category, bpmnXml } = data;

    // Validate BPMN XML (basic validation)
    if (!bpmnXml || !bpmnXml.includes('<?xml') || !bpmnXml.includes('bpmn')) {
      throw new AppError('Invalid BPMN XML format', 400);
    }

    // Check if process key already exists
    const existingProcess = await db.query(
      'SELECT id, version FROM process_definitions WHERE key = $1 ORDER BY version DESC LIMIT 1',
      [key]
    );

    const version = existingProcess.rows.length > 0 ? existingProcess.rows[0].version + 1 : 1;

    const result = await db.query(
      `INSERT INTO process_definitions (name, key, description, category, bpmn_xml, version, state, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, key, description || null, category || null, bpmnXml, version, 'draft', createdBy]
    );

    return this.mapRowToProcessDefinition(result.rows[0]);
  }

  async getProcessById(id: string): Promise<ProcessDefinition | null> {
    const result = await db.query(
      'SELECT * FROM process_definitions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProcessDefinition(result.rows[0]);
  }

  async getProcessByKey(key: string, version?: number): Promise<ProcessDefinition | null> {
    let query = 'SELECT * FROM process_definitions WHERE key = $1';
    const params: any[] = [key];

    if (version) {
      query += ' AND version = $2';
      params.push(version);
    } else {
      query += ' AND is_active = true';
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProcessDefinition(result.rows[0]);
  }

  async listProcesses(category?: string, state?: string): Promise<ProcessDefinition[]> {
    let query = 'SELECT * FROM process_definitions WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    if (state) {
      query += ` AND state = $${paramCount++}`;
      params.push(state);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);

    return result.rows.map((row) => this.mapRowToProcessDefinition(row));
  }

  async publishProcess(id: string, publishedBy: string): Promise<ProcessDefinition> {
    await db.transaction(async (client) => {
      // Get the process
      const processResult = await client.query(
        'SELECT * FROM process_definitions WHERE id = $1',
        [id]
      );

      if (processResult.rows.length === 0) {
        throw new AppError('Process not found', 404);
      }

      const process = processResult.rows[0];

      if (process.state !== 'draft') {
        throw new AppError('Only draft processes can be published', 400);
      }

      // Deactivate previous versions
      await client.query(
        'UPDATE process_definitions SET is_active = false WHERE key = $1',
        [process.key]
      );

      // Publish this version
      await client.query(
        `UPDATE process_definitions
         SET state = 'published', is_active = true, published_at = NOW(), published_by = $1
         WHERE id = $2`,
        [publishedBy, id]
      );
    });

    const updated = await this.getProcessById(id);
    if (!updated) {
      throw new AppError('Process not found after update', 500);
    }

    return updated;
  }

  async updateProcess(id: string, data: Partial<CreateProcessRequest>): Promise<ProcessDefinition> {
    const process = await this.getProcessById(id);

    if (!process) {
      throw new AppError('Process not found', 404);
    }

    if (process.state !== 'draft') {
      throw new AppError('Only draft processes can be modified', 400);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (data.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(data.category);
    }

    if (data.bpmnXml) {
      fields.push(`bpmn_xml = $${paramCount++}`);
      values.push(data.bpmnXml);
    }

    if (fields.length === 0) {
      return process;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE process_definitions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    return this.mapRowToProcessDefinition(result.rows[0]);
  }

  private mapRowToProcessDefinition(row: any): ProcessDefinition {
    return {
      id: row.id,
      name: row.name,
      key: row.key,
      description: row.description,
      category: row.category,
      bpmnXml: row.bpmn_xml,
      version: row.version,
      state: row.state,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      publishedAt: row.published_at,
      publishedBy: row.published_by,
      parentProcessId: row.parent_process_id,
      isVariant: row.is_variant,
    };
  }
}

export const processService = new ProcessService();
