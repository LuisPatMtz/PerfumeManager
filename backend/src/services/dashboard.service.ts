import { prisma } from "../utils/prisma";

export async function getDashboardKPIs() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // All independent queries run in a single round-trip
  const [
    cashAgg,
    thisMonthSales,
    lastMonthSales,
    pendingCredits,
    supplies,
    bottles,
    recentMovements,
    topSaleItems,
    salesItemsCost,
    expensesThisMonth,
    salesLast7,
  ] = await Promise.all([
    // Aggregate sum instead of findMany + JS reduce
    prisma.businessCashMovement.aggregate({ _sum: { amount: true } }),
    prisma.sale.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { paid: true },
    }),
    // lt: startOfMonth is exact — avoids missing the last second of the month
    prisma.sale.findMany({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
      select: { paid: true },
    }),
    prisma.credit.findMany({
      where: { pending: { gt: 0 } },
      select: { pending: true, risk: true },
    }),
    // Single supplies query covers both lowStockCount and suppliesValue
    prisma.supply.findMany({
      select: { stock: true, minStock: true, costPerUnit: true },
    }),
    prisma.bottle.findMany({
      where: { status: { not: "archived" } },
      select: { purchasePrice: true, initialMl: true, calculatedRemainingMl: true },
    }),
    prisma.perfumeMovement.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { type: true, ml: true },
    }),
    prisma.saleItem.groupBy({
      by: ["perfumeId"],
      where: { createdAt: { gte: startOfMonth }, isGift: false },
      _sum: { price: true, realProfit: true, ml: true },
      _count: true,
      orderBy: { _sum: { price: "desc" } },
      take: 5,
    }),
    // Moved into Promise.all — was a sequential query before
    prisma.saleItem.aggregate({
      where: { createdAt: { gte: startOfMonth }, isGift: false },
      _sum: { perfumeCost: true, suppliesCost: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // Moved into Promise.all — was a sequential query before
    prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { paid: true, createdAt: true },
    }),
  ]);

  // Cash balance
  const cashBalance = cashAgg._sum.amount ?? 0;

  // Revenue
  const revenueThisMonth = thisMonthSales.reduce((s, x) => s + x.paid, 0);
  const revenueLastMonth = lastMonthSales.reduce((s, x) => s + x.paid, 0);
  const revenueGrowth =
    revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : null;

  // Credits
  const totalPendingCredits = pendingCredits.reduce((s, c) => s + c.pending, 0);
  const highRiskCredits = pendingCredits.filter((c) => c.risk === "high").length;

  // Supplies — single pass for both metrics
  const lowStockCount = supplies.filter((s) => s.stock <= s.minStock).length;
  const suppliesValue = supplies.reduce((s, sup) => s + sup.stock * sup.costPerUnit, 0);

  // Inventory value (bottles)
  const inventoryValue = bottles.reduce((s, b) => {
    const ratio = b.initialMl > 0 ? b.calculatedRemainingMl / b.initialMl : 0;
    return s + Math.round(b.purchasePrice * ratio);
  }, 0);

  // Monthly profit
  const expenseThisMonth = expensesThisMonth._sum.amount ?? 0;
  const costThisMonth =
    (salesItemsCost._sum.perfumeCost ?? 0) + (salesItemsCost._sum.suppliesCost ?? 0);
  const grossProfitThisMonth = revenueThisMonth - costThisMonth;
  const netProfitThisMonth = grossProfitThisMonth - expenseThisMonth;

  // ML movements — single pass with type discrimination
  let mlSoldThisMonth = 0;
  let mlGiftedThisMonth = 0;
  let mlLostThisMonth = 0;
  for (const m of recentMovements) {
    if (m.type === "sale") mlSoldThisMonth += m.ml;
    else if (m.type === "gift") mlGiftedThisMonth += m.ml;
    else if (m.type === "loss" || m.type === "adjustment") mlLostThisMonth += m.ml;
  }

  // Sales chart — group by day in JS (7 items max, O(7 * salesLast7.length))
  const salesChart = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(sevenDaysAgo);
    dayStart.setDate(sevenDaysAgo.getDate() + i);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const revenue = salesLast7
      .filter((s) => {
        const d = new Date(s.createdAt);
        return d >= dayStart && d < dayEnd;
      })
      .reduce((sum, s) => sum + s.paid, 0);
    return { date: dayStart.toISOString().slice(0, 10), revenue };
  });

  // Top perfumes — one lookup query, guarded so we skip if no sales
  const perfumeIds = topSaleItems.map((i) => i.perfumeId);
  const perfumeNames =
    perfumeIds.length > 0
      ? await prisma.perfume.findMany({
          where: { id: { in: perfumeIds } },
          select: { id: true, name: true, brand: true },
        })
      : [];

  // O(1) lookup via Map instead of Array.find
  const nameMap = new Map(perfumeNames.map((p) => [p.id, p]));
  const topPerfumes = topSaleItems.map((item) => {
    const p = nameMap.get(item.perfumeId);
    return {
      perfumeId: item.perfumeId,
      name: p?.name ?? "—",
      brand: p?.brand ?? "—",
      revenue: item._sum.price ?? 0,
      profit: item._sum.realProfit ?? 0,
      mlSold: item._sum.ml ?? 0,
      salesCount: item._count,
    };
  });

  return {
    cashBalance,
    revenueThisMonth,
    revenueLastMonth,
    revenueGrowth,
    netProfitThisMonth,
    grossProfitThisMonth,
    expenseThisMonth,
    totalPendingCredits,
    highRiskCredits,
    lowStockCount,
    inventoryValue,
    suppliesValue,
    mlSoldThisMonth,
    mlGiftedThisMonth,
    mlLostThisMonth,
    salesChart,
    topPerfumes,
  };
}

