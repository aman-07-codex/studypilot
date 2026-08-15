import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam
} from "../controllers/examController";

const router = Router();

router.use(requireAuth);

router.get("/", getExams);
router.get("/:id", getExam);
router.post("/", createExam);
router.put("/:id", updateExam);
router.delete("/:id", deleteExam);

export default router;
