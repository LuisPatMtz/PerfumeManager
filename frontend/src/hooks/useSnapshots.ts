"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FinancialSnapshot {
  id: string;
  cash: number;
  utility: number;
  inventoryValue: number;
  pendingCredits: number;
  avgRoi: number;
  date: string;
  createdAt: string;
}

export function useSnapshots(limit = 30) {
  return useQuery({
    queryKey: ["snapshots", limit],
    queryFn: async () => {
      const res = await api.get<FinancialSnapshot[]>("/snapshots", { params: { limit } });
      return res.data;
    },
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<FinancialSnapshot>("/snapshots");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["snapshots"] }),
  });
}
