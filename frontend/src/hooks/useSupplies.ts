"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Supply } from "@/types";

interface SupplyWithRules extends Supply {
  consumeRules: { ml: number; quantity: number }[];
}

export function useSupplies() {
  return useQuery({
    queryKey: ["supplies"],
    queryFn: async () => {
      const res = await api.get<SupplyWithRules[]>("/supplies");
      return res.data;
    },
  });
}

export function useSuppliesSummary() {
  return useQuery({
    queryKey: ["supplies", "summary"],
    queryFn: async () => {
      const res = await api.get<{ total: number; lowStock: number; totalValue: number }>("/supplies/summary");
      return res.data;
    },
  });
}

export function useSupplyRules() {
  return useQuery({
    queryKey: ["supplies", "rules"],
    queryFn: async () => {
      const res = await api.get<{ id: string; ml: number; quantity: number; supply: Supply }[]>("/supplies/rules");
      return res.data;
    },
  });
}

export function useCreateSupply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      category: string;
      stock?: number;
      minStock?: number;
      unit?: string;
      costPerUnit?: number;
    }) => {
      const res = await api.post<Supply>("/supplies", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplies"] }),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, delta, reason }: { id: string; delta: number; reason?: string }) => {
      const res = await api.post(`/supplies/${id}/adjust`, { delta, reason });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplies"] }),
  });
}

export function useSetSupplyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ml: number; supplyId: string; quantity: number }) => {
      const res = await api.post("/supplies/rules", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplies", "rules"] }),
  });
}
