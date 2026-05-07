"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Sale } from "@/types";

interface SaleItemInput {
  bottleId: string;
  perfumeId: string;
  ml: number;
  isGift?: boolean;
}

interface CreateSaleInput {
  customerId?: string;
  paymentMethod: "cash" | "transfer" | "card" | "credit";
  notes?: string;
  items: SaleItemInput[];
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const res = await api.get<Sale[]>("/sales");
      return res.data;
    },
  });
}

export function useSalesSummary() {
  return useQuery({
    queryKey: ["sales", "summary"],
    queryFn: async () => {
      const res = await api.get<{ today: number; week: number; month: number }>("/sales/summary");
      return res.data;
    },
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSaleInput) => {
      const res = await api.post<Sale>("/sales", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["bottles"] });
      qc.invalidateQueries({ queryKey: ["perfumes"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}
