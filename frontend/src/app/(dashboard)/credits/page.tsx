"use client";

import { useState } from "react";
import { DollarSign, Check, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredits, useCreditsSummary, useAddPayment } from "@/hooks/useCredits";
import type { Credit } from "@/types";

const riskStyles = {
  low: "bg-chart-1/10 text-chart-1",
  medium: "bg-accent/10 text-accent",
  high: "bg-destructive/10 text-destructive",
};
const riskLabels = { low: "Bajo", medium: "Medio", high: "Alto" };

function PaymentModal({
  credit,
  onClose,
}: {
  credit: Credit;
  onClose: () => void;
}) {
  const addPayment = useAddPayment();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (cents <= 0 || cents > credit.pending) return;
    await addPayment.mutateAsync({ creditId: credit.id, amount: cents, method });
    onClose();
  };

  const pendingPesos = (credit.pending / 100).toFixed(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl border border-border/50 mx-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Registrar abono</h2>
            <p className="text-sm text-muted-foreground mt-1">Pendiente: ${pendingPesos}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Monto del abono *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" required min="0.01" max={credit.pending / 100} step="0.01"
                className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm" />
            </div>
            <button type="button" onClick={() => setAmount((credit.pending / 100).toFixed(2))}
              className="text-xs text-accent mt-1 hover:underline">
              Liquidar todo (${pendingPesos})
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {[["cash", "Efectivo"], ["transfer", "Transferencia"], ["card", "Tarjeta"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setMethod(v)}
                  className={cn("py-2.5 rounded-lg text-sm font-medium transition-all",
                    method === v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {addPayment.error && <p className="text-sm text-destructive">Error al registrar el abono</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-secondary transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={addPayment.isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {addPayment.isPending ? "Guardando..." : "Registrar abono"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  const { data: credits = [], isLoading } = useCredits();
  const { data: summary } = useCreditsSummary();
  const [selected, setSelected] = useState<Credit | null>(null);

  return (
    <>
      {selected && <PaymentModal credit={selected} onClose={() => setSelected(null)} />}

      <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-semibold mb-2">Créditos</h1>
          <p className="text-muted-foreground">Control financiero y seguimiento</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: DollarSign, label: "Total pendiente", value: `$${((summary?.totalPending ?? 0) / 100).toFixed(0)}`, color: "text-destructive" },
            { icon: Check, label: "Total recuperado", value: `$${((summary?.totalPaid ?? 0) / 100).toFixed(0)}`, color: "text-chart-1" },
            { icon: AlertCircle, label: "Créditos activos", value: String(summary?.activeCredits ?? 0), color: "text-accent" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Icon className={cn("w-5 h-5", color)} />
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
              <p className="text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse h-20" />
            ))}
          </div>
        )}

        {!isLoading && credits.length === 0 && (
          <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
            <p className="font-medium mb-1">No hay créditos activos</p>
            <p className="text-sm text-muted-foreground">Los créditos aparecen al registrar ventas a crédito</p>
          </div>
        )}

        {!isLoading && credits.length > 0 && (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  {["Cliente", "Total", "Pagado", "Pendiente", "Último abono", "Riesgo", ""].map((h) => (
                    <th key={h} className="text-left p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {credits.map((c) => {
                  const customer = (c as any).customer;
                  const isPaid = c.pending === 0;
                  return (
                    <tr key={c.id} className={cn("border-b border-border/50 transition-colors last:border-0", isPaid ? "opacity-50" : "hover:bg-secondary/20")}>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent-foreground">
                            {customer?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <p className="font-medium text-sm">{customer?.name ?? "—"}</p>
                        </div>
                      </td>
                      <td className="p-5 text-sm font-medium">${(c.total / 100).toFixed(0)}</td>
                      <td className="p-5 text-sm font-medium text-chart-1">${(c.paid / 100).toFixed(0)}</td>
                      <td className="p-5 text-sm font-medium text-destructive">${(c.pending / 100).toFixed(0)}</td>
                      <td className="p-5 text-sm text-muted-foreground">
                        {c.lastPaymentAt ? new Date(c.lastPaymentAt).toLocaleDateString("es-MX") : "—"}
                      </td>
                      <td className="p-5">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium", riskStyles[c.risk])}>
                          {riskLabels[c.risk]}
                        </span>
                      </td>
                      <td className="p-5">
                        {!isPaid && (
                          <button onClick={() => setSelected(c)}
                            className="px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-all whitespace-nowrap">
                            Registrar abono
                          </button>
                        )}
                        {isPaid && <span className="text-xs text-chart-1 font-medium">Liquidado</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
