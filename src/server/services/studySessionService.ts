import { createClient } from "@supabase/supabase-js";
import { StudySession, StudySessionWithDetails } from "../../shared/types";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class StudySessionService {
  static async createSession(
    userId: string,
    topicId: string | null,
    startedAt: string,
    completedAt: string,
    tzOffset: number
  ): Promise<StudySession> {
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid timestamps");
    }

    if (end.getTime() < start.getTime()) {
      throw new Error("completed_at cannot be earlier than started_at");
    }

    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

    // Verify topic belongs to user if provided
    if (topicId) {
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('id')
        .eq('id', topicId)
        .eq('user_id', userId)
        .single();
      
      if (topicError || !topic) {
        throw new Error("Topic not found or does not belong to you.");
      }
    }

    // Insert session
    const { data: session, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: userId,
        topic_id: topicId,
        started_at: startedAt,
        completed_at: completedAt,
        duration_minutes: durationMinutes
      })
      .select()
      .single();

    if (error) throw error;

    // Calculate Streak
    await this.updateStreak(userId, start, tzOffset);

    return session;
  }

  static async updateStreak(userId: string, sessionStartUTC: Date, tzOffset: number) {
    // 1. Fetch current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, last_study_date')
      .eq('id', userId)
      .single();

    if (profileError || !profile) return;

    // 2. Calculate local date string of the session
    const localTime = sessionStartUTC.getTime() - (tzOffset * 60000);
    const sessionLocalDateStr = new Date(localTime).toISOString().split('T')[0];

    let newStreak = profile.current_streak;
    let newLastDate = profile.last_study_date;

    if (!profile.last_study_date) {
      newStreak = 1;
      newLastDate = sessionLocalDateStr;
    } else {
      const lastDate = new Date(`${profile.last_study_date}T00:00:00Z`);
      const sessionDate = new Date(`${sessionLocalDateStr}T00:00:00Z`);
      
      const diffDays = Math.round((sessionDate.getTime() - lastDate.getTime()) / 86400000);

      if (diffDays === 1) {
        newStreak += 1;
        newLastDate = sessionLocalDateStr;
      } else if (diffDays > 1) {
        newStreak = 1;
        newLastDate = sessionLocalDateStr;
      } else if (diffDays === 0) {
        // Same day, streak remains the same
      } else {
        // Backdated session, ignore streak calculation
      }
    }

    if (newStreak !== profile.current_streak || newLastDate !== profile.last_study_date) {
      await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          last_study_date: newLastDate
        })
        .eq('id', userId);
    }
  }

  static async getSessions(userId: string): Promise<StudySessionWithDetails[]> {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*, topic:topics(name, subject:subjects(name, color_code))")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error) throw error;

    return data;
  }
}
