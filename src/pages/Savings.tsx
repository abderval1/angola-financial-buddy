import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Target, PiggyBank, Calendar, Trophy,
  History, ArrowUpDown, Filter, LayoutGrid, Table as TableIcon, LineChart, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useAchievements } from "@/hooks/useAchievements";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import { SmartGoalCard } from "@/components/savings/SmartGoalCard";
import { ReservesEvolutionChart, SavingsTable } from "@/components/savings/SavingsVisualizations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ptBR, enUS, fr, es } from "date-fns/locale";
import { ln } from "@/lib/date-fns-lingala"; // Assuming this exists or I'll need to mock it if not, but I'll stick to what I know works or just use default for now if unsure. Actually I'll use a mapping.

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number | null;
  monthly_contribution: number | null;
  interest_rate: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  icon: string | null;
  color: string | null;
}

const GOAL_ICONS = [
  { name: 'Emergência', key: 'Emergência', icon: '🛡️', color: 'emerald' },
  { name: 'Viagem', key: 'Viagem', icon: '✈️', color: 'blue' },
  { name: 'Casa', key: 'Casa', icon: '🏠', color: 'orange' },
  { name: 'Carro', key: 'Carro', icon: '🚗', color: 'purple' },
  { name: 'Educação', key: 'Educação', icon: '🎓', color: 'pink' },
  { name: 'Casamento', key: 'Casamento', icon: '💍', color: 'yellow' },
  { name: 'Aposentadoria', key: 'Aposentadoria', icon: '🏖️', color: 'cyan' },
  { name: 'Outro', key: 'Outro', icon: '🎯', color: 'gray' },
];

const localeMap: Record<string, any> = {
  en: enUS,
  fr: fr,
  es: es,
  pt: ptBR,
};

type SortOption = 'closest' | 'furthest' | 'risk' | 'amount_high' | 'amount_low';

