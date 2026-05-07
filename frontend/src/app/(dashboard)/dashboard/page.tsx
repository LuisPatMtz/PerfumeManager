"use client";

import {
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  AlertCircle,
  Package,
  Droplet,
  Gift,
  ShoppingCart,
  Lightbulb,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { useDashboard, useDashboardInsights } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n / 100);

function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-secondary" />
        <div className="w-16 h-4 bg-secondary rounded" />
      </div>
      <div className="w-24 h-3 bg-secondary rounded mb-2" />
      <div className="w-32 h-8 bg-secondary rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: insights = [] } = useDashboardInsights();

  const revenueGrowthUp = (data?.revenueGrowth ?? 0) > 0;
  const revenueGrowthDown = (data?.revenueGrowth ?? 0) < 0;

  const chartData =
    data?.salesChart.map((d) => ({
      day: new Date(d.date).toLocaleDateString("es-MX", { weekday: "short" }),
      amount: d.revenue / 100,
    })) ?? [];

  return (
    <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del negocio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={DollarSign}
              label="Ventas del mes"
              value={fmt(data?.revenueThisMonth ?? 0)}
              trend={
                data?.revenueGrowth != null
                  ? `${data.revenueGrowth > 0 ? "+" : ""}${data.revenueGrowth}% vs mes anterior`
                  : undefined
              }
              trendUp={revenueGrowthUp}
              trendDown={revenueGrowthDown}
              className="animate-fade-in-up"
              style={{ animationDelay: "0ms" }}
            />
            <StatCard
              icon={TrendingUp}
              label="Utilidad neta del mes"
              value={fmt(data?.netProfitThisMonth ?? 0)}
              trend={
                data?.grossProfitThisMonth != null
                  ? `Bruta ${fmt(data.grossProfitThisMonth)}`
                  : undefined
              }
              trendUp={(data?.netProfitThisMonth ?? 0) > 0}
              trendDown={(data?.netProfitThisMonth ?? 0) < 0}
              className="animate-fade-in-up"
              style={{ animationDelay: "75ms" }}
            />
            <StatCard
              icon={Wallet}
              label="Caja actual"
              value={fmt(data?.cashBalance ?? 0)}
              trend={
                data?.expenseThisMonth != null
                  ? `${fmt(data.expenseThisMonth)} en gastos`
                  : undefined
              }
              className="animate-fade-in-up"
              style={{ animationDelay: "150ms" }}
            />
            <StatCard
              icon={CreditCard}
              label="Créditos pendientes"
              value={fmt(data?.totalPendingCredits ?? 0)}
              trend={
                (data?.highRiskCredits ?? 0) > 0
                  ? `${data!.highRiskCredits} de alto riesgo`
                  : undefined
              }
              trendDown={(data?.highRiskCredits ?? 0) > 0}
              className="animate-fade-in-up"
              style={{ animationDelay: "225ms" }}
            />
          </>
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Inventario botellas",
            value: fmt(data?.inventoryValue ?? 0),
            icon: Package,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "ml vendidos (mes)",
            value: `${data?.mlSoldThisMonth ?? 0}ml`,
            icon: ShoppingCart,
            color: "text-chart-1",
            bg: "bg-chart-1/10",
          },
          {
            label: "ml regalados (mes)",
            value: `${data?.mlGiftedThisMonth ?? 0}ml`,
            icon: Gift,
            color: "text-accent",
            bg: "bg-accent/10",
          },
          {
            label: "ml perdidos (mes)",
            value: `${data?.mlLostThisMonth ?? 0}ml`,
            icon: Droplet,
            color: "text-destructive",
            bg: "bg-destructive/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <div
            key={label}
            className="bg-card rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${300 + i * 60}ms` }}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", bg)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={cn("text-xl font-semibold", color)}>
              {isLoading ? <span className="inline-block w-20 h-6 bg-secondary rounded animate-pulse" /> : value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-8 border border-border/50 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">Ventas últimos 7 días</h3>
            <p className="text-sm text-muted-foreground">Ingresos diarios cobrados</p>
          </div>
          {isLoading ? (
            <div className="h-[280px] bg-secondary/30 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [`$${Number(v).toLocaleString("es-MX")}`, "Ingresos"]}
                />
                <Bar dataKey="amount" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top perfumes */}
        <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">Más vendidos</h3>
            <p className="text-sm text-muted-foreground">Este mes por ingresos</p>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 bg-secondary rounded animate-pulse" />
                    <div className="w-16 h-3 bg-secondary rounded animate-pulse" />
                  </div>
                  <div className="w-12 h-4 bg-secondary rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (data?.topPerfumes?.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin ventas este mes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data!.topPerfumes.map((p) => (
                <div key={p.perfumeId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(p.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{p.salesCount} ventas</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock supplies */}
        <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Alertas de insumos</h3>
              <p className="text-sm text-muted-foreground">Insumos bajo stock mínimo</p>
            </div>
            <AlertCircle className={cn("w-5 h-5", (data?.lowStockCount ?? 0) > 0 ? "text-destructive" : "text-muted-foreground")} />
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-secondary/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (data?.lowStockCount ?? 0) === 0 ? (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Todos los insumos tienen stock suficiente</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-sm text-destructive">
                  {data!.lowStockCount} {data!.lowStockCount === 1 ? "insumo bajo" : "insumos bajo"} stock mínimo
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ve a Insumos para ver el detalle y reabastecer
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Financial overview */}
        <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">Resumen financiero</h3>
            <p className="text-sm text-muted-foreground">Estado general del negocio</p>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2">
                  <div className="w-32 h-3.5 bg-secondary rounded animate-pulse" />
                  <div className="w-20 h-3.5 bg-secondary rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {[
                { label: "Caja disponible", value: fmt(data?.cashBalance ?? 0), bold: true },
                { label: "Valor inventario perfumes", value: fmt(data?.inventoryValue ?? 0), color: "text-primary" },
                { label: "Valor inventario insumos", value: fmt(data?.suppliesValue ?? 0), color: "text-muted-foreground" },
                { label: "Créditos por cobrar", value: fmt(data?.totalPendingCredits ?? 0), color: "text-accent" },
                {
                  label: "Activos totales (estimado)",
                  value: fmt(
                    (data?.cashBalance ?? 0) +
                    (data?.inventoryValue ?? 0) +
                    (data?.suppliesValue ?? 0) +
                    (data?.totalPendingCredits ?? 0)
                  ),
                  bold: true,
                  separator: true,
                },
              ].map(({ label, value, bold, color, separator }) => (
                <div key={label}>
                  {separator && <div className="border-t border-border my-3" />}
                  <div className="flex items-center justify-between py-2">
                    <p className={cn("text-sm", bold ? "font-semibold" : "text-muted-foreground")}>{label}</p>
                    <p className={cn("text-sm font-semibold", color ?? (bold ? "text-foreground" : "text-muted-foreground"))}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div className="mt-6 bg-card rounded-xl p-8 border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">Insights del negocio</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border",
                  insight.type === "warning" && "bg-destructive/5 border-destructive/20",
                  insight.type === "success" && "bg-chart-2/5 border-chart-2/20",
                  insight.type === "info"    && "bg-primary/5 border-primary/20"
                )}
              >
                {insight.type === "warning" && <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                {insight.type === "success" && <CheckCircle className="w-4 h-4 text-chart-2 shrink-0 mt-0.5" />}
                {insight.type === "info"    && <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                <p className={cn(
                  "text-sm",
                  insight.type === "warning" && "text-destructive",
                  insight.type === "success" && "text-chart-2",
                  insight.type === "info"    && "text-primary"
                )}>
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
