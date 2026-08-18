import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createSession,
  getSessions,
  getSessionById,
  deleteSession,
  getHistoryStats
} from "../controllers/studySessionController";

const router = Router();

router.use(requireAuth);

router.post("/", createSession);
router.get("/", getSessions);
router.get("/stats", getHistoryStats);
router.get("/:id", getSessionById);
router.delete("/:id", deleteSession);

export default router;
