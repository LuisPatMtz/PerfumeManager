import { prisma } from "../utils/prisma";
import { PaymentMethod } from "@prisma/client";

export const creditsService = {
  async list() {
    return prisma.credit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        payments: { orderBy: { paidAt: "desc" }, take: 5 },
      },
    });
  },

  async findById(id: string) {
    return prisma.credit.findUnique({
      where: { id },
      include: {
        customer: true,
        sale: { include: { items: { include: { perfume: true } } } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });
  },

  async addPayment(creditId: string, amount: number, method: PaymentMethod, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({ where: { id: creditId } });
      if (!credit) throw new Error("Crédito no encontrado");
      if (amount > credit.pending) throw new Error("El pago excede la deuda pendiente");

      const newPaid = credit.paid + amount;
      const newPending = credit.pending - amount;
      const isFullyPaid = newPending === 0;

      // Register payment
      const payment = await tx.creditPayment.create({
        data: { creditId, amount, method, notes },
      });

      // Update credit
      await tx.credit.update({
        where: { id: creditId },
        data: {
          paid: newPaid,
          pending: newPending,
          lastPaymentAt: new Date(),
          ...(isFullyPaid ? { risk: "low" } : {}),
        },
      });

      // Update sale paid amount
      await tx.sale.update({
        where: { id: credit.saleId },
        data: {
          paid: { increment: amount },
          status: isFullyPaid ? "paid" : "partial",
        },
      });

      // Register cash movement
      await tx.businessCashMovement.create({
        data: {
          type: "credit_payment",
          amount,
          description: `Abono crédito #${creditId.slice(-6)}`,
          referenceId: creditId,
        },
      });

      return payment;
    });
  },

  async updateRisk(creditId: string, risk: "low" | "medium" | "high") {
    return prisma.credit.update({ where: { id: creditId }, data: { risk } });
  },

  async getSummary() {
    const result = await prisma.credit.aggregate({
      where: { pending: { gt: 0 } },
      _sum: { total: true, paid: true, pending: true },
      _count: true,
    });
    return {
      totalBilled: result._sum.total ?? 0,
      totalPaid: result._sum.paid ?? 0,
      totalPending: result._sum.pending ?? 0,
      activeCredits: result._count,
    };
  },
};
