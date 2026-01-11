# Implementation Plan: Task-Based Employee Skill Review System

## Overview
Create a self-rating system where employees submit tasks (PRs, bug fixes, documentation) and rate their performance on specific skills. The system aggregates ratings into weekly/monthly trends, showing strengths, weaknesses, and improvement over time.

## Key Requirements
- **Employee self-rating** when submitting tasks
- **Manual entry form** for task submission
- **1-5 rating scale** (1=Poor, 5=Excellent)
- **All tasks use same skill set** - no task type differentiation
- **Weekly/monthly trend aggregation**
- **Clear visualization** of strengths and improvement areas
- **Manager feedback tracking** - Did manager find issues?
- **Task priority** - High/Medium/Low
- **On-time delivery** - Yes/No tracking

## Tech Stack Context
- Next.js 16 (App Router, Server Components, Server Actions)
- TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS v4
- ApexCharts for visualizations
- Native React forms (no React Hook Form)

---

## Database Schema

### Simplified 3-Table Structure

#### 1. **skills** - Master list of all skills
Master list of skills that apply to ALL tasks (no task type differentiation):
- Analysis
- Planning
- Development
- QA (Quality Assurance)
- English (Communication)
- Task Comments (Documentation)
- Edge Cases Covered
- PR Review
- Code Quality
- Problem Solving
- Testing
- Debugging
- Time Management
- Initiative/Proactivity
- Mentoring Others

#### 2. **tasks** - Employee task submissions
Fields:
- `id` (UUID, primary key)
- `user_id` (UUID, references auth.users)
- `title` (VARCHAR)
- `description` (TEXT)
- `task_date` (DATE)
- `external_link` (VARCHAR, optional - PR link, ticket URL, etc.)
- `priority` (ENUM: 'high', 'medium', 'low')
- `delivered_on_time` (BOOLEAN)
- `manager_found_issues` (BOOLEAN)
- `manager_notes` (TEXT, optional)
- `manager_helped_analysis` (BOOLEAN) - Did manager help with task analysis?
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### 3. **skill_ratings** - Ratings for each skill per task
Fields:
- `id` (UUID, primary key)
- `task_id` (UUID, references tasks)
- `skill_id` (UUID, references skills)
- `rating` (INTEGER, CHECK 1-5)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Key Features
- Row-Level Security (RLS) policies ensuring users only see their own data
- Proper indexes for performance on user_id and task_date queries
- Triggers for auto-updating timestamps
- Simple aggregation via SQL queries (no views needed)

---

## Implementation Steps

### Phase 1: Database Setup ⚡ CRITICAL FIRST STEP
**Files to create:**
- Manual SQL execution in Supabase SQL Editor (no local file needed)

**SQL to execute:**

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

**Actions:**
1. Execute database schema SQL in Supabase dashboard
2. Execute seed data SQL to populate skills
3. Verify 3 tables created with proper RLS policies
4. Verify 15 skills are seeded

**Critical tables:** 3 tables (skills, tasks, skill_ratings) must be created before proceeding

---

### Phase 2: TypeScript Types & Server Actions

**Files to create:**

#### 1. `/src/types/skills.ts`
Complete TypeScript interfaces for:
- Database models: `Skill`, `Task`, `SkillRating`
- Extended types: `TaskWithDetails`
- Aggregation types: `SkillAverage`, `SkillTrend`, `PerformanceSummary`
- Form types: `TaskSubmissionFormData`
- Constants: `RATING_LABELS`, `RATING_DESCRIPTIONS`, `PRIORITY_OPTIONS`

#### 2. `/src/app/actions/tasks.ts`
Server actions for task management:
- `submitTask(formData)` - Create new task with skill ratings, priority, delivery status
- `updateTask(taskId, formData)` - Update existing task and ratings
- `deleteTask(taskId)` - Delete task (cascades to ratings via DB)
- `getAllSkills()` - Fetch all active skills (replaces getTaskTypes)
- `getUserTasks(userId?, limit, offset)` - Fetch user's task history with pagination
- `getTaskById(taskId)` - Fetch single task with all details

