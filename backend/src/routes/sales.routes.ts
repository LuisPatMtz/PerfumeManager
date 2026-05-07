import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { salesService } from "../services/sales.service";

export const salesRouter = Router();

salesRouter.use(authenticate);

const saleItemSchema = z.object({
  bottleId: z.string().min(1),
  perfumeId: z.string().min(1),
  ml: z.number().int().positive(),
  isGift: z.boolean().optional(),
});

const createSaleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.enum(["cash", "transfer", "card", "credit"]),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1),
});

// GET /api/sales
salesRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const sales = await salesService.list();
  res.json(sales);
});

// GET /api/sales/summary
salesRouter.get("/summary", async (_req: AuthRequest, res: Response) => {
  const summary = await salesService.getSummary();
  res.json(summary);
});

// GET /api/sales/:id
salesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const sale = await salesService.findById(req.params.id);
  if (!sale) {
    res.status(404).json({ error: "Venta no encontrada" });
    return;
  }
  res.json(sale);
});

// POST /api/sales
salesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const sale = await salesService.create(parsed.data);
    res.status(201).json(sale);
  } catch (err: any) {
    res.status(422).json({ error: err.message });
  }
});
