import { prisma } from "../utils/prisma";

export async function listGoals() {
  return prisma.goal.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createGoal(data: {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: Date;
  notes?: string;
}) {
  return prisma.goal.create({ data });
}

export async function updateGoal(
  id: string,
  data: {
    title?: string;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: Date | null;
    notes?: string;
    isCompleted?: boolean;
  }
) {
  // Auto-complete if currentAmount meets target
  const goal = await prisma.goal.findUniqueOrThrow({ where: { id } });
  const newCurrent = data.currentAmount ?? goal.currentAmount;
  const newTarget = data.targetAmount ?? goal.targetAmount;
  const isCompleted = data.isCompleted ?? newCurrent >= newTarget;

  return prisma.goal.update({ where: { id }, data: { ...data, isCompleted } });
}

export async function deleteGoal(id: string) {
  return prisma.goal.delete({ where: { id } });
}

export async function addProgress(id: string, amount: number) {
  const goal = await prisma.goal.findUniqueOrThrow({ where: { id } });
  const newCurrent = goal.currentAmount + amount;
  const isCompleted = newCurrent >= goal.targetAmount;
  return prisma.goal.update({
    where: { id },
    data: { currentAmount: newCurrent, isCompleted },
  });
}
