import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, TrendingUp, TrendingDown, Trash2, Edit2, AlertTriangle,
  Briefcase, Car, Home, Heart, GraduationCap, Gamepad2, Shirt, FileText, UtensilsCrossed, Laptop,
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Layers, List, Table as TableIcon, History as HistoryIcon,
  Settings, Wallet, PiggyBank, Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO, subMonths, addMonths, startOfYear, endOfYear, addYears, subYears } from "date-fns";
import { pt, enUS, fr, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAICoach } from "@/hooks/useAICoach";

const localeMap: Record<string, any> = {
  en: enUS,
  fr: fr,
  es: es,
  pt: pt,
};

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

const BUCKET_CATEGORIES = [
  'Poupança', 'Levantamento',
  'Investimento', 'Resgate de Investimento',
  'Dívida (Pagamento)', 'Dívida (Recebimento)',
  'Empréstimo (Pagamento)', 'Empréstimo (Recebimento)',
  'Transferência para Poupança', 'Transferência da Poupança'
];

const isInternal = (t: any) => {
  const catName = t.transaction_categories?.name;
  return BUCKET_CATEGORIES.includes(catName || '') || t.category_id === 'internal-transfer' || t.savings_goal_id;
};

const isOnlyBucket = (t: any) => {
  const catName = t.transaction_categories?.name;
  const bucketOnly = BUCKET_CATEGORIES.filter(c =>
    !c.toLowerCase().includes('poupança') &&
    !c.toLowerCase().includes('savings')
  );
  return bucketOnly.includes(catName || '') || t.category_id === 'internal-transfer';
};

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

  // Chart preferences - load from localStorage or use defaults
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'donut'>(
    () => (localStorage.getItem('budget_chart_type') as 'pie' | 'bar' | 'donut') || 'pie'
  );
  const [chartValueMode, setChartValueMode] = useState<'value' | 'percentage'>(
    () => (localStorage.getItem('budget_chart_value_mode') as 'value' | 'percentage') || 'value'
  );

  useEffect(() => {
    localStorage.setItem('budget_chart_type', chartType);
  }, [chartType]);

  useEffect(() => {
    localStorage.setItem('budget_chart_value_mode', chartValueMode);
  }, [chartValueMode]);

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
    const { data, error } = (await supabase
      .from('financial_profiles' as any)
      .select('budget_config' as any)
      .eq('user_id', user?.id)
      .single()) as any;

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
      .select('*, transaction_categories(name, type)')
      .gte('date', start)
      .lte('date', end);

    setPreviousMonthTransactions(data as any || []);
  };

  const fetchTransactions = async () => {
    let query = supabase.from('transactions').select('*, transaction_categories(name, type)');

    // No longer filtering by date here to allow calculating carriedOverBalance from all history.
    // The period filtering is done client-side via filteredTransactionsByMode.

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      toast.error(t("Erro ao carregar transações"));
      return;
    }

    setTransactions(data as any || []);
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

  let periodStart: Date | null = null;
  if (viewMode === 'monthly') periodStart = startOfMonth(currentDate);
  if (viewMode === 'yearly') periodStart = startOfYear(currentDate);

  const filteredTransactionsByMode = transactions.filter(t => {
    if (viewMode === 'monthly') return t.date.startsWith(monthPrefix);
    if (viewMode === 'yearly') return t.date.startsWith(yearPrefix);
    return true; // mode 'all'
  });

  const displayTransactions = filteredTransactionsByMode.filter(t => !isInternal(t));

  const totalIncome = filteredTransactionsByMode.filter(t => t.type === 'income' && !isInternal(t)).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactionsByMode.filter(t => t.type === 'expense' && !isInternal(t)).reduce((sum, t) => sum + t.amount, 0);

  // Balance includes savings transfers to effectively "subtract" them from available money
  const balance = filteredTransactionsByMode
    .filter(t => !isOnlyBucket(t))
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const carriedOverBalance = transactions
    .filter(t => {
      if (!periodStart) return false;
      const txDate = new Date(t.date);
      return txDate < periodStart && !isOnlyBucket(t);
    })
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  // Net savings = deposits into goals minus withdrawals from goals
  const totalDepositedToGoals = filteredTransactionsByMode
    .filter(t => t.type === 'expense' && t.savings_goal_id)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawnFromGoals = filteredTransactionsByMode
    .filter(t => t.type === 'income' && t.savings_goal_id)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalTransferredToGoalStorage = totalDepositedToGoals - totalWithdrawnFromGoals;

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const expensesByCategory = displayTransactions
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

  const incomeByCategory = displayTransactions
    .filter(t => t.type === 'income')
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
    const dayTransactions = transactions.filter(t => t.date === dateStr && !isInternal(t));
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

  const prevIncome = viewMode === 'all' ? undefined : previousMonthTransactions.filter(t => t.type === 'income' && !isInternal(t)).reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = viewMode === 'all' ? undefined : previousMonthTransactions.filter(t => t.type === 'expense' && !isInternal(t)).reduce((sum, t) => sum + t.amount, 0);
  const prevBalance = (prevIncome !== undefined && prevExpense !== undefined) ? prevIncome - prevExpense : undefined;

  const trendLabel = viewMode === 'yearly' ? 'vs ano anterior' : 'vs mês anterior';

  // Financial Health Calculation
  const healthScore = Math.max(0, Math.min(((totalIncome > 0 ? (savingsRate / budgetConfig.savings_goal_pct) * 4 : 2) + 3 + (balance + carriedOverBalance >= 0 ? 3 : 0)), 10));

  const coachInsights: string[] = [];
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || "Utilizador";
  if (totalIncome === 0) {
    coachInsights.push(t("Olá {{name}}, registe receitas para eu analisar!", { name: firstName }));
  } else {
    if (balance < 0) coachInsights.push(t("⚠️ {{name}}, os gastos superaram as receitas.", { name: firstName }));
    if (balance >= 0 && savingsRate >= budgetConfig.savings_goal_pct) coachInsights.push(t("✅ Excelente! Poupança acima da meta ({{rate}}%).", { rate: savingsRate.toFixed(1) }));
    if (totalTransferredToGoalStorage > 0) coachInsights.push(t("🏦 Poupança líquida: {{amount}}.", { amount: formatPrice(totalTransferredToGoalStorage) }));
    if (savingsRate < budgetConfig.savings_goal_pct && totalIncome > 0) coachInsights.push(t("📉 Taxa de poupança {{rate}}%, abaixo da meta de {{goal}}%.", { rate: savingsRate.toFixed(1), goal: budgetConfig.savings_goal_pct }));
    if (totalExpense > 0 && expensesByCategory.length > 0) coachInsights.push(t("🏷️ Maior gasto: {{cat}} ({{amount}}).", { cat: expensesByCategory[0].name, amount: formatPrice(expensesByCategory[0].value) }));
    if (totalIncome > 0 && totalExpense / totalIncome > 0.8) coachInsights.push(t("🔴 Gastou mais de 80% da receita. Reduza despesas."));
    if (totalIncome > 0 && totalExpense / totalIncome < 0.5) coachInsights.push(t("🟢 Bom controlo! Menos de 50% da receita em despesas."));
    if (carriedOverBalance < 0) coachInsights.push(t("📌 Saldo anterior negativo. Priorize equilibrar as contas."));
  }

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

          {/* Coach Strip + AI Sheet */}
          {coachInsights.length > 0 && (
            <CoachStrip
              insights={coachInsights}
              context={`Receitas: ${formatPrice(totalIncome)}, Despesas: ${formatPrice(totalExpense)}, Saldo: ${formatPrice(balance)}, Taxa de poupança: ${savingsRate.toFixed(1)}%, Maior categoria de despesa: ${expensesByCategory[0]?.name || 'N/A'}`}
              t={t}
            />
          )}

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <MetricCard
              title={viewMode === 'all' ? t("Saldo Acumulado") : t("Saldo Anterior")}
              value={carriedOverBalance}
              icon={HistoryIcon}
              type="neutral"
              valueClassName={carriedOverBalance >= 0 ? "text-success" : "text-destructive"}
              formatter={(v) => formatPrice(v)}
            />
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
              value={balance + carriedOverBalance}
              previousValue={viewMode === 'monthly' ? carriedOverBalance : undefined}
              trendLabel={trendLabel}
              icon={Wallet}
              type="neutral"
              valueClassName={(balance + carriedOverBalance) >= 0 ? "text-success" : "text-destructive"}
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

            {/* Chart Type and Value Mode Selector */}
            <div className="card-finance">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-display text-lg font-semibold text-foreground">{t("Gráficos por Categoria")}</h3>
                <div className="flex items-center gap-2">
                  {/* Chart Type Selector */}
                  <div className="flex items-center bg-secondary rounded-lg p-1">
                    <button
                      onClick={() => setChartType('pie')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${chartType === 'pie' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title={t("Gráfico de Pizza")}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setChartType('donut')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${chartType === 'donut' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title={t("Gráfico de Rosca")}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title={t("Gráfico de Barras")}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                  </div>
                  {/* Value Mode Selector */}
                  <div className="flex items-center bg-secondary rounded-lg p-1">
                    <button
                      onClick={() => setChartValueMode('value')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${chartValueMode === 'value' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title={t("Valores")}
                    >
                      Kz
                    </button>
                    <button
                      onClick={() => setChartValueMode('percentage')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${chartValueMode === 'percentage' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title={t("Percentagem")}
                    >
                      %
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Income by Category */}
            {incomeByCategory.length > 0 && (
              <div className="card-finance">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t("Receitas por Categoria")}</h3>
                <div className="flex flex-col md:flex-row h-auto md:h-64 items-center gap-4">
                  <div className="w-full md:w-1/2 h-64 md:h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={incomeByCategory} layout="vertical">
                          <XAxis type="number" axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => chartValueMode === 'percentage' ? `${v}%` : `${v / 1000}k`} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} className="text-xs" width={80} />
                          <Tooltip formatter={(v: number) => chartValueMode === 'percentage' ? `${v.toFixed(1)}%` : `Kz ${v.toLocaleString()}`} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {incomeByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={incomeByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={chartType === 'donut' ? 60 : 0}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {incomeByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => chartValueMode === 'percentage' ? `${((v / totalIncome) * 100).toFixed(1)}%` : `Kz ${v.toLocaleString()}`} />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {incomeByCategory.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-muted-foreground truncate" title={cat.name}>{cat.name}</span>
                        </div>
                        <span className="font-semibold text-xs break-all">
                          {chartValueMode === 'percentage'
                            ? `${((cat.value / totalIncome) * 100).toFixed(1)}%`
                            : `Kz ${cat.value.toLocaleString()}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expenses by Category */}
            <div className="card-finance">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t("Despesas por Categoria")}</h3>
              {expensesByCategory.length > 0 ? (
                <div className="flex flex-col md:flex-row h-auto md:h-64 items-center gap-4">
                  <div className="w-full md:w-1/2 h-64 md:h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={expensesByCategory} layout="vertical">
                          <XAxis type="number" axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => chartValueMode === 'percentage' ? `${v}%` : `${v / 1000}k`} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} className="text-xs" width={80} />
                          <Tooltip formatter={(v: number) => chartValueMode === 'percentage' ? `${v.toFixed(1)}%` : `Kz ${v.toLocaleString()}`} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {expensesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={chartType === 'donut' ? 60 : 0}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {expensesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => chartValueMode === 'percentage' ? `${((v / totalExpense) * 100).toFixed(1)}%` : `Kz ${v.toLocaleString()}`} />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {expensesByCategory.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-muted-foreground truncate" title={cat.name}>{cat.name}</span>
                        </div>
                        <span className="font-semibold text-xs break-all">
                          {chartValueMode === 'percentage'
                            ? `${((cat.value / totalExpense) * 100).toFixed(1)}%`
                            : `Kz ${cat.value.toLocaleString()}`}
                        </span>
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
                        displayTransactions.reduce((groups, tx) => {
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
                      transactions={displayTransactions}
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
                      transactions={displayTransactions}
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

// ─── CoachStrip Component ──────────────────────────────────────────────────────

interface CoachStripProps {
  insights: string[];
  context: string;
  t: (key: string, opts?: any) => string;
}

function CoachStrip({ insights, context, t }: CoachStripProps) {
  const [open, setOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<string | null>(null);
  const { advice, loading, error, quota, isQuotaExceeded, getAdvice, clear } = useAICoach();

  const handlePillClick = (tip: string) => {
    setSelectedTip(tip);
    setOpen(true);
    clear();
    getAdvice(tip, context);
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-base">👨‍🏫</span>
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{t("Prof")}:</span>
        </div>
        {insights.map((insight, idx) => (
          <button
            key={idx}
            onClick={() => handlePillClick(insight)}
            className="shrink-0 text-xs bg-primary/10 border border-primary/20 text-foreground px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-primary/20 hover:border-primary/40 transition-colors cursor-pointer flex items-center gap-1 group"
            title="Clique para obter conselho da IA"
          >
            {insight}
            <span className="opacity-0 group-hover:opacity-60 transition-opacity text-[9px] ml-0.5">✨</span>
          </button>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-xl">👨‍🏫</span>
              <div>
                <SheetTitle className="text-sm font-bold">{t("Conselho do Professor")}</SheetTitle>
                <SheetDescription className="text-xs">{t("Análise personalizada com IA")}</SheetDescription>
              </div>
            </div>
            {selectedTip && (
              <div className="mt-2 text-xs bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg text-foreground">
                {selectedTip}
              </div>
            )}
          </SheetHeader>

          <div className="pt-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">{t("A pensar...")}</p>
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            {isQuotaExceeded && (
              <div className="text-center py-8 space-y-4">
                <div className="text-4xl">🚫</div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{t("Limite diário excedido")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Já usaste as tuas {{limit}} dicas de IA hoje.", { limit: quota?.limit || 50 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⏰ {t("O quota renova à meia-noite (hora de Angola).")}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                  💡 {t("Dica: Podes usar o Coach (passo a passo) quantas vezes quiseres!")}
                </div>
              </div>
            )}

            {advice && !loading && (
              <div className="prose prose-sm max-w-none space-y-3">
                {advice.split(/\n+/).filter(Boolean).map((paragraph, i) => (
                  <p
                    key={i}
                    className={`text-sm leading-relaxed ${paragraph.startsWith('**') || /^\d\./.test(paragraph)
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground'
                      }`}
                  >
                    {paragraph.replace(/\*\*/g, '')}
                  </p>
                ))}
                <div className="pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
                  <span>✨</span>
                  <span>{t("Gerado por IA — use como orientação, não como conselho financeiro profissional.")}</span>
                  {quota && (
                    <span className="ml-auto bg-primary/10 px-2 py-1 rounded-full">
                      {quota.remaining}/{quota.limit} quota
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
