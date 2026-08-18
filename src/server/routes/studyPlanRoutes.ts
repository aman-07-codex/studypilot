import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  generatePlan,
  getPlans,
  getPlan,
  updateTaskStatus
} from "../controllers/studyPlanController";

const router = Router();

router.use(requireAuth);

router.post("/generate", generatePlan);
router.get("/", getPlans);
router.get("/:id", getPlan);
router.put("/tasks/:taskId", updateTaskStatus);

export default router;
