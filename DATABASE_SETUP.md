# Database Setup Instructions

## Step 1: Execute SQL in Supabase Dashboard

Before using the application, you need to set up the database schema in Supabase.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL below
4. Click "Run" to execute

## SQL Script

```sql
-- =====================================================
-- TABLE: skills
-- =====================================================
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: tasks
-- =====================================================
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  external_link VARCHAR(500),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  delivered_on_time BOOLEAN NOT NULL,
  manager_found_issues BOOLEAN NOT NULL,
  manager_notes TEXT,
  manager_helped_analysis BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: skill_ratings
-- =====================================================
CREATE TABLE skill_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, skill_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_task_date ON tasks(task_date);
CREATE INDEX idx_tasks_user_date ON tasks(user_id, task_date DESC);
CREATE INDEX idx_skill_ratings_task_id ON skill_ratings(task_id);
CREATE INDEX idx_skill_ratings_skill_id ON skill_ratings(skill_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_ratings ENABLE ROW LEVEL SECURITY;

-- Skills: Everyone can read active skills
CREATE POLICY "Anyone can view active skills" ON skills
  FOR SELECT USING (is_active = true);

-- Tasks: Users can only manage their own tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Skill Ratings: Users can only manage ratings on their own tasks
CREATE POLICY "Users can view ratings on their own tasks" ON skill_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = skill_ratings.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ratings on their own tasks" ON skill_ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = skill_ratings.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ratings on their own tasks" ON skill_ratings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = skill_ratings.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ratings on their own tasks" ON skill_ratings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = skill_ratings.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_ratings_updated_at BEFORE UPDATE ON skill_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: Skills
-- =====================================================
INSERT INTO skills (name) VALUES
('Analysis'),
('Planning'),
('Development'),
('QA'),
('English'),
('Task Comments'),
('Edge Cases Covered'),
('PR Review'),
('Code Quality'),
('Problem Solving'),
('Testing'),
('Debugging'),
('Time Management'),
('Initiative/Proactivity'),
('Mentoring Others');
```

## Step 2: Verify Database Setup

After running the SQL, verify:

1. **Tables Created**: Check that you have 3 tables:
   - `skills` (15 rows)
   - `tasks` (empty initially)
   - `skill_ratings` (empty initially)

2. **RLS Policies**: Verify that Row Level Security is enabled on all tables

3. **Indexes**: Confirm indexes are created for performance

## Step 3: Test the Application

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   - `/tasks/new` - Submit a new task
   - `/tasks` - View your task history
   - `/performance` - View performance dashboard

## Available Routes

- **Submit Task**: `/tasks/new` - Create a new task submission with skill ratings
- **My Tasks**: `/tasks` - View all submitted tasks with history
- **Performance**: `/performance` - View performance analytics and trends

## Features Implemented

✅ Task submission form with all 15 skills rating
✅ Manager feedback tracking (issues found, helped with analysis)
✅ Priority levels (High, Medium, Low)
✅ On-time delivery tracking
✅ Task history table with badges
✅ Performance dashboard with:
  - Top 5 strengths
  - Bottom 5 growth opportunities
  - Skill trend charts (6 months)
  - Summary statistics
✅ Full dark mode support
✅ Responsive design
✅ Row-level security for data isolation

## Next Steps

1. Execute the database setup SQL in Supabase
2. Start the development server
3. Sign in to your application
4. Submit your first task to test the system
5. View your performance dashboard after submitting a few tasks

For detailed implementation information, refer to `IMPLEMENTATION_PLAN.md`.
