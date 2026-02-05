import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReferralProcessor } from "@/hooks/useReferralProcessor";
import { AppLayout } from "@/components/layout/AppLayout";
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
  ChevronRight,
  Star,
  Building,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

export default function Dashboard() {
  const { user } = useAuth();
  
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

  // Calculate metrics
  const currentMonth = new Date();
  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);
  
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= currentMonthStart && date <= currentMonthEnd;
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.saved_amount || 0), 0);
  const totalDebt = debts.reduce((sum, d) => sum + (d.current_amount || 0), 0);
  const totalInvestments = investments.reduce((sum, i) => sum + (i.current_value || i.amount), 0);
  const netWorth = totalSavings + totalInvestments - totalDebt;

  // Chart data - last 6 months
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });
    
    const income = monthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    
    chartData.push({
      month: format(date, "MMM", { locale: pt }),
      receitas: income,
      despesas: expense,
      saldo: income - expense,
    });
  }

  // Category breakdown for expenses
  const categoryData = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      const categoryName = t.transaction_categories?.name || "Outros";
      if (!acc[categoryName]) acc[categoryName] = 0;
      acc[categoryName] += t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData).slice(0, 5).map(([name, value]) => ({ name, value }));

  const fireGoal = fireGoals[0];
  const fireProgress = fireGoal ? ((fireGoal.current_amount || 0) / fireGoal.target_amount) * 100 : 0;

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral das suas finanças">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card-income">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Receitas do Mês</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-expense">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Despesas do Mês</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={balance >= 0 ? "stat-card-savings" : "stat-card-expense"}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo do Mês</p>
                  <p className={`text-2xl font-bold ${balance >= 0 ? "text-finance-savings" : "text-destructive"}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  balance >= 0 ? "bg-finance-savings/20" : "bg-destructive/20"
                }`}>
                  <Wallet className={`h-6 w-6 ${balance >= 0 ? "text-finance-savings" : "text-destructive"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-investment">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patrimônio Líquido</p>
                  <p className={`text-2xl font-bold ${netWorth >= 0 ? "text-finance-investment" : "text-destructive"}`}>
                    {formatCurrency(netWorth)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-finance-investment/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-finance-investment" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FIRE Progress, Gamification & Monetization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monetization Widget */}
          <MonetizationWidget />
          {/* FIRE Progress */}
          <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Jornada FIRE</CardTitle>
                    <CardDescription>Financial Independence, Retire Early</CardDescription>
                  </div>
                </div>
                <Link to="/goals">
                  <Button variant="ghost" size="sm">
                    Ver Detalhes
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {fireGoal ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso para FIRE</span>
                    <span className="font-medium">{fireProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={fireProgress} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span>{formatCurrency(fireGoal.current_amount || 0)}</span>
                    <span className="font-medium text-amber-600">{formatCurrency(fireGoal.target_amount)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">Configure sua meta FIRE</p>
                  <Link to="/goals">
                    <Button size="sm" className="gradient-accent text-accent-foreground">
                      Começar Agora
                    </Button>
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
                    <CardTitle className="text-lg">Seu Progresso</CardTitle>
                    <CardDescription>Nível {gamification?.current_level || 1} - {gamification?.level_name || "Iniciante"}</CardDescription>
                  </div>
                </div>
                <Link to="/community">
                  <Button variant="ghost" size="sm">
                    Ver Ranking
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
                  <p className="text-xs text-muted-foreground">Pontos</p>
                </div>
                <div className="text-center p-3 bg-success/10 rounded-lg">
                  <Target className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-lg font-bold">{gamification?.challenges_completed || 0}</p>
                  <p className="text-xs text-muted-foreground">Desafios</p>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{gamification?.current_streak || 0}</p>
                  <p className="text-xs text-muted-foreground">Dias Seguidos</p>
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
              <CardTitle className="text-lg">Fluxo de Caixa</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.2)" />
                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
              <CardDescription>Este mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">Sem despesas registradas</p>
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
                  Poupança
                </CardTitle>
                <Link to="/savings">
                  <Button variant="ghost" size="sm">Ver</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-finance-savings mb-2">{formatCurrency(totalSavings)}</p>
              <p className="text-sm text-muted-foreground">{savingsGoals.length} metas ativas</p>
            </CardContent>
          </Card>

          {/* Debts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-destructive" />
                  Dívidas
                </CardTitle>
                <Link to="/debts">
                  <Button variant="ghost" size="sm">Ver</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive mb-2">{formatCurrency(totalDebt)}</p>
              <p className="text-sm text-muted-foreground">{debts.length} dívidas pendentes</p>
            </CardContent>
          </Card>

          {/* Investments */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-finance-investment" />
                  Investimentos
                </CardTitle>
                <Link to="/investments">
                  <Button variant="ghost" size="sm">Ver</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-finance-investment mb-2">{formatCurrency(totalInvestments)}</p>
              <p className="text-sm text-muted-foreground">{investments.length} ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Investment Recommendations & Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvestmentRecommendations />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sua Assinatura</CardTitle>
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
              <CardTitle className="text-lg">Transações Recentes</CardTitle>
              <Link to="/budget">
                <Button variant="ghost" size="sm">
                  Ver Todas
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
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === "income" ? "bg-success/20" : "bg-destructive/20"
                      }`}>
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description || transaction.transaction_categories?.name || "Transação"}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.date), "dd MMM", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      transaction.type === "income" ? "text-success" : "text-destructive"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma transação registrada</p>
                <Link to="/budget">
                  <Button variant="link" className="mt-2">Adicionar transação</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
