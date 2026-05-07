"use client";

import { useState } from "react";
import { GitBranch, ShoppingCart, Gift, FlaskConical, AlertTriangle, Wrench, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMovements, useMovementsSummary } from "@/hooks/useMovements";

const TYPE_CONFIG = {
  sale:       { label: "Venta",      icon: ShoppingCart, color: "text-chart-1",    bg: "bg-chart-1/10" },
  gift:       { label: "Regalo",     icon: Gift,         color: "text-accent",     bg: "bg-accent/10" },
  sample:     { label: "Muestra",    icon: FlaskConical, color: "text-chart-2",    bg: "bg-chart-2/10" },
  loss:       { label: "Pérdida",    icon: AlertTriangle,color: "text-destructive",bg: "bg-destructive/10" },
  adjustment: { label: "Ajuste",     icon: Wrench,       color: "text-muted-foreground", bg: "bg-muted" },
  purchase:   { label: "Compra",     icon: Package,      color: "text-primary",    bg: "bg-primary/10" },
} as const;

type MovementType = keyof typeof TYPE_CONFIG;

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "sale", label: "Ventas" },
  { value: "loss", label: "Pérdidas" },
  { value: "gift", label: "Regalos" },
  { value: "adjustment", label: "Ajustes" },
  { value: "sample", label: "Muestras" },
];

export default function MovementsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: summary } = useMovementsSummary();
  const { data: movements = [], isLoading } = useMovements(
    typeFilter !== "all" ? { type: typeFilter, limit: 150 } : { limit: 150 }
  );

  const totalLostMl = (summary?.summary?.["loss"]?.totalMl ?? 0) +
    (summary?.summary?.["adjustment"]?.totalMl ?? 0);
  const totalSoldMl = summary?.summary?.["sale"]?.totalMl ?? 0;
  const totalGiftedMl = summary?.summary?.["gift"]?.totalMl ?? 0;

  return (
    <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold mb-2">Movimientos</h1>
        <p className="text-muted-foreground">Historial completo de todos los movimientos de ml</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "ml vendidos", value: totalSoldMl, color: "text-chart-1" },
          { label: "ml regalados", value: totalGiftedMl, color: "text-accent" },
          { label: "ml perdidos", value: totalLostMl, color: "text-destructive" },
          { label: "Total movimientos", value: movements.length, color: "text-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">{label}</p>
            <p className={cn("text-2xl font-semibold", color)}>
              {typeof value === "number" && label !== "Total movimientos" ? `${value}ml` : value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(({ value, label }) => (
          <button key={value} onClick={() => setTypeFilter(value)}
            className={cn("px-5 py-2.5 rounded-lg font-medium text-sm transition-all",
              typeFilter === value
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:bg-secondary")}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border/50 animate-pulse h-16" />
          ))}
        </div>
      )}

      {!isLoading && movements.length === 0 && (
        <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
          <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-1">No hay movimientos</p>
          <p className="text-sm text-muted-foreground">Los movimientos se generan al registrar ventas</p>
        </div>
      )}

      {!isLoading && movements.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Tipo", "Perfume", "Cantidad", "Botella", "Motivo", "Fecha"].map((h) => (
                  <th key={h} className="text-left p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const cfg = TYPE_CONFIG[m.type as MovementType] ?? TYPE_CONFIG.adjustment;
                const Icon = cfg.icon;
                return (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors last:border-0">
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                          <Icon className={cn("w-4 h-4", cfg.color)} />
                        </div>
                        <span className={cn("text-sm font-medium", cfg.color)}>{cfg.label}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-medium">{(m as any).perfume?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{(m as any).perfume?.brand ?? ""}</p>
                    </td>
                    <td className="p-5">
                      <span className={cn("text-sm font-semibold",
                        m.type === "loss" || m.type === "adjustment" ? "text-destructive" :
                        m.type === "sale" ? "text-chart-1" : "text-accent")}>
                        -{m.ml}ml
                      </span>
                    </td>
                    <td className="p-5 text-sm text-muted-foreground">
                      {(m as any).bottle?.calculatedRemainingMl != null
                        ? `${(m as any).bottle.calculatedRemainingMl}ml restantes`
                        : "—"}
                    </td>
                    <td className="p-5 text-sm text-muted-foreground">{m.reason ?? "—"}</td>
                    <td className="p-5 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString("es-MX", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
