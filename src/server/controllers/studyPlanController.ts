import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { StudyPlanService } from "../services/studyPlanService";
import { isValidUUID } from "../utils/validation";

export const generatePlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { exam_id } = req.body;

    if (!isValidUUID(exam_id)) {
      return res.status(400).json({ error: "Invalid exam ID format" });
    }

    const plan = await StudyPlanService.generateStudyPlan(userId, exam_id);
    res.status(201).json(plan);
  } catch (error: any) {
    console.error("Error generating study plan:", error);
    if (error.message.includes("not found or does not belong to you")) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes("No topics found")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to generate study plan" });
  }
};

export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { exam_id } = req.query;

    if (exam_id && !isValidUUID(exam_id as string)) {
      return res.status(400).json({ error: "Invalid exam ID format" });
    }

    if (exam_id) {
      const plans = await StudyPlanService.getStudyPlansByExam(userId, exam_id as string);
      return res.json(plans);
    }
    
    // We could implement fetching all plans, but for this phase we fetch by exam
    return res.status(400).json({ error: "exam_id query parameter is required" });
  } catch (error) {
    console.error("Error fetching study plans:", error);
    res.status(500).json({ error: "Failed to fetch study plans" });
  }
};

export const getPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid plan ID format" });
    }

    const plan = await StudyPlanService.getStudyPlanById(userId, id);
    res.json(plan);
  } catch (error) {
    console.error("Error fetching study plan:", error);
    res.status(500).json({ error: "Failed to fetch study plan" });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { taskId } = req.params;
    const { is_completed } = req.body;

    if (!isValidUUID(taskId)) {
      return res.status(400).json({ error: "Invalid task ID format" });
    }

    if (typeof is_completed !== "boolean") {
      return res.status(400).json({ error: "is_completed must be a boolean" });
    }

    const task = await StudyPlanService.updateTaskStatus(userId, taskId, is_completed);
    res.json(task);
  } catch (error) {
    console.error("Error updating study task:", error);
    res.status(500).json({ error: "Failed to update study task" });
  }
};
