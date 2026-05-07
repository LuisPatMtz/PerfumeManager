"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerfumes } from "@/hooks/usePerfumes";
import { useBottles } from "@/hooks/useBottles";
import { useCustomers } from "@/hooks/useCustomers";
import { useSales, useCreateSale } from "@/hooks/useSales";

const ML_OPTIONS = [3, 5, 10, 15, 20, 30];
const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
  { value: "credit", label: "A crédito" },
] as const;

interface CartItem {
  id: string;
  bottleId: string;
  perfumeId: string;
  perfumeName: string;
  ml: number;
  price: number; // centavos
  isGift: boolean;
}

export default function SalesPage() {
  const { data: perfumes = [] } = usePerfumes();
  const { data: bottles = [] } = useBottles();
  const { data: customers = [] } = useCustomers();
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const createSale = useCreateSale();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPerfumeId, setSelectedPerfumeId] = useState("");
  const [selectedBottleId, setSelectedBottleId] = useState("");
  const [selectedMl, setSelectedMl] = useState(10);
  const [customMl, setCustomMl] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "transfer" | "card" | "credit">("cash");
  const [success, setSuccess] = useState(false);

  const activePerfume = perfumes.find((p) => p.id === selectedPerfumeId);
  const perfumeBottles = bottles.filter(
    (b) => b.perfumeId === selectedPerfumeId && b.calculatedRemainingMl > 0 && b.status !== "empty" && b.status !== "archived"
  );
  const selectedBottle = perfumeBottles.find((b) => b.id === selectedBottleId);

  const ml = customMl ? parseInt(customMl) : selectedMl;
  const priceForMl = useMemo(() => {
    if (!activePerfume || isGift) return 0;
    const exact = activePerfume.prices?.find((p: any) => p.ml === ml);
    if (exact) return exact.price;
    // Interpolate
    const base = activePerfume.prices?.[0];
    if (!base) return 0;
    return Math.round((base.price / base.ml) * ml);
  }, [activePerfume, ml, isGift]);

  const addToCart = () => {
    if (!selectedPerfumeId || !selectedBottleId || ml <= 0) return;
    if (!selectedBottle || selectedBottle.calculatedRemainingMl < ml) return;
    setCart((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        bottleId: selectedBottleId,
        perfumeId: selectedPerfumeId,
        perfumeName: activePerfume?.name ?? "",
        ml,
        price: priceForMl,
        isGift,
      },
    ]);
    setSelectedPerfumeId("");
    setSelectedBottleId("");
    setCustomMl("");
    setIsGift(false);
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const total = cart.reduce((acc, i) => acc + (i.isGift ? 0 : i.price), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    await createSale.mutateAsync({
      customerId: customerId || undefined,
      paymentMethod,
      items: cart.map(({ bottleId, perfumeId, ml, isGift }) => ({
        bottleId, perfumeId, ml, isGift,
      })),
    });
    setCart([]);
    setCustomerId("");
    setPaymentMethod("cash");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="p-8 lg:p-12 max-w-[1800px] mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold mb-2">Nueva Venta</h1>
        <p className="text-muted-foreground">Punto de venta premium</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item builder */}
          <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm">
            <h3 className="font-semibold mb-6">Agregar producto</h3>
            <div className="space-y-5">
              {/* Perfume */}
              <div>
                <label className="block text-sm font-medium mb-2">Perfume</label>
                <select value={selectedPerfumeId} onChange={(e) => { setSelectedPerfumeId(e.target.value); setSelectedBottleId(""); }}
                  className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm">
                  <option value="">Seleccionar perfume...</option>
                  {perfumes.filter(p => p.status === "active").map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.brand}</option>
                  ))}
                </select>
              </div>

              {/* Bottle */}
              {selectedPerfumeId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Botella</label>
                  <select value={selectedBottleId} onChange={(e) => setSelectedBottleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm">
                    <option value="">Seleccionar botella...</option>
                    {perfumeBottles.map((b) => (
                      <option key={b.id} value={b.id}>{b.calculatedRemainingMl}ml disponibles — ${(b.purchasePrice / 100).toFixed(0)} costo</option>
                    ))}
                  </select>
                  {perfumeBottles.length === 0 && (
                    <p className="text-xs text-destructive mt-1">No hay botellas con stock disponible</p>
                  )}
                </div>
              )}

              {/* ML */}
              <div>
                <label className="block text-sm font-medium mb-2">Mililitros</label>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {ML_OPTIONS.map((m) => (
                    <button key={m} type="button" onClick={() => { setSelectedMl(m); setCustomMl(""); }}
                      className={cn("py-2 rounded-lg font-medium text-sm transition-all",
                        selectedMl === m && !customMl ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                      {m}ml
                    </button>
                  ))}
                </div>
                <input type="number" value={customMl} onChange={(e) => setCustomMl(e.target.value)}
                  placeholder="Cantidad personalizada..." min="1"
                  className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm" />
              </div>

              {/* Gift + Price */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="w-4 h-4 accent-accent" />
                  <span className="text-sm font-medium">Es regalo</span>
                </label>
                {selectedPerfumeId && !isGift && (
                  <p className="text-sm text-muted-foreground">
                    Precio: <span className="font-semibold text-accent">${(priceForMl / 100).toFixed(0)}</span>
                    {priceForMl === 0 && <span className="text-destructive ml-1">(sin precio definido)</span>}
                  </p>
                )}
              </div>

              <button onClick={addToCart}
                disabled={!selectedPerfumeId || !selectedBottleId || ml <= 0}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Agregar al carrito
              </button>
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm">
              <h3 className="font-semibold mb-4">Carrito ({cart.length})</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.perfumeName} — {item.ml}ml</p>
                      <p className="text-xs text-muted-foreground">{item.isGift ? "Regalo" : `$${(item.price / 100).toFixed(0)}`}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent sales */}
          <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm">
            <h3 className="font-semibold mb-4">Ventas recientes</h3>
            {salesLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}</div>
            ) : sales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay ventas registradas</p>
            ) : (
              <div className="space-y-3">
                {sales.slice(0, 8).map((s) => (
                  <div key={s.id} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{(s as any).customer?.name ?? "Sin cliente"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString("es-MX")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">${(s.total / 100).toFixed(0)}</p>
                      <span className={cn("text-xs", s.status === "paid" ? "text-chart-1" : "text-accent")}>
                        {s.status === "paid" ? "Pagado" : s.status === "credit" ? "Crédito" : "Parcial"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm sticky top-8">
            <h3 className="text-lg font-semibold mb-6">Resumen de venta</h3>

            {/* Client */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Cliente (opcional)</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all text-sm">
                <option value="">Sin cliente</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Payment */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Método de pago</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setPaymentMethod(value)}
                    className={cn("py-2.5 rounded-lg font-medium text-sm transition-all",
                      paymentMethod === value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-border mb-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Productos</span><span>{cart.length}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Regalos</span><span>{cart.filter((i) => i.isGift).length}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-semibold text-accent">${(total / 100).toFixed(0)}</span>
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-chart-1/10 text-chart-1 text-sm font-medium">
                <Check className="w-4 h-4" /> Venta registrada
              </div>
            )}

            {createSale.error && (
              <p className="text-sm text-destructive mb-4">
                {(createSale.error as any)?.response?.data?.error ?? "Error al procesar la venta"}
              </p>
            )}

            <button onClick={handleSubmit} disabled={cart.length === 0 || createSale.isPending}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-40 shadow-lg shadow-primary/20">
              {createSale.isPending ? "Procesando..." : "Procesar venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
