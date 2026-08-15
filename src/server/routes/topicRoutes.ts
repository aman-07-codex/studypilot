import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic
} from "../controllers/topicController";

const router = Router();

// All topic routes require authentication
router.use(requireAuth);

// Note: /api/subjects/:subjectId/topics handled here or in subject router?
// Usually easier to mount this directly at /api/subjects/:subjectId/topics or /api/topics

// We'll define:
// POST /api/subjects/:subjectId/topics (mount this in server.ts under /api/subjects)
// GET /api/subjects/:subjectId/topics (mount this in server.ts under /api/subjects)

// For PUT and DELETE, we just need the topic ID:
// PUT /api/topics/:id
// DELETE /api/topics/:id

export const subjectTopicsRouter = Router({ mergeParams: true });
subjectTopicsRouter.use(requireAuth);
subjectTopicsRouter.get("/", getTopics);
subjectTopicsRouter.post("/", createTopic);

export const topicRouter = Router();
topicRouter.use(requireAuth);
topicRouter.put("/:id", updateTopic);
topicRouter.delete("/:id", deleteTopic);
