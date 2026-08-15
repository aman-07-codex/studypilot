import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
} from "../controllers/subjectController";

const router = Router();

// All subject routes require authentication
router.use(requireAuth);

router.get("/", getSubjects);
router.get("/:id", getSubject);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
