import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createSession,
  getSessions
} from "../controllers/studySessionController";

const router = Router();

router.use(requireAuth);

router.post("/", createSession);
router.get("/", getSessions);

export default router;
