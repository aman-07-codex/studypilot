import { createClient } from "@supabase/supabase-js";
import { Exam, ExamWithSubject } from "../../shared/types";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ExamService {
  static async getExamsByUser(userId: string): Promise<ExamWithSubject[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*, subjects(name, color_code)")
      .eq("user_id", userId)
      .order("exam_date", { ascending: true });

    if (error) throw error;
    
    // Transform to match ExamWithSubject
    return data.map((exam: any) => ({
      ...exam,
      subject: exam.subjects
    }));
  }

  static async getExamById(userId: string, examId: string): Promise<ExamWithSubject | null> {
    const { data, error } = await supabase
      .from("exams")
      .select("*, subjects(name, color_code)")
      .eq("id", examId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;

    return {
      ...data,
      subject: data.subjects
    };
  }

  static async createExam(userId: string, subjectId: string, examDate: string, notes: string | null = null): Promise<Exam> {
    const { data, error } = await supabase
      .from("exams")
      .insert({
        user_id: userId,
        subject_id: subjectId,
        exam_date: examDate,
        notes: notes ? notes.trim() : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23503') {
        throw new Error("Subject not found or does not belong to you.");
      }
      throw error;
    }
    return data;
  }

  static async updateExam(
    userId: string, 
    examId: string, 
    updates: { subject_id?: string; exam_date?: string; notes?: string | null }
  ): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .update(updates)
      .eq("id", examId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') {
        throw new Error("Subject not found or does not belong to you.");
      }
      if (error.code !== "PGRST116") throw error;
    }
    
    return data;
  }

  static async deleteExam(userId: string, examId: string): Promise<boolean> {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", examId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  }
}
