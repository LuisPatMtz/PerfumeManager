"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Bottle } from "@/types";

export function useBottles(perfumeId?: string) {
  return useQuery({
    queryKey: ["bottles", perfumeId],
    queryFn: async () => {
      const res = await api.get<Bottle[]>("/bottles", {
        params: perfumeId ? { perfumeId } : undefined,
      });
      return res.data;
    },
  });
}

export function useBottle(id: string) {
  return useQuery({
    queryKey: ["bottles", id],
    queryFn: async () => {
      const res = await api.get<Bottle>(`/bottles/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useBottleAudit(id: string) {
  return useQuery({
    queryKey: ["bottles", id, "audit"],
    queryFn: async () => {
      const res = await api.get(`/bottles/${id}/audit`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateBottle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      perfumeId: string;
      purchasePrice: number;
      initialMl: number;
      batchId?: string;
      supplierId?: string;
    }) => {
      const res = await api.post<Bottle>("/bottles", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bottles"] });
      qc.invalidateQueries({ queryKey: ["perfumes"] });
    },
  });
}
