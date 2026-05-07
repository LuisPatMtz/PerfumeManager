"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  ShoppingCart,
  CreditCard,
  Package,
  Target,
  Users,
  Droplet,
  TrendingUp,
  Wallet,
  GitBranch,
  LogOut,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { useUnreadCount } from "@/hooks/useAlerts";

const navItems = [
  { href: "/dashboard",      label: "Dashboard",    icon: LayoutDashboard },
  { href: "/perfumes",       label: "Perfumes",     icon: Sparkles },
  { href: "/bottles",        label: "Botellas",     icon: Droplet },
  { href: "/sales",          label: "Ventas",       icon: ShoppingCart },
  { href: "/credits",        label: "Créditos",     icon: CreditCard },
  { href: "/customers",      label: "Clientes",     icon: Users },
  { href: "/supplies",       label: "Insumos",      icon: Package },
  { href: "/movements",      label: "Movimientos",  icon: GitBranch },
  { href: "/cash",           label: "Caja",         icon: Wallet },
  { href: "/profitability",  label: "Rentabilidad", icon: TrendingUp },
  { href: "/goals",          label: "Metas",        icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-8 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Droplet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Perfume Manager</h1>
            <p className="text-xs text-muted-foreground">Sistema Premium</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Alerts link with unread badge */}
        <Link
          href="/alerts"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
            pathname === "/alerts"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <Bell className="w-4.5 h-4.5 shrink-0" />
          <span className="flex-1">Alertas</span>
          {unreadCount > 0 && (
            <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent mb-2">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">
            {user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name ?? "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? "Sistema privado"}</p>
          </div>
        </div>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span>{logout.isPending ? "Cerrando..." : "Cerrar sesión"}</span>
        </button>
      </div>
    </aside>
  );
}
