"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PerfumeMovement, Perfume, Bottle } from "@/types";

interface MovementWithRelations extends Omit<PerfumeMovement, "perfume"> {
  perfume: Pick<Perfume, "id" | "name" | "brand">;
  bottle: Pick<Bottle, "id" | "initialMl" | "calculatedRemainingMl">;
}

interface MovementsSummary {
  summary: Record<string, { count: number; totalMl: number }>;
  recentLosses: MovementWithRelations[];
}

export function useMovements(filters?: {
  perfumeId?: string;
  bottleId?: string;
  type?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["movements", filters],
    queryFn: async () => {
      const res = await api.get<MovementWithRelations[]>("/perfume-movements", {
        params: filters,
      });
      return res.data;
    },
  });
}

export function useMovementsSummary() {
  return useQuery({
    queryKey: ["movements", "summary"],
    queryFn: async () => {
      const res = await api.get<MovementsSummary>("/perfume-movements/summary");
      return res.data;
    },
  });
}
