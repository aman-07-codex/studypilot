import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { TopicService } from "../services/topicService";
import { SubjectService } from "../services/subjectService";
import { isValidUUID, isValidString } from "../utils/validation";

export const getTopics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subjectId } = req.params;

    if (!isValidUUID(subjectId)) {
      return res.status(400).json({ error: "Invalid subject ID format" });
    }

    // Verify subject ownership
    const subject = await SubjectService.getSubjectById(userId, subjectId);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const topics = await TopicService.getTopicsBySubject(userId, subjectId);
    res.json(topics);
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
};

export const createTopic = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subjectId } = req.params;
    const { name } = req.body;

    if (!isValidUUID(subjectId)) {
      return res.status(400).json({ error: "Invalid subject ID format" });
    }

    if (!isValidString(name)) {
      return res.status(400).json({ error: "Topic name is required and cannot be empty" });
    }

    const topic = await TopicService.createTopic(userId, subjectId, name);
    res.status(201).json(topic);
  } catch (error: any) {
    console.error("Error creating topic:", error);
    if (error.message === "Subject not found or does not belong to you.") {
        return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create topic" });
  }
};

export const updateTopic = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { is_completed } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid topic ID format" });
    }

    if (typeof is_completed !== "boolean") {
      return res.status(400).json({ error: "is_completed must be a boolean" });
    }

    const topic = await TopicService.updateTopicCompletion(userId, id, is_completed);
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    res.json(topic);
  } catch (error) {
    console.error("Error updating topic:", error);
    res.status(500).json({ error: "Failed to update topic" });
  }
};

export const deleteTopic = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid topic ID format" });
    }

    // Try deleting, if nothing deleted, either it doesn't exist or not owned
    // Actually our delete function just resolves, let's verify exists first if we want 404
    // Or just issue the delete and assume 200 is fine (idempotent).
    // Let's do a quick read just for proper 404 response
    
    // Better: topic service could return row count, but simplicity works here
    await TopicService.deleteTopic(userId, id);
    res.status(200).json({ message: "Topic deleted successfully" });
  } catch (error) {
    console.error("Error deleting topic:", error);
    res.status(500).json({ error: "Failed to delete topic" });
  }
};
