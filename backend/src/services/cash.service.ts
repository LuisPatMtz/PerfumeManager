import { prisma } from "../utils/prisma";

export async function getBalance() {
  const movements = await prisma.businessCashMovement.findMany({
    orderBy: { date: "asc" },
  });

  let balance = 0;
  let totalIn = 0;
  let totalOut = 0;
  const byType: Record<string, number> = {};

  for (const m of movements) {
    balance += m.amount;
    if (m.amount > 0) totalIn += m.amount;
    else totalOut += Math.abs(m.amount);
    byType[m.type] = (byType[m.type] ?? 0) + m.amount;
  }

  return { balance, totalIn, totalOut, byType };
}

export async function listMovements(limit = 100, type?: string) {
  return prisma.businessCashMovement.findMany({
    where: type ? { type } : undefined,
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createExpense(data: {
  category: string;
  amount: number;
  description: string;
  date?: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date ?? new Date(),
      },
    });

    await tx.businessCashMovement.create({
      data: {
        type: "expense",
        amount: -data.amount,
        description: data.description,
        referenceId: expense.id,
        date: data.date ?? new Date(),
      },
    });

    return expense;
  });
}

export async function createContribution(data: {
  amount: number;
  description?: string;
  date?: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const contrib = await tx.ownerContribution.create({
      data: {
        amount: data.amount,
        description: data.description,
        date: data.date ?? new Date(),
      },
    });

    await tx.businessCashMovement.create({
      data: {
        type: "contribution",
        amount: data.amount,
        description: data.description ?? "Aportación del dueño",
        referenceId: contrib.id,
        date: data.date ?? new Date(),
      },
    });

    return contrib;
  });
}

export async function createWithdrawal(data: {
  amount: number;
  description?: string;
  date?: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.ownerWithdrawal.create({
      data: {
        amount: data.amount,
        description: data.description,
        date: data.date ?? new Date(),
      },
    });

    await tx.businessCashMovement.create({
      data: {
        type: "withdrawal",
        amount: -data.amount,
        description: data.description ?? "Retiro del dueño",
        referenceId: withdrawal.id,
        date: data.date ?? new Date(),
      },
    });

    return withdrawal;
  });
}
