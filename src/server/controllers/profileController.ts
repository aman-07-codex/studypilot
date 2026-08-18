import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProfileService } from "../services/profileService";

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await ProfileService.getProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { full_name } = req.body;

    if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0) {
      return res.status(400).json({ error: "Valid full name is required" });
    }

    const updatedProfile = await ProfileService.updateProfile(userId, full_name.trim());
    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
