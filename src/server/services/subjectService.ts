import { createClient } from "@supabase/supabase-js";
import { Subject } from "../../shared/types";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SubjectService {
  static async getSubjectsByUser(userId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*, topics(id, is_completed)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((subject: any) => ({
      ...subject,
      topics: undefined, // Don't send raw topics back for this endpoint
      total_topics: subject.topics?.length || 0,
      completed_topics: subject.topics?.filter((t: any) => t.is_completed).length || 0,
    }));
  }

  static async getSubjectById(userId: string, subjectId: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is no rows returned
    return data;
  }

  static async createSubject(userId: string, name: string, colorCode: string | null = null): Promise<Subject> {
    const { data, error } = await supabase
      .from("subjects")
      .insert({ user_id: userId, name: name.trim(), color_code: colorCode })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSubject(
    userId: string,
    subjectId: string,
    updates: { name?: string; color_code?: string | null }
  ): Promise<Subject | null> {
    const { data, error } = await supabase
      .from("subjects")
      .update(updates)
      .eq("id", subjectId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  static async deleteSubject(userId: string, subjectId: string): Promise<boolean> {
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  }
}
