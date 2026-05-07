"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Credit } from "@/types";

export function useCredits() {
  return useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const res = await api.get<Credit[]>("/credits");
      return res.data;
    },
  });
}

export function useCreditsSummary() {
  return useQuery({
    queryKey: ["credits", "summary"],
    queryFn: async () => {
      const res = await api.get<{
        totalBilled: number;
        totalPaid: number;
        totalPending: number;
        activeCredits: number;
      }>("/credits/summary");
      return res.data;
    },
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      creditId,
      amount,
      method,
      notes,
    }: {
      creditId: string;
      amount: number;
      method: string;
      notes?: string;
    }) => {
      const res = await api.post(`/credits/${creditId}/payments`, { amount, method, notes });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}
