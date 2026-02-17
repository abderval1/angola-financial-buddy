import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, TrendingUp, TrendingDown, Trash2, Edit2, AlertTriangle,
  Briefcase, Car, Home, Heart, GraduationCap, Gamepad2, Shirt, FileText, UtensilsCrossed, Laptop,
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Layers, List, Table as TableIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO, subMonths, addMonths, startOfYear, endOfYear, addYears, subYears } from "date-fns";
import { pt, enUS, fr, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

const localeMap: Record<string, any> = {
  en: enUS,
  fr: fr,
  es: es,
  pt: pt,
};
import { useQueryClient } from "@tanstack/react-query";
import { useAchievements } from "@/hooks/useAchievements";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TransactionTable } from "@/components/budget/TransactionTable";
import { TransactionCalendar } from "@/components/budget/TransactionCalendar";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { MetricCard } from "@/components/budget/MetricCard";
import { BudgetSettings } from "@/components/budget/BudgetSettings";
import { Settings, Wallet, PiggyBank, Activity } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  is_default: boolean | null;
}

interface BudgetAlert {
  id: string;
  category_id: string;
  limit_amount: number;
  period: 'monthly' | 'yearly';
  is_active: boolean;
  category_name?: string;
  spent?: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase, Car, Home, Heart, GraduationCap, Gamepad2, Shirt, FileText, UtensilsCrossed, Laptop, TrendingUp, Plus
};

const COLOR_MAP: Record<string, string> = {
  emerald: "hsl(160 84% 39%)",
  blue: "hsl(200 90% 45%)",
  purple: "hsl(270 60% 55%)",
  orange: "hsl(25 95% 53%)",
  red: "hsl(0 72% 51%)",
  pink: "hsl(340 75% 55%)",
  yellow: "hsl(45 93% 47%)",
  gray: "hsl(220 10% 45%)",
};

