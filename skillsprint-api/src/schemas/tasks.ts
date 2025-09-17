import { z } from 'zod';

// Enums for validation
export const TaskStatusSchema = z.enum(['todo', 'in-progress', 'completed']);
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high']);

// Main Task schema
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  dueDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Schema for creating new tasks
export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  dueDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
});

// Schema for updating tasks
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  dueDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
});

// TypeScript types
export type Task = z.infer<typeof TaskSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;