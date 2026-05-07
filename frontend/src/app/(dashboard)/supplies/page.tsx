"use client";

import { useState } from "react";
import { Plus, Package, AlertCircle, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSupplies,
  useSuppliesSummary,
  useSupplyRules,
  useCreateSupply,
  useAdjustStock,
  useSetSupplyRule,
} from "@/hooks/useSupplies";

const CATEGORIES = [
  { value: "bottles", label: "Botellas" },
  { value: "bags", label: "Bolsas" },
  { value: "stickers", label: "Stickers" },
  { value: "labels", label: "Etiquetas" },
  { value: "boxes", label: "Cajas" },
  { value: "ribbons", label: "Cintas" },
  { value: "paper", label: "Papel" },
  { value: "other", label: "Otro" },
] as const;

const ML_SIZES = [3, 5, 10, 15, 20, 30];

// ─── Modals ───────────────────────────────────────────────────────────────────

function CreateSupplyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateSupply();
  const [form, setForm] = useState({
    name: "", category: "bottles" as string,
    stock: "", minStock: "", unit: "unidad", costPerUnit: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      name: form.name,
      category: form.category,
      stock: form.stock ? parseInt(form.stock) : undefined,
      minStock: form.minStock ? parseInt(form.minStock) : undefined,
      unit: form.unit || undefined,
      costPerUnit: form.costPerUnit ? Math.round(parseFloat(form.costPerUnit) * 100) : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl border border-border/50 mx-4">
        <h2 className="text-2xl font-semibold mb-2">Nuevo insumo</h2>
        <p className="text-sm text-muted-foreground mb-8">Agregar al inventario</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
              placeholder="Ej. Atomizadores 10ml"
              className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Categoría *</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unidad</label>
              <input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="unidad"
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Stock inicial</label>
              <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} min="0" placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mínimo</label>
              <input type="number" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} min="0" placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Costo c/u</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input type="number" value={form.costPerUnit} onChange={(e) => set("costPerUnit", e.target.value)} min="0" step="0.01" placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all" />
              </div>
            </div>
          </div>
          {create.error && <p className="text-sm text-destructive">Error al crear el insumo</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-secondary transition-all">Cancelar</button>
            <button type="submit" disabled={create.isPending} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {create.isPending ? "Guardando..." : "Crear insumo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustModal({ supplyId, supplyName, onClose }: { supplyId: string; supplyName: string; onClose: () => void }) {
  const adjust = useAdjustStock();
  const [delta, setDelta] = useState("");
  const [isEntry, setIsEntry] = useState(true);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(delta);
    if (!amount) return;
    await adjust.mutateAsync({ id: supplyId, delta: isEntry ? amount : -amount, reason: reason || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-border/50 mx-4">
        <h2 className="text-2xl font-semibold mb-1">Ajustar stock</h2>
        <p className="text-sm text-muted-foreground mb-6">{supplyName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setIsEntry(true)}
              className={cn("py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all",
                isEntry ? "bg-chart-1/10 text-chart-1 border-2 border-chart-1/30" : "bg-secondary text-secondary-foreground")}>
              <ArrowUp className="w-4 h-4" /> Entrada
            </button>
            <button type="button" onClick={() => setIsEntry(false)}
              className={cn("py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all",
                !isEntry ? "bg-destructive/10 text-destructive border-2 border-destructive/30" : "bg-secondary text-secondary-foreground")}>
              <ArrowDown className="w-4 h-4" /> Salida
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cantidad *</label>
            <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} min="1" required placeholder="0"
              className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Motivo</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Compra, merma..."
              className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all" />
          </div>
          {adjust.error && <p className="text-sm text-destructive">{(adjust.error as any)?.response?.data?.error ?? "Error"}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-secondary transition-all">Cancelar</button>
            <button type="submit" disabled={adjust.isPending} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {adjust.isPending ? "Guardando..." : "Aplicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RulesPanel() {
  const { data: supplies = [] } = useSupplies();
  const { data: rules = [] } = useSupplyRules();
  const setRule = useSetSupplyRule();
  const [ml, setMl] = useState(10);
  const [supplyId, setSupplyId] = useState("");
  const [qty, setQty] = useState("1");

  const rulesForMl = rules.filter((r) => r.ml === ml);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyId) return;
    await setRule.mutateAsync({ ml, supplyId, quantity: parseInt(qty) });
    setSupplyId("");
    setQty("1");
  };

  return (
    <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-accent" />
        <div>
          <h3 className="font-semibold">Reglas de consumo automático</h3>
          <p className="text-sm text-muted-foreground">Insumos que se descuentan al registrar una venta</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {ML_SIZES.map((m) => (
          <button key={m} onClick={() => setMl(m)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
              ml === m ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
            {m}ml
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-6 min-h-[60px]">
        {rulesForMl.length === 0
          ? <p className="text-sm text-muted-foreground py-4 text-center">Sin reglas para {ml}ml</p>
          : rulesForMl.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
              <span className="text-sm font-medium">{r.supply.name}</span>
              <span className="text-sm text-muted-foreground">{r.quantity} {r.supply.unit}</span>
            </div>
          ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <select value={supplyId} onChange={(e) => setSupplyId(e.target.value)} required
          className="flex-1 px-3 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all">
          <option value="">Seleccionar insumo...</option>
          {supplies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" placeholder="Cant."
          className="w-20 px-3 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm transition-all" />
        <button type="submit" disabled={setRule.isPending}
          className="px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-all disabled:opacity-60">
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuppliesPage() {
  const { data: supplies = [], isLoading } = useSupplies();
  const { data: summary } = useSuppliesSummary();
  const [showModal, setShowModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <CreateSupplyModal open={showModal} onClose={() => setShowModal(false)} />
      {adjustTarget && (
        <AdjustModal supplyId={adjustTarget.id} supplyName={adjustTarget.name} onClose={() => setAdjustTarget(null)} />
      )}

      <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Control de Insumos</h1>
            <p className="text-muted-foreground">Inventario de materiales y reglas de consumo</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-all text-sm">
            <Plus className="w-4 h-4" />Nuevo insumo
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total insumos", value: String(summary?.total ?? 0) },
            { label: "Stock bajo", value: String(summary?.lowStock ?? 0), warn: (summary?.lowStock ?? 0) > 0 },
            { label: "Valor inventario", value: `$${((summary?.totalValue ?? 0) / 100).toFixed(0)}` },
          ].map(({ label, value, warn }) => (
            <div key={label} className={cn("bg-card rounded-xl p-6 border shadow-sm", warn ? "border-accent/30" : "border-border/50")}>
              {warn && <AlertCircle className="w-4 h-4 text-accent mb-2" />}
              <p className="text-sm text-muted-foreground mb-2">{label}</p>
              <p className={cn("text-3xl font-semibold", warn && "text-accent")}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Supplies grid */}
          <div className="lg:col-span-2">
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-6 border border-border/50 animate-pulse h-40" />
                ))}
              </div>
            )}

            {!isLoading && supplies.length === 0 && (
              <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-1">No hay insumos</p>
                <p className="text-sm text-muted-foreground">Agrega tu primer insumo</p>
              </div>
            )}

            {!isLoading && supplies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplies.map((s) => {
                  const isLow = s.stock <= s.minStock;
                  const pct = s.minStock > 0 ? Math.min(100, Math.round((s.stock / (s.minStock * 2)) * 100)) : 50;
                  const catLabel = CATEGORIES.find((c) => c.value === s.category)?.label ?? s.category;

                  return (
                    <div key={s.id} className={cn("bg-card rounded-xl p-6 border shadow-sm transition-all hover:shadow-md",
                      isLow ? "border-destructive/30" : "border-border/50")}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-0.5 truncate">{s.name}</h3>
                          <p className="text-xs text-muted-foreground">{catLabel}</p>
                        </div>
                        {isLow && <AlertCircle className="w-4 h-4 text-destructive shrink-0 ml-2" />}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Stock</span>
                          <span className={cn("font-medium", isLow && "text-destructive")}>
                            {s.stock} {s.unit}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", isLow ? "bg-destructive" : "bg-chart-1")}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Mínimo: {s.minStock}</span>
                          {s.costPerUnit > 0 && <span>${(s.costPerUnit / 100).toFixed(2)}/u</span>}
                        </div>
                      </div>

                      {s.consumeRules.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {s.consumeRules.map((r) => (
                            <span key={r.ml} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                              {r.ml}ml → {r.quantity}u
                            </span>
                          ))}
                        </div>
                      )}

                      <button onClick={() => setAdjustTarget({ id: s.id, name: s.name })}
                        className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-all">
                        Ajustar stock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rules panel */}
          <div>
            <RulesPanel />
          </div>
        </div>
      </div>
    </>
  );
}
