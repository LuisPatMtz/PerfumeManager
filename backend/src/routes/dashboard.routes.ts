import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import * as dashboardService from "../services/dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

// GET /api/dashboard
dashboardRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const data = await dashboardService.getDashboardKPIs();
  res.json(data);
});

// GET /api/dashboard/insights
dashboardRouter.get("/insights", async (_req: AuthRequest, res: Response) => {
  const data = await dashboardService.getDashboardInsights();
  res.json(data);
});
