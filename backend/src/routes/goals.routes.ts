import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import * as goalsService from "../services/goals.service";

export const goalsRouter = Router();

goalsRouter.use(authenticate);

// GET /api/goals
goalsRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const data = await goalsService.listGoals();
  res.json(data);
});

// POST /api/goals
goalsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    title: z.string().min(1),
    targetAmount: z.number().int().positive(),
    currentAmount: z.number().int().min(0).optional(),
    targetDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { targetDate, ...rest } = parsed.data;
  const data = await goalsService.createGoal({
    ...rest,
    targetDate: targetDate ? new Date(targetDate) : undefined,
  });
  res.status(201).json(data);
});

// PUT /api/goals/:id
goalsRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    title: z.string().min(1).optional(),
    targetAmount: z.number().int().positive().optional(),
    currentAmount: z.number().int().min(0).optional(),
    targetDate: z.string().datetime().nullable().optional(),
    notes: z.string().optional(),
    isCompleted: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { targetDate, ...rest } = parsed.data;
  const data = await goalsService.updateGoal(req.params.id, {
    ...rest,
    targetDate: targetDate === null ? null : targetDate ? new Date(targetDate) : undefined,
  });
  res.json(data);
});

// POST /api/goals/:id/progress
goalsRouter.post("/:id/progress", async (req: AuthRequest, res: Response) => {
  const schema = z.object({ amount: z.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const data = await goalsService.addProgress(req.params.id, parsed.data.amount);
  res.json(data);
});

// DELETE /api/goals/:id
goalsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  await goalsService.deleteGoal(req.params.id);
  res.json({ ok: true });
});
