import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getProfile, updateProfile } from "../controllers/profileController";

const router = Router();

router.use(requireAuth);

router.get("/", getProfile);
router.put("/", updateProfile);

export default router;
