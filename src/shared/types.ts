export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color_code: string | null;
  created_at: string;
  updated_at: string;
  // Computed properties
  total_topics?: number;
  completed_topics?: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  current_streak: number;
  last_study_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_subjects: number;
  total_topics: number;
  completed_topics: number;
  overall_percentage: number;
  today_study_minutes: number;
  today_sessions: number;
  current_streak: number;
}

export interface DashboardSubject {
  id: string;
  name: string;
  color_code: string | null;
  total_topics: number;
  completed_topics: number;
  completion_percentage: number;
}

export interface DashboardData {
  stats: DashboardStats;
  subjects: DashboardSubject[];
  today_tasks?: (StudyTask & { topic?: { name: string; subject?: { name: string; color_code: string | null } } })[];
  user_full_name?: string | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  topic_id: string | null;
  duration_minutes: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface StudySessionWithDetails extends StudySession {
  topic?: {
    name: string;
    subject: {
      name: string;
      color_code: string | null;
    }
  } | null;
}


export interface Exam {
  id: string;
  subject_id: string;
  user_id: string;
  exam_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamWithSubject extends Exam {
  subject: {
    name: string;
    color_code: string | null;
  };
}

export interface StudyPlan {
  id: string;
  user_id: string;
  exam_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudyTask {
  id: string;
  user_id: string;
  study_plan_id: string;
  topic_id: string | null;
  task_date: string;
  duration_minutes: number;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudyPlanWithDetails extends StudyPlan {
  exam: ExamWithSubject;
  tasks: (StudyTask & { topic?: { name: string } | null })[];
}

export interface StudyMaterial {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id: string | null;
  material_type: 'note' | 'pyq';
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  extraction_error?: string | null;
  extracted_at?: string | null;
  extraction_truncated?: boolean;
}
