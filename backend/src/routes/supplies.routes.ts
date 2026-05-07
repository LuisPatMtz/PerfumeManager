import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { suppliesService } from "../services/supplies.service";

export const suppliesRouter = Router();

suppliesRouter.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["bottles", "bags", "stickers", "labels", "boxes", "ribbons", "paper", "other"]),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  costPerUnit: z.number().int().min(0).optional(),
});

const adjustSchema = z.object({
  delta: z.number().int().refine((v) => v !== 0, "Delta no puede ser 0"),
  reason: z.string().optional(),
});

const ruleSchema = z.object({
  ml: z.number().int().positive(),
  supplyId: z.string().min(1),
  quantity: z.number().int().positive(),
});

// GET /api/supplies
suppliesRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const supplies = await suppliesService.list();
  res.json(supplies);
});

// GET /api/supplies/summary
suppliesRouter.get("/summary", async (_req: AuthRequest, res: Response) => {
  const summary = await suppliesService.getSummary();
  res.json(summary);
});

// GET /api/supplies/low-stock
suppliesRouter.get("/low-stock", async (_req: AuthRequest, res: Response) => {
  const items = await suppliesService.getLowStock();
  res.json(items);
});

// GET /api/supplies/rules
suppliesRouter.get("/rules", async (_req: AuthRequest, res: Response) => {
  const rules = await suppliesService.listRules();
  res.json(rules);
});

// POST /api/supplies/rules
suppliesRouter.post("/rules", async (req: AuthRequest, res: Response) => {
  const parsed = ruleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const rule = await suppliesService.setRule(parsed.data);
  res.status(201).json(rule);
});

// DELETE /api/supplies/rules
suppliesRouter.delete("/rules", async (req: AuthRequest, res: Response) => {
  const parsed = z.object({ ml: z.coerce.number().int(), supplyId: z.string() }).safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  await suppliesService.deleteRule(parsed.data.ml, parsed.data.supplyId);
  res.json({ ok: true });
});

// GET /api/supplies/:id
suppliesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const supply = await suppliesService.findById(req.params.id);
  if (!supply) {
    res.status(404).json({ error: "Insumo no encontrado" });
    return;
  }
  res.json(supply);
});

// POST /api/supplies
suppliesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const supply = await suppliesService.create(parsed.data);
  res.status(201).json(supply);
});

// PUT /api/supplies/:id
suppliesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const supply = await suppliesService.update(req.params.id, parsed.data);
  res.json(supply);
});

// POST /api/supplies/:id/adjust
suppliesRouter.post("/:id/adjust", async (req: AuthRequest, res: Response) => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const supply = await suppliesService.adjustStock(req.params.id, parsed.data);
    res.json(supply);
  } catch (err: any) {
    res.status(422).json({ error: err.message });
  }
});
