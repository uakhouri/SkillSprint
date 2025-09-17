import pool from '../config/database.js';
import { Task, CreateTask, UpdateTask, TaskStatus } from '../schemas/tasks.js';

export class TaskModel {
  // Convert database row to Task object
  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as TaskStatus,
      priority: row.priority,
      dueDate: row.due_date ? new Date(row.due_date) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Get all tasks
  async findAll(): Promise<Task[]> {
    const query = `
      SELECT id, title, description, status, priority, due_date, created_at, updated_at
      FROM tasks
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows.map((row: any) => this.mapRowToTask(row));
  }

  // Get task by ID
  async findById(id: string): Promise<Task | null> {
    const query = `
      SELECT id, title, description, status, priority, due_date, created_at, updated_at
      FROM tasks
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToTask(result.rows[0]);
  }

  // Create new task
  async create(taskData: CreateTask): Promise<Task> {
    const query = `
      INSERT INTO tasks (title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, description, status, priority, due_date, created_at, updated_at
    `;
    
    const values = [
      taskData.title,
      taskData.description || null,
      taskData.status || 'todo',
      taskData.priority || 'medium',
      taskData.dueDate || null
    ];
    
    const result = await pool.query(query, values);
    return this.mapRowToTask(result.rows[0]);
  }

  // Update existing task
  async update(id: string, taskData: UpdateTask): Promise<Task | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Build dynamic update query
    if (taskData.title !== undefined) {
      paramCount++;
      fields.push(`title = $${paramCount}`);
      values.push(taskData.title);
    }
    
    if (taskData.description !== undefined) {
      paramCount++;
      fields.push(`description = $${paramCount}`);
      values.push(taskData.description);
    }
    
    if (taskData.status !== undefined) {
      paramCount++;
      fields.push(`status = $${paramCount}`);
      values.push(taskData.status);
    }
    
    if (taskData.priority !== undefined) {
      paramCount++;
      fields.push(`priority = $${paramCount}`);
      values.push(taskData.priority);
    }
    
    if (taskData.dueDate !== undefined) {
      paramCount++;
      fields.push(`due_date = $${paramCount}`);
      values.push(taskData.dueDate);
    }

    if (fields.length === 0) {
      return this.findById(id); // No updates, return existing
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, description, status, priority, due_date, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTask(result.rows[0]);
  }

  // Delete task
  async delete(id: string): Promise<Task | null> {
    const query = `
      DELETE FROM tasks
      WHERE id = $1
      RETURNING id, title, description, status, priority, due_date, created_at, updated_at
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTask(result.rows[0]);
  }

  // Update task status
  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    const query = `
      UPDATE tasks
      SET status = $1
      WHERE id = $2
      RETURNING id, title, description, status, priority, due_date, created_at, updated_at
    `;

    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTask(result.rows[0]);
  }

  // Get tasks by status
  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const query = `
      SELECT id, title, description, status, priority, due_date, created_at, updated_at
      FROM tasks
      WHERE status = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [status]);
    return result.rows.map((row: any) => this.mapRowToTask(row));
  }
}

export default TaskModel;