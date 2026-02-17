import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import { useReferralProcessor } from "@/hooks/useReferralProcessor";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { InvestmentRecommendations } from "@/components/dashboard/InvestmentRecommendations";
import { MonetizationWidget } from "@/components/dashboard/MonetizationWidget";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Layers } from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  Target,
  Flame,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Building,
  DollarSign,
  Newspaper,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt, es, fr, arSA, zhCN } from "date-fns/locale";


const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

export default function Dashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly' | 'all'>('monthly');

  // Check module access
  const { data: hasMetasFire } = useModuleAccess('metas_fire');
  const { data: hasEducation } = useModuleAccess('education');
  const { data: hasNews } = useModuleAccess('news');

  // Process pending referral code after login
  useReferralProcessor();
  // Fetch current month transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["dashboard-transactions"],
    queryFn: async () => {
      const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("transactions")
        .select("*, transaction_categories(name, icon, color)")
        .eq("user_id", user?.id)
        .gte("date", sixMonthsAgo)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch savings goals
  const { data: savingsGoals = [] } = useQuery({
    queryKey: ["dashboard-savings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch debts
  const { data: debts = [] } = useQuery({
    queryKey: ["dashboard-debts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", user?.id)
        .neq("status", "paid");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch investments
  const { data: investments = [] } = useQuery({
    queryKey: ["dashboard-investments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch FIRE goals
  const { data: fireGoals = [] } = useQuery({
    queryKey: ["dashboard-fire-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_fire_goal", true)
        .eq("status", "active")
        .limit(1);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch gamification
  const { data: gamification } = useQuery({
    queryKey: ["dashboard-gamification"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_gamification")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch extra income sources
  const { data: incomeSources = [] } = useQuery({
    queryKey: ["dashboard-income-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_sources")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate metrics
  const monthStr = format(currentDate, 'yyyy-MM');
  const yearStr = format(currentDate, 'yyyy');

  const filteredTransactions = transactions.filter(t => {
    if (viewMode === 'monthly') return t.date.startsWith(monthStr);
    if (viewMode === 'yearly') return t.date.startsWith(yearStr);
    return true; // Mode 'all'
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.saved_amount || 0), 0);
  const totalDebt = debts.reduce((sum, d) => sum + (d.current_amount || 0), 0);
  const totalInvestments = investments.reduce((sum, i) => sum + (i.current_value || i.amount), 0);
  const totalExtraIncomeBalance = incomeSources.reduce((sum, s) => sum + (s.monthly_revenue || 0), 0);
  const netWorth = totalSavings + totalInvestments + totalExtraIncomeBalance - totalDebt;

  // Chart data - last 6 months
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const targetMonthStr = format(date, "yyyy-MM");

    const monthTransactions = transactions.filter(t => {
      return t.date.startsWith(targetMonthStr);
    });

    const income = monthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    const getLocale = () => {
      switch (i18n.language) {
        case 'en': return undefined;
        case 'es': return es;
        case 'fr': return fr;
        case 'ar': return arSA;
        case 'zh': return zhCN;
        default: return pt;
      }
    };

    chartData.push({
      month: format(date, "MMM", { locale: getLocale() }),
      receitas: income,
      despesas: expense,
      saldo: income - expense,
    });
  }

  // Category breakdown for expenses
  const categoryData = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      // Handle potential array or object structure from Supabase join
      const cat = Array.isArray(t.transaction_categories)
        ? t.transaction_categories[0]
        : t.transaction_categories;

      const categoryName = cat?.name || t("Outros");
      if (!acc[categoryName]) acc[categoryName] = 0;
      acc[categoryName] += t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const fireGoal = fireGoals[0];
  const fireProgress = fireGoal ? ((fireGoal.current_amount || 0) / fireGoal.target_amount) * 100 : 0;

  return (
    <AppLayout title={t("Dashboard")} subtitle={t("Visão geral das suas finanças", "Visão geral das suas finanças")}>
      <ModuleGuard
        moduleKey="basic"
        title={t("Dashboard Financeiro", "Dashboard Financeiro")}
        description={t("Aceda ao seu panorama financeiro completo, incluindo gráficos de fluxo de caixa e património líquido.", "Aceda ao seu panorama financeiro completo, incluindo gráficos de fluxo de caixa e património líquido.")}
      >
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="monthly">{t("Mensal")}</TabsTrigger>
                <TabsTrigger value="yearly">{t("Anual")}</TabsTrigger>
                <TabsTrigger value="all">{t("Total")}</TabsTrigger>
              </TabsList>
            </Tabs>

            {viewMode !== 'all' && (
              <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-xl border-2 border-primary/10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (viewMode === 'monthly') setCurrentDate(prev => subMonths(prev, 1));
                    if (viewMode === 'yearly') setCurrentDate(prev => new Date(prev.setFullYear(prev.getFullYear() - 1)));
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center min-w-[120px]">
                  <h2 className="text-sm font-bold capitalize">
                    {viewMode === 'monthly'
                      ? format(currentDate, 'MMMM yyyy', { locale: i18n.language === 'en' ? undefined : i18n.language === 'es' ? es : i18n.language === 'fr' ? fr : i18n.language === 'ar' ? arSA : i18n.language === 'zh' ? zhCN : pt })
                      : format(currentDate, 'yyyy', { locale: i18n.language === 'en' ? undefined : i18n.language === 'es' ? es : i18n.language === 'fr' ? fr : i18n.language === 'ar' ? arSA : i18n.language === 'zh' ? zhCN : pt })
                    }
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (viewMode === 'monthly') setCurrentDate(prev => addMonths(prev, 1));
                    if (viewMode === 'yearly') setCurrentDate(prev => new Date(prev.setFullYear(prev.getFullYear() + 1)));
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2">
            <Card className="stat-card-income">
              <CardContent className="p-2 md:p-3">
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <p className="text-[10px] xs:text-xs text-muted-foreground mb-0.5">
                      {t("Receitas")} {viewMode === 'monthly' ? t("do Mês") : viewMode === 'yearly' ? t("do Ano") : t("Totais")}
                    </p>
                    <p className="text-xs sm:text-sm md:text-lg font-bold text-success break-all">{formatPrice(totalIncome)}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card-expense">
              <CardContent className="p-2 md:p-3">
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <p className="text-[10px] xs:text-xs text-muted-foreground mb-0.5">
                      {t("Despesas")} {viewMode === 'monthly' ? t("do Mês") : viewMode === 'yearly' ? t("do Ano") : t("Totais")}
                    </p>
                    <p className="text-xs sm:text-sm md:text-lg font-bold text-destructive break-all">{formatPrice(totalExpenses)}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={balance >= 0 ? "stat-card-savings" : "stat-card-expense"}>
              <CardContent className="p-2 md:p-3">
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <p className="text-[10px] xs:text-xs text-muted-foreground mb-0.5">
                      {t("Saldo")} {viewMode === 'monthly' ? t("do Mês") : viewMode === 'yearly' ? t("do Ano") : t("Total")}
                    </p>
                    <p className={`text-xs sm:text-sm md:text-lg font-bold break-all ${balance >= 0 ? "text-finance-savings" : "text-destructive"}`}>
                      {formatPrice(balance)}
                    </p>
                  </div>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${balance >= 0 ? "bg-finance-savings/20" : "bg-destructive/20"
                    }`}>
                    <Wallet className={`h-4 w-4 ${balance >= 0 ? "text-finance-savings" : "text-destructive"}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card-investment">
              <CardContent className="p-3">
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <p className="text-[10px] xs:text-xs text-muted-foreground mb-0.5">{t("Renda Extra & Negócios")}</p>
                    <p className="text-xs sm:text-sm md:text-lg font-bold text-finance-investment break-all">
                      {formatPrice(totalExtraIncomeBalance)}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-finance-investment/20 flex items-center justify-center">
                    <Building className="h-4 w-4 text-finance-investment" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card-investment">
              <CardContent className="p-3">
                <div className="flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <p className="text-[10px] xs:text-xs text-muted-foreground mb-0.5">{t("Patrimônio Líquido")}</p>
                    <p className={`text-xs sm:text-sm md:text-lg font-bold break-all ${netWorth >= 0 ? "text-finance-investment" : "text-destructive"}`}>
                      {formatPrice(netWorth)}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-finance-investment/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-finance-investment" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Access Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`border-2 transition-all ${hasMetasFire ? 'border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10' : 'border-muted bg-muted/20 opacity-75'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${hasMetasFire ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t("Metas & FIRE")}</p>
                    <p className="text-xs text-muted-foreground">{hasMetasFire ? t("Acesso Ativo") : t("Bloqueado")}</p>
                  </div>
                </div>
                {!hasMetasFire && (
                  <Link to="/plans">
                    <Button size="sm" variant="outline" className="h-8 text-xs">{t("Activar")}</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className={`border-2 transition-all ${hasEducation ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/20 opacity-75'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${hasEducation ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t("Educação & Calc")}</p>
                    <p className="text-xs text-muted-foreground">{hasEducation ? t("Acesso Ativo") : t("Bloqueado")}</p>
                  </div>
                </div>
                {!hasEducation && (
                  <Link to="/plans">
                    <Button size="sm" variant="outline" className="h-8 text-xs">{t("Activar")}</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className={`border-2 transition-all ${hasNews ? 'border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10' : 'border-muted bg-muted/20 opacity-75'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${hasNews ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Newspaper className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t("Notícias & Mercado")}</p>
                    <p className="text-xs text-muted-foreground">{hasNews ? t("Acesso Ativo") : t("Bloqueado")}</p>
                  </div>
                </div>
                {!hasNews && (
                  <Link to="/plans">
                    <Button size="sm" variant="outline" className="h-8 text-xs">{t("Activar")}</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FIRE Progress, Gamification & Monetization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monetization Widget */}
            <MonetizationWidget />
            {/* FIRE Progress */}
            <Card className={`border-2 transition-all ${hasMetasFire ? 'border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' : 'border-muted bg-muted/20 opacity-50 grayscale select-none'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${hasMetasFire ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-muted'}`}>
                      <Flame className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("Jornada FIRE")}</CardTitle>
                      <CardDescription>Financial Independence, Retire Early</CardDescription>
                    </div>
                  </div>
                  {hasMetasFire ? (
                    <Link to="/goals">
                      <Button variant="ghost" size="sm">
                        {t("Ver Detalhes")}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  ) : (
                    <Badge variant="outline" className="text-xs">PRO</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {hasMetasFire ? (
                  fireGoal ? (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("Progresso para FIRE")}</span>
                        <span className="font-medium">{fireProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={fireProgress} className="h-3" />
                      <div className="flex justify-between text-sm">
                        <span>{formatPrice(fireGoal.current_amount || 0)}</span>
                        <span className="font-medium text-amber-600">{formatPrice(fireGoal.target_amount)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-3">{t("Configure sua meta FIRE")}</p>
                      <Link to="/goals">
                        <Button size="sm" className="gradient-accent text-accent-foreground">
                          {t("Começar Agora")}
                        </Button>
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">{t("Desbloqueie o simulador FIRE e planeamento financeiro avançado.")}</p>
                    <Link to="/plans">
                      <Button size="sm" variant="outline">{t("Ver Planos")}</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gamification */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("Seu Progresso")}</CardTitle>
                      <CardDescription>{t("Nível")} {gamification?.current_level || 1} - {gamification?.level_name ? t(gamification.level_name) : t("Nível Iniciante")}</CardDescription>
                    </div>
                  </div>
                  <Link to="/community">
                    <Button variant="ghost" size="sm">
                      {t("Ver Ranking")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                    <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                    <p className="text-lg font-bold">{gamification?.total_points || 0}</p>
                    <p className="text-xs text-muted-foreground">{t("Pontos")}</p>
                  </div>
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <Target className="h-5 w-5 mx-auto mb-1 text-success" />
                    <p className="text-lg font-bold">{gamification?.challenges_completed || 0}</p>
                    <p className="text-xs text-muted-foreground">{t("Desafios")}</p>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <Flame className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{gamification?.current_streak || 0}</p>
                    <p className="text-xs text-muted-foreground">{t("Dias Seguidos")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cash Flow Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">{t("Fluxo de Caixa")}</CardTitle>
                <CardDescription>{t("Últimos 6 meses")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip
                        formatter={(value: number) => formatPrice(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area type="monotone" dataKey="receitas" name={t("Receitas")} stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.2)" />
                      <Area type="monotone" dataKey="despesas" name={t("Despesas")} stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("Despesas por Categoria")}</CardTitle>
                <CardDescription>
                  {viewMode === 'monthly' ? t("Este mês") : viewMode === 'yearly' ? t("Este ano") : t("Todo o período")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex flex-col">
                  {pieData.length > 0 ? (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatPrice(value)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 space-y-2 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                        {pieData.slice(0, 6).map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-muted-foreground truncate max-w-[120px]">{item.name}</span>
                            </div>
                            <span className="font-medium">{formatPrice(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">{t("Sem despesas registradas")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Savings Goals */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-finance-savings" />
                    {t("Poupança")}
                  </CardTitle>
                  <Link to="/savings">
                    <Button variant="ghost" size="sm">{t("Ver")}</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-finance-savings mb-2 break-all">{formatPrice(totalSavings)}</p>
                <p className="text-sm text-muted-foreground">{savingsGoals.length} {t("metas ativas")}</p>
              </CardContent>
            </Card>

            {/* Debts */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-destructive" />
                    {t("Dívidas")}
                  </CardTitle>
                  <Link to="/debts">
                    <Button variant="ghost" size="sm">{t("Ver")}</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-destructive mb-2 break-all">{formatPrice(totalDebt)}</p>
                <p className="text-sm text-muted-foreground">{debts.length} {t("dívidas pendentes")}</p>
              </CardContent>
            </Card>

            {/* Investments */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-finance-investment" />
                    {t("Investimentos")}
                  </CardTitle>
                  <Link to="/investments">
                    <Button variant="ghost" size="sm">{t("Ver")}</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-finance-investment mb-2 break-all">{formatPrice(totalInvestments)}</p>
                <p className="text-sm text-muted-foreground">{investments.length} {t("ativos")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Investment Recommendations & Subscription */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={hasEducation ? "" : "opacity-50 grayscale pointer-events-none select-none"}>
              <InvestmentRecommendations />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("Sua Assinatura")}</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionStatus />
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("Transações Recentes")}</CardTitle>
                <Link to="/budget">
                  <Button variant="ghost" size="sm">
                    {t("Ver Todas")}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${transaction.type === "income" ? "bg-success/20" : "bg-destructive/20"
                          }`}>
                          {transaction.type === "income" ? (
                            <ArrowUpRight className="h-5 w-5 text-success" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description || transaction.transaction_categories?.name || t("Transação")}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.date), "dd MMM", { locale: i18n.language === 'en' ? undefined : i18n.language === 'es' ? es : i18n.language === 'fr' ? fr : i18n.language === 'ar' ? arSA : i18n.language === 'zh' ? zhCN : pt })}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-destructive"
                        }`}>
                        {transaction.type === "income" ? "+" : "-"}{formatPrice(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("Nenhuma transação registrada")}</p>
                  <Link to="/budget">
                    <Button variant="link" className="mt-2">{t("Adicionar transação")}</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ModuleGuard>
    </AppLayout>
  );
}