**Key features:**
- Authentication checks using `getCurrentUser()`
- Ownership verification for updates/deletes
- All skills are rated for every task (no partial rating)
- Transaction-like behavior (rollback on rating insert failure)
- `revalidatePath()` for cache invalidation
- Handles priority, delivered_on_time, manager_found_issues fields

#### 3. `/src/app/actions/performance.ts`
Server actions for analytics:
- `getWeeklySkillTrends(weekCount)` - Calculate weekly skill averages from raw data
- `getMonthlySkillTrends(monthCount)` - Calculate monthly skill averages from raw data
- `getOverallSkillAverages()` - Calculate all-time averages, top 5 skills, bottom 5 skills
- `getPerformanceSummary(startDate, endDate)` - Aggregated performance data for date range

**Key features:**
- Direct SQL aggregation queries (no views)
- Server-side trend calculation using GROUP BY and DATE_TRUNC
- Categorization into strengths/weaknesses
- Calculates averages, counts, min/max ratings per skill

---

### Phase 3: Form Components

**Files to create:**

#### 1. `/src/components/form/RatingInput.tsx`
Custom rating component with:
- 5 clickable buttons (1-5 scale)
- Visual feedback for selected rating
- Skill name and description display
- Required field indicator
- Rating label (Poor/Fair/Good/Very Good/Excellent)
- Dark mode support

**Dependencies:** Uses existing Tailwind classes matching your design system

#### 2. `/src/components/tasks/TaskSubmissionForm.tsx`
Main task submission form featuring:
- **All 15 skills loaded on mount** - No dynamic loading, all skills shown for every task
- **Task information fields**:
  - Title (Input)
  - Description (TextArea)
  - Date (DatePicker)
  - External Link (Input, optional)
  - Priority (Select: High/Medium/Low)
  - Delivered on time? (Radio: Yes/No)
  - Manager found issues? (Radio: Yes/No)
  - Manager notes (TextArea, optional, shown if manager found issues = Yes)
  - Manager helped with analysis? (Radio: Yes/No)
- **Skill rating section** - RatingInput for ALL 15 skills (all required)
- **Form validation** - Ensures all 15 skills are rated before submission
- **Error handling** - Display validation and submission errors
- **Loading states** - Disable submit during API calls
- **Cancel/Submit buttons** - Navigate back or submit

**Key logic:**
- `useState` for form data and ratings (Map<skillId, rating>)
- `useEffect` to load all skills on mount (single fetch)
- Validation ensures all 15 skills have ratings before calling `submitTask()`
- Router navigation on success

---

### Phase 4: Display Components

**Files to create:**

#### 1. `/src/components/tasks/TaskHistoryTable.tsx`
Table displaying submitted tasks:
- Columns: Date, Task Title, Priority, Avg Rating, On Time?, Manager Issues?, Actions
- Badge components for:
  - Priority (High=error, Medium=warning, Low=success)
  - Avg Rating (color-coded by value)
  - On Time (Yes=success, No=error)
  - Manager Issues (Yes=error, No=success)
- Action buttons: View, Edit, Delete
- Responsive design with horizontal scroll on mobile
- Uses existing Table components from your UI library
- Empty state handling

**External dependency:** `date-fns` for date formatting (needs installation)

#### 2. `/src/components/performance/SkillsOverview.tsx`
Two-column layout showing:
- **Your Strengths**: Top 5 highest-rated skills with ranking, name, rating count, and badge
- **Growth Opportunities**: Bottom 5 skills (improvement areas) with same format
- Color-coded badges based on rating (>4.5=success, >3.5=primary, >2.5=warning, else error)
- Dark mode support

#### 3. `/src/components/performance/SkillTrendChart.tsx`
Line chart component using ApexCharts:
- Smooth line curve showing rating over time
- X-axis: Time periods (weeks/months)
- Y-axis: Rating (0-5 scale)
- Responsive design
- Dynamic import for SSR compatibility
- Customizable color prop

**External dependency:** `react-apexcharts` and `apexcharts` (already in your project)

---

### Phase 5: Pages & Routes

**Files to create:**

#### 1. `/src/app/(admin)/tasks/new/page.tsx`
Task submission page:
- Server Component
- PageBreadcrumb component
- ComponentCard wrapper
- Renders `<TaskSubmissionForm />`
- Metadata for SEO

