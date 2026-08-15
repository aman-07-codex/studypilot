import { createClient } from "@supabase/supabase-js";
import { DashboardData } from "../../shared/types";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class DashboardService {
  static async getDashboardData(userId: string): Promise<DashboardData> {
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

    return {
      stats: {
        total_subjects: data.length,
        total_topics: totalTopics,
        completed_topics: completedTopics,
        overall_percentage
      },
      subjects
    };
  }
}
