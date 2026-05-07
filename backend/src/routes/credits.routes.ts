import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { creditsService } from "../services/credits.service";

export const creditsRouter = Router();

creditsRouter.use(authenticate);

const paymentSchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(["cash", "transfer", "card", "credit"]),
  notes: z.string().optional(),
});

// GET /api/credits
creditsRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const credits = await creditsService.list();
  res.json(credits);
});

// GET /api/credits/summary
creditsRouter.get("/summary", async (_req: AuthRequest, res: Response) => {
  const summary = await creditsService.getSummary();
  res.json(summary);
});

// GET /api/credits/:id
creditsRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const credit = await creditsService.findById(req.params.id);
  if (!credit) {
    res.status(404).json({ error: "Crédito no encontrado" });
    return;
  }
  res.json(credit);
});

// POST /api/credits/:id/payments
creditsRouter.post("/:id/payments", async (req: AuthRequest, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const payment = await creditsService.addPayment(
      req.params.id,
      parsed.data.amount,
      parsed.data.method,
      parsed.data.notes
    );
    res.status(201).json(payment);
  } catch (err: any) {
    res.status(422).json({ error: err.message });
  }
});

// PATCH /api/credits/:id/risk
creditsRouter.patch("/:id/risk", async (req: AuthRequest, res: Response) => {
  const parsed = z.object({ risk: z.enum(["low", "medium", "high"]) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const credit = await creditsService.updateRisk(req.params.id, parsed.data.risk);
  res.json(credit);
});
