import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { DashboardService } from "../services/dashboardService";

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = await DashboardService.getDashboardData(userId);
    res.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};
