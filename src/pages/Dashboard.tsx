import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, TrendingDown, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  category_id: string | null;
}

interface SavingsGoal {
  id: string;
  saved_amount: number | null;
}

interface Debt {
  id: string;
  current_amount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Fetch current month transactions
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    // Fetch last 6 months transactions for chart
    const sixMonthsAgo = subMonths(currentMonth, 5);
    const { data: allTxData } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', format(startOfMonth(sixMonthsAgo), 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    // Fetch savings goals
    const { data: savingsData } = await supabase
      .from('savings_goals')
      .select('id, saved_amount');

    // Fetch debts
    const { data: debtsData } = await supabase
      .from('debts')
      .select('id, current_amount')
      .eq('status', 'pending');

    setTransactions(txData || []);
    setAllTransactions(allTxData || []);
    setSavingsGoals(savingsData || []);
    setDebts(debtsData || []);
    setLoading(false);
  };

  // Calculate stats
  const currentMonthIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = currentMonthIncome - currentMonthExpense;

  const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.saved_amount || 0), 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.current_amount, 0);

  // Calculate previous month for comparison
  const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
  const prevMonthEnd = endOfMonth(subMonths(new Date(), 1));

  const prevMonthTransactions = allTransactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= prevMonthStart && txDate <= prevMonthEnd;
  });

  const prevMonthExpense = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseChange = prevMonthExpense > 0 
    ? ((currentMonthExpense - prevMonthExpense) / prevMonthExpense * 100).toFixed(0)
    : 0;

  // Chart data - group by month
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthTx = allTransactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });

    return {
      month: format(month, 'MMM', { locale: pt }),
      receita: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      despesa: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  // Recent transactions
  const recentTransactions = transactions.slice(0, 5).map(tx => ({
    id: tx.id,
    name: tx.description || 'Sem descrição',
    category: tx.type === 'income' ? 'Receita' : 'Despesa',
    amount: tx.type === 'income' ? tx.amount : -tx.amount,
    type: tx.type,
    date: formatRelativeDate(tx.date),
  }));

  function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return format(date, 'dd/MM', { locale: pt });
  }

  const stats = [
    { 
      title: "Saldo do Mês", 
      value: `Kz ${balance.toLocaleString('pt-AO')}`, 
      change: balance >= 0 ? "+positivo" : "negativo",
      positive: balance >= 0, 
      icon: TrendingUp, 
      type: "income" as const
    },
    { 
      title: "Despesas do Mês", 
      value: `Kz ${currentMonthExpense.toLocaleString('pt-AO')}`, 
      change: `${Number(expenseChange) <= 0 ? '' : '+'}${expenseChange}%`,
      positive: Number(expenseChange) <= 0, 
      icon: TrendingDown, 
      type: "expense" as const
    },
    { 
      title: "Poupança Total", 
      value: `Kz ${totalSavings.toLocaleString('pt-AO')}`, 
      change: savingsGoals.length > 0 ? `${savingsGoals.length} metas` : "0 metas",
      positive: true, 
      icon: PiggyBank, 
      type: "savings" as const
    },
    { 
      title: "Dívidas", 
      value: `Kz ${totalDebts.toLocaleString('pt-AO')}`, 
      change: debts.length > 0 ? `${debts.length} ativas` : "0 dívidas",
      positive: totalDebts === 0, 
      icon: CreditCard, 
      type: "expense" as const
    },
  ];

  if (loading) {
    return (
      <AppLayout title="Dashboard" subtitle="Visão geral das suas finanças">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral das suas finanças">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`stat-card-${stat.type} p-6`}
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`h-6 w-6 ${stat.type === "income" || stat.type === "savings" ? "text-success" : "text-destructive"}`} />
                <span className={`text-sm font-medium flex items-center gap-1 ${stat.positive ? "text-success" : "text-destructive"}`}>
                  {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 card-finance">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Fluxo de Caixa</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="receita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="despesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => `Kz ${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(160 84% 39%)" fill="url(#receita)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesa" stroke="hsl(0 72% 51%)" fill="url(#despesa)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card-finance">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Últimas Transações</h3>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground">{tx.name}</p>
                      <p className="text-xs text-muted-foreground">{tx.category} • {tx.date}</p>
                    </div>
                    <span className={`font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : ""}{tx.amount.toLocaleString()} Kz
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma transação este mês</p>
                  <p className="text-sm mt-1">Vá ao Orçamento para adicionar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
