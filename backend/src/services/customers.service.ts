import { prisma } from "../utils/prisma";

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  instagram?: string;
  notes?: string;
}

export const customersService = {
  async list(search?: string) {
    return prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { instagram: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { sales: true } },
        credits: {
          select: { pending: true },
          where: { pending: { gt: 0 } },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { items: { include: { perfume: true } } },
        },
        credits: { orderBy: { createdAt: "desc" } },
      },
    });
  },

  async create(data: CreateCustomerInput) {
    return prisma.customer.create({ data });
  },

  async update(id: string, data: Partial<CreateCustomerInput> & { isVip?: boolean }) {
    return prisma.customer.update({ where: { id }, data });
  },

  async getDebt(customerId: string) {
    const result = await prisma.credit.aggregate({
      where: { customerId, pending: { gt: 0 } },
      _sum: { pending: true, total: true, paid: true },
    });
    return {
      totalDebt: result._sum.pending ?? 0,
      totalBilled: result._sum.total ?? 0,
      totalPaid: result._sum.paid ?? 0,
    };
  },
};
