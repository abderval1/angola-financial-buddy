import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Target,
  GraduationCap,
  Briefcase,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ShoppingBag,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orçamento", href: "/budget", icon: Wallet },
  { name: "Poupança", href: "/savings", icon: PiggyBank },
  { name: "Dívidas", href: "/debts", icon: CreditCard },
  { name: "Investimentos", href: "/investments", icon: TrendingUp },
  { name: "Metas & FIRE", href: "/goals", icon: Target, badge: "FIRE" },
  { name: "Educação", href: "/education", icon: GraduationCap },
  { name: "Renda Extra", href: "/income", icon: Briefcase },
  { name: "Análises", href: "/reports", icon: BarChart3 },
  { name: "Comunidade", href: "/community", icon: Users },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: userRole } = useQuery({
    queryKey: ["user-role-mobile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .maybeSingle();
      
      if (error) return null;
      return data?.role;
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRole === "admin";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate("/");
    setOpen(false);
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    const name = user.user_metadata?.name || user.email;
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    return user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-sidebar border-sidebar-border">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                <span className="font-display text-xl font-bold text-sidebar-primary-foreground">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold text-sidebar-foreground">
                  Kuanza
                </span>
                <span className="text-xs text-sidebar-foreground/60">Finanças Inteligentes</span>
              </div>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-primary/10 text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive ? "text-sidebar-primary" : "group-hover:text-sidebar-foreground"
                    )}
                  />
                  <span className={cn("font-medium flex-1", isActive && "text-sidebar-primary")}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                  location.pathname === "/admin"
                    ? "bg-sidebar-primary/10 text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Shield className="h-5 w-5 shrink-0" />
                <span className="font-medium">Admin</span>
              </Link>
            )}

            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                location.pathname === "/settings"
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span className="font-medium">Configurações</span>
            </Link>
            
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="font-medium">Sair</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-accent flex items-center justify-center">
                <span className="font-display font-semibold text-sidebar-primary-foreground">{getUserInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {getUserName()}
                </p>
                <div className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-amber-500" />
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {isAdmin ? "Administrador" : "Nível Iniciante"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
