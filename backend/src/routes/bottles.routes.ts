import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { bottlesService } from "../services/bottles.service";

export const bottlesRouter = Router();

bottlesRouter.use(authenticate);

const createBottleSchema = z.object({
  perfumeId: z.string().min(1),
  batchId: z.string().optional(),
  supplierId: z.string().optional(),
  purchasePrice: z.number().int().positive(),
  initialMl: z.number().int().positive(),
});

const createBatchSchema = z.object({
  perfumeId: z.string().min(1),
  batchCode: z.string().min(1),
  purchasePrice: z.number().int().positive(),
  purchaseDate: z.string(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/bottles
bottlesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const perfumeId = req.query.perfumeId as string | undefined;
  const bottles = await bottlesService.list(typeof perfumeId === "string" ? perfumeId : undefined);
  res.json(bottles);
});

// GET /api/bottles/:id
bottlesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const bottle = await bottlesService.findById(req.params.id);
  if (!bottle) {
    res.status(404).json({ error: "Botella no encontrada" });
    return;
  }
  res.json(bottle);
});

// GET /api/bottles/:id/audit
bottlesRouter.get("/:id/audit", async (req: AuthRequest, res: Response) => {
  const result = await bottlesService.getAudit(req.params.id);
  if (!result) {
    res.status(404).json({ error: "Botella no encontrada" });
    return;
  }
  res.json(result);
});

// POST /api/bottles
bottlesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = createBottleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const bottle = await bottlesService.create(parsed.data);
  res.status(201).json(bottle);
});

// POST /api/bottles/batches
bottlesRouter.post("/batches", async (req: AuthRequest, res: Response) => {
  const parsed = createBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const batch = await bottlesService.createBatch(parsed.data);
  res.status(201).json(batch);
});

// GET /api/bottles/batches?perfumeId=xxx
bottlesRouter.get("/batches/list", async (req: AuthRequest, res: Response) => {
  const perfumeId = typeof req.query.perfumeId === "string" ? req.query.perfumeId : undefined;
  if (!perfumeId) {
    res.status(400).json({ error: "perfumeId requerido" });
    return;
  }
  const batches = await bottlesService.listBatches(perfumeId);
  res.json(batches);
});
