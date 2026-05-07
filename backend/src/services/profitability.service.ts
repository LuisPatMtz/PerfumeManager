import { prisma } from "../utils/prisma";

export async function getPerfumeProfitability() {
  const perfumes = await prisma.perfume.findMany({
    where: { status: { not: "archived" } },
    include: {
      saleItems: {
        where: { isGift: false },
        select: {
          ml: true,
          price: true,
          perfumeCost: true,
          suppliesCost: true,
          estimatedProfit: true,
          realProfit: true,
          createdAt: true,
        },
      },
      bottles: {
        select: {
          purchasePrice: true,
          initialMl: true,
          calculatedRemainingMl: true,
          status: true,
        },
      },
      prices: {
        select: { ml: true, price: true },
        orderBy: { ml: "asc" },
      },
    },
  });

  return perfumes.map((p) => {
    const totalMlSold = p.saleItems.reduce((s, i) => s + i.ml, 0);
    const totalRevenue = p.saleItems.reduce((s, i) => s + i.price, 0);
    const totalCost = p.saleItems.reduce((s, i) => s + i.perfumeCost + i.suppliesCost, 0);
    const totalProfit = p.saleItems.reduce((s, i) => s + i.realProfit, 0);
    const salesCount = p.saleItems.length;

    // Investment = sum of all bottle purchase prices
    const totalInvestment = p.bottles.reduce((s, b) => s + b.purchasePrice, 0);

    // Remaining inventory value (proportional to remaining ml)
    const inventoryValue = p.bottles.reduce((s, b) => {
      const ratio = b.initialMl > 0 ? b.calculatedRemainingMl / b.initialMl : 0;
      return s + Math.round(b.purchasePrice * ratio);
    }, 0);

    const roi = totalInvestment > 0 ? Math.round((totalProfit / totalInvestment) * 100) : 0;
    const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    // Last sale date
    const sortedSales = [...p.saleItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastSaleAt = sortedSales[0]?.createdAt ?? null;

    // Days since last sale (dead inventory flag)
    const daysSinceLastSale = lastSaleAt
      ? Math.floor((Date.now() - new Date(lastSaleAt).getTime()) / 86_400_000)
      : null;

    const isDead = daysSinceLastSale !== null ? daysSinceLastSale > 60 : salesCount === 0;

    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      status: p.status,
      salesCount,
      totalMlSold,
      totalRevenue,
      totalCost,
      totalProfit,
      totalInvestment,
      inventoryValue,
      roi,
      margin,
      lastSaleAt,
      daysSinceLastSale,
      isDead,
      avgPricePerMl: totalMlSold > 0 ? Math.round(totalRevenue / totalMlSold) : 0,
      avgCostPerMl: totalMlSold > 0 ? Math.round(totalCost / totalMlSold) : 0,
    };
  });
}

export async function getProfitabilitySummary() {
  const items = await getPerfumeProfitability();

  const totalRevenue = items.reduce((s, i) => s + i.totalRevenue, 0);
  const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
  const totalProfit = items.reduce((s, i) => s + i.totalProfit, 0);
  const totalInvestment = items.reduce((s, i) => s + i.totalInvestment, 0);
  const inventoryValue = items.reduce((s, i) => s + i.inventoryValue, 0);

  const overallRoi = totalInvestment > 0 ? Math.round((totalProfit / totalInvestment) * 100) : 0;
  const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const deadCount = items.filter((i) => i.isDead).length;
  const topPerformers = [...items]
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5);

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    totalInvestment,
    inventoryValue,
    overallRoi,
    overallMargin,
    deadCount,
    topPerformers,
    items,
  };
}
