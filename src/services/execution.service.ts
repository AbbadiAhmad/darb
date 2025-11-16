import db from '../database';
import { ProcessInstance, Task, StartProcessRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { processService } from './process.service';

class ExecutionService {
  async startProcess(data: StartProcessRequest, startedBy: string): Promise<ProcessInstance> {
    const { processKey, businessKey, variables } = data;

    // Get the active process definition
    const processDef = await processService.getProcessByKey(processKey);

    if (!processDef) {
      throw new AppError('Process definition not found', 404);
    }

    if (processDef.state !== 'published') {
      throw new AppError('Only published processes can be started', 400);
    }

    // Create process instance
    const result = await db.query(
      `INSERT INTO process_instances (
        process_definition_id, process_key, process_version,
        business_key, state, variables, started_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        processDef.id,
        processDef.key,
        processDef.version,
        businessKey || null,
        'active',
        JSON.stringify(variables || {}),
        startedBy,
      ]
    );

    const instance = this.mapRowToProcessInstance(result.rows[0]);

    // Parse BPMN and create initial tasks (simplified)
    await this.createInitialTasks(instance.id, processDef.bpmnXml);

    return instance;
  }

  async getProcessInstance(id: string): Promise<ProcessInstance | null> {
    const result = await db.query(
      'SELECT * FROM process_instances WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProcessInstance(result.rows[0]);
  }

  async listProcessInstances(filters?: {
    processKey?: string;
    state?: string;
    startedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ instances: ProcessInstance[]; total: number }> {
    let query = 'SELECT * FROM process_instances WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM process_instances WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.processKey) {
      const condition = ` AND process_key = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.processKey);
    }

    if (filters?.state) {
      const condition = ` AND state = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.state);
    }

    if (filters?.startedBy) {
      const condition = ` AND started_by = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.startedBy);
    }

    query += ' ORDER BY started_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const [instancesResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, paramCount - (filters?.limit ? 1 : 0) - (filters?.offset ? 1 : 0))),
    ]);

    return {
      instances: instancesResult.rows.map((row) => this.mapRowToProcessInstance(row)),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async getTaskById(id: string): Promise<Task | null> {
    const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTask(result.rows[0]);
  }

  async listTasks(filters?: {
    processInstanceId?: string;
    assignee?: string;
    state?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: Task[]; total: number }> {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM tasks WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.processInstanceId) {
      const condition = ` AND process_instance_id = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.processInstanceId);
    }

    if (filters?.assignee) {
      const condition = ` AND assignee = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.assignee);
    }

    if (filters?.state) {
      const condition = ` AND state = $${paramCount++}`;
      query += condition;
      countQuery += condition;
      params.push(filters.state);
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

    const [tasksResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, paramCount - (filters?.limit ? 1 : 0) - (filters?.offset ? 1 : 0))),
    ]);

    return {
      tasks: tasksResult.rows.map((row) => this.mapRowToTask(row)),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  async assignTask(taskId: string, assignee: string): Promise<Task> {
    const result = await db.query(
      `UPDATE tasks
       SET assignee = $1, state = 'assigned', assigned_at = NOW()
       WHERE id = $2 AND state IN ('created', 'assigned')
       RETURNING *`,
      [assignee, taskId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Task not found or cannot be assigned', 404);
    }

    return this.mapRowToTask(result.rows[0]);
  }

  async completeTask(taskId: string, completedBy: string, data?: { variables?: any; formData?: any }): Promise<Task> {
    const task = await this.getTaskById(taskId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.state === 'completed') {
      throw new AppError('Task already completed', 400);
    }

    const result = await db.query(
      `UPDATE tasks
       SET state = 'completed', completed_at = NOW(), completed_by = $1,
           variables = $2, form_data = $3
       WHERE id = $4
       RETURNING *`,
      [
        completedBy,
        data?.variables ? JSON.stringify(data.variables) : task.variables,
        data?.formData ? JSON.stringify(data.formData) : task.formData,
        taskId,
      ]
    );

    // Check if all tasks are completed to complete the process instance
    await this.checkProcessCompletion(task.processInstanceId);

    return this.mapRowToTask(result.rows[0]);
  }

  private async createInitialTasks(processInstanceId: string, bpmnXml: string): Promise<void> {
    // Simplified task creation - in a real implementation, this would parse the BPMN XML
    // and create tasks based on the process definition
    // For now, we'll create a single sample task

    await db.query(
      `INSERT INTO tasks (
        process_instance_id, task_definition_key, name, task_type, state, priority
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [processInstanceId, 'start_task', 'Initial Task', 'user_task', 'created', 50]
    );
  }

  private async checkProcessCompletion(processInstanceId: string): Promise<void> {
    // Check if all tasks are completed
    const result = await db.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN state = 'completed' THEN 1 ELSE 0 END) as completed
       FROM tasks
       WHERE process_instance_id = $1`,
      [processInstanceId]
    );

    const { total, completed } = result.rows[0];

    if (parseInt(total, 10) === parseInt(completed, 10) && parseInt(total, 10) > 0) {
      await db.query(
        `UPDATE process_instances
         SET state = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [processInstanceId]
      );
    }
  }

  private mapRowToProcessInstance(row: any): ProcessInstance {
    return {
      id: row.id,
      processDefinitionId: row.process_definition_id,
      processKey: row.process_key,
      processVersion: row.process_version,
      businessKey: row.business_key,
      state: row.state,
      variables: row.variables,
      startedBy: row.started_by,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      parentInstanceId: row.parent_instance_id,
      variantId: row.variant_id,
    };
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      processInstanceId: row.process_instance_id,
      taskDefinitionKey: row.task_definition_key,
      name: row.name,
      description: row.description,
      taskType: row.task_type,
      state: row.state,
      assignee: row.assignee,
      candidateUsers: row.candidate_users,
      candidateRoles: row.candidate_roles,
      priority: row.priority,
      dueDate: row.due_date,
      formData: row.form_data,
      variables: row.variables,
      createdAt: row.created_at,
      assignedAt: row.assigned_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      completedBy: row.completed_by,
    };
  }
}

export const executionService = new ExecutionService();
