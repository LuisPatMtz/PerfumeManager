"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Customer } from "@/types";

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      const res = await api.get<Customer[]>("/customers", {
        params: search ? { search } : undefined,
      });
      return res.data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; phone?: string; instagram?: string; notes?: string }) => {
      const res = await api.post<Customer>("/customers", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
