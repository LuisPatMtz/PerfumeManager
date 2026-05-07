"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardKPIs {
  cashBalance: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number | null;
  netProfitThisMonth: number;
  grossProfitThisMonth: number;
  expenseThisMonth: number;
  totalPendingCredits: number;
  highRiskCredits: number;
  lowStockCount: number;
  inventoryValue: number;
  suppliesValue: number;
  mlSoldThisMonth: number;
  mlGiftedThisMonth: number;
  mlLostThisMonth: number;
  salesChart: { date: string; revenue: number }[];
  topPerfumes: {
    perfumeId: string;
    name: string;
    brand: string;
    revenue: number;
    profit: number;
    mlSold: number;
    salesCount: number;
  }[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<DashboardKPIs>("/dashboard");
      return res.data;
    },
    refetchInterval: 60_000,
  });
}

export interface DashboardInsight {
  type: "warning" | "info" | "success";
  message: string;
}

export function useDashboardInsights() {
  return useQuery({
    queryKey: ["dashboard", "insights"],
    queryFn: async () => {
      const res = await api.get<DashboardInsight[]>("/dashboard/insights");
      return res.data;
    },
    refetchInterval: 120_000,
  });
}
