-- SkillSprint API Database Schema
-- Migration: 001_create_skillsprint_tables.sql

-- Create ENUM types
CREATE TYPE mood_type AS ENUM ('terrible', 'bad', 'okay', 'good', 'excellent');
CREATE TYPE task_difficulty AS ENUM ('very_easy', 'easy', 'medium', 'hard', 'very_hard');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Sprints table
CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    goal_description TEXT,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0 AND duration_days <= 365),
    start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0)
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1),
    task_text TEXT NOT NULL,
    resources JSONB,
    is_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT task_text_not_empty CHECK (length(trim(task_text)) > 0),
    UNIQUE(sprint_id, day_number, task_text)
);

-- Checkins table
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1),
    reflection_text TEXT,
    mood mood_type,
    task_difficulty task_difficulty,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(sprint_id, day_number)
);

-- XP Logs table
CREATE TABLE xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    day_number INTEGER,
    xp_earned INTEGER NOT NULL CHECK (xp_earned >= 0),
    reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sprints_user_id ON sprints(user_id);
CREATE INDEX idx_sprints_start_date ON sprints(start_date DESC);
CREATE INDEX idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX idx_tasks_day_number ON tasks(day_number);
CREATE INDEX idx_tasks_is_complete ON tasks(is_complete);
CREATE INDEX idx_checkins_sprint_id ON checkins(sprint_id);
CREATE INDEX idx_checkins_day_number ON checkins(day_number);
CREATE INDEX idx_xp_logs_user_id ON xp_logs(user_id);
CREATE INDEX idx_xp_logs_sprint_id ON xp_logs(sprint_id);
CREATE INDEX idx_xp_logs_created_at ON xp_logs(created_at DESC);

-- Triggers for cascading XP calculations
CREATE OR REPLACE FUNCTION award_task_completion_xp()
RETURNS TRIGGER AS $$
BEGIN
    -- Award XP when task is marked as complete
    IF NEW.is_complete = true AND (OLD IS NULL OR OLD.is_complete = false) THEN
        INSERT INTO xp_logs (user_id, sprint_id, day_number, xp_earned, reason)
        SELECT s.user_id, NEW.sprint_id, NEW.day_number, 10, 'Task completion: ' || LEFT(NEW.task_text, 50) || '...'
        FROM sprints s WHERE s.id = NEW.sprint_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completion_xp_trigger
    AFTER INSERT OR UPDATE OF is_complete ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION award_task_completion_xp();

-- Function to get sprint progress
CREATE OR REPLACE FUNCTION get_sprint_progress(sprint_uuid UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE is_complete = true) as completed_tasks,
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE is_complete = true)::NUMERIC / COUNT(*)) * 100, 2)
        END as completion_percentage
    FROM tasks
    WHERE sprint_id = sprint_uuid;
END;
$$ LANGUAGE plpgsql;