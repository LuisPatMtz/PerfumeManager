"use client";

import { useState } from "react";
import { Plus, Droplet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBottles, useCreateBottle } from "@/hooks/useBottles";
import { usePerfumes } from "@/hooks/usePerfumes";

const statusStyles = {
  open: "bg-chart-1/10 text-chart-1",
  low_stock: "bg-accent/10 text-accent",
  empty: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  damaged: "bg-destructive/10 text-destructive",
};

const statusLabels = {
  open: "Abierta",
  low_stock: "Stock bajo",
  empty: "Vacía",
  archived: "Archivada",
  damaged: "Dañada",
};

type BottleStatus = keyof typeof statusStyles;

function CreateBottleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: perfumes = [] } = usePerfumes();
  const create = useCreateBottle();
  const [form, setForm] = useState({ perfumeId: "", purchasePrice: "", initialMl: "" });

  if (!open) return null;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      perfumeId: form.perfumeId,
      purchasePrice: Math.round(parseFloat(form.purchasePrice) * 100),
      initialMl: parseInt(form.initialMl),
    });
    setForm({ perfumeId: "", purchasePrice: "", initialMl: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl border border-border/50 mx-4">
        <h2 className="text-2xl font-semibold mb-2">Nueva botella</h2>
        <p className="text-sm text-muted-foreground mb-8">Registrar compra de botella</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Perfume *</label>
            <select
              value={form.perfumeId}
              onChange={(e) => set("perfumeId", e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm"
            >
              <option value="">Seleccionar perfume...</option>
              {perfumes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.brand}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Precio de compra *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={form.purchasePrice}
                  onChange={(e) => set("purchasePrice", e.target.value)}
                  placeholder="0.00"
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ml iniciales *</label>
              <input
                type="number"
                value={form.initialMl}
                onChange={(e) => set("initialMl", e.target.value)}
                placeholder="100"
                required
                min="1"
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm"
              />
            </div>
          </div>

          {create.error && (
            <p className="text-sm text-destructive">Error al crear la botella. Intenta de nuevo.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-secondary transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all disabled:opacity-60"
            >
              {create.isPending ? "Guardando..." : "Registrar botella"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BottlesPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: bottles = [], isLoading } = useBottles();

  const lowStock = bottles.filter(
    (b) => b.status === "low_stock" || b.calculatedRemainingMl < 20
  ).length;

  return (
    <>
      <CreateBottleModal open={showModal} onClose={() => setShowModal(false)} />

      <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Botellas</h1>
            <p className="text-muted-foreground">Control individual de inventario</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva botella
          </button>
        </div>

        {lowStock > 0 && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-accent/10 border border-accent/20">
            <AlertCircle className="w-5 h-5 text-accent shrink-0" />
            <p className="text-sm font-medium">
              {lowStock} {lowStock === 1 ? "botella tiene" : "botellas tienen"} stock bajo
            </p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse h-24" />
            ))}
          </div>
        )}

        {!isLoading && bottles.length === 0 && (
          <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
            <Droplet className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-1">No hay botellas registradas</p>
            <p className="text-sm text-muted-foreground">Registra tu primera compra</p>
          </div>
        )}

        {!isLoading && bottles.length > 0 && (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Perfume</th>
                  <th className="text-left p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
                  <th className="text-right p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Calculado</th>
                  <th className="text-right p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Real</th>
                  <th className="text-right p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Diferencia</th>
                  <th className="text-right p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Costo</th>
                  <th className="p-5" />
                </tr>
              </thead>
              <tbody>
                {bottles.map((b) => {
                  const diff = b.realRemainingMl - b.calculatedRemainingMl;
                  const status = b.status as BottleStatus;
                  const perfume = (b as any).perfume;
                  return (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors last:border-0">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Droplet className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{perfume?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{perfume?.brand ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium", statusStyles[status])}>
                          {statusLabels[status]}
                        </span>
                      </td>
                      <td className="p-5 text-right font-medium text-sm">{b.calculatedRemainingMl}ml</td>
                      <td className="p-5 text-right font-medium text-sm">{b.realRemainingMl}ml</td>
                      <td className="p-5 text-right text-sm">
                        <span className={cn(
                          "font-medium",
                          diff < 0 ? "text-destructive" : diff > 0 ? "text-chart-1" : "text-muted-foreground"
                        )}>
                          {diff > 0 ? "+" : ""}{diff}ml
                        </span>
                      </td>
                      <td className="p-5 text-right text-sm font-medium">
                        ${(b.purchasePrice / 100).toFixed(0)}
                      </td>
                      <td className="p-5">
                        <button className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-all whitespace-nowrap">
                          Auditoría
                        </button>
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
