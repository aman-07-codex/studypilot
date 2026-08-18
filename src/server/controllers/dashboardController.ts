import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { DashboardService } from "../services/dashboardService";

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let tzOffset = 0;
    if (req.query.tzOffset && !isNaN(Number(req.query.tzOffset))) {
      tzOffset = Number(req.query.tzOffset);
    }
    const data = await DashboardService.getDashboardData(userId, tzOffset);
    res.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};
