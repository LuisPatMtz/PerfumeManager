import { prisma } from "../utils/prisma";
import { PaymentMethod, SaleStatus } from "@prisma/client";

export interface SaleItemInput {
  bottleId: string;
  perfumeId: string;
  ml: number;
  isGift?: boolean;
}

export interface CreateSaleInput {
  customerId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: SaleItemInput[];
}

export const salesService = {
  async list(limit = 50) {
    return prisma.sale.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        items: {
          include: { perfume: { select: { id: true, name: true, brand: true } } },
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { perfume: true, bottle: true } },
        credit: true,
      },
    });
  },

  async create(input: CreateSaleInput) {
    return prisma.$transaction(async (tx) => {
      let grandTotal = 0;
      const resolvedItems: {
        bottleId: string;
        perfumeId: string;
        ml: number;
        price: number;
        perfumeCost: number;
        suppliesCost: number;
        estimatedProfit: number;
        realProfit: number;
        isGift: boolean;
      }[] = [];

      for (const item of input.items) {
        // 1. Validate bottle has enough ml
        const bottle = await tx.bottle.findUnique({ where: { id: item.bottleId } });
        if (!bottle) throw new Error(`Botella ${item.bottleId} no encontrada`);
        if (bottle.calculatedRemainingMl < item.ml) {
          throw new Error(
            `Botella sin suficientes ml: tiene ${bottle.calculatedRemainingMl}ml, necesitas ${item.ml}ml`
          );
        }

        // 2. Get sale price from price table
        let price = 0;
        if (!item.isGift) {
          const priceRecord = await tx.perfumePrice.findFirst({
            where: { perfumeId: item.perfumeId, ml: item.ml },
          });
          if (!priceRecord) {
            // Fallback: interpolate from nearest price
            const nearest = await tx.perfumePrice.findFirst({
              where: { perfumeId: item.perfumeId },
              orderBy: { ml: "asc" },
            });
            price = nearest ? Math.round((nearest.price / nearest.ml) * item.ml) : 0;
          } else {
            price = priceRecord.price;
          }
        }

        // 3. Calculate perfume cost (purchase price / initial ml * sold ml)
        const perfumeCost = Math.round((bottle.purchasePrice / bottle.initialMl) * item.ml);

        // 4. Calculate supplies cost
        const rules = await tx.productSupplyRule.findMany({
          where: { ml: item.ml },
          include: { supply: true },
        });
        let suppliesCost = 0;
        for (const rule of rules) {
          suppliesCost += rule.supply.costPerUnit * rule.quantity;
        }

        const estimatedProfit = price - perfumeCost - suppliesCost;
        const realProfit = item.isGift ? -(perfumeCost + suppliesCost) : estimatedProfit;

        grandTotal += price;
        resolvedItems.push({
          bottleId: item.bottleId,
          perfumeId: item.perfumeId,
          ml: item.ml,
          price,
          perfumeCost,
          suppliesCost,
          estimatedProfit,
          realProfit,
          isGift: item.isGift ?? false,
        });
      }

      // 5. Determine sale status
      const isCredit = input.paymentMethod === "credit";
      const status: SaleStatus = isCredit ? "credit" : "paid";
      const paid = isCredit ? 0 : grandTotal;

      // 6. Create the sale
      const sale = await tx.sale.create({
        data: {
          customerId: input.customerId,
          total: grandTotal,
          paid,
          status,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          items: {
            create: resolvedItems.map((item) => ({
              bottleId: item.bottleId,
              perfumeId: item.perfumeId,
              ml: item.ml,
              price: item.price,
              perfumeCost: item.perfumeCost,
              suppliesCost: item.suppliesCost,
              estimatedProfit: item.estimatedProfit,
              realProfit: item.realProfit,
              isGift: item.isGift,
            })),
          },
        },
        include: { items: true },
      });

      // 7. Deduct ml from bottles + create movements
      for (const item of resolvedItems) {
        const bottle = await tx.bottle.findUnique({ where: { id: item.bottleId } });
        if (!bottle) continue;

        const newMl = bottle.calculatedRemainingMl - item.ml;
        const newStatus =
          newMl <= 0 ? "empty" : newMl < 20 ? "low_stock" : "open";

        await tx.bottle.update({
          where: { id: item.bottleId },
          data: {
            calculatedRemainingMl: newMl,
            realRemainingMl: Math.max(0, bottle.realRemainingMl - item.ml),
            status: newStatus,
          },
        });

        await tx.perfumeMovement.create({
          data: {
            bottleId: item.bottleId,
            perfumeId: item.perfumeId,
            type: item.isGift ? "gift" : "sale",
            ml: item.ml,
            reason: item.isGift ? "Regalo" : "Venta",
          },
        });
      }

      // 8. Deduct supplies
      for (const item of resolvedItems) {
        const rules = await tx.productSupplyRule.findMany({ where: { ml: item.ml } });
        for (const rule of rules) {
          await tx.supply.update({
            where: { id: rule.supplyId },
            data: { stock: { decrement: rule.quantity } },
          });
          await tx.supplyMovement.create({
            data: {
              supplyId: rule.supplyId,
              delta: -rule.quantity,
              reason: "Venta automática",
              saleId: sale.id,
            },
          });
        }
      }

      // 9. Create credit if needed
      if (isCredit && input.customerId) {
        await tx.credit.create({
          data: {
            customerId: input.customerId,
            saleId: sale.id,
            total: grandTotal,
            paid: 0,
            pending: grandTotal,
            risk: "low",
          },
        });
      }

      // 10. Register cash movement (only if paid)
      if (!isCredit && grandTotal > 0) {
        await tx.businessCashMovement.create({
          data: {
            type: "sale",
            amount: grandTotal,
            description: `Venta #${sale.id.slice(-6)}`,
            referenceId: sale.id,
          },
        });
      }

      return sale;
    });
  },

  async getSummary() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [day, week, month] = await Promise.all([
      prisma.sale.aggregate({ where: { createdAt: { gte: startOfDay } }, _sum: { paid: true } }),
      prisma.sale.aggregate({ where: { createdAt: { gte: startOfWeek } }, _sum: { paid: true } }),
      prisma.sale.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { paid: true } }),
    ]);

    return {
      today: day._sum.paid ?? 0,
      week: week._sum.paid ?? 0,
      month: month._sum.paid ?? 0,
    };
  },
};
