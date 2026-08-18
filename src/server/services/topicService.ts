import { createClient } from "@supabase/supabase-js";
import { Topic } from "../../shared/types";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class TopicService {
  static async getTopicsByUserId(userId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getTopicsBySubject(userId: string, subjectId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  }

  static async createTopic(userId: string, subjectId: string, name: string): Promise<Topic> {
    // Relying on Postgres composite foreign key (subject_id, user_id)
    // to reject creation if the subject doesn't belong to the user.
    const { data, error } = await supabase
      .from("topics")
      .insert({
        subject_id: subjectId,
        user_id: userId,
        name: name.trim(),
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
       // If it's a foreign key violation, it likely means the subject doesn't belong to this user
       if (error.code === '23503') {
           throw new Error("Subject not found or does not belong to you.");
       }
       throw error;
    }
    return data;
  }

  static async updateTopicCompletion(userId: string, topicId: string, isCompleted: boolean): Promise<Topic | null> {
    const { data, error } = await supabase
      .from("topics")
      .update({ is_completed: isCompleted })
      .eq("id", topicId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  static async deleteTopic(userId: string, topicId: string): Promise<boolean> {
    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("id", topicId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  }
}
