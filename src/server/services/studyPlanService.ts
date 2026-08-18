import { createClient } from "@supabase/supabase-js";
import { StudyPlanWithDetails, StudyPlan, StudyTask } from "../../shared/types";
import { getGemini } from "./geminiService";
import { Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class StudyPlanService {
  static async generateStudyPlan(userId: string, examId: string): Promise<StudyPlanWithDetails> {
    // 1. Fetch exam details to verify ownership and get context
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("*, subjects(*)")
      .eq("id", examId)
      .eq("user_id", userId)
      .single();

    if (examError || !exam) {
      throw new Error("Exam not found or does not belong to you.");
    }

    // 2. Fetch topics for the subject
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("*")
      .eq("subject_id", exam.subject_id)
      .eq("user_id", userId);

    if (topicsError) {
      throw new Error("Failed to fetch topics.");
    }
    if (!topics || topics.length === 0) {
      throw new Error("No topics found for this subject. Please add topics before generating a study plan.");
    }

    // 2.5. Fetch completed study materials for the subject
    const { data: materials, error: materialsError } = await supabase
      .from("study_materials")
      .select("id, topic_id, material_type, extracted_text, extraction_truncated, title")
      .eq("subject_id", exam.subject_id)
      .eq("user_id", userId)
      .eq("extraction_status", "completed");

    if (materialsError) {
      console.error("Failed to fetch study materials:", materialsError);
    }
    
    const validMaterials = materials || [];
    let subjectPyqsText = '';
    const topicNotesMap: Record<string, string[]> = {};

    let totalContextLength = 0;
    const CONTEXT_BUDGET = 250000; // conservative budget for prompt context

    const pyqs = validMaterials.filter(m => m.material_type === 'pyq' && !m.topic_id);
    const notes = validMaterials.filter(m => m.material_type === 'note' && m.topic_id);

    // Prioritize PYQs
    for (const pyq of pyqs) {
      if (!pyq.extracted_text) continue;
      if (totalContextLength >= CONTEXT_BUDGET) break;

      let textToAdd = `\n--- PYQ: ${pyq.title} ---\n`;
      textToAdd += pyq.extraction_truncated ? "[Note: This document was truncated during extraction]\n" : "";
      
      const availableBudget = CONTEXT_BUDGET - totalContextLength;
      if (pyq.extracted_text.length > availableBudget) {
        textToAdd += pyq.extracted_text.substring(0, availableBudget) + "\n...[CONTENT TRUNCATED DUE TO CONTEXT BUDGET]...";
        totalContextLength += availableBudget;
      } else {
        textToAdd += pyq.extracted_text;
        totalContextLength += pyq.extracted_text.length;
      }
      subjectPyqsText += textToAdd;
    }

    // Then Notes by topic
    for (const note of notes) {
      if (!note.extracted_text || !note.topic_id) continue;
      if (totalContextLength >= CONTEXT_BUDGET) break;

      let textToAdd = `\n--- Note: ${note.title} ---\n`;
      textToAdd += note.extraction_truncated ? "[Note: This document was truncated during extraction]\n" : "";

      const availableBudget = CONTEXT_BUDGET - totalContextLength;
      if (note.extracted_text.length > availableBudget) {
        textToAdd += note.extracted_text.substring(0, availableBudget) + "\n...[CONTENT TRUNCATED DUE TO CONTEXT BUDGET]...";
        totalContextLength += availableBudget;
      } else {
        textToAdd += note.extracted_text;
        totalContextLength += note.extracted_text.length;
      }
      if (!topicNotesMap[note.topic_id]) {
        topicNotesMap[note.topic_id] = [];
      }
      topicNotesMap[note.topic_id].push(textToAdd);
    }

    let materialsContext = "";
    if (subjectPyqsText.length > 0 || Object.keys(topicNotesMap).length > 0) {
      materialsContext = "\n<STUDY_MATERIALS>\n";
      if (subjectPyqsText.length > 0) {
        materialsContext += `<SUBJECT_PYQS>${subjectPyqsText}\n</SUBJECT_PYQS>\n\n`;
      }
      for (const topic of topics) {
        const tNotes = topicNotesMap[topic.id];
        if (tNotes && tNotes.length > 0) {
          materialsContext += `<TOPIC>\n<NAME>${topic.name}</NAME>\n<TOPIC_NOTES>${tNotes.join("\n")}\n</TOPIC_NOTES>\n</TOPIC>\n\n`;
        }
      }
      materialsContext += "</STUDY_MATERIALS>\n";
    }

    // 3. Call Gemini to generate the plan
    const ai = getGemini();
    const prompt = `
      You are an expert study planner. Create a study plan for an upcoming exam.
      Exam Date: ${new Date(exam.exam_date).toISOString()}
      Subject: ${exam.subjects.name}
      Notes: ${exam.notes || 'None'}
      
      Available Topics (with IDs):
      ${topics.map(t => `- ID: ${t.id} | Name: ${t.name} | Completed: ${t.is_completed}`).join('\n')}

      ${materialsContext}

      AI INSTRUCTIONS FOR MATERIAL-AWARE PLANNING:
      1. PYQs are evidence of what has historically been asked.
      2. Repeated concepts/questions in PYQs should increase importance/priority.
      3. Notes indicate the amount and depth of material the student needs to study.
      4. A topic with substantial/complex notes may require more time.
      5. A topic appearing frequently or prominently in PYQs should receive higher priority.
      6. A topic with little/no material should NOT automatically receive high duration merely because its name sounds important.
      7. Do not invent information about the student's materials.
      8. Do not claim that a topic is important unless the supplied PYQs/material provide evidence or the topic has a reasonable structural relationship to the supplied content.
      9. If no notes or PYQs are available, fall back gracefully to topic-based reasoning.
      10. You must respect the user's available study time and exam date.
      11. Priority should be one of: low, medium, high.
      12. Identify useful subtopics (max 8) INSIDE each topic based PRIMARILY on the uploaded Notes and PYQs.
      13. If there is no extracted material for a topic, subtopics MUST be an empty array []. Do not invent them.
      14. Subtopics must be concise (max 120 chars), study-oriented, and explicitly present in the material.

      Generate a realistic study schedule leading up to the exam date.
      Assign topics to specific days. Do not generate tasks after the exam date.
      Ensure the total time is balanced.
      Return the response as a JSON array of tasks.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic_id: { type: Type.STRING, description: "The UUID of the topic from the provided list, or empty if it's a general review task." },
              task_date: { type: Type.STRING, description: "The date for this task in YYYY-MM-DD format." },
              duration_minutes: { type: Type.INTEGER, description: "Estimated duration in minutes (must be > 0)." },
              priority: { type: Type.STRING, description: "One of: low, medium, high." },
              subtopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Concise subtopics derived from materials, max 8. Empty array if no material." }
            },
            required: ["task_date", "duration_minutes", "priority"]
          }
        }
      }
    });

    let outputStr = response.text?.trim();
    if (!outputStr) {
      throw new Error("Empty response from AI.");
    }

    if (outputStr.startsWith("```json")) {
      outputStr = outputStr.substring(7);
    } else if (outputStr.startsWith("```")) {
      outputStr = outputStr.substring(3);
    }
    if (outputStr.endsWith("```")) {
      outputStr = outputStr.slice(0, -3);
    }
    
    let generatedTasks: any[];
    try {
      generatedTasks = JSON.parse(outputStr.trim());
    } catch (e) {
      throw new Error("Failed to parse AI output.");
    }

    // 4. Validate output
    const validTopics = new Set(topics.map(t => t.id));
    const finalTasks = generatedTasks.map(t => {
      if (t.topic_id && !validTopics.has(t.topic_id)) {
         t.topic_id = null; // invalid topic mapped to general review
      }
      const dur = parseInt(t.duration_minutes, 10);
      const duration_minutes = isNaN(dur) || dur <= 0 ? 30 : dur;
      let priority = t.priority?.toLowerCase() || 'medium';
      if (!['low', 'medium', 'high'].includes(priority)) {
        priority = 'medium';
      }
      let task_date = t.task_date;
      if (!task_date || isNaN(Date.parse(task_date))) {
         task_date = new Date().toISOString().split('T')[0];
      }

      let subtopics = Array.isArray(t.subtopics) ? t.subtopics : [];
      subtopics = subtopics
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim().substring(0, 120));
      subtopics = [...new Set(subtopics)].slice(0, 8); // remove duplicates, max 8

      return {
        user_id: userId,
        topic_id: t.topic_id || null,
        task_date,
        duration_minutes,
        priority,
        subtopics,
        is_completed: false
      };
    });

    if (finalTasks.length === 0) {
      throw new Error("AI generated an empty study plan.");
    }

    // 5. Transaction via RPC or dual inserts
    // We will do a regular insert of study_plan, then insert tasks.
    // If tasks fail, we delete the study_plan (poor man's transaction).
    const { data: studyPlan, error: planError } = await supabase
      .from("study_plans")
      .insert({
        user_id: userId,
        exam_id: examId
      })
      .select()
      .single();

    if (planError || !studyPlan) {
      throw new Error("Failed to create study plan record.");
    }

    const tasksToInsert = finalTasks.map(t => ({
      ...t,
      study_plan_id: studyPlan.id
    }));

    const { error: tasksError } = await supabase
      .from("study_tasks")
      .insert(tasksToInsert);

    if (tasksError) {
      // rollback
      await supabase.from("study_plans").delete().eq("id", studyPlan.id);
      throw new Error("Failed to insert study tasks: " + tasksError.message);
    }

    // Fetch the newly created plan with tasks
    return await this.getStudyPlanById(userId, studyPlan.id);
  }

  static async getStudyPlansByExam(userId: string, examId: string): Promise<StudyPlanWithDetails[]> {
    const { data, error } = await supabase
      .from("study_plans")
      .select("*, exams(*, subjects(*)), study_tasks(*, topics(name))")
      .eq("user_id", userId)
      .eq("exam_id", examId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((plan: any) => ({
      ...plan,
      exam: {
        ...plan.exams,
        subject: plan.exams.subjects
      },
      tasks: plan.study_tasks.map((t: any) => ({
        ...t,
        topic: t.topics
      })).sort((a: any, b: any) => new Date(a.task_date).getTime() - new Date(b.task_date).getTime())
    }));
  }

  static async getStudyPlanById(userId: string, planId: string): Promise<StudyPlanWithDetails> {
    const { data, error } = await supabase
      .from("study_plans")
      .select("*, exams(*, subjects(*)), study_tasks(*, topics(name))")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Study plan not found.");

    return {
      ...data,
      exam: {
        ...data.exams,
        subject: data.exams.subjects
      },
      tasks: data.study_tasks.map((t: any) => ({
        ...t,
        topic: t.topics
      })).sort((a: any, b: any) => new Date(a.task_date).getTime() - new Date(b.task_date).getTime())
    };
  }

  static async updateTaskStatus(userId: string, taskId: string, isCompleted: boolean): Promise<StudyTask> {
    const { data, error } = await supabase
      .from("study_tasks")
      .update({ is_completed: isCompleted })
      .eq("id", taskId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
