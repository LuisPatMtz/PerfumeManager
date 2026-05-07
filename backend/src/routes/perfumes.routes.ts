import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { perfumesService } from "../services/perfumes.service";

export const perfumesRouter = Router();

perfumesRouter.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  concentration: z.enum(["EDP", "EDT", "EXP", "EDC", "PC"]).optional(),
  status: z.enum(["active", "archived", "out_of_stock"]).optional(),
});

const priceSchema = z.object({
  ml: z.number().int().positive(),
  price: z.number().int().positive(),
  isFullBottle: z.boolean().optional(),
});

// GET /api/perfumes
perfumesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const search = req.query.search as string | undefined;
  const perfumes = await perfumesService.list(search);
  res.json(perfumes);
});

// GET /api/perfumes/:id
perfumesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const perfume = await perfumesService.findById(req.params.id);
  if (!perfume) {
    res.status(404).json({ error: "Perfume no encontrado" });
    return;
  }
  const totals = await perfumesService.getTotalMl(req.params.id);
  res.json({ ...perfume, ...totals });
});

// POST /api/perfumes
perfumesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const perfume = await perfumesService.create(parsed.data);
  res.status(201).json(perfume);
});

// PUT /api/perfumes/:id
perfumesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const perfume = await perfumesService.update(req.params.id, parsed.data);
  res.json(perfume);
});

// GET /api/perfumes/:id/prices
perfumesRouter.get("/:id/prices", async (req: AuthRequest, res: Response) => {
  const prices = await perfumesService.getPrices(req.params.id);
  res.json(prices);
});

// POST /api/perfumes/:id/prices  (upsert)
perfumesRouter.post("/:id/prices", async (req: AuthRequest, res: Response) => {
  const parsed = priceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const price = await perfumesService.setPrice(req.params.id, parsed.data);
  res.status(201).json(price);
});
