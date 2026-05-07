"use client";

import { useEffect } from "react";
import {
  Bell,
  Package,
  AlertTriangle,
  CreditCard,
  Clock,
  CheckCircle,
  RefreshCw,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAlerts,
  useMarkAlertRead,
  useMarkAllRead,
  useGenerateAlerts,
  type Alert,
} from "@/hooks/useAlerts";

const TYPE_CONFIG: Record<
  Alert["type"],
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  low_stock:      { label: "Stock bajo",        icon: Package,       color: "text-accent",      bg: "bg-accent/10" },
  high_losses:    { label: "Pérdidas altas",    icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  overdue_credit: { label: "Crédito vencido",   icon: CreditCard,    color: "text-destructive", bg: "bg-destructive/10" },
  dead_inventory: { label: "Inventario muerto", icon: Clock,         color: "text-chart-1",     bg: "bg-chart-1/10" },
  goal_completed: { label: "Meta completada",   icon: Target,        color: "text-chart-2",     bg: "bg-chart-2/10" },
  price_change:   { label: "Cambio de precio",  icon: RefreshCw,     color: "text-primary",     bg: "bg-primary/10" },
};

function AlertRow({ alert, index = 0 }: { alert: Alert; index?: number }) {
  const markRead = useMarkAlertRead();
  const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.high_losses;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-5 border-b border-border/50 last:border-0 transition-colors animate-fade-in-up",
        !alert.isRead ? "bg-secondary/20" : "hover:bg-secondary/10"
      )}
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
        <Icon className={cn("w-4 h-4", cfg.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-xs font-semibold uppercase tracking-wide", cfg.color)}>
            {cfg.label}
          </span>
          {!alert.isRead && (
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
          )}
        </div>
        <p className="text-sm text-foreground leading-relaxed">{alert.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(alert.createdAt).toLocaleString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {!alert.isRead && (
        <button
          onClick={() => markRead.mutate(alert.id)}
          disabled={markRead.isPending}
          title="Marcar como leída"
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const markAllRead = useMarkAllRead();
  const generateAlerts = useGenerateAlerts();

  // Auto-generate on load
  useEffect(() => {
    generateAlerts.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = alerts.filter((a) => !a.isRead).length;

  const byType = alerts.reduce<Record<string, Alert[]>>((acc, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {});

  return (
    <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Alertas</h1>
          <p className="text-muted-foreground">
            {unread > 0 ? `${unread} alertas sin leer` : "Sin alertas nuevas"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generateAlerts.mutate()}
            disabled={generateAlerts.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", generateAlerts.isPending && "animate-spin")} />
            {generateAlerts.isPending ? "Analizando..." : "Analizar ahora"}
          </button>
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Marcar todas leídas
            </button>
          )}
        </div>
      </div>

      {/* Summary by type */}
      {!isLoading && Object.keys(byType).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {(Object.keys(TYPE_CONFIG) as Alert["type"][])
            .filter((t) => byType[t])
            .map((type, i) => {
              const cfg = TYPE_CONFIG[type];
              const Icon = cfg.icon;
              const count = byType[type]?.length ?? 0;
              const unreadCount = byType[type]?.filter((a) => !a.isRead).length ?? 0;
              return (
                <div
                  key={type}
                  className="bg-card rounded-xl p-4 border border-border/50 animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-3", cfg.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{cfg.label}</p>
                  <p className="text-lg font-semibold">{count}</p>
                  {unreadCount > 0 && (
                    <p className="text-xs text-destructive">{unreadCount} sin leer</p>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* List */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse h-20" />
          ))}
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-1">Sin alertas</p>
          <p className="text-sm text-muted-foreground">
            Haz clic en "Analizar ahora" para revisar el estado del negocio
          </p>
        </div>
      )}

      {!isLoading && alerts.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          {alerts.map((alert, i) => (
            <AlertRow key={alert.id} alert={alert} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
