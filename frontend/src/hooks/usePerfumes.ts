"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Perfume, PerfumePrice } from "@/types";

interface PerfumeWithStock extends Perfume {
  prices: PerfumePrice[];
  calculatedMl: number;
  realMl: number;
  bottles: { id: string; calculatedRemainingMl: number; realRemainingMl: number; status: string }[];
}

export function usePerfumes(search?: string) {
  return useQuery({
    queryKey: ["perfumes", search],
    queryFn: async () => {
      const res = await api.get<PerfumeWithStock[]>("/perfumes", {
        params: search ? { search } : undefined,
      });
      return res.data;
    },
  });
}

export function usePerfume(id: string) {
  return useQuery({
    queryKey: ["perfumes", id],
    queryFn: async () => {
      const res = await api.get<PerfumeWithStock>(`/perfumes/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreatePerfume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      brand: string;
      category?: string;
      description?: string;
      concentration?: string;
    }) => {
      const res = await api.post<Perfume>("/perfumes", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["perfumes"] }),
  });
}

export function useUpdatePerfume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; name?: string; brand?: string }) => {
      const res = await api.put<Perfume>(`/perfumes/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["perfumes"] }),
  });
}

export function useSetPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ perfumeId, ml, price }: { perfumeId: string; ml: number; price: number }) => {
      const res = await api.post(`/perfumes/${perfumeId}/prices`, { ml, price });
      return res.data;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["perfumes", vars.perfumeId] }),
  });
}
