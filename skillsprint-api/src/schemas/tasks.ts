import { z } from 'zod';

export const TaskStatusSchema = z.enum(['todo', 'in-progress', 'completed']);
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  dueDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sprint_id: z.string().uuid().nullable(),
  day_number: z.number().nullable()
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
