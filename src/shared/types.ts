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
