import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { SubjectService } from "../services/subjectService";
import { isValidUUID, isValidString } from "../utils/validation";

export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const subjects = await SubjectService.getSubjectsByUser(userId);
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

export const getSubject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid subject ID format" });
    }

    const subject = await SubjectService.getSubjectById(userId, id);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    res.status(500).json({ error: "Failed to fetch subject" });
  }
};

export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, color_code } = req.body;

    if (!isValidString(name)) {
      return res.status(400).json({ error: "Subject name is required and cannot be empty" });
    }

    const subject = await SubjectService.createSubject(userId, name, color_code);
    res.status(201).json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Failed to create subject" });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, color_code } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid subject ID format" });
    }

    if (name !== undefined && !isValidString(name)) {
      return res.status(400).json({ error: "Subject name cannot be empty" });
    }

    const updates: { name?: string; color_code?: string | null } = {};
    if (name !== undefined) updates.name = name.trim();
    if (color_code !== undefined) updates.color_code = color_code;

    const subject = await SubjectService.updateSubject(userId, id, updates);
    
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(subject);
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ error: "Failed to update subject" });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid subject ID format" });
    }

    // Checking if it exists first to return 404 properly
    const existing = await SubjectService.getSubjectById(userId, id);
    if (!existing) {
       return res.status(404).json({ error: "Subject not found" });
    }

    await SubjectService.deleteSubject(userId, id);
    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Failed to delete subject" });
  }
};
