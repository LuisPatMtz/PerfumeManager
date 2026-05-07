import { prisma } from "../utils/prisma";

export interface CreateBottleInput {
  perfumeId: string;
  batchId?: string;
  supplierId?: string;
  purchasePrice: number; // centavos
  initialMl: number;
}

export interface CreateBatchInput {
  perfumeId: string;
  batchCode: string;
  purchasePrice: number; // centavos
  purchaseDate: string;
  supplierId?: string;
  notes?: string;
}

export const bottlesService = {
  async list(perfumeId?: string) {
    return prisma.bottle.findMany({
      where: perfumeId ? { perfumeId } : undefined,
      include: {
        perfume: { select: { id: true, name: true, brand: true } },
        batch: true,
        supplier: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.bottle.findUnique({
      where: { id },
      include: {
        perfume: true,
        batch: true,
        supplier: true,
        movements: { orderBy: { createdAt: "desc" }, take: 50 },
        adjustments: { orderBy: { createdAt: "desc" } },
      },
    });
  },

  async create(data: CreateBottleInput) {
    return prisma.bottle.create({
      data: {
        ...data,
        calculatedRemainingMl: data.initialMl,
        realRemainingMl: data.initialMl,
        status: "open",
      },
      include: {
        perfume: { select: { id: true, name: true, brand: true } },
      },
    });
  },

  // Audit: full breakdown of a bottle
  async getAudit(id: string) {
    const bottle = await prisma.bottle.findUnique({
      where: { id },
      include: {
        perfume: true,
        movements: { orderBy: { createdAt: "asc" } },
        adjustments: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!bottle) return null;

    const summary = bottle.movements.reduce(
      (acc, m) => {
        acc[m.type] = (acc[m.type] ?? 0) + Math.abs(m.ml);
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      bottle,
      audit: {
        initialMl: bottle.initialMl,
        sold: summary["sale"] ?? 0,
        gifted: summary["gift"] ?? 0,
        sampled: summary["sample"] ?? 0,
        lost: summary["loss"] ?? 0,
        adjusted: summary["adjustment"] ?? 0,
        calculatedRemaining: bottle.calculatedRemainingMl,
        realRemaining: bottle.realRemainingMl,
        difference: bottle.realRemainingMl - bottle.calculatedRemainingMl,
      },
    };
  },

  async createBatch(data: CreateBatchInput) {
    return prisma.perfumeBatch.create({
      data: {
        ...data,
        purchaseDate: new Date(data.purchaseDate),
      },
      include: { supplier: true },
    });
  },

  async listBatches(perfumeId: string) {
    return prisma.perfumeBatch.findMany({
      where: { perfumeId },
      include: { supplier: true, bottles: true },
      orderBy: { purchaseDate: "desc" },
    });
  },
};
