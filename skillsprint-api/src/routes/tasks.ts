import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '@/middleware/authenticate.js';
import { TaskService } from '@/services/taskService.js';

const router = Router();
const taskService = new TaskService();

router.get('/', authenticate, async (req, res) => {
  const tasks = await taskService.findAll();
  res.json({ success: true, data: tasks, count: tasks.length });
});

router.get('/:id', authenticate, async (req, res) => {
  const task = await taskService.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  res.json({ success: true, data: task });
});

router.patch('/:id/status', authenticate, async (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!['todo', 'in-progress', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const updatedTask = await taskService.updateStatus(req.params.id, status, req.user!.userId);
  if (!updatedTask) return res.status(404).json({ success: false, error: 'Task not found' });

  res.json({ success: true, data: updatedTask, message: 'Task status updated successfully' });
});

router.get('/status/:status', authenticate, async (req, res) => {
  const tasks = await taskService.findByStatus(req.params.status as any);
  res.json({ success: true, data: tasks, count: tasks.length });
});

export default router;
