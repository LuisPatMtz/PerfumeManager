"use client";

import { useState } from "react";
import { Search, Plus, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";

function CreateCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateCustomer();
  const [form, setForm] = useState({ name: "", phone: "", instagram: "", notes: "" });

  if (!open) return null;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      name: form.name,
      phone: form.phone || undefined,
      instagram: form.instagram || undefined,
      notes: form.notes || undefined,
    });
    setForm({ name: "", phone: "", instagram: "", notes: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl border border-border/50 mx-4">
        <h2 className="text-2xl font-semibold mb-2">Nuevo cliente</h2>
        <p className="text-sm text-muted-foreground mb-8">Registrar cliente</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Nombre completo"
              className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Teléfono</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+52..."
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@usuario"
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notas</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Observaciones..."
              className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-secondary transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={create.isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {create.isPending ? "Guardando..." : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { data: customers = [], isLoading } = useCustomers(search || undefined);

  const totalDebt = customers.reduce((acc, c) => acc + (c.totalDebt ?? 0), 0);

  return (
    <>
      <CreateCustomerModal open={showModal} onClose={() => setShowModal(false)} />
      <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Clientes</h1>
            <p className="text-muted-foreground">Gestión y seguimiento</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-all text-sm">
            <Plus className="w-4 h-4" />Nuevo cliente
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total clientes", value: customers.length.toString() },
            { label: "Clientes VIP", value: customers.filter((c) => c.isVip).length.toString() },
            { label: "Deuda total", value: `$${(totalDebt / 100).toFixed(0)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
              <p className="text-sm text-muted-foreground mb-2">{label}</p>
              <p className="text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nombre, teléfono o Instagram..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm" />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse h-20" />
            ))}
          </div>
        )}

        {!isLoading && customers.length === 0 && (
          <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-1">No hay clientes</p>
            <p className="text-sm text-muted-foreground">{search ? "Intenta con otra búsqueda" : "Registra tu primer cliente"}</p>
          </div>
        )}

        {!isLoading && customers.length > 0 && (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  {["Cliente", "Teléfono", "Instagram", "Compras", "Deuda", ""].map((h) => (
                    <th key={h} className="text-left p-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const debt = (c as any).credits?.reduce((acc: number, cr: any) => acc + cr.pending, 0) ?? 0;
                  const salesCount = (c as any)._count?.sales ?? 0;
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors last:border-0">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent-foreground">
                            {c.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{c.name}</p>
                              {c.isVip && <Crown className="w-3.5 h-3.5 text-accent" />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-muted-foreground">{c.phone ?? "—"}</td>
                      <td className="p-5 text-sm text-muted-foreground">{c.instagram ?? "—"}</td>
                      <td className="p-5 text-sm font-medium">{salesCount}</td>
                      <td className="p-5">
                        {debt > 0
                          ? <span className="text-sm font-medium text-destructive">${(debt / 100).toFixed(0)}</span>
                          : <span className="text-sm text-muted-foreground">—</span>}
                      </td>
                      <td className="p-5">
                        <button className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-all">
                          Ver historial
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
