import {Router} from 'express';
import pool from '../config/database.js';
import {z} from 'zod';
import { authenticate,AuthenticatedRequest } from '@/middleware/authenticate.js';
import { generateTasksWithOpenRouter } from '@/utils/openRouter.js';
import { start } from 'repl';

const router = Router()

const SprintSchema = z.object({ //this schema is used for validating the input from the user
  title:z.string().min(1),
  goal_description:z.string().min(10),
  duration_days:z.number().min(1).max(30),
  start_date:z.string().default(new Date().toISOString())//optional, defaults to today
});

router.post('/', authenticate, async (req: AuthenticatedRequest,res)=>{
  try{
    //Validate the input
    const {title, goal_description, duration_days, start_date} = SprintSchema.parse(req.body)
    const userId = req.user!.userId;

    //Save the sprint to the database
    const sprintResult = await pool.query(
      'INSERT INTO sprints (user_id, title, goal_description, duration_days, start_date,created_at) VALUES ($1,$2,$3,$4,$5, NOW()) RETURNING id',
      [userId, title, goal_description, duration_days, start_date]
    );
    const sprintId = sprintResult.rows[0].id;

    //Generate tasks using HuggingFace
    const tasks = await generateTasksWithOpenRouter(goal_description, duration_days);

    //Save the tasks to the database
    for(const task of tasks){
      await pool.query(
        'INSERT INTO tasks (sprint_id, day_number, title, description, resources, is_complete, created_at) VALUES ($1,$2,$3,$4,$5,false, NOW())',
        [sprintId, task.day, task.title, task.description, JSON.stringify(task.resources || [] )]
      );
  }

  // Respond to the client
    res.status(201).json({ 
      success: true,
      message: 'Sprint and tasks created successfully', 
      sprintId,
      taskCount: tasks.length
   });
  }catch(error){
    console.error('Error creating sprint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
})

export default router;