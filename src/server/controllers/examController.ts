import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ExamService } from "../services/examService";
import { isValidUUID, isValidString } from "../utils/validation";

export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const exams = await ExamService.getExamsByUser(userId);
    res.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
};

export const getExam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid exam ID format" });
    }

    const exam = await ExamService.getExamById(userId, id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    res.json(exam);
  } catch (error) {
    console.error("Error fetching exam:", error);
    res.status(500).json({ error: "Failed to fetch exam" });
  }
};

export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subject_id, exam_date, notes } = req.body;

    if (!isValidUUID(subject_id)) {
      return res.status(400).json({ error: "Invalid subject ID format" });
    }

    if (!isValidString(exam_date) || isNaN(Date.parse(exam_date))) {
      return res.status(400).json({ error: "Valid exam_date is required" });
    }
    
    if (notes && typeof notes !== 'string') {
      return res.status(400).json({ error: "Notes must be a string" });
    }

    const exam = await ExamService.createExam(userId, subject_id, exam_date, notes);
    res.status(201).json(exam);
  } catch (error: any) {
    console.error("Error creating exam:", error);
    if (error.message === "Subject not found or does not belong to you.") {
        return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create exam" });
  }
};

export const updateExam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { subject_id, exam_date, notes } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid exam ID format" });
    }

    const updates: any = {};

    if (subject_id !== undefined) {
      if (!isValidUUID(subject_id)) {
        return res.status(400).json({ error: "Invalid subject ID format" });
      }
      updates.subject_id = subject_id;
    }

    if (exam_date !== undefined) {
      if (!isValidString(exam_date) || isNaN(Date.parse(exam_date))) {
        return res.status(400).json({ error: "Valid exam_date is required" });
      }
      updates.exam_date = exam_date;
    }

    if (notes !== undefined) {
      if (notes !== null && typeof notes !== 'string') {
        return res.status(400).json({ error: "Notes must be a string or null" });
      }
      updates.notes = notes;
    }

    const exam = await ExamService.updateExam(userId, id, updates);
    
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    res.json(exam);
  } catch (error: any) {
    console.error("Error updating exam:", error);
    if (error.message === "Subject not found or does not belong to you.") {
        return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to update exam" });
  }
};

export const deleteExam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid exam ID format" });
    }

    const existing = await ExamService.getExamById(userId, id);
    if (!existing) {
       return res.status(404).json({ error: "Exam not found" });
    }

    await ExamService.deleteExam(userId, id);
    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    res.status(500).json({ error: "Failed to delete exam" });
  }
};