export default function Budget() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const currentLocale = localeMap[i18n.language] || pt;
  const queryClient = useQueryClient();
  const { unlockAchievement } = useAchievements();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly' | 'all'>('monthly');
  const [viewType, setViewType] = useState<'list' | 'table' | 'calendar'>('calendar');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: 'FileText',
    color: 'emerald',
  });

  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [newAlert, setNewAlert] = useState({
    category_id: '',
    limit_amount: '',
    period: 'monthly' as 'monthly' | 'yearly',
  });

  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previousMonthTransactions, setPreviousMonthTransactions] = useState<Transaction[]>([]);
  const [budgetConfig, setBudgetConfig] = useState({
    savings_goal_pct: 20,
    needs_limit_pct: 50,
    wants_limit_pct: 30
  });
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem('budget_onboarding_completed');
      if (!hasCompletedOnboarding) {
        setShowOnboardingGuide(true);
      }
    }
  }, [user, currentDate, viewMode]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTransactions(),
      fetchPreviousMonthTransactions(),
      fetchCategories(),
      fetchAlerts(),
      fetchBudgetConfig()
    ]);
    setLoading(false);
  };

  const fetchBudgetConfig = async () => {
    const { data, error } = await supabase
      .from('financial_profiles')
      .select('budget_config')
      .eq('user_id', user?.id)
      .single();

    if (data?.budget_config) {
      setBudgetConfig(data.budget_config as any);
    }
  };

  const fetchPreviousMonthTransactions = async () => {
    let start, end;

    if (viewMode === 'monthly') {
      const prevMonth = subMonths(currentDate, 1);
      start = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
      end = format(endOfMonth(prevMonth), 'yyyy-MM-dd');
    } else if (viewMode === 'yearly') {
      const prevYear = subMonths(currentDate, 12); // or subYears(currentDate, 1)
      start = `${prevYear.getFullYear()}-01-01`;
      end = `${prevYear.getFullYear()}-12-31`;
    } else {
      setPreviousMonthTransactions([]);
      return;
    }

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', start)
      .lte('date', end);

    setPreviousMonthTransactions(data || []);
  };

  const fetchTransactions = async () => {
    let query = supabase.from('transactions').select('*');

    if (viewMode !== 'all') {
      const yearStart = `${currentDate.getFullYear()}-01-01`;
      const yearEnd = `${currentDate.getFullYear()}-12-31`;
      query = query.gte('date', yearStart).lte('date', yearEnd);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      toast.error(t("Erro ao carregar transações"));
      return;
    }

    setTransactions(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('transaction_categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error(t("Erro ao carregar categorias"));
      return;
    }

    setCategories(data || []);
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('is_active', true);

    if (!error && data) {
      setAlerts(data as BudgetAlert[]);
    }
  };

  const handleSaveTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      toast.error(t("Preencha todos os campos obrigatórios"));
      return;
    }

    const transactionData = {
      user_id: user?.id,
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      category_id: newTransaction.category_id || null,
      date: newTransaction.date,
    };

    let error;
    let data;

    if (editingTransactionId) {
      const { error: updateError, data: updateData } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', editingTransactionId)
        .select()
        .single();
      error = updateError;
      data = updateData;
    } else {
      const { error: insertError, data: insertData } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();
      error = insertError;
      data = insertData;
    }

    if (error) {
      toast.error(editingTransactionId ? t("Erro ao atualizar transação") : t("Erro ao adicionar transação"));
      return;
    }

    if (data) {
      setTransactions(prev => {
        let newTxList;
        if (editingTransactionId) {
          newTxList = prev.map(t => t.id === data.id ? data : t);
        } else {
          newTxList = [data, ...prev];
        }
        // Simple sort by date desc
        return newTxList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    }

    toast.success(editingTransactionId ? t("Transação atualizada!") : t("Transação adicionada com sucesso!"));
    setDialogOpen(false);
    resetForm();
    // We update state manually above, but we can still invalidate to be safe
    queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
    checkBudgetAlerts();
  };

  const resetForm = () => {
    setEditingTransactionId(null);
    setNewTransaction({
      type: 'expense',
      amount: '',
      description: '',
      category_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(t("Erro ao excluir transação"));
      return;
    }

    toast.success(t("Transação excluída"));
    setTransactions(prev => prev.filter(t => t.id !== id));
    queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
  };

  const addBudgetAlert = async () => {
    if (!newAlert.category_id || !newAlert.limit_amount) {
      toast.error(t("Preencha todos os campos"));
      return;
    }

    const { error } = await supabase
      .from('budget_alerts')
      .insert({
        user_id: user?.id,
        category_id: newAlert.category_id,
        limit_amount: parseFloat(newAlert.limit_amount),
        period: newAlert.period,
        is_active: true,
      });

    if (error) {
      toast.error(t("Erro ao criar alerta"));
      return;
    }

    toast.success(t("Alerta de orçamento criado!"));
    unlockAchievement('organized', 'Organizado', 2);
    setAlertDialogOpen(false);
    setNewAlert({ category_id: '', limit_amount: '', period: 'monthly' });
    fetchAlerts();
  };

  const deleteBudgetAlert = async (id: string) => {
    const { error } = await supabase
      .from('budget_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(t("Erro ao excluir alerta"));
      return;
    }

    toast.success(t("Alerta excluído"));
    fetchAlerts();
  };

  const completeOnboarding = () => {
    localStorage.setItem('budget_onboarding_completed', 'true');
    setShowOnboardingGuide(false);
    toast.success(t("Guia concluído! Boa sorte com as finanças!"));
  };

  const downloadBudget = async () => {
    try {
      toast.promise(
        async () => {
          // Fetch all data for the current view (or year if explicitly requested)
          // For now, let's export what's in the current view or all year
          let query = supabase.from('transactions').select(`
                    *,
                    transaction_categories (name)
                `);

          const yearStart = `${currentDate.getFullYear()}-01-01`;
          const yearEnd = `${currentDate.getFullYear()}-12-31`;

          // If user wants "current view", use viewMode filters. 
          // But user asked for "export excel todo orcamento organizado, selecionando o ano"
          // So let's default to the CURRENT selected year in the view.
          query = query.gte('date', yearStart).lte('date', yearEnd).order('date', { ascending: false });

          const { data: txs, error } = await query;
          if (error) throw error;

          // Prepare data for Excel
          const exportData = txs.map(t => ({
            Data: format(parseISO(t.date), 'dd/MM/yyyy'),
            Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
            Categoria: t.transaction_categories?.name || 'Sem Categoria',
            Descrição: t.description,
            Valor: t.amount,
          }));

          // Calculate summary
          const totalInc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const totalExp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const summaryData = [
            { Métrica: 'Total Receitas', Valor: totalInc },
            { Métrica: 'Total Despesas', Valor: totalExp },
            { Métrica: 'Saldo', Valor: totalInc - totalExp },
            { Métrica: 'Poupança (%)', Valor: `${totalInc > 0 ? ((totalInc - totalExp) / totalInc * 100).toFixed(1) : 0}%` }
          ];

          const wb = XLSX.utils.book_new();
          const wsTxs = XLSX.utils.json_to_sheet(exportData);
          const wsSummary = XLSX.utils.json_to_sheet(summaryData);

          XLSX.utils.book_append_sheet(wb, wsTxs, "Transações");
          XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
          saveAs(blob, `Orcamento_${currentDate.getFullYear()}.xlsx`);
        },
        {
          loading: 'Gerando Excel...',
          success: 'Download iniciado!',
          error: 'Erro ao exportar dados'
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const addCategory = async () => {
    if (!newCategory.name) {
      toast.error("Informe o nome da categoria");
      return;
    }

    const { data, error } = await supabase
      .from('transaction_categories')
      .insert({
        user_id: user?.id,
        name: newCategory.name,
        type: newCategory.type,
        icon: newCategory.icon,
        color: newCategory.color,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar categoria");
      return;
    }

    toast.success("Categoria criada com sucesso!");
    setCategories(prev => [...prev, data]);
    setNewTransaction(prev => ({ ...prev, category_id: data.id }));
    setShowNewCategoryForm(false);
    setNewCategory({ name: '', type: 'expense', icon: 'FileText', color: 'emerald' });
  };

  const checkBudgetAlerts = () => {
    const monthPrefix = format(new Date(), 'yyyy-MM');
    const yearPrefix = format(new Date(), 'yyyy');

    alerts.forEach(alert => {
      const category = categories.find(c => c.id === alert.category_id);
      if (!category) return;

      const spent = transactions
        .filter(t => {
          const isSameCategory = t.category_id === alert.category_id;
          const isExpense = t.type === 'expense';
          if (!isSameCategory || !isExpense) return false;

          if (alert.period === 'monthly') {
            return t.date.startsWith(monthPrefix);
          } else {
            return t.date.startsWith(yearPrefix);
          }
        })
        .reduce((sum, t) => sum + t.amount, 0);

      if (spent >= alert.limit_amount * 0.8) {
        const periodLabel = alert.period === 'monthly' ? 'mensal' : 'anual';
        toast.warning(`Atenção: Você já gastou ${((spent / alert.limit_amount) * 100).toFixed(0)}% do limite ${periodLabel} de ${category.name}`, {
          duration: 5000,
        });
      }
    });
  };

  const getCategoryInfo = (categoryId: string | null) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat || { name: 'Sem categoria', icon: 'FileText', color: 'gray' };
  };

  const monthPrefix = format(currentDate, 'yyyy-MM');
  const yearPrefix = format(currentDate, 'yyyy');

  const filteredTransactionsByMode = transactions.filter(t => {
    if (viewMode === 'monthly') return t.date.startsWith(monthPrefix);
    if (viewMode === 'yearly') return t.date.startsWith(yearPrefix);
    return true; // mode 'all'
  });

  const totalIncome = filteredTransactionsByMode.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactionsByMode.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = filteredTransactionsByMode
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const catInfo = getCategoryInfo(t.category_id);
      const existing = acc.find(item => item.name === catInfo.name);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({
          name: catInfo.name,
          value: t.amount,
          color: COLOR_MAP[catInfo.color] || COLOR_MAP.gray,
        });
      }
      return acc;
    }, [] as { name: string; value: number; color: string }[])
    .sort((a, b) => b.value - a.value);

  // Chart data for daily expenses (always show last 14 days from transactions)
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    return {
      date: format(date, 'dd/MM'),
      receita: dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      despesa: dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  }).slice(-14);

  const filteredCategories = categories.filter(c => c.type === newTransaction.type);

  if (loading) {
    return (
      <AppLayout title="Orçamento" subtitle="Gerencie suas receitas e despesas">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const prevIncome = viewMode === 'all' ? undefined : previousMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = viewMode === 'all' ? undefined : previousMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const prevBalance = (prevIncome !== undefined && prevExpense !== undefined) ? prevIncome - prevExpense : undefined;

  const trendLabel = viewMode === 'yearly' ? 'vs ano anterior' : 'vs mês anterior';

  // Financial Health Calculation
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const savingsScore = Math.min((savingsRate / budgetConfig.savings_goal_pct) * 4, 4); // Max 4 points
  const budgetAdherence = totalExpense > 0 ? 1 : 1; // Placeholder for now, simple logic
  const budgetScore = budgetAdherence * 3; // Max 3 points (simplified)
  const balanceScore = balance >= 0 ? 3 : 0; // Max 3 points
  const healthScore = Math.min(savingsScore + budgetScore + balanceScore, 10);

  return (
    <AppLayout title={t("Orçamento")} subtitle={t("Gerencie suas receitas e despesas")}>
      <ModuleGuard
        moduleKey="basic"
        title={t("Gestão de Orçamento")}
        description={t("Controle as suas finanças pessoais, registe despesas e receitas.")}
      >
        <div className="space-y-6 animate-fade-in">
          {/* Header & Settings */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="monthly">{t("Mensal")}</TabsTrigger>
                  <TabsTrigger value="yearly">{t("Anual")}</TabsTrigger>
                  <TabsTrigger value="all">{t("Total")}</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadBudget} className="hidden md:flex">
                <FileText className="h-4 w-4 mr-2" />
                {t("Exportar Excel")}
              </Button>
            </div>

            {viewMode !== 'all' && (
              <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-xl border-2 border-primary/10">
                <Button variant="ghost" size="icon" onClick={() => {
                  if (viewMode === 'monthly') setCurrentDate(prev => subMonths(prev, 1));
                  if (viewMode === 'yearly') setCurrentDate(prev => new Date(prev.setFullYear(prev.getFullYear() - 1)));
                }}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center min-w-[120px]">
                  <h2 className="text-sm font-bold capitalize">
                    {viewMode === 'monthly'
                      ? format(currentDate, 'MMMM yyyy', { locale: currentLocale })
                      : format(currentDate, 'yyyy', { locale: currentLocale })
                    }
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (viewMode === 'monthly') setCurrentDate(prev => addMonths(prev, 1));
                  if (viewMode === 'yearly') setCurrentDate(prev => new Date(prev.setFullYear(prev.getFullYear() + 1)));
                }}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Health Score Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{t("Saúde Financeira")}: {healthScore.toFixed(1)}/10</h3>
                <p className="text-sm text-muted-foreground">
                  {healthScore >= 8 ? t("Excelente! Continue assim.") : healthScore >= 5 ? t("Bom, mas pode melhorar.") : t("Atenção aos seus gastos!")}
                </p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{t("Taxa de Poupança")}</p>
              <p className={`text-2xl font-bold ${savingsRate >= budgetConfig.savings_goal_pct ? 'text-success' : 'text-warning'}`}>
                {savingsRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">{t("Meta")}: {budgetConfig.savings_goal_pct}%</p>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              title={t("Receitas")}
              value={totalIncome}
              previousValue={prevIncome}
              trendLabel={trendLabel}
              icon={TrendingUp}
              type="neutral"
              valueClassName="text-success"
              formatter={(v) => formatPrice(v)}
            />
            <MetricCard
              title={t("Despesas")}
              value={totalExpense}
              previousValue={prevExpense}
              trendLabel={trendLabel}
              icon={TrendingDown}
              type="reverse"
              valueClassName="text-destructive"
              formatter={(v) => formatPrice(v)}
            />
            <MetricCard
              title={t("Saldo")}
              value={balance}
              previousValue={prevBalance}
              trendLabel={trendLabel}
              icon={Wallet}
              type="neutral"
              valueClassName={balance >= 0 ? "text-success" : "text-destructive"}
              formatter={(v) => formatPrice(v)}
            />
          </div>


          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setCategoryManagerOpen(true)}>
              <Layers className="h-4 w-4 mr-2" />
              {t("Gerir Categorias")}
            </Button>

            <CategoryManager
              open={categoryManagerOpen}
              onOpenChange={setCategoryManagerOpen}
              categories={categories}
              onUpdate={() => {
                fetchCategories();
                queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
              }}
            />

            <BudgetSettings
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              onUpdate={fetchBudgetConfig}
              currentConfig={budgetConfig}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="accent">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Nova Transação")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingTransactionId ? t("Editar Transação") : t("Adicionar Transação")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                      className={`flex-1 ${newTransaction.type === 'income' ? 'bg-success hover:bg-success/90' : ''}`}
                      onClick={() => setNewTransaction({ ...newTransaction, type: 'income', category_id: '' })}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {t("Receita")}
                    </Button>
                    <Button
                      type="button"
                      variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                      className={`flex-1 ${newTransaction.type === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                      onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category_id: '' })}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      {t("Despesa")}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("Valor")} (Kz)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("Descrição")}</Label>
                    <Input
                      placeholder={t("Ex: Salário, Supermercado...")}
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>{t("Categoria")}</Label>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          setShowNewCategoryForm(!showNewCategoryForm);
                          setNewCategory(prev => ({ ...prev, type: newTransaction.type }));
                        }}
                      >
                        {showNewCategoryForm ? t("Selecionar Existente") : t("+ Nova Categoria")}
                      </Button>
                    </div>

                    {showNewCategoryForm ? (
                      <div className="p-3 border rounded-lg bg-secondary/30 space-y-3 animate-in fade-in slide-in-from-top-1">
                        <Input
                          placeholder={t("Nome da categoria")}
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <Select
                            value={newCategory.color}
                            onValueChange={(v: any) => setNewCategory({ ...newCategory, color: v })}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Cor" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(COLOR_MAP).map(color => (
                                <SelectItem key={color} value={color}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_MAP[color] }} />
                                    <span className="capitalize">{color}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button className="flex-1" onClick={addCategory}>Criar</Button>
                        </div>
                      </div>
                    ) : (
                      <Select
                        value={newTransaction.category_id}
                        onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t("Data")}</Label>
                    <Input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleSaveTransaction} className="w-full" variant="accent">
                    {editingTransactionId ? t("Salvar Alterações") : t("Adicionar Transação")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {t("Criar Alerta")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("Alerta de Orçamento")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>{t("Categoria")}</Label>
                    <Select
                      value={newAlert.category_id}
                      onValueChange={(value) => setNewAlert({ ...newAlert, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Selecione uma categoria")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.type === 'expense').map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("Limite")} (Kz)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t("Ex: 50000")}
                        className="flex-1"
                        value={newAlert.limit_amount}
                        onChange={(e) => setNewAlert({ ...newAlert, limit_amount: e.target.value })}
                      />
                      <Select
                        value={newAlert.period}
                        onValueChange={(v: any) => setNewAlert({ ...newAlert, period: v })}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder={t("Período")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">{t("Mensal")}</SelectItem>
                          <SelectItem value="yearly">{t("Anual")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={addBudgetAlert} className="w-full" variant="accent">
                    {t("Criar Alerta")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* - **Fixed Cash Flow Chart**: The **"Fluxo de Caixa (14 dias)"** now correctly shows both income and expenses for a true 14-day rolling window, independent of your monthly/yearly view filter.
    - **Savings Goal History**: Each goal now has a **"Histórico"** button that reveals a detailed list of all deposits and withdrawals, linked directly to that specific goal. */}
            {/* Cash Flow Chart */}
            <div className="card-finance">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t("Fluxo de Caixa (14 dias)")}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="despesaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs" />
                    <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => `Kz ${v.toLocaleString()}`} />
                    <Area type="monotone" dataKey="receita" stroke="hsl(160 84% 39%)" fill="url(#receitaGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="despesa" stroke="hsl(0 72% 51%)" fill="url(#despesaGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="card-finance">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t("Despesas por Categoria")}</h3>
              {expensesByCategory.length > 0 ? (
                <div className="flex flex-col md:flex-row h-auto md:h-64 items-center gap-4">
                  <div className="w-full md:w-1/2 h-64 md:h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => `Kz ${v.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {expensesByCategory.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-muted-foreground truncate" title={cat.name}>{cat.name}</span>
                        </div>
                        <span className="font-semibold text-xs break-all">Kz {cat.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {t("Nenhuma despesa registrada")}
                </div>
              )}
            </div>
          </div>

          {/* Budget Alerts Management */}
          {alerts.length > 0 && (
            <div className="card-finance">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {t("Gestão de Alertas")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert) => {
                  const category = categories.find(c => c.id === alert.category_id);
                  if (!category) return null;

                  const spent = transactions
                    .filter(t => {
                      const isSameCategory = t.category_id === alert.category_id;
                      const isExpense = t.type === 'expense';
                      if (!isSameCategory || !isExpense) return false;

                      if (alert.period === 'monthly') {
                        return t.date.startsWith(monthPrefix);
                      } else {
                        return t.date.startsWith(yearPrefix);
                      }
                    })
                    .reduce((sum, t) => sum + t.amount, 0);

                  const progress = Math.min((spent / alert.limit_amount) * 100, 100);
                  const isOverLimit = spent >= alert.limit_amount;
                  const isWarning = spent >= alert.limit_amount * 0.8;

                  return (
                    <div key={alert.id} className="p-4 rounded-xl border bg-secondary/30 relative group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${COLOR_MAP[category.color || 'gray']}20` }}
                          >
                            {ICON_MAP[category.icon || 'FileText'] && (
                              <div style={{ color: COLOR_MAP[category.color || 'gray'] }}>
                                {(() => {
                                  const Icon = ICON_MAP[category.icon || 'FileText'];
                                  return <Icon className="h-4 w-4" />;
                                })()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm flex items-center gap-2">
                              {category.name}
                              <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase opacity-70">
                                {alert.period === 'monthly' ? t('Mensal') : t('Anual')}
                              </Badge>
                            </p>
                            <p className="text-xs text-muted-foreground break-all">Limite: Kz {alert.limit_amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteBudgetAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className={isOverLimit ? "text-destructive font-bold" : isWarning ? "text-amber-600 font-bold" : "text-muted-foreground"}>
                            {t("Gasto")}: <span className="break-all">{formatPrice(spent)}</span>
                          </span>
                          <span className="font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              isOverLimit ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-primary"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card-finance">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {viewMode === 'monthly' && `Transações de ${format(currentDate, 'MMMM yyyy', { locale: pt })}`}
                {viewMode === 'yearly' && `Transações de ${format(currentDate, 'yyyy')}`}
                {viewMode === 'all' && "Todas as Transações"}
              </h3>

              <div className="flex items-center p-1 bg-muted rounded-lg w-fit">
                <Button
                  variant={viewType === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('list')}
                  className="h-8 gap-2"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("Lista")}</span>
                </Button>
                <Button
                  variant={viewType === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('table')}
                  className="h-8 gap-2"
                >
                  <TableIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("Tabela")}</span>
                </Button>
                <Button
                  variant={viewType === 'calendar' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('calendar')}
                  className="h-8 gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("Calendário")}</span>
                </Button>
              </div>
            </div>

            <div className="min-h-[300px]">
              {filteredTransactionsByMode.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t("Nenhuma transação registrada neste período.")}</p>
                  <p className="text-sm mt-1">{t("Clique em \"Nova Transação\" para começar.")}</p>
                </div>
              ) : (
                <>
                  {viewType === 'list' && (
                    <div className="h-[500px] overflow-y-auto pr-2 space-y-6">
                      {Object.entries(
                        filteredTransactionsByMode.reduce((groups, tx) => {
                          const date = format(parseISO(tx.date), 'yyyy-MM-dd');
                          if (!groups[date]) groups[date] = [];
                          groups[date].push(tx);
                          return groups;
                        }, {} as Record<string, Transaction[]>)
                      ).map(([date, txs]) => (
                        <div key={date} className="space-y-2">
                          <h3 className="font-semibold text-sm text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
                            {format(parseISO(date), "d 'de' MMMM", { locale: currentLocale })}
                            {date === format(new Date(), 'yyyy-MM-dd') && ` (${t("Hoje")})`}
                          </h3>
                          <div className="space-y-2">
                            {txs.map((tx) => {
                              const catInfo = getCategoryInfo(tx.category_id);
                              const IconComponent = ICON_MAP[catInfo.icon] || FileText;

                              return (
                                <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 group hover:bg-secondary/70 transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                                      style={{ backgroundColor: `${COLOR_MAP[catInfo.color] || COLOR_MAP.gray}20` }}
                                    >
                                      <IconComponent
                                        className="h-5 w-5"
                                        style={{ color: COLOR_MAP[catInfo.color] || COLOR_MAP.gray }}
                                      />
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground">{tx.description}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {catInfo.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className={`font-semibold break-all ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                                      {tx.type === 'income' ? '+' : '-'}Kz {tx.amount.toLocaleString('pt-AO')}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => {
                                          setEditingTransactionId(tx.id);
                                          setNewTransaction({
                                            type: tx.type as 'income' | 'expense',
                                            amount: tx.amount.toString(),
                                            description: tx.description || '',
                                            category_id: tx.category_id || '',
                                            date: tx.date,
                                          });
                                          setDialogOpen(true);
                                        }}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                                        onClick={() => deleteTransaction(tx.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewType === 'table' && (
                    <TransactionTable
                      transactions={filteredTransactionsByMode}
                      categories={categories}
                      onEdit={(tx) => {
                        setEditingTransactionId(tx.id);
                        setNewTransaction({
                          type: tx.type as 'income' | 'expense',
                          amount: tx.amount.toString(),
                          description: tx.description || '',
                          category_id: tx.category_id || '',
                          date: tx.date,
                        });
                        setDialogOpen(true);
                      }}
                      onDelete={deleteTransaction}
                    />
                  )}

                  {viewType === 'calendar' && (
                    <TransactionCalendar
                      transactions={filteredTransactionsByMode}
                      categories={categories}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </ModuleGuard>
    </AppLayout>
  );
}