**Route:** `/tasks/new`

#### 2. `/src/app/(admin)/tasks/page.tsx`
Task history page:
- Server Component
- Fetches user tasks on server using `getUserTasks()`
- "Submit New Task" button in header
- Renders `<TaskHistoryTable />`
- Empty state with CTA when no tasks exist
- Auth redirect if not logged in

**Route:** `/tasks`

#### 3. `/src/app/(admin)/performance/page.tsx`
Performance dashboard page:
- Server Component
- Parallel data fetching: `getOverallSkillAverages()` and `getMonthlySkillTrends(6)`
- Renders `<SkillsOverview />` with top/bottom skills
- Renders multiple `<SkillTrendChart />` components (up to 4 skills)
- Empty state when no data exists
- Auth redirect if not logged in

**Route:** `/performance`

---

### Phase 6: Navigation Integration

**File to modify:**
- `/src/layout/AppSidebar.tsx` or sidebar navigation component

**Changes:**
Add navigation items for:
- "Submit Task" → `/tasks/new`
- "My Tasks" → `/tasks`
- "Performance" → `/performance`

---

### Phase 7: Dependencies

**Packages to install:**
```bash
npm install date-fns
```

**Already available:** react-apexcharts, apexcharts (verified in your package.json)

---

## Critical Files Summary

### Must Create (Priority Order)
1. **Database Schema** - Execute SQL in Supabase (Phase 1) - Creates 3 tables with 15 skills
2. `/src/types/skills.ts` - Type definitions (Phase 2)
3. `/src/app/actions/tasks.ts` - Core business logic (Phase 2)
4. `/src/app/actions/performance.ts` - Analytics logic (Phase 2)
5. `/src/components/form/RatingInput.tsx` - Rating UI (Phase 3)
6. `/src/components/tasks/TaskSubmissionForm.tsx` - Main form with all fields (Phase 3)
7. `/src/app/(admin)/tasks/new/page.tsx` - Submission page (Phase 5)
8. `/src/components/tasks/TaskHistoryTable.tsx` - Task list with priority/delivery columns (Phase 4)
9. `/src/app/(admin)/tasks/page.tsx` - History page (Phase 5)
10. `/src/components/performance/SkillsOverview.tsx` - Strengths/weaknesses (Phase 4)
11. `/src/components/performance/SkillTrendChart.tsx` - Trend visualization (Phase 4)
12. `/src/app/(admin)/performance/page.tsx` - Dashboard page (Phase 5)

### May Modify
- Sidebar navigation component (add new menu items)

---

## Verification Steps

### After Phase 1 (Database)
- [ ] 3 tables exist in Supabase (skills, tasks, skill_ratings)
- [ ] 15 skills are seeded (including Initiative/Proactivity and Mentoring Others)
- [ ] RLS policies are enabled on all tables
- [ ] Can query skills table and see all 15 skills
- [ ] skills table has no description or display_order columns
- [ ] tasks table has manager_helped_analysis column
- [ ] skill_ratings table has no notes column

### After Phase 2-3 (Actions & Forms)
- [ ] Can submit a task through the form
- [ ] All 15 skills load on form mount
- [ ] Priority dropdown works (High/Medium/Low)
- [ ] On-time delivery radio works (Yes/No)
- [ ] Manager issues radio works (Yes/No)
- [ ] Manager notes field shows when manager found issues = Yes
- [ ] Manager helped with analysis radio works (Yes/No)
- [ ] Validation prevents submission without rating all 15 skills
- [ ] Data appears correctly in Supabase tables
- [ ] Error messages display for validation failures

### After Phase 4-5 (Display & Pages)
- [ ] Task history page shows submitted tasks with all columns
- [ ] Priority badges display correctly (High/Medium/Low)
- [ ] Average ratings calculate correctly across 15 skills
- [ ] On-time delivery badge shows Yes/No
- [ ] Manager issues badge shows Yes/No
- [ ] Manager helped analysis badge/column displays correctly
- [ ] Performance dashboard shows top 5 and bottom 5 skills
- [ ] Charts render with correct data
- [ ] Empty states display when no data exists

