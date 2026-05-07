"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PerfumeProfitabilityItem {
  id: string;
  name: string;
  brand: string;
  status: string;
  salesCount: number;
  totalMlSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalInvestment: number;
  inventoryValue: number;
  roi: number;
  margin: number;
  lastSaleAt: string | null;
  daysSinceLastSale: number | null;
  isDead: boolean;
  avgPricePerMl: number;
  avgCostPerMl: number;
}

export interface ProfitabilitySummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalInvestment: number;
  inventoryValue: number;
  overallRoi: number;
  overallMargin: number;
  deadCount: number;
  topPerformers: PerfumeProfitabilityItem[];
  items: PerfumeProfitabilityItem[];
}

export function useProfitabilitySummary() {
  return useQuery({
    queryKey: ["profitability", "summary"],
    queryFn: async () => {
      const res = await api.get<ProfitabilitySummary>("/profitability/summary");
      return res.data;
    },
  });
}

export function usePerfumeProfitability() {
  return useQuery({
    queryKey: ["profitability", "perfumes"],
    queryFn: async () => {
      const res = await api.get<PerfumeProfitabilityItem[]>("/profitability/perfumes");
      return res.data;
    },
  });
}
