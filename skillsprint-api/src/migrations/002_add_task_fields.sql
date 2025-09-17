-- Migration: Add missing fields to tasks table

-- Add new columns
ALTER TABLE tasks
ADD COLUMN title VARCHAR(255),
ADD COLUMN description TEXT,
ADD COLUMN status VARCHAR(50) DEFAULT 'todo',
ADD COLUMN priority VARCHAR(50) DEFAULT 'medium',
ADD COLUMN due_date DATE,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Optional: Add constraints or indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Optional: Add a trigger to auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();