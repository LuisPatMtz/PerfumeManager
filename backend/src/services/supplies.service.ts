import { prisma } from "../utils/prisma";
import { SupplyCategory } from "@prisma/client";

export interface CreateSupplyInput {
  name: string;
  category: SupplyCategory;
  stock?: number;
  minStock?: number;
  unit?: string;
  costPerUnit?: number; // centavos
}

export interface AdjustStockInput {
  delta: number;   // positive = entrada, negative = salida
  reason?: string;
}

export interface SupplyRuleInput {
  ml: number;
  supplyId: string;
  quantity: number;
}

export const suppliesService = {
  async list() {
    return prisma.supply.findMany({
      orderBy: { name: "asc" },
      include: {
        consumeRules: {
          select: { ml: true, quantity: true },
          orderBy: { ml: "asc" },
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.supply.findUnique({
      where: { id },
      include: {
        consumeRules: true,
        movements: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
  },

  async create(data: CreateSupplyInput) {
    return prisma.supply.create({ data });
  },

  async update(id: string, data: Partial<CreateSupplyInput>) {
    return prisma.supply.update({ where: { id }, data });
  },

  async adjustStock(id: string, input: AdjustStockInput) {
    const supply = await prisma.supply.findUnique({ where: { id } });
    if (!supply) throw new Error("Insumo no encontrado");

    const newStock = supply.stock + input.delta;
    if (newStock < 0) throw new Error("Stock insuficiente");

    const [updated] = await prisma.$transaction([
      prisma.supply.update({
        where: { id },
        data: { stock: newStock },
      }),
      prisma.supplyMovement.create({
        data: {
          supplyId: id,
          delta: input.delta,
          reason: input.reason,
        },
      }),
    ]);

    return updated;
  },

  // ─── Supply Rules ──────────────────────────────────────────────────────────

  async listRules() {
    return prisma.productSupplyRule.findMany({
      include: { supply: true },
      orderBy: { ml: "asc" },
    });
  },

  async setRule(input: SupplyRuleInput) {
    return prisma.productSupplyRule.upsert({
      where: { ml_supplyId: { ml: input.ml, supplyId: input.supplyId } },
      update: { quantity: input.quantity },
      create: input,
      include: { supply: true },
    });
  },

  async deleteRule(ml: number, supplyId: string) {
    return prisma.productSupplyRule.delete({
      where: { ml_supplyId: { ml, supplyId } },
    });
  },

  async getLowStock() {
    const all = await prisma.supply.findMany({ orderBy: { stock: "asc" } });
    return all.filter((s) => s.stock <= s.minStock);
  },

  async getSummary() {
    const all = await prisma.supply.findMany();
    const lowStock = all.filter((s) => s.stock <= s.minStock);
    const totalValue = all.reduce((acc, s) => acc + s.stock * s.costPerUnit, 0);
    return {
      total: all.length,
      lowStock: lowStock.length,
      totalValue,
    };
  },
};
