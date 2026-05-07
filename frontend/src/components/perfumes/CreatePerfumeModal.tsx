"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useCreatePerfume } from "@/hooks/usePerfumes";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CONCENTRATIONS = ["EDP", "EDT", "EXP", "EDC", "PC"] as const;

export function CreatePerfumeModal({ open, onClose }: Props) {
  const create = useCreatePerfume();
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "",
    description: "",
    concentration: "" as string,
  });

  if (!open) return null;

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      name: form.name,
      brand: form.brand,
      category: form.category || undefined,
      description: form.description || undefined,
      concentration: form.concentration || undefined,
    });
    setForm({ name: "", brand: "", category: "", description: "", concentration: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-border/50 mx-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Nuevo perfume</h2>
            <p className="text-sm text-muted-foreground mt-1">Agregar al catálogo</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ej. Aventus"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Marca *</label>
              <input
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                placeholder="Ej. Creed"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Concentración</label>
              <select
                value={form.concentration}
                onChange={(e) => set("concentration", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm"
              >
                <option value="">Sin especificar</option>
                {CONCENTRATIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Ej. Oriental, Fresco..."
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Notas, características..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm resize-none"
            />
          </div>

          {create.error && (
            <p className="text-sm text-destructive">Error al crear el perfume. Intenta de nuevo.</p>
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
              {create.isPending ? "Guardando..." : "Crear perfume"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
