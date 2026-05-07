"use client";

import { useState } from "react";
import { Search, Plus, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerfumes } from "@/hooks/usePerfumes";
import { CreatePerfumeModal } from "@/components/perfumes/CreatePerfumeModal";

const statusStyles = {
  active: "bg-chart-1/10 text-chart-1",
  out_of_stock: "bg-destructive/10 text-destructive",
  archived: "bg-muted text-muted-foreground",
};

const statusLabels = {
  active: "Activo",
  out_of_stock: "Sin stock",
  archived: "Archivado",
};

export default function PerfumesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const { data: perfumes = [], isLoading } = usePerfumes(search || undefined);

  const filtered = perfumes.filter((p) => {
    if (filter === "low") {
      const totalMl = p.bottles.reduce((acc, b) => acc + b.calculatedRemainingMl, 0);
      return totalMl < 20;
    }
    if (filter === "archived") return p.status === "archived";
    return p.status !== "archived";
  });

  return (
    <>
      <CreatePerfumeModal open={showModal} onClose={() => setShowModal(false)} />

      <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-semibold mb-2">Catálogo de Perfumes</h1>
          <p className="text-muted-foreground">Gestión completa del inventario</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "Todos" },
              { key: "low", label: "Stock bajo" },
              { key: "archived", label: "Archivados" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "px-5 py-3 rounded-lg font-medium transition-all text-sm",
                  filter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-secondary"
                )}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border/50 animate-pulse h-52" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="bg-card rounded-xl p-16 border border-border/50 text-center">
            <Droplet className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-1">No hay perfumes</p>
            <p className="text-sm text-muted-foreground">
              {search ? "Intenta con otra búsqueda" : "Agrega tu primer perfume"}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const totalMl = p.bottles.reduce((acc, b) => acc + b.calculatedRemainingMl, 0);
              const totalInitial = p.bottles.reduce((acc, b) => acc + b.calculatedRemainingMl + (b.realRemainingMl - b.calculatedRemainingMl), 0) || 1;
              const pct = Math.min(100, Math.round((totalMl / (totalInitial || 1)) * 100));
              const stockLevel = totalMl === 0 ? "empty" : totalMl < 20 ? "low" : "ok";

              return (
                <div
                  key={p.id}
                  className="bg-card rounded-xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-0.5 truncate">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.brand}</p>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-xs font-medium shrink-0 ml-2", statusStyles[p.status])}>
                      {statusLabels[p.status]}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Stock disponible</span>
                      <span className={cn("font-medium", stockLevel === "low" && "text-destructive", stockLevel === "empty" && "text-muted-foreground")}>
                        {totalMl}ml
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          stockLevel === "ok" && "bg-chart-1",
                          stockLevel === "low" && "bg-accent",
                          stockLevel === "empty" && "bg-muted-foreground"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Concentración</span>
                      <span className="font-medium">{p.concentration ?? "—"}</span>
                    </div>
                    {p.prices.length > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Precio base</span>
                        <span className="font-semibold text-accent">
                          ${(p.prices[0].price / 100).toFixed(0)}/{p.prices[0].ml}ml
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all text-sm">
                      Ver detalles
                    </button>
                    <button className="py-2.5 px-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all text-sm">
                      <Droplet className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
