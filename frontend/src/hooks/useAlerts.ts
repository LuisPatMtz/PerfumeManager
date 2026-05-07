"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Alert {
  id: string;
  type: "low_stock" | "high_losses" | "overdue_credit" | "dead_inventory" | "goal_completed" | "price_change";
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export function useAlerts(onlyUnread = false) {
  return useQuery({
    queryKey: ["alerts", { onlyUnread }],
    queryFn: async () => {
      const res = await api.get<Alert[]>("/alerts", {
        params: onlyUnread ? { unread: true } : undefined,
      });
      return res.data;
    },
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["alerts", "unread-count"],
    queryFn: async () => {
      const res = await api.get<{ count: number }>("/alerts/unread-count");
      return res.data.count;
    },
    refetchInterval: 30_000,
  });
}

export function useGenerateAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/alerts/generate");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/alerts/${id}/read`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.patch("/alerts/read-all");
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
