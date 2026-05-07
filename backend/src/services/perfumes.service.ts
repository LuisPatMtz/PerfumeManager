import { prisma } from "../utils/prisma";
import { Prisma, PerfumeStatus, Concentration } from "@prisma/client";

export interface CreatePerfumeInput {
  name: string;
  brand: string;
  category?: string;
  description?: string;
  concentration?: Concentration;
  status?: PerfumeStatus;
}

export interface UpdatePerfumeInput extends Partial<CreatePerfumeInput> {}

export interface CreatePriceInput {
  ml: number;
  price: number; // centavos
  isFullBottle?: boolean;
}

export const perfumesService = {
  async list(search?: string) {
    const where: Prisma.PerfumeWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    return prisma.perfume.findMany({
      where,
      include: {
        prices: { orderBy: { ml: "asc" } },
        bottles: {
          where: { status: { not: "archived" } },
          select: {
            id: true,
            calculatedRemainingMl: true,
            realRemainingMl: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.perfume.findUnique({
      where: { id },
      include: {
        prices: { orderBy: { ml: "asc" } },
        batches: {
          include: { supplier: true },
          orderBy: { purchaseDate: "desc" },
        },
        bottles: {
          where: { status: { not: "archived" } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async create(data: CreatePerfumeInput) {
    return prisma.perfume.create({ data });
  },

  async update(id: string, data: UpdatePerfumeInput) {
    return prisma.perfume.update({ where: { id }, data });
  },

  async setPrice(perfumeId: string, input: CreatePriceInput) {
    return prisma.perfumePrice.upsert({
      where: { perfumeId_ml: { perfumeId, ml: input.ml } },
      update: { price: input.price, isFullBottle: input.isFullBottle ?? false },
      create: {
        perfumeId,
        ml: input.ml,
        price: input.price,
        isFullBottle: input.isFullBottle ?? false,
      },
    });
  },

  async getPrices(perfumeId: string) {
    return prisma.perfumePrice.findMany({
      where: { perfumeId },
      orderBy: { ml: "asc" },
    });
  },

  // Total ml remaining across all active bottles
  async getTotalMl(perfumeId: string) {
    const result = await prisma.bottle.aggregate({
      where: {
        perfumeId,
        status: { notIn: ["archived", "empty"] },
      },
      _sum: { calculatedRemainingMl: true, realRemainingMl: true },
    });
    return {
      calculatedMl: result._sum.calculatedRemainingMl ?? 0,
      realMl: result._sum.realRemainingMl ?? 0,
    };
  },
};