export default function Savings() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const currentLocale = localeMap[i18n.language] || ptBR;
  const queryClient = useQueryClient();
  const { unlockAchievement } = useAchievements();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [activeHistoryGoal, setActiveHistoryGoal] = useState<SavingsGoal | null>(null);
  const [goalTransactions, setGoalTransactions] = useState<any[]>([]);
  const [allSavingsTransactions, setAllSavingsTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('closest');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'chart'>('cards');

  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    monthly_contribution: '',
    interest_rate: '0',
    end_date: '',
    icon: '🎯',
    color: 'gray',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGoals(), fetchAllSavingsTransactions()]);
    setLoading(false);
  };

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`${t("Erro ao carregar metas")}: ${error.message}`);
      return;
    }

    setGoals(data || []);
  };

  const fetchAllSavingsTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('date, amount, type, savings_goal_id')
      .not('savings_goal_id', 'is', null)
      .order('date', { ascending: true });

    if (error) {
      console.error("Error fetching savings txs:", error);
    } else {
      setAllSavingsTransactions(data || []);
    }
  };

  const chartData = useMemo(() => {
    if (allSavingsTransactions.length === 0) return [];

    // Aggregate by date
    const balanceByDate: Record<string, number> = {};
    let runningBalance = 0;

    // Sort txs just in case
    const sortedTxs = [...allSavingsTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTxs.forEach(tx => {
      const amount = tx.type === 'income' ? tx.amount : -tx.amount;
      runningBalance += amount;
      balanceByDate[tx.date] = runningBalance;
    });

    // Create daily data points for last 6 months to ensure smooth chart
    // For MVP, we'll just map the transactions which gives "steps".

    // Better approach: Get unique dates
    const dataPoints = Object.entries(balanceByDate).map(([date, balance]) => ({
      date,
      balance
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return dataPoints;
  }, [allSavingsTransactions]);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const progressA = ((a.saved_amount || 0) / a.target_amount);
      const progressB = ((b.saved_amount || 0) / b.target_amount);

      switch (sortBy) {
        case 'closest':
          // Sort by progress desc (closest to 100%)
          return progressB - progressA;
        case 'furthest':
          // Sort by progress asc
          return progressA - progressB;
        case 'amount_high':
          return b.target_amount - a.target_amount;
        case 'amount_low':
          return a.target_amount - b.target_amount;
        case 'risk':
          // Simple risk logic: Low progress AND low/no monthly contribution
          // Higher score = higher risk
          const riskA = (1 - progressA) * (a.monthly_contribution ? 1 : 2);
          const riskB = (1 - progressB) * (b.monthly_contribution ? 1 : 2);
          return riskB - riskA;
        default:
          return 0;
      }
    });
  }, [goals, sortBy]);

  const exportToCSV = () => {
    if (goals.length === 0) {
      toast.error(t("Sem dados para exportar"));
      return;
    }

    const headers = [t("Meta"), t("Meta Total"), t("Acumulado"), t("Poupança Mensal"), t("Previsão"), t("Status")];
    const csvContent = [
      headers.join(","),
      ...goals.map(g => [
        `"${g.name}"`,
        g.target_amount,
        g.saved_amount || 0,
        g.monthly_contribution || 0,
        g.end_date || "",
        g.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `poupanca_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) {
      toast.error(t("Preencha o nome e valor da meta"));
      return;
    }

    const { error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: user?.id,
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        monthly_contribution: parseFloat(newGoal.monthly_contribution) || 0,
        interest_rate: parseFloat(newGoal.interest_rate) || 0,
        end_date: newGoal.end_date || null,
        icon: newGoal.icon,
        color: newGoal.color,
        status: 'active',
      });

    if (error) {
      toast.error(`${t("Erro ao criar meta")}: ${error.message}`);
      return;
    }

    toast.success(t("Meta criada com sucesso! 🎯"));
    unlockAchievement('first_goal', 'Primeiro Passo', 2);
    setDialogOpen(false);
    setNewGoal({
      name: '',
      target_amount: '',
      monthly_contribution: '',
      interest_rate: '0',
      end_date: '',
      icon: '🎯',
      color: 'gray',
    });
    fetchGoals();
  };

  const updateGoal = async (id: string, updatedData: Partial<SavingsGoal>) => {
    const { error } = await supabase
      .from('savings_goals')
      .update(updatedData)
      .eq('id', id);

    if (error) {
      toast.error(t("Erro ao atualizar meta"));
      return;
    }

    toast.success(t("Meta atualizada com sucesso! 🎯"));
    setEditDialogOpen(false);
    setEditingGoal(null);
    fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(t("Erro ao excluir meta"));
      return;
    }

    toast.success(t("Meta excluída"));
    fetchGoals();
  };


  const handleTransaction = async () => {
    if (!selectedGoal || !depositAmount) {
      toast.error(t("Informe o valor"));
      return;
    }

    const amount = parseFloat(depositAmount);
    const isDeposit = transactionType === 'deposit';

    if (!isDeposit && (selectedGoal.saved_amount || 0) < amount) {
      toast.error(t("Saldo insuficiente na meta"));
      return;
    }

    const newSavedAmount = isDeposit
      ? (selectedGoal.saved_amount || 0) + amount
      : (selectedGoal.saved_amount || 0) - amount;

    const isNowCompleted = newSavedAmount >= selectedGoal.target_amount;

    const { error } = await supabase
      .from('savings_goals')
      .update({
        saved_amount: newSavedAmount,
        status: isNowCompleted ? 'completed' : (selectedGoal.status === 'completed' ? 'active' : selectedGoal.status),
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedGoal.id);

    if (error) {
      toast.error(t("Erro ao processar transação"));
      return;
    }

    // Check for achievements
    if (isDeposit) {
      if (newSavedAmount >= 10000) {
        unlockAchievement('beginner_saver', 'Poupador Iniciante', 2);
      }
    }

    if (isNowCompleted) {
      unlockAchievement('goal_reached', 'Meta Batida!', 2);

      // Check for Savings Master (5 completed goals)
      const totalCompleted = goals.filter(g => g.status === 'completed' || g.id === selectedGoal.id).length;
      if (totalCompleted >= 5) {
        unlockAchievement('savings_master', 'Mestre da Poupança', 2);
      }
    }

    // CREATE TRANSACTION RECORD
    const catName = isDeposit ? t("Poupança") : t("Levantamento");
    const catType = isDeposit ? 'income' : 'expense';

    let { data: catData } = await supabase
      .from('transaction_categories')
      .select('id')
      .eq('name', catName)
      .eq('type', catType)
      .maybeSingle();

    if (!catData) {
      // Create category if it doesn't exist
      const { data: newCat, error: catError } = await supabase
        .from('transaction_categories')
        .insert({
          user_id: user?.id,
          name: catName,
          type: catType,
          icon: isDeposit ? 'PiggyBank' : 'Wallet',
          color: isDeposit ? 'emerald' : 'orange'
        })
        .select()
        .single();

      if (!catError) {
        catData = newCat;
      }
    }

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user?.id,
        type: catType,
        amount: amount,
        description: `${isDeposit ? t("Depósito realizado! 💰") : t("Levantamento realizado! 💸")} em: ${selectedGoal.name}`,
        category_id: catData?.id || null,
        savings_goal_id: selectedGoal.id,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

    if (txError) {
      console.error("Error creating transaction:", txError);
      toast.error(`${t("Erro ao registrar transação no histórico")}: ${txError.message}`);
    }

    queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
    toast.success(isDeposit ? t("Depósito realizado! 💰") : t("Levantamento realizado! 💸"));
    setDepositDialogOpen(false);
    setDepositAmount('');
    setSelectedGoal(null);
    fetchAllSavingsTransactions(); // Update chart
    fetchGoals();
  };

  const toggleGoalStatus = async (goal: SavingsGoal) => {
    const newStatus = goal.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('savings_goals')
      .update({ status: newStatus })
      .eq('id', goal.id);

    if (error) {
      toast.error(t("Erro ao atualizar status"));
      return;
    }

    toast.success(newStatus === 'paused' ? t("Meta pausada") : t("Meta reativada"));
    fetchGoals();
  };

  const fetchGoalHistory = async (goalId: string) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('savings_goal_id', goalId)
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
      toast.error(t("Erro ao carregar histórico"));
      setGoalTransactions([]);
    } else {
      setGoalTransactions(data || []);
    }
    setLoadingHistory(false);
  };

  // Stats
  const totalSaved = goals.reduce((sum, g) => sum + (g.saved_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalMonthlyContribution = goals
    .filter(g => g.status === 'active')
    .reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);

  if (loading) {
    return (
      <AppLayout title={t("Poupança Inteligente")} subtitle={t("Planeie as suas metas financeiras")}>
        <ModuleGuard
          moduleKey="basic"
          title={t("Metas de Poupança")}
          description={t("Crie metas personalizadas, acompanhe o seu progresso e estabeleça um fundo de emergência sólido.")}
        >
          <div className="flex items-center justify-center h-64">
            <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </ModuleGuard>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t("Poupança Inteligente")} subtitle={t("Gerencie suas metas com análise avançada")}>
      <ModuleGuard
        moduleKey="basic"
        title={t("Poupança & Metas")}
        description={t("Crie e acompanhe as suas metas de poupança, realize depósitos e visualize o seu progresso rumo à liberdade financeira.")}
      >
        <div className="space-y-6 animate-fade-in">
          {/* Header Stats Logic same as before... */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="card-finance p-3 sm:p-6 border-l-4 border-savings bg-savings/5">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-savings" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("Total Poupado")}</span>
              </div>
              <p className="text-sm sm:text-lg md:text-2xl font-bold break-all">{formatPrice(totalSaved)}</p>
            </div>

            <div className="card-finance p-3 sm:p-6 border-l-4 border-primary bg-primary/5">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("Meta Total")}</span>
              </div>
              <p className="text-sm sm:text-lg md:text-2xl font-bold break-all">{formatPrice(totalTarget)}</p>
            </div>

            <div className="card-finance p-3 sm:p-6 border-l-4 border-success bg-success/5">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("Conclúidas")}</span>
              </div>
              <p className="text-sm sm:text-lg md:text-2xl font-bold">{completedGoals}</p>
            </div>

            <div className="card-finance p-3 sm:p-6 border-l-4 border-accent bg-accent/5">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("Poupança Mensal")}</span>
              </div>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-accent break-all">{formatPrice(totalMonthlyContribution)}</p>
            </div>
          </div>


          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{t("Objetivos de Poupança")}</h3>
                <p className="text-sm text-muted-foreground">{t("Você tem {{count}} metas ativas", { count: goals.length })}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* View Toggles */}
                <div className="bg-muted p-1 rounded-lg flex items-center">
                  <Button
                    variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="h-7 px-3"
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    {t("Cards")}
                  </Button>
                  <Button
                    variant={viewMode === 'chart' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('chart')}
                    className="h-7 px-3"
                  >
                    <LineChart className="h-4 w-4 mr-2" />
                    {t("Evolução")}
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-7 px-3"
                  >
                    <TableIcon className="h-4 w-4 mr-2" />
                    {t("Tabela")}
                  </Button>
                </div>

                <Button variant="outline" onClick={exportToCSV} className="hidden sm:flex" title={t("Exportar")}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("Exportar")}
                </Button>

                {viewMode === 'cards' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("Ordenar")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy('closest')}>{t("Mais Próximas")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('furthest')}>{t("Mais Distantes")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('risk')}>{t("Maior Risco")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('amount_high')}>{t("Maior Valor")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button onClick={() => setDialogOpen(true)} className="gradient-primary flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Nova Meta")}
                </Button>
              </div>
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[400px]">
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {goals.length === 0 ? (
                    <div className="col-span-full py-12 text-center card-finance">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t("Você ainda não tem metas. Comece agora!")}</p>
                    </div>
                  ) : (
                    sortedGoals.map((goal) => (
                      <SmartGoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={(g: SavingsGoal) => { setEditingGoal(g); setEditDialogOpen(true); }}
                        onDelete={(id: string) => { if (confirm(t("Tem certeza?"))) deleteGoal(id); }}
                        onDeposit={(g: SavingsGoal) => { setSelectedGoal(g); setTransactionType('deposit'); setDepositDialogOpen(true); }}
                        onWithdraw={(g: SavingsGoal) => { setSelectedGoal(g); setTransactionType('withdraw'); setDepositDialogOpen(true); }}
                        onHistory={(g: SavingsGoal) => { setActiveHistoryGoal(g); fetchGoalHistory(g.id); setHistoryDialogOpen(true); }}
                        onToggleStatus={toggleGoalStatus}
                      />
                    ))
                  )}
                </div>
              )}

              {viewMode === 'chart' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ReservesEvolutionChart data={chartData} />
                </div>
              )}

              {viewMode === 'table' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SavingsTable
                    goals={sortedGoals}
                    onEdit={(g: SavingsGoal) => { setEditingGoal(g); setEditDialogOpen(true); }}
                    onDelete={(id: string) => { if (confirm(t("Tem certeza?"))) deleteGoal(id); }}
                  />
                </div>
              )}
            </div>

          </div>


          {/* Dialogs */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("Nova Meta")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {GOAL_ICONS.map((g) => (
                    <button
                      key={g.name}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${newGoal.icon === g.icon ? 'border-primary bg-primary/10' : 'border-border'}`}
                      onClick={() => setNewGoal({ ...newGoal, icon: g.icon, color: g.color })}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-[10px] truncate w-full text-center">{t(g.key)}</span>
                    </button>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Label>{t("Nome da Meta")}</Label>
                  <Input value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{t("Meta Total")} ({i18n.language === 'pt' ? 'Kz' : '$'})</Label>
                    <Input type="number" value={newGoal.target_amount} onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("Poupança Mensal")}</Label>
                    <Input type="number" value={newGoal.monthly_contribution} onChange={(e) => setNewGoal({ ...newGoal, monthly_contribution: e.target.value })} />
                  </div>
                </div>
                <Button onClick={createGoal} className="w-full gradient-primary">{t("Criar")}</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Transaction Dialog */}
          <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{transactionType === 'deposit' ? t("Reforçar Poupança") : t("Retirar Valor")}</DialogTitle>
              </DialogHeader>
              {selectedGoal && (
                <div className="space-y-4 py-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{t("Meta Selecionada")}</p>
                    <p className="font-bold text-lg">{selectedGoal.icon} {selectedGoal.name}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("Valor")}</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleTransaction} className="w-full gradient-savings">{transactionType === 'deposit' ? t("Confirmar Depósito") : t("Confirmar Retirada")}</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Goal Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("Editar Meta")}</DialogTitle>
              </DialogHeader>
              {editingGoal && (
                <div className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label>{t("Nome da Meta")}</Label>
                    <Input value={editingGoal.name} onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{t("Meta Total")} ({i18n.language === 'pt' ? 'Kz' : '$'})</Label>
                      <Input type="number" value={editingGoal.target_amount} onChange={(e) => setEditingGoal({ ...editingGoal, target_amount: parseFloat(e.target.value) })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("Poupança Mensal")}</Label>
                      <Input type="number" value={editingGoal.monthly_contribution || ''} onChange={(e) => setEditingGoal({ ...editingGoal, monthly_contribution: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <Button onClick={() => updateGoal(editingGoal.id, editingGoal)} className="w-full gradient-primary">{t("Salvar Alterações")}</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Savings History Dialog */}
          <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  {t("Histórico")}: {activeHistoryGoal?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : goalTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t("Nenhum registo encontrado para esta meta.")}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {goalTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(tx.date), 'dd/MM/yyyy', { locale: currentLocale })}
                          </span>
                          <span className="text-sm font-medium">{tx.description}</span>
                        </div>
                        <span className={cn(
                          "font-bold text-sm",
                          tx.type === 'income' ? "text-success" : "text-destructive"
                        )}>
                          {tx.type === 'income' ? '+' : '-'} {formatPrice(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={() => setHistoryDialogOpen(false)} className="w-full">
                  {t("Fechar")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </ModuleGuard>
    </AppLayout >
  );
}
