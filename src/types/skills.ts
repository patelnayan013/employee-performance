// Database models
export interface Skill {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  task_date: string;
  external_link: string | null;
  priority: 'high' | 'medium' | 'low';
  delivered_on_time: boolean;
  manager_found_issues: boolean;
  manager_notes: string | null;
  manager_helped_analysis: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillRating {
  id: string;
  task_id: string;
  skill_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface TaskWithDetails extends Task {
  skill_ratings: (SkillRating & { skill: Skill })[];
  average_rating?: number;
}

// Aggregation types
export interface SkillAverage {
  skill_id: string;
  skill_name: string;
  average_rating: number;
  rating_count: number;
  min_rating: number;
  max_rating: number;
}

export interface SkillTrend {
  skill_id: string;
  skill_name: string;
  period: string; // ISO date string for the period start
  average_rating: number;
  rating_count: number;
}

export interface PerformanceSummary {
  total_tasks: number;
  overall_average: number;
  skill_averages: SkillAverage[];
  strengths: SkillAverage[]; // Top 5 skills
  growth_opportunities: SkillAverage[]; // Bottom 5 skills
  on_time_delivery_rate: number;
  manager_issues_rate: number;
  manager_helped_rate: number;
}

// Form types
export interface TaskSubmissionFormData {
  title: string;
  description: string;
  task_date: string;
  external_link?: string;
  priority: 'high' | 'medium' | 'low';
  delivered_on_time: boolean;
  manager_found_issues: boolean;
  manager_notes?: string;
  manager_helped_analysis: boolean;
  skill_ratings: Map<string, number>; // skill_id -> rating
}

// Constants
export const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
} as const;

export const RATING_DESCRIPTIONS = {
  1: 'Significant improvement needed',
  2: 'Below expectations',
  3: 'Meets expectations',
  4: 'Exceeds expectations',
  5: 'Outstanding performance',
} as const;

export const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;
