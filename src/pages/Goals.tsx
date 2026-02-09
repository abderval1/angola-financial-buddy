import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Target, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";

// Components
import { FireStrategyPanel } from "@/components/goals/FireStrategyPanel";
import { VirtualCoach } from "@/components/goals/VirtualCoach";
import { EducationalContext } from "@/components/goals/EducationalContext";

// Types derived from other pages
interface Investment {
  amount: number;
  current_value: number | null;
  type: string;
}

interface SavingsGoal {
  saved_amount: number | null;
  target_amount: number;
  name: string;
  icon?: string;
}

export default function Goals() {
  const { user } = useAuth();

  // 1. Fetch Investments (Read Only)
  const { data: investments = [] } = useQuery({
    queryKey: ["investments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("amount, current_value, type")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data as Investment[];
    },
    enabled: !!user,
  });

  // 2. Fetch Savings Goals (Active Goals)
  const { data: savingsGoals = [] } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("name, saved_amount, target_amount, status, icon")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user,
  });

  // 3. Fetch Monthly Expenses (Dual Source: Actual History vs Planned Budget)
  const { data: expenseData = { value: 500000, source: 'default', hasAlerts: false } } = useQuery({
    queryKey: ["monthly-expenses-smart"],
    queryFn: async () => {
      // Source B: Planned Budget (Sum of Monthly Alerts)
      const { data: alertData } = await supabase
        .from("budget_alerts")
        .select("limit_amount")
        .eq("user_id", user?.id)
        .eq("period", "monthly")
        .eq("is_active", true);

      const hasAlerts = (alertData?.length || 0) > 0;

      // Source A: Manual Budget Override (User Settings) - HIGHEST PRIORITY
      const manualBudget = Number(user?.user_metadata?.monthly_budget || 0);
      if (manualBudget > 0) return { value: manualBudget, source: 'manual', hasAlerts };

      const budgetLimit = alertData?.reduce((acc, curr) => acc + Number(curr.limit_amount), 0) || 0;

      // Source C: Actual Spending (Last 30 Days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: txData } = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "expense")
        .eq("user_id", user?.id)
        .gte("date", thirtyDaysAgo.toISOString().split('T')[0]);

      const actualSpend = txData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      if (budgetLimit > 0 && actualSpend > 0) {
        return { value: Math.max(budgetLimit, actualSpend), source: budgetLimit > actualSpend ? 'budget' : 'history', hasAlerts };
      } else if (budgetLimit > 0) {
        return { value: budgetLimit, source: 'budget', hasAlerts };
      } else if (actualSpend > 0) {
        return { value: actualSpend, source: 'history', hasAlerts };
      }

      return { value: 500000, source: 'default', hasAlerts };
    },
    enabled: !!user
  });

  const monthlyExpenses = expenseData.value;

  // 4. Fetch Monthly Income (Rolling 30 days)
  const { data: monthlyIncome = 0 } = useQuery({
    queryKey: ["monthly-income"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "income")
        .eq("user_id", user?.id)
        .gte("date", thirtyDaysAgo.toISOString().split('T')[0]);

      if (error) throw error;
      return data.reduce((acc, curr) => acc + Number(curr.amount), 0);
    },
    enabled: !!user
  });

  // 5. Aggregate Data for Strategy
  const strategyData = useMemo(() => {
    const totalInvestments = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);
    const totalSavings = savingsGoals.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0);
    const totalNetWorth = totalInvestments + totalSavings;

    const dist: Record<string, number> = {};
    dist['poupanca'] = totalSavings;
    investments.forEach(inv => {
      dist[inv.type] = (dist[inv.type] || 0) + (inv.current_value || inv.amount);
    });

    const emergencyFund = savingsGoals
      .filter(g => {
        const isShieldIcon = g.icon === '🛡️';
        const normalizedName = (g.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isEmergencyName = normalizedName.includes("emerg") || normalizedName.includes("reserva") || normalizedName.includes("seguranca") || normalizedName.includes("fundo");
        return (isEmergencyName || isShieldIcon) && (g.saved_amount || 0) > 0;
      })
      .reduce((sum, g) => sum + (g.saved_amount || 0), 0);

    return { totalNetWorth, totalInvestments, totalSavings, dist, emergencyFund };
  }, [investments, savingsGoals]);

  return (
    <AppLayout title="Estratégia & FIRE 🔥" subtitle="Painel de Inteligência Financeira">
      <ModuleGuard
        moduleKey="metas_fire"
        title="Módulo Metas & FIRE"
        description="Desbloqueie o simulador de independência financeira (FIRE), gestão de metas avançada e recomendações personalizadas."
      >
        <div className="space-y-6 animate-fade-in">
          {/* Top Section: Coach & Strategy Overview */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <VirtualCoach
                totalNetWorth={strategyData.totalNetWorth}
                emergencyFundTotal={strategyData.emergencyFund}
                monthlyExpenses={monthlyExpenses}
                investmentDistribution={strategyData.dist}
                expenseSource={expenseData.source as any}
                hasBudgetAlerts={expenseData.hasAlerts}
              />
              <div className="mt-4 space-y-4">
                <EducationalContext topic="inflation" />
                <EducationalContext topic="fire" />
              </div>
            </div>

            <div className="lg:col-span-2">
              <FireStrategyPanel
                totalNetWorth={strategyData.totalNetWorth}
                currentMonthlySavings={Math.max(0, monthlyIncome - monthlyExpenses)}
                monthlyExpenses={monthlyExpenses}
              />
            </div>
          </div>

          {/* Bottom Section: Active Goals Monitor */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Monitor de Metas Ativas
              </h3>
              <Link to="/savings">
                <Button variant="ghost" size="sm">
                  Gerir Metas na Poupança <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {savingsGoals.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  Nenhuma meta ativa encontrada no menu Poupança.
                </div>
              ) : (
                savingsGoals.map((goal, idx) => {
                  const progress = Math.min(((goal.saved_amount || 0) / goal.target_amount) * 100, 100);
                  return (
                    <div key={idx} className="bg-card border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold truncate pr-2">{goal.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {(goal.saved_amount || 0).toLocaleString('pt-AO')} Kz
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{progress.toFixed(0)}%</span>
                          <span>Meta: {goal.target_amount.toLocaleString('pt-AO')}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </ModuleGuard>
    </AppLayout>
  );
}
