import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import * as cashService from "../services/cash.service";

export const cashRouter = Router();

cashRouter.use(authenticate);

// GET /api/cash/balance
cashRouter.get("/balance", async (_req: AuthRequest, res: Response) => {
  const data = await cashService.getBalance();
  res.json(data);
});

// GET /api/cash/movements
cashRouter.get("/movements", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    limit: z.coerce.number().int().positive().max(500).optional(),
    type: z.string().optional(),
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const data = await cashService.listMovements(parsed.data.limit, parsed.data.type);
  res.json(data);
});

// POST /api/cash/expenses
cashRouter.post("/expenses", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    category: z.string().min(1),
    amount: z.number().int().positive(),
    description: z.string().min(1),
    date: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { date, ...rest } = parsed.data;
  const data = await cashService.createExpense({
    ...rest,
    date: date ? new Date(date) : undefined,
  });
  res.status(201).json(data);
});

// POST /api/cash/contributions
cashRouter.post("/contributions", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    amount: z.number().int().positive(),
    description: z.string().optional(),
    date: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { date, ...rest } = parsed.data;
  const data = await cashService.createContribution({
    ...rest,
    date: date ? new Date(date) : undefined,
  });
  res.status(201).json(data);
});

// POST /api/cash/withdrawals
cashRouter.post("/withdrawals", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    amount: z.number().int().positive(),
    description: z.string().optional(),
    date: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { date, ...rest } = parsed.data;
  const data = await cashService.createWithdrawal({
    ...rest,
    date: date ? new Date(date) : undefined,
  });
  res.status(201).json(data);
});
