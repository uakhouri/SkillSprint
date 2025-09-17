import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import path from 'path';
import pool, { testConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoUsers = [
  { email: 'alice@skillsprint.com', password: 'alice123' },
  { email: 'bob@skillsprint.com', password: 'bob123' },
  { email: 'charlie@skillsprint.com', password: 'charlie123' }
];

const sampleSprints = [
  {
    title: 'Learn TypeScript Fundamentals',
    goal: 'Master the basics of TypeScript including types, interfaces, generics, and advanced patterns',
    duration: 7
  },
  {
    title: 'Build a REST API with Express',
    goal: 'Create a fully functional backend API with routing, middleware, and database integration',
    duration: 5
  }
];

const sampleTasks = [
  'Set up development environment',
  'Learn basic types',
  'Practice interfaces and type aliases',
  'Build typed functions',
  'Explore union and intersection types',
  'Learn generics and constraints',
  'Use utility types',
  'Build a mini project',
  'Refactor code with better types'
];

const sampleCheckins = [
  { mood: 'good', difficulty: 'easy', reflection: 'Feeling productive today!' },
  { mood: 'okay', difficulty: 'medium', reflection: 'Struggled a bit but made progress.' },
  { mood: 'excellent', difficulty: 'hard', reflection: 'Crushed it! Learned a lot.' }
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to database');
      process.exit(1);
    }

    console.log('🧹 Clearing existing data...');
    await pool.query('DELETE FROM xp_logs');
    await pool.query('DELETE FROM checkins');
    await pool.query('DELETE FROM tasks');
    await pool.query('DELETE FROM sprints');
    await pool.query('DELETE FROM users');

    for (const user of demoUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      const userResult = await pool.query(`
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id, email
      `, [user.email, hashedPassword]);

      const userId = userResult.rows[0].id;
      console.log(`✅ Created user: ${user.email}`);

      for (const sprint of sampleSprints) {
        const startDate = new Date();
        const sprintResult = await pool.query(`
          INSERT INTO sprints (user_id, title, goal_description, duration_days, start_date)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, title
        `, [
          userId,
          sprint.title,
          sprint.goal,
          sprint.duration,
          startDate.toISOString().split('T')[0]
        ]);

        const sprintId = sprintResult.rows[0].id;
        console.log(`🏃‍♂️ Created sprint: "${sprint.title}" for ${user.email}`);

        let taskCount = 0;
        for (let day = 1; day <= sprint.duration; day++) {
          const taskText = sampleTasks[day % sampleTasks.length];
          await pool.query(`
            INSERT INTO tasks (
              sprint_id, day_number, task_text, title, description, status, priority, due_date, resources, is_complete
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            sprintId,
            day,
            taskText,
            taskText,
            `Description for: ${taskText}`,
            'todo',
            'medium',
            null,
            null,
            Math.random() > 0.5
          ]);
          taskCount++;
        }
        console.log(`📝 Created ${taskCount} tasks`);

        for (let day = 1; day <= Math.min(3, sprint.duration); day++) {
          const checkin = sampleCheckins[day % sampleCheckins.length];
          await pool.query(`
            INSERT INTO checkins (sprint_id, day_number, reflection_text, mood, task_difficulty)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            sprintId,
            day,
            checkin.reflection,
            checkin.mood,
            checkin.difficulty
          ]);
        }
        console.log(`✅ Created ${Math.min(3, sprint.duration)} check-ins`);

        const xpLogs = [
          { day: 1, xp: 25, reason: 'Completed daily sprint tasks' },
          { day: 2, xp: 30, reason: 'Completed daily tasks + extra practice' },
          { day: 3, xp: 20, reason: 'Completed most tasks' },
          { day: null, xp: 50, reason: 'Weekly consistency bonus' }
        ];

        for (const log of xpLogs) {
          await pool.query(`
            INSERT INTO xp_logs (user_id, sprint_id, day_number, xp_earned, reason)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            userId,
            log.day ? sprintId : null,
            log.day,
            log.xp,
            log.reason
          ]);
        }
        console.log(`🏆 Created ${xpLogs.length} XP logs`);
      }

      const xpResult = await pool.query(`
        SELECT SUM(xp_earned) as total_xp FROM xp_logs WHERE user_id = $1
      `, [userId]);

      console.log(`📊 Stats for ${user.email}:`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   🏆 Total XP: ${xpResult.rows[0].total_xp || 0}`);
      console.log(`   🏃‍♂️ Sprints: ${sampleSprints.length}`);
      console.log(`   📝 Tasks: ${sampleSprints.length * sampleSprints[0].duration}`);
      console.log(`   ✅ Check-ins: ${Math.min(3, sampleSprints[0].duration)}\n`);
    }

    console.log('🎉 All users seeded successfully!');
  } catch (error) {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === __filename) {
  seedDatabase();
}

export default seedDatabase;