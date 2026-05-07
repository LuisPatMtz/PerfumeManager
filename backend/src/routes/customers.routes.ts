import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { customersService } from "../services/customers.service";

export const customersRouter = Router();

customersRouter.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/customers
customersRouter.get("/", async (req: AuthRequest, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const customers = await customersService.list(search);
  res.json(customers);
});

// GET /api/customers/:id
customersRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const customer = await customersService.findById(id);
  if (!customer) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }
  const debt = await customersService.getDebt(id);
  res.json({ ...customer, ...debt });
});

// POST /api/customers
customersRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const customer = await customersService.create(parsed.data);
  res.status(201).json(customer);
});

// PUT /api/customers/:id
customersRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.partial().extend({ isVip: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const customer = await customersService.update(String(req.params.id), parsed.data);
  res.json(customer);
});
