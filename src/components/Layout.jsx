import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Calendar,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Users,
  X,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Painel", icon: LayoutDashboard },
  { path: "/escala", label: "Escala", icon: Calendar },
  { path: "/colaboradores", label: "Colaboradores", icon: Users },
  { path: "/comandos", label: "Comandos IA", icon: MessageSquare },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border p-6">
          <h1 className="font-heading text-xl font-bold tracking-tight text-white">
            EscalaPro
          </h1>
          <p className="mt-1 text-xs text-sidebar-foreground/60">
            Gestao de escalas inteligente
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
                to={item.path}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="text-center text-xs text-sidebar-foreground/40">
            Drogaria Cristal © 2025
          </div>
        </div>
      </aside>

      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-sidebar px-4 py-3 text-white lg:hidden">
        <h1 className="font-heading text-lg font-bold">EscalaPro</h1>
        <button className="p-2" onClick={() => setMobileOpen((open) => !open)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="h-full w-64 bg-sidebar p-4 pt-16 text-sidebar-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-sidebar-primary text-white"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                    }`}
                    onClick={() => setMobileOpen(false)}
                    to={item.path}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}

      <main className="flex-1 overflow-auto p-4 pt-16 lg:p-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
