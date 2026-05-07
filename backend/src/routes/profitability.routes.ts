import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import * as profitabilityService from "../services/profitability.service";

export const profitabilityRouter = Router();

profitabilityRouter.use(authenticate);

// GET /api/profitability/summary
profitabilityRouter.get("/summary", async (_req: AuthRequest, res: Response) => {
  const data = await profitabilityService.getProfitabilitySummary();
  res.json(data);
});

// GET /api/profitability/perfumes
profitabilityRouter.get("/perfumes", async (_req: AuthRequest, res: Response) => {
  const data = await profitabilityService.getPerfumeProfitability();
  res.json(data);
});
