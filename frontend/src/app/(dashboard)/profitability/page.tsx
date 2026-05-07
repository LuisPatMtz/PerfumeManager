"use client";

import { useState } from "react";
import { TrendingUp, AlertTriangle, BarChart3, Package, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfitabilitySummary, type PerfumeProfitabilityItem } from "@/hooks/useProfitability";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n / 100);

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

type SortKey = "totalProfit" | "roi" | "margin" | "totalMlSold" | "totalRevenue" | "daysSinceLastSale";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "totalProfit", label: "Utilidad" },
  { value: "roi", label: "ROI" },
  { value: "margin", label: "Margen" },
  { value: "totalRevenue", label: "Ingresos" },
  { value: "totalMlSold", label: "ml vendidos" },
  { value: "daysSinceLastSale", label: "Inventario muerto" },
];

function RoiBadge({ roi }: { roi: number }) {
  const color =
    roi >= 100 ? "text-chart-2 bg-chart-2/10" :
    roi >= 50  ? "text-primary bg-primary/10" :
    roi >= 0   ? "text-muted-foreground bg-muted" :
                 "text-destructive bg-destructive/10";
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", color)}>
      {pct(roi)}
    </span>
  );
}

function DeadBadge() {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      Estancado
    </span>
  );
}

function PerfumeRow({ item }: { item: PerfumeProfitabilityItem }) {
  const mlProgress = item.totalInvestment > 0
    ? Math.min(100, Math.round((item.inventoryValue / item.totalInvestment) * 100))
    : 0;

  return (
    <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors last:border-0">
      <td className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.brand}</p>
          </div>
        </div>
      </td>
      <td className="p-5">
        <p className="text-sm font-semibold">{fmt(item.totalRevenue)}</p>
        <p className="text-xs text-muted-foreground">{item.salesCount} ventas · {item.totalMlSold}ml</p>
      </td>
      <td className="p-5">
        <p className={cn("text-sm font-semibold", item.totalProfit >= 0 ? "text-chart-2" : "text-destructive")}>
          {fmt(item.totalProfit)}
        </p>
        <p className="text-xs text-muted-foreground">Margen {item.margin}%</p>
      </td>
      <td className="p-5">
        <RoiBadge roi={item.roi} />
      </td>
      <td className="p-5">
        <p className="text-sm">{fmt(item.totalInvestment)}</p>
        <div className="mt-1.5 h-1.5 bg-secondary rounded-full w-24">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${mlProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{fmt(item.inventoryValue)} restante</p>
      </td>
      <td className="p-5">
        {item.isDead ? (
          <DeadBadge />
        ) : item.daysSinceLastSale !== null ? (
          <p className="text-sm text-muted-foreground">hace {item.daysSinceLastSale}d</p>
        ) : (
          <p className="text-sm text-muted-foreground">Sin ventas</p>
        )}
      </td>
      <td className="p-5">
        <p className="text-xs text-muted-foreground">
          {item.avgPricePerMl > 0 ? `$${(item.avgPricePerMl / 100).toFixed(0)}/ml` : "—"}
        </p>
      </td>
    </tr>
  );
}

export default function ProfitabilityPage() {
  const { data, isLoading } = useProfitabilitySummary();
  const [sortBy, setSortBy] = useState<SortKey>("totalProfit");
  const [showDead, setShowDead] = useState(false);

  const items = data?.items ?? [];
  const sorted = [...items].sort((a, b) => {
    if (sortBy === "daysSinceLastSale") {
      const aVal = a.daysSinceLastSale ?? 9999;
      const bVal = b.daysSinceLastSale ?? 9999;
      return bVal - aVal;
    }
    return (b[sortBy] as number) - (a[sortBy] as number);
  });
  const filtered = showDead ? sorted.filter((i) => i.isDead) : sorted;

  return (
    <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold mb-2">Rentabilidad</h1>
        <p className="text-muted-foreground">ROI, margen y análisis de perfumes</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Ingresos totales",
            value: fmt(data?.totalRevenue ?? 0),
            color: "text-chart-1",
            icon: TrendingUp,
          },
          {
            label: "Utilidad total",
            value: fmt(data?.totalProfit ?? 0),
            color: (data?.totalProfit ?? 0) >= 0 ? "text-chart-2" : "text-destructive",
            icon: BarChart3,
          },
          {
            label: "ROI promedio",
            value: `${data?.overallRoi ?? 0}%`,
            color: (data?.overallRoi ?? 0) >= 50 ? "text-chart-2" : "text-muted-foreground",
            icon: TrendingUp,
          },
          {
            label: "Inventario muerto",
            value: `${data?.deadCount ?? 0} perfumes`,
            color: (data?.deadCount ?? 0) > 0 ? "text-destructive" : "text-muted-foreground",
            icon: AlertTriangle,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={cn("w-4 h-4", color)} />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
            <p className={cn("text-2xl font-semibold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Top 5 performers */}
      {(data?.topPerformers?.length ?? 0) > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm mb-8">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Top perfumes por utilidad</h3>
          <div className="flex flex-col gap-3">
            {data!.topPerformers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{p.name} <span className="text-muted-foreground font-normal">· {p.brand}</span></p>
                    <div className="flex items-center gap-3 shrink-0">
                      <RoiBadge roi={p.roi} />
                      <span className="text-sm font-semibold text-chart-2">{fmt(p.totalProfit)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((p.totalProfit / (data!.topPerformers[0]?.totalProfit || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map(({ value, label }) => (
              <button key={value} onClick={() => setSortBy(value)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  sortBy === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-secondary")}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowDead((v) => !v)}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2",
            showDead
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-card border-border hover:bg-secondary")}>
          <AlertTriangle className="w-4 h-4" />
          {showDead ? "Mostrando estancados" : "Ver estancados"}
        </button>
      </div>

      {/* Table */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border/50 animate-pulse h-16" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-1">Sin datos de rentabilidad</p>
          <p className="text-sm text-muted-foreground">Registra ventas para ver el análisis</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Perfume", "Ingresos", "Utilidad", "ROI", "Inversión", "Última venta", "Precio/ml"].map((h) => (
                  <th key={h} className="text-left p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <PerfumeRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
