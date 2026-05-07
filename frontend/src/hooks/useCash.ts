"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CashBalance {
  balance: number;
  totalIn: number;
  totalOut: number;
  byType: Record<string, number>;
}

interface CashMovement {
  id: string;
  type: string;
  amount: number;
  description?: string;
  referenceId?: string;
  date: string;
  createdAt: string;
}

export function useCashBalance() {
  return useQuery({
    queryKey: ["cash", "balance"],
    queryFn: async () => {
      const res = await api.get<CashBalance>("/cash/balance");
      return res.data;
    },
  });
}

export function useCashMovements(type?: string, limit = 150) {
  return useQuery({
    queryKey: ["cash", "movements", type, limit],
    queryFn: async () => {
      const res = await api.get<CashMovement[]>("/cash/movements", {
        params: { type, limit },
      });
      return res.data;
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      category: string;
      amount: number;
      description: string;
      date?: string;
    }) => {
      const res = await api.post("/cash/expenses", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}

export function useCreateContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: number; description?: string; date?: string }) => {
      const res = await api.post("/cash/contributions", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: number; description?: string; date?: string }) => {
      const res = await api.post("/cash/withdrawals", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}
