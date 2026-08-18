import { createClient } from "@supabase/supabase-js";
import { DashboardData } from "../../shared/types";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class DashboardService {
  static async getDashboardData(userId: string, tzOffset: number = 0): Promise<DashboardData> {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, color_code, topics(id, is_completed)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    let totalTopics = 0;
    let completedTopics = 0;
    const subjects = data.map((subject: any) => {
      const sTotal = subject.topics?.length || 0;
      const sCompleted = subject.topics?.filter((t: any) => t.is_completed).length || 0;
      
      totalTopics += sTotal;
      completedTopics += sCompleted;

      return {
        id: subject.id,
        name: subject.name,
        color_code: subject.color_code,
        total_topics: sTotal,
        completed_topics: sCompleted,
        completion_percentage: sTotal === 0 ? 0 : Math.round((sCompleted / sTotal) * 100)
      };
    });

    const overall_percentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

    // Calculate today's study stats
    const now = new Date();
    const localTime = now.getTime() - (tzOffset * 60000);
    const localDateStr = new Date(localTime).toISOString().split('T')[0];
    
    const startOfLocalDayUTC = new Date(`${localDateStr}T00:00:00Z`).getTime() + (tzOffset * 60000);
    const endOfLocalDayUTC = startOfLocalDayUTC + (24 * 60 * 60 * 1000);

    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .gte('started_at', new Date(startOfLocalDayUTC).toISOString())
      .lt('started_at', new Date(endOfLocalDayUTC).toISOString());

    let today_study_minutes = 0;
    let today_sessions = 0;
    
    if (sessions) {
      today_sessions = sessions.length;
      today_study_minutes = sessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
    }

    // Calculate dynamic streak display
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, last_study_date, full_name')
      .eq('id', userId)
      .single();

    let current_streak = 0;
    if (profile) {
      current_streak = profile.current_streak;
      if (profile.last_study_date) {
        const lastDate = new Date(`${profile.last_study_date}T00:00:00Z`);
        const todayDate = new Date(`${localDateStr}T00:00:00Z`);
        const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
        if (diffDays > 1) {
          current_streak = 0; // Streak is broken
        }
      }
    }

    // Fetch today's study tasks
    const { data: todayTasks } = await supabase
      .from('study_tasks')
      .select('*, topic:topics(name, subject:subjects(name, color_code))')
      .eq('user_id', userId)
      .eq('task_date', localDateStr)
      .order('priority', { ascending: true }); // We could order, assuming high priority comes first? Actually, let's just send them as-is.

    return {
      stats: {
        total_subjects: data.length,
        total_topics: totalTopics,
        completed_topics: completedTopics,
        overall_percentage,
        today_study_minutes,
        today_sessions,
        current_streak
      },
      subjects,
      today_tasks: todayTasks || [],
      user_full_name: profile?.full_name || null
    };
  }
}
