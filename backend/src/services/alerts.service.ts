import { AlertType } from "@prisma/client";
import { prisma } from "../utils/prisma";

export async function listAlerts(onlyUnread = false) {
  return prisma.alert.findMany({
    where: onlyUnread ? { isRead: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function countUnread() {
  return prisma.alert.count({ where: { isRead: false } });
}

export async function markRead(id: string) {
  return prisma.alert.update({ where: { id }, data: { isRead: true } });
}

export async function markAllRead() {
  return prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } });
}

export async function generateAlerts() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000);

  // Fetch all source data in parallel
  const [supplies, perfumes, overdueCredits, lossThis, lossLast, activeGoals] =
    await Promise.all([
      prisma.supply.findMany({
        select: { id: true, name: true, stock: true, minStock: true },
      }),
      prisma.perfume.findMany({
        where: { status: "active" },
        select: {
          id: true,
          name: true,
          brand: true,
          saleItems: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
          bottles: {
            where: { status: { in: ["open", "low_stock"] } },
            select: { calculatedRemainingMl: true },
          },
        },
      }),
      prisma.credit.findMany({
        where: { pending: { gt: 0 }, dueDate: { lt: new Date() } },
        include: { customer: { select: { name: true } } },
      }),
      prisma.perfumeMovement.aggregate({
        where: { type: { in: ["loss", "adjustment"] }, createdAt: { gte: startOfMonth } },
        _sum: { ml: true },
      }),
      prisma.perfumeMovement.aggregate({
        where: {
          type: { in: ["loss", "adjustment"] },
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
        _sum: { ml: true },
      }),
      prisma.goal.findMany({ where: { isCompleted: false } }),
    ]);

  // Build the list of alerts that should be created
  const alertsToCreate: { type: AlertType; message: string; referenceId?: string }[] = [];

  // 1. Low stock supplies
  for (const s of supplies) {
    if (s.stock <= s.minStock) {
      alertsToCreate.push({
        type: "low_stock",
        message: `Insumo "${s.name}" bajo stock mínimo — ${s.stock} restantes (mín. ${s.minStock}).`,
        referenceId: s.id,
      });
    }
  }

  // 2. Dead inventory — active perfumes with stock but no sales in > 60 days
  for (const p of perfumes) {
    const hasStock = p.bottles.some((b) => b.calculatedRemainingMl > 0);
    if (!hasStock) continue;
    const lastSale = p.saleItems[0]?.createdAt ?? null;
    if (!lastSale || lastSale < sixtyDaysAgo) {
      const days = lastSale
        ? Math.floor((Date.now() - lastSale.getTime()) / 86_400_000)
        : null;
      alertsToCreate.push({
        type: "dead_inventory",
        message: `${p.name} (${p.brand}) lleva ${days != null ? `${days} días` : "mucho tiempo"} sin venderse y tiene inventario disponible.`,
        referenceId: p.id,
      });
    }
  }

  // 3. Overdue credits
  for (const c of overdueCredits) {
    alertsToCreate.push({
      type: "overdue_credit",
      message: `Crédito de ${c.customer.name} vencido — $${(c.pending / 100).toFixed(0)} pendientes.`,
      referenceId: c.id,
    });
  }

  // 4. High losses this month vs last month (>20% increase)
  const thisLoss = lossThis._sum.ml ?? 0;
  const lastLoss = lossLast._sum.ml ?? 0;
  if (lastLoss > 0 && thisLoss > lastLoss * 1.2) {
    const inc = Math.round(((thisLoss - lastLoss) / lastLoss) * 100);
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    alertsToCreate.push({
      type: "high_losses",
      message: `Las pérdidas de ml este mes (${thisLoss}ml) aumentaron ${inc}% respecto al mes anterior.`,
      referenceId: `month:${monthKey}`,
    });
  }

  // Deduplicate: one query for all existing unread alerts, O(N) set lookup
  const existingUnread = await prisma.alert.findMany({
    where: { isRead: false },
    select: { type: true, referenceId: true },
  });
  const existingSet = new Set(
    existingUnread.map((a) => `${a.type}:${a.referenceId ?? ""}`)
  );
  const newAlerts = alertsToCreate.filter(
    (a) => !existingSet.has(`${a.type}:${a.referenceId ?? ""}`)
  );

  // Batch insert all new non-goal alerts in one statement
  let created = 0;
  if (newAlerts.length > 0) {
    const result = await prisma.alert.createMany({ data: newAlerts });
    created = result.count;
  }

  // 5. Goals — atomic: mark completed + create alert in the same transaction (ACID)
  const completedGoals = activeGoals.filter((g) => g.currentAmount >= g.targetAmount);
  if (completedGoals.length > 0) {
    const existingGoalAlerts = new Set(
      existingUnread
        .filter((a) => a.type === "goal_completed")
        .map((a) => a.referenceId ?? "")
    );

    await prisma.$transaction(async (tx) => {
      for (const g of completedGoals) {
        await tx.goal.update({ where: { id: g.id }, data: { isCompleted: true } });
        if (!existingGoalAlerts.has(g.id)) {
          await tx.alert.create({
            data: {
              type: "goal_completed",
              message: `¡Meta "${g.title}" completada! Alcanzaste $${(g.targetAmount / 100).toFixed(0)}.`,
              referenceId: g.id,
            },
          });
          created++;
        }
      }
    });
  }

  return { generated: created };
}
