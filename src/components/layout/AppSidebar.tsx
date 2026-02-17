import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  ChevronLeft,
  ChevronRight,
  Flame,
  Shield,
  ShoppingBag,
  Newspaper,
  Calculator,
  Tags,
  Coins,
  Trophy,
  BookText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";


export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  const navigation = [
    { name: t("Dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("Orçamento", "Orçamento"), href: "/budget", icon: Wallet },
    { name: t("Poupança", "Poupança"), href: "/savings", icon: PiggyBank },
    { name: t("Dívidas", "Dívidas"), href: "/debts", icon: CreditCard },
    { name: t("Investimentos", "Investimentos"), href: "/investments", icon: TrendingUp },
    { name: t("Metas & FIRE", "Metas & FIRE"), href: "/goals", icon: Target, badge: "FIRE" },
    { name: t("Educação", "Educação"), href: "/education", icon: GraduationCap },
    { name: t("Renda Extra", "Renda Extra"), href: "/income", icon: Briefcase },
    { name: t("Calculadoras", "Calculadoras"), href: "/calculators", icon: Calculator },
    { name: t("Comparar Preços", "Comparar Preços"), href: "/prices", icon: Tags },
    { name: t("Monetização", "Monetização"), href: "/monetization", icon: Coins, badge: t("NOVO", "NOVO") },
    { name: t("Análises", "Análises"), href: "/reports", icon: BarChart3 },
    { name: t("Conquistas", "Conquistas"), href: "/achievements", icon: Trophy },
    { name: t("Notícias", "Notícias"), href: "/news", icon: Newspaper },
    { name: t("Comunidade", "Comunidade"), href: "/community", icon: Users },
    { name: t("Marketplace"), href: "/marketplace", icon: ShoppingBag },
    { name: t("Blog"), href: "/blog", icon: BookText },
  ];

  const bottomNavigation = [
    { name: t("Settings"), href: "/settings", icon: Settings },
  ];

  // Check if user is admin
  const { data: userRole } = useQuery({
    queryKey: ["user-role-sidebar", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        console.error("Sidebar role check error:", error);
        return null;
      }
      console.log("Sidebar role check result:", data);
      return data?.role;
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRole === "admin";

  // Get current plan name
  const { data: currentPlan } = useQuery({
    queryKey: ["user-current-plan", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("status, is_trial, subscription_plans(name)")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      // @ts-ignore
      const rawData = data as any;
      const plan: any = Array.isArray(rawData.subscription_plans) ? rawData.subscription_plans[0] : rawData.subscription_plans;
      return {
        name: plan?.name || t("Geral"),
        isTrial: rawData.is_trial as boolean
      };
    },
    enabled: !!user?.id,
  });

  console.log("Is Admin?", isAdmin, "User Role:", userRole, "Plan:", currentPlan);

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("Sessão encerrada", "Sessão encerrada"));
    navigate("/");
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
    const fullName = user?.user_metadata?.name || user?.email?.split("@")[0] || t("Usuário");
    return fullName.split(" ")[0];
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden lg:block",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
              <span className="font-display text-xl font-bold text-sidebar-primary-foreground">A</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold">
                  <span className="text-sidebar-primary">Angola</span>
                  <span className="text-sidebar-foreground">Finance</span>
                </span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
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
                {!collapsed && (
                  <>
                    <span className={cn("font-medium flex-1", isActive && "text-sidebar-primary")}>
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
          {/* Admin Link - only show if user is admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/admin"
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Shield className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="font-medium">{t("Admin")}</span>}
            </Link>
          )}

          {bottomNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="font-medium">{t("Logout")}</span>}
          </button>
        </div>

        {/* User Profile */}
        {!collapsed && (
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
                    {isAdmin ? t("Administrador") : currentPlan ? `${currentPlan.name}${currentPlan.isTrial ? ` (${t("Teste")})` : ""}` : t("Plano Gratuito")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
