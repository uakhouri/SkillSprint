import pool from '../config/database.js';
import { Task, TaskStatus } from '../schemas/tasks.js';

export class TaskService {
  // Convert DB row to Task object
  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as TaskStatus,
      priority: row.priority,
      dueDate: row.due_date ? new Date(row.due_date) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      sprint_id: row.sprint_id,
      day_number: row.day_number
    };
  }

  async findAll(): Promise<Task[]> {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows.map(this.mapRowToTask);
  }

  async findById(id: string): Promise<Task | null> {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows.length ? this.mapRowToTask(result.rows[0]) : null;
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const result = await pool.query('SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC', [status]);
    return result.rows.map(this.mapRowToTask);
  }

  async updateStatus(id: string, status: TaskStatus, userId: string): Promise<Task | null> {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) return null;

    const updatedTask = this.mapRowToTask(result.rows[0]);

    // ✅ Log XP if completed
    if (status === 'completed') {
      await pool.query(
        'INSERT INTO xp_logs (user_id, sprint_id, day_number, xp_earned, reason, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [userId, updatedTask.sprint_id, updatedTask.day_number, 10, 'Completed task']
      );
    }

    return updatedTask;
  }
}
