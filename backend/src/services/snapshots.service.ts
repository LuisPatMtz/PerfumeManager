import { prisma } from "../utils/prisma";

export async function listSnapshots(limit = 30) {
  return prisma.financialSnapshot.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createSnapshot() {
  const [cashMovements, credits, bottles, supplies, saleItems] = await Promise.all([
    prisma.businessCashMovement.findMany({ select: { amount: true } }),
    prisma.credit.findMany({ where: { pending: { gt: 0 } }, select: { pending: true } }),
    prisma.bottle.findMany({
      where: { status: { not: "archived" } },
      select: { purchasePrice: true, initialMl: true, calculatedRemainingMl: true },
    }),
    prisma.supply.findMany({ select: { stock: true, costPerUnit: true } }),
    prisma.saleItem.findMany({
      where: { isGift: false },
      select: { realProfit: true, perfumeCost: true, suppliesCost: true },
    }),
  ]);

  const cash = cashMovements.reduce((s, m) => s + m.amount, 0);
  const pendingCredits = credits.reduce((s, c) => s + c.pending, 0);

  const inventoryValue =
    bottles.reduce((s, b) => {
      const ratio = b.initialMl > 0 ? b.calculatedRemainingMl / b.initialMl : 0;
      return s + Math.round(b.purchasePrice * ratio);
    }, 0) + supplies.reduce((s, sup) => s + sup.stock * sup.costPerUnit, 0);

  const totalProfit = saleItems.reduce((s, i) => s + i.realProfit, 0);
  const totalInvestment =
    bottles.reduce((s, b) => s + b.purchasePrice, 0) +
    supplies.reduce((s, sup) => s + sup.stock * sup.costPerUnit, 0);
  const avgRoi = totalInvestment > 0 ? Math.round((totalProfit / totalInvestment) * 100) : 0;

  return prisma.financialSnapshot.create({
    data: {
      cash,
      utility: totalProfit,
      inventoryValue,
      pendingCredits,
      avgRoi,
    },
  });
}
