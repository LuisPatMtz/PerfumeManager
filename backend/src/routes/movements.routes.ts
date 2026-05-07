import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../utils/prisma";

export const movementsRouter = Router();

movementsRouter.use(authenticate);

const querySchema = z.object({
  perfumeId: z.string().optional(),
  bottleId: z.string().optional(),
  type: z.enum(["sale", "gift", "sample", "loss", "adjustment", "purchase"]).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

// GET /api/perfume-movements
movementsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { perfumeId, bottleId, type, limit = 100 } = parsed.data;

  const movements = await prisma.perfumeMovement.findMany({
    where: {
      ...(perfumeId ? { perfumeId } : {}),
      ...(bottleId ? { bottleId } : {}),
      ...(type ? { type } : {}),
    },
    include: {
      perfume: { select: { id: true, name: true, brand: true } },
      bottle: { select: { id: true, initialMl: true, calculatedRemainingMl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  res.json(movements);
});

// GET /api/perfume-movements/summary
movementsRouter.get("/summary", async (_req: AuthRequest, res: Response) => {
  const [byType, recentLosses] = await Promise.all([
    prisma.perfumeMovement.groupBy({
      by: ["type"],
      _sum: { ml: true },
      _count: true,
    }),
    prisma.perfumeMovement.findMany({
      where: { type: { in: ["loss", "adjustment"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { perfume: { select: { name: true, brand: true } } },
    }),
  ]);

  const summary = byType.reduce(
    (acc, row) => {
      acc[row.type] = { count: row._count, totalMl: row._sum.ml ?? 0 };
      return acc;
    },
    {} as Record<string, { count: number; totalMl: number }>
  );

  res.json({ summary, recentLosses });
});
