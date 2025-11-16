import db from '../database';
import { WorkItem, CreateWorkItemRequest, UpdateWorkItemRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

class WorkItemService {
  async createWorkItem(data: CreateWorkItemRequest, reporter: string): Promise<WorkItem> {
    const {
      title,
      description,
      itemType = 'ticket',
      priority = 'medium',
      assignee,
      category,
      tags,
      dueDate,
    } = data;

    const result = await db.query(
      `INSERT INTO work_items (
        title, description, item_type, status, priority,
        assignee, reporter, category, tags, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        title,
        description || null,
        itemType,
        'open',
        priority,
        assignee || null,
        reporter,
        category || null,
        tags || [],
        dueDate || null,
      ]
    );

    return this.mapRowToWorkItem(result.rows[0]);
  }

  async getWorkItemById(id: string): Promise<WorkItem | null> {
    const result = await db.query('SELECT * FROM work_items WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToWorkItem(result.rows[0]);
  }

  async listWorkItems(filters?: {
    status?: string;
    assignee?: string;
    reporter?: string;
    priority?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: WorkItem[]; total: number }> {
    let query = 'SELECT * FROM work_items WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM work_items WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      const condition = ` AND status = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.status);
    }

    if (filters?.assignee) {
      const condition = ` AND assignee = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.assignee);
    }

    if (filters?.reporter) {
      const condition = ` AND reporter = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.reporter);
    }

    if (filters?.priority) {
      const condition = ` AND priority = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.priority);
    }

    if (filters?.category) {
      const condition = ` AND category = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.category);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const [itemsResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, paramCount - (filters?.limit ? 1 : 0) - (filters?.offset ? 1 : 0))),
    ]);

    return {
      items: itemsResult.rows.map((row) => this.mapRowToWorkItem(row)),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async updateWorkItem(id: string, data: UpdateWorkItemRequest): Promise<WorkItem> {
    const workItem = await this.getWorkItemById(id);

    if (!workItem) {
      throw new AppError('Work item not found', 404);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title) {
      fields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }

    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (data.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);

      // Auto-set resolved_at or closed_at based on status
      if (data.status === 'resolved') {
        fields.push(`resolved_at = NOW()`);
      } else if (data.status === 'closed') {
        fields.push(`closed_at = NOW()`);
      }
    }

    if (data.priority) {
      fields.push(`priority = $${paramCount++}`);
      values.push(data.priority);
    }

    if (data.assignee !== undefined) {
      fields.push(`assignee = $${paramCount++}`);
      values.push(data.assignee);
    }

    if (data.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(data.category);
    }

    if (data.tags !== undefined) {
      fields.push(`tags = $${paramCount++}`);
      values.push(data.tags);
    }

    if (data.dueDate !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(data.dueDate);
    }

    if (fields.length === 0) {
      return workItem;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE work_items
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    return this.mapRowToWorkItem(result.rows[0]);
  }

  async addComment(workItemId: string, userId: string, comment: string): Promise<void> {
    await db.query(
      'INSERT INTO work_item_comments (work_item_id, user_id, comment) VALUES ($1, $2, $3)',
      [workItemId, userId, comment]
    );
  }

  async getComments(workItemId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT wic.*, u.username, u.first_name, u.last_name
       FROM work_item_comments wic
       JOIN users u ON wic.user_id = u.id
       WHERE wic.work_item_id = $1
       ORDER BY wic.created_at ASC`,
      [workItemId]
    );

    return result.rows;
  }

  private mapRowToWorkItem(row: any): WorkItem {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      itemType: row.item_type,
      status: row.status,
      priority: row.priority,
      processInstanceId: row.process_instance_id,
      taskId: row.task_id,
      assignee: row.assignee,
      reporter: row.reporter,
      category: row.category,
      tags: row.tags,
      customFields: row.custom_fields,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
      closedAt: row.closed_at,
      dueDate: row.due_date,
    };
  }
}

export const workItemService = new WorkItemService();