### End-to-End Test
1. Sign in as employee
2. Navigate to "Submit Task"
3. Fill out task details:
   - Title: "Implement user authentication"
   - Description: "Added JWT-based auth system"
   - Date: Today
   - External Link: "https://github.com/repo/pull/123"
   - Priority: High
   - Delivered on time: Yes
   - Manager found issues: No
   - Manager helped with analysis: No
4. Rate ALL 15 skills (Analysis, Planning, Development, QA, English, Task Comments, Edge Cases Covered, PR Review, Code Quality, Problem Solving, Testing, Debugging, Time Management, Initiative/Proactivity, Mentoring Others)
5. Submit successfully
6. View task in "My Tasks" - verify all fields display correctly including manager_helped_analysis
7. Check "Performance" dashboard shows the new ratings
8. Submit 3-4 more tasks over different dates with varying ratings
9. Verify weekly/monthly trends appear on dashboard
10. Verify top 5 skills and bottom 5 skills update correctly
11. Test editing and deleting tasks

---

## Edge Cases Handled

### Data Integrity
- Users can only view/edit their own tasks (RLS policies)
- All 15 skills must be rated before submission (validation)
- Ratings are 1-5 constrained at database level (CHECK constraint)
- Task deletion cascades to skill ratings (ON DELETE CASCADE)
- Priority must be one of: high, medium, low (CHECK constraint)

### User Experience
- Empty states with helpful CTAs when no tasks exist
- Loading states during form submission
- Error messages for validation failures
- Manager notes field conditionally shown based on "Manager found issues" selection
- Date defaults to today but allows backdating
- All 15 skills always shown (no dynamic loading complexity)

### Performance
- Database indexes on user_id and task_date columns
- Direct aggregation queries with GROUP BY (no views needed)
- Pagination support in `getUserTasks()` (50 per page)
- Lazy loading of charts via dynamic import

### Security
- All server actions verify authentication
- RLS policies prevent cross-user data access
- Ownership checks on update/delete operations
- Supabase client prevents SQL injection

---

## Optional Future Enhancements
1. Task editing functionality (currently submit-only)
2. Filters/sorting on task history (by type, date, rating)
3. Export reports to CSV/PDF
4. Goal setting and tracking
5. Manager view (requires role system)
6. Team comparisons and benchmarks
7. Notifications for milestones
8. Bulk task submission via CSV import
9. AI-powered insights and recommendations
10. Integration with GitHub API for automatic PR submission

---

## Key Simplifications from Original Design
1. **No task_types table** - All tasks use the same 15 skills, no categorization
2. **No task_type_skills junction table** - Removed with task types
3. **No database views** - Direct aggregation queries using SQL GROUP BY
4. **Simpler form** - Load all 15 skills once, no dynamic skill loading
5. **Added manager feedback fields** - priority, delivered_on_time, manager_found_issues, manager_notes, manager_helped_analysis
6. **Streamlined skill list** - 15 carefully chosen skills focused on practical work evaluation
7. **Minimal schema** - skills table only has id, name, is_active (no description, no display_order)
8. **Simple ratings** - skill_ratings table only has id, task_id, skill_id, rating (no notes field)

## Skills Included (15 Total)
1. Analysis - Requirements and problem analysis
2. Planning - Task planning and estimation
3. Development - Code implementation
4. QA - Quality assurance and testing
5. English - Communication skills
6. Task Comments - Documentation in tasks
7. Edge Cases Covered - Thorough edge case handling
8. PR Review - Code review quality
9. Code Quality - Clean, maintainable code
10. Problem Solving - Complex problem resolution
11. Testing - Test writing and execution
12. Debugging - Bug identification and fixing
13. Time Management - Meeting deadlines
14. Initiative/Proactivity - Taking initiative without being asked
15. Mentoring Others - Helping and guiding team members

## Notes
- All components follow your existing design system patterns
- Dark mode is fully supported throughout
- Mobile responsive by default using Tailwind
- Server Components used where possible for performance
- Client Components only when interactivity is needed (forms, charts)
- Type safety enforced with TypeScript throughout
- Error handling at every async boundary
- Simpler architecture = easier to maintain and extend
