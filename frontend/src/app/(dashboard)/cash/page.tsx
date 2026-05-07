"use client";

import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ShoppingCart,
  CreditCard,
  Package,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCashBalance,
  useCashMovements,
  useCreateExpense,
  useCreateContribution,
  useCreateWithdrawal,
} from "@/hooks/useCash";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n / 100);

const MOVEMENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  sale:             { label: "Venta",         icon: ShoppingCart, color: "text-chart-1",     bg: "bg-chart-1/10" },
  credit_payment:   { label: "Pago crédito",  icon: CreditCard,   color: "text-primary",     bg: "bg-primary/10" },
  expense:          { label: "Gasto",          icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
  contribution:     { label: "Aportación",     icon: TrendingUp,   color: "text-chart-2",     bg: "bg-chart-2/10" },
  withdrawal:       { label: "Retiro",         icon: ArrowUpRight, color: "text-accent",      bg: "bg-accent/10" },
  purchase:         { label: "Compra",         icon: Package,      color: "text-muted-foreground", bg: "bg-muted" },
  gift:             { label: "Regalo",         icon: Gift,         color: "text-accent",      bg: "bg-accent/10" },
};

const EXPENSE_CATEGORIES = [
  "Empaque", "Envío", "Marketing", "Servicios", "Renta", "Sueldos", "Impuestos", "Otro",
];

type ModalType = "expense" | "contribution" | "withdrawal" | null;

function AddMovementModal({
  type,
  onClose,
}: {
  type: ModalType;
  onClose: () => void;
}) {
  const createExpense = useCreateExpense();
  const createContribution = useCreateContribution();
  const createWithdrawal = useCreateWithdrawal();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Otro");

  if (!type) return null;

  const title =
    type === "expense" ? "Registrar gasto" :
    type === "contribution" ? "Registrar aportación" :
    "Registrar retiro";

  const isPending =
    createExpense.isPending || createContribution.isPending || createWithdrawal.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;

    if (type === "expense") {
      await createExpense.mutateAsync({ category, amount: amountCents, description });
    } else if (type === "contribution") {
      await createContribution.mutateAsync({ amount: amountCents, description: description || undefined });
    } else {
      await createWithdrawal.mutateAsync({ amount: amountCents, description: description || undefined });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-8 w-full max-w-md shadow-xl border border-border/50" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "expense" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Monto (MXN)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Descripción {type !== "expense" && <span className="text-muted-foreground">(opcional)</span>}
            </label>
            <input
              type="text"
              placeholder="Descripción..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm"
              required={type === "expense"}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors">
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CashPage() {
  const { data: balance, isLoading: balanceLoading } = useCashBalance();
  const { data: movements = [], isLoading: movementsLoading } = useCashMovements(undefined, 200);
  const [modal, setModal] = useState<ModalType>(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = typeFilter === "all" ? movements : movements.filter((m) => m.type === typeFilter);

  const balanceValue = balance?.balance ?? 0;
  const totalIn = balance?.totalIn ?? 0;
  const totalOut = balance?.totalOut ?? 0;

  return (
    <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-semibold mb-2">Caja Financiera</h1>
          <p className="text-muted-foreground">Control del dinero real del negocio</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal("expense")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors text-destructive">
            <TrendingDown className="w-4 h-4" />
            Gasto
          </button>
          <button onClick={() => setModal("withdrawal")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors text-accent">
            <ArrowUpRight className="w-4 h-4" />
            Retiro
          </button>
          <button onClick={() => setModal("contribution")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors">
            <Plus className="w-4 h-4" />
            Aportación
          </button>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Saldo actual</p>
          </div>
          {balanceLoading ? (
            <div className="h-10 bg-secondary/50 rounded animate-pulse" />
          ) : (
            <p className={cn("text-4xl font-semibold", balanceValue >= 0 ? "text-foreground" : "text-destructive")}>
              {fmt(balanceValue)}
            </p>
          )}
        </div>

        <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownLeft className="w-4 h-4 text-chart-2" />
            <p className="text-sm text-muted-foreground">Total entradas</p>
          </div>
          <p className="text-2xl font-semibold text-chart-2">{fmt(totalIn)}</p>
          <p className="text-xs text-muted-foreground mt-1">Ventas + créditos + aportaciones</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-4 h-4 text-destructive" />
            <p className="text-sm text-muted-foreground">Total salidas</p>
          </div>
          <p className="text-2xl font-semibold text-destructive">{fmt(totalOut)}</p>
          <p className="text-xs text-muted-foreground mt-1">Gastos + compras + retiros</p>
        </div>
      </div>

      {/* By-type breakdown */}
      {balance?.byType && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {Object.entries(balance.byType).map(([type, amount]) => {
            const cfg = MOVEMENT_CONFIG[type];
            if (!cfg) return null;
            const Icon = cfg.icon;
            return (
              <div key={type} className="bg-card rounded-xl p-4 border border-border/50">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", cfg.bg)}>
                  <Icon className={cn("w-4 h-4", cfg.color)} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{cfg.label}</p>
                <p className={cn("text-sm font-semibold", amount >= 0 ? cfg.color : "text-destructive")}>
                  {fmt(amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[{ value: "all", label: "Todos" }, ...Object.entries(MOVEMENT_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map(
          ({ value, label }) => (
            <button key={value} onClick={() => setTypeFilter(value)}
              className={cn("px-4 py-2 rounded-lg font-medium text-sm transition-all",
                typeFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-secondary")}>
              {label}
            </button>
          )
        )}
      </div>

      {/* Movements list */}
      {movementsLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border/50 animate-pulse h-16" />
          ))}
        </div>
      )}

      {!movementsLoading && filtered.length === 0 && (
        <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
          <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-1">Sin movimientos</p>
          <p className="text-sm text-muted-foreground">Registra ventas, gastos o aportaciones para verlos aquí</p>
        </div>
      )}

      {!movementsLoading && filtered.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Tipo", "Descripción", "Monto", "Fecha"].map((h) => (
                  <th key={h} className="text-left p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const cfg = MOVEMENT_CONFIG[m.type] ?? MOVEMENT_CONFIG.expense;
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
                    <td className="p-5 text-sm text-muted-foreground">{m.description ?? "—"}</td>
                    <td className="p-5">
                      <span className={cn("text-sm font-semibold", m.amount >= 0 ? "text-chart-2" : "text-destructive")}>
                        {m.amount >= 0 ? "+" : ""}{fmt(m.amount)}
                      </span>
                    </td>
                    <td className="p-5 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(m.date).toLocaleString("es-MX", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddMovementModal type={modal} onClose={() => setModal(null)} />
    </div>
  );
}