export async function getDashboardInsights() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

  const insights: { type: "warning" | "info" | "success"; message: string }[] = [];

  const [revenueThis, revenueLast, lossesThis, salesMlThis, perfumes, highRisk, supplies, cashAgg] =
    await Promise.all([
      prisma.sale.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { paid: true } }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
        _sum: { paid: true },
      }),
      prisma.perfumeMovement.aggregate({
        where: { type: { in: ["loss", "adjustment"] }, createdAt: { gte: startOfMonth } },
        _sum: { ml: true },
      }),
      prisma.perfumeMovement.aggregate({
        where: { type: "sale", createdAt: { gte: startOfMonth } },
        _sum: { ml: true },
      }),
      prisma.perfume.findMany({
        where: { status: "active" },
        select: {
          name: true,
          brand: true,
          saleItems: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
          bottles: { where: { status: { in: ["open", "low_stock"] } }, select: { calculatedRemainingMl: true } },
        },
      }),
      prisma.credit.count({ where: { risk: "high", pending: { gt: 0 } } }),
      prisma.supply.findMany({ select: { stock: true, minStock: true, name: true } }),
      prisma.businessCashMovement.aggregate({ _sum: { amount: true } }),
    ]);

  const rThis = revenueThis._sum.paid ?? 0;
  const rLast = revenueLast._sum.paid ?? 0;

  // 1. Revenue trend
  if (rLast > 0 && rThis < rLast * 0.8) {
    const drop = Math.round(((rLast - rThis) / rLast) * 100);
    insights.push({ type: "warning", message: `Las ventas bajaron ${drop}% vs el mes pasado. Considera revisar precios o promociones.` });
  } else if (rLast > 0 && rThis > rLast * 1.2) {
    const rise = Math.round(((rThis - rLast) / rLast) * 100);
    insights.push({ type: "success", message: `¡Excelente! Las ventas subieron ${rise}% respecto al mes pasado.` });
  }

  // 2. Losses vs sales ratio
  const lossml = lossesThis._sum.ml ?? 0;
  const saleml = salesMlThis._sum.ml ?? 0;
  if (saleml > 0 && lossml / saleml > 0.1) {
    insights.push({
      type: "warning",
      message: `Las pérdidas (${lossml}ml) representan el ${Math.round((lossml / saleml) * 100)}% de lo vendido. Revisa mermas y derrames.`,
    });
  }

  // 3. Dead inventory
  const dead = perfumes.filter((p) => {
    const hasStock = p.bottles.some((b) => b.calculatedRemainingMl > 0);
    if (!hasStock) return false;
    const lastSale = p.saleItems[0]?.createdAt;
    return !lastSale || lastSale < thirtyDaysAgo;
  });
  if (dead.length === 1) {
    insights.push({ type: "warning", message: `${dead[0].name} (${dead[0].brand}) lleva más de 30 días sin venderse y tiene inventario.` });
  } else if (dead.length > 1) {
    insights.push({ type: "warning", message: `${dead.length} perfumes llevan más de 30 días sin venderse. Considera descuentos o promociones.` });
  }

  // 4. High risk credits
  if (highRisk > 0) {
    insights.push({ type: "warning", message: `${highRisk} crédito${highRisk > 1 ? "s" : ""} de alto riesgo con saldo pendiente. Gestiona cobros pronto.` });
  }

  // 5. Low stock supplies
  const lowStock = supplies.filter((s) => s.stock <= s.minStock);
  if (lowStock.length === 1) {
    insights.push({ type: "warning", message: `El insumo "${lowStock[0].name}" está por agotarse. Reabastece pronto.` });
  } else if (lowStock.length > 1) {
    insights.push({ type: "warning", message: `${lowStock.length} insumos están bajo su stock mínimo. Ve a Insumos para reabastecer.` });
  }

  // 6. Cash balance health
  const cashBalance = cashAgg._sum.amount ?? 0;
  if (cashBalance < 0) {
    insights.push({ type: "warning", message: `La caja está en negativo ($${(Math.abs(cashBalance) / 100).toFixed(0)}). Revisa gastos y aportaciones.` });
  } else if (cashBalance > rThis * 2 && cashBalance > 50000) {
    insights.push({ type: "info", message: `Tienes buen efectivo disponible. Considera reinvertir en inventario o registrar una meta.` });
  }

  // 7. All good fallback
  if (insights.length === 0) {
    insights.push({ type: "success", message: `El negocio está en buen estado. No se detectaron alertas críticas este período.` });
  }

  return insights;
}
