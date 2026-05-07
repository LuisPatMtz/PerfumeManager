"use client";

import { useState } from "react";
import { Droplet } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@perfume.co");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-lg">
            <Droplet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-semibold mb-3 tracking-tight">
            Perfume Manager
          </h1>
          <p className="text-muted-foreground">Sistema privado de gestión premium</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl p-8 shadow-xl border border-border/50"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@perfume.co"
                required
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              />
            </div>

            {login.error && (
              <p className="text-sm text-destructive text-center">
                Correo o contraseña incorrectos
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {login.isPending ? "Ingresando..." : "Ingresar al sistema"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Acceso exclusivo · Sistema privado
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
