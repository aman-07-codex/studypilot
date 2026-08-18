import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { StudySessionService } from "../services/studySessionService";
import { isValidUUID } from "../utils/validation";

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { topic_id, started_at, completed_at, timezone_offset } = req.body;

    if (topic_id && !isValidUUID(topic_id)) {
      return res.status(400).json({ error: "Invalid topic ID format" });
    }

    if (!started_at || !completed_at) {
      return res.status(400).json({ error: "started_at and completed_at are required" });
    }
    
    let tzOffset = 0;
    if (timezone_offset !== undefined && !isNaN(Number(timezone_offset))) {
      tzOffset = Number(timezone_offset);
    }

    const session = await StudySessionService.createSession(
      userId, 
      topic_id || null, 
      started_at, 
      completed_at, 
      tzOffset
    );

    res.status(201).json(session);
  } catch (error: any) {
    console.error("Error creating study session:", error);
    if (error.message.includes("does not belong to you")) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes("timestamps") || error.message.includes("completed_at")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create study session" });
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessions = await StudySessionService.getSessions(userId);
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    res.status(500).json({ error: "Failed to fetch study sessions" });
  }
};
