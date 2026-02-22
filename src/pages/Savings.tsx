import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Target, PiggyBank, Trophy, Wallet,
  History, LayoutGrid, Table as TableIcon, LineChart, Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useAchievements } from "@/hooks/useAchievements";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import { SmartGoalCard } from "@/components/savings/SmartGoalCard";
import { ReservesEvolutionChart, SavingsTable } from "@/components/savings/SavingsVisualizations";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ptBR, enUS, fr, es } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [budgetBalance, setBudgetBalance] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
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

  useEffect(() => {
    if (user?.id) {
      fetchBudgetBalance();
    }
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGoals(), fetchAllSavingsTransactions(), fetchBudgetBalance()]);
    setLoading(false);
  };

  const fetchBudgetBalance = async () => {
    if (!user?.id) return;

    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*, transaction_categories(name, type)')
      .eq('user_id', user.id);

    if (!allTransactions) return;

    const bucketCategoryNames = [
      'Poupança', 'Levantamento',
      'Investimento', 'Resgate de Investimento',
      'Dívida (Pagamento)', 'Dívida (Recebimento)',
      'Empréstimo (Pagamento)', 'Empréstimo (Recebimento)',
      'Transferência para Poupança', 'Transferência da Poupança'
    ];

    const monthPrefix = selectedMonth;
    const transactionsUpToMonth = (allTransactions as any[]).filter(t => {
      if (!t.date) return false;
      return t.date.substring(0, 7) <= monthPrefix;
    });

    const totalTransferred = transactionsUpToMonth
      .filter(t => t.savings_goal_id)
      .reduce((sum, t) => sum + (t.type === 'expense' ? (t.amount || 0) : -(t.amount || 0)), 0);

    const income = transactionsUpToMonth
      .filter(t => {
        if (t.type !== 'income') return false;
        if (t.savings_goal_id) return false; // Exclude redemptions from "external" income
        const catName = t.transaction_categories?.name;
        return !bucketCategoryNames.includes(catName);
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expense = transactionsUpToMonth
      .filter(t => {
        if (t.type !== 'expense') return false;
        if (t.savings_goal_id) return false; // Exclude deposits from "external" expense
        const catName = t.transaction_categories?.name;
        return !bucketCategoryNames.includes(catName);
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netBalance = income - expense - totalTransferred;
    setBudgetBalance(netBalance);
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
    const balanceByDate: Record<string, number> = {};
    let runningBalance = 0;
    const sortedTxs = [...allSavingsTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedTxs.forEach(tx => {
      runningBalance += (tx.type === 'income' ? tx.amount : -tx.amount);
      balanceByDate[tx.date] = runningBalance;
    });
    return Object.entries(balanceByDate).map(([date, balance]) => ({ date, balance }));
  }, [allSavingsTransactions]);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const progressA = ((a.saved_amount || 0) / a.target_amount);
      const progressB = ((b.saved_amount || 0) / b.target_amount);
      switch (sortBy) {
        case 'closest': return progressB - progressA;
        case 'furthest': return progressA - progressB;
        case 'amount_high': return b.target_amount - a.target_amount;
        case 'amount_low': return a.target_amount - b.target_amount;
        default: return 0;
      }
    });
  }, [goals, sortBy]);

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
    setDialogOpen(false);
    setNewGoal({ name: '', target_amount: '', monthly_contribution: '', interest_rate: '0', end_date: '', icon: '🎯', color: 'gray' });
    fetchGoals();
  };

  const updateGoal = async (id: string, updatedData: Partial<SavingsGoal>) => {
    const { error } = await supabase.from('savings_goals').update(updatedData).eq('id', id);
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
    await supabase.from('transactions').delete().eq('savings_goal_id', id);
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) {
      toast.error(t("Erro ao excluir meta"));
      return;
    }
    toast.success(t("Meta excluída"));
    fetchGoals();
    fetchBudgetBalance();
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

    if (isDeposit) {
      if (budgetBalance < amount) {
        toast.error(t("Saldo insuficiente no orçamento"));
        return;
      }
    }

    const newSavedAmount = isDeposit ? (selectedGoal.saved_amount || 0) + amount : (selectedGoal.saved_amount || 0) - amount;
    const isNowCompleted = newSavedAmount >= selectedGoal.target_amount;

    const { error: gErr } = await supabase.from('savings_goals').update({
      saved_amount: newSavedAmount,
      status: isNowCompleted ? 'completed' : (selectedGoal.status === 'completed' ? 'active' : selectedGoal.status),
      updated_at: new Date().toISOString(),
    }).eq('id', selectedGoal.id);

    if (gErr) {
      toast.error(t("Erro ao atualizar meta"));
      return;
    }

    await supabase.from('transactions').insert({
      user_id: user?.id,
      amount: amount,
      type: isDeposit ? 'expense' : 'income',
      description: isDeposit
        ? `${t("Depósito")}: ${selectedGoal.name}`
        : `${t("Resgate")}: ${selectedGoal.name}`,
      savings_goal_id: selectedGoal.id,
      date: new Date().toISOString().split('T')[0],
      category_id: null
    });

    toast.success(isDeposit ? t("Depósito realizado! 💰") : t("Resgate realizado! 💸"));
    if (isDeposit && isNowCompleted) unlockAchievement('goal_setter', 'Meta Alcançada', 5);

    setDepositDialogOpen(false);
    setDepositAmount('');
    fetchGoals();
    fetchBudgetBalance();
  };

  const fetchGoalHistory = async (goalId: string) => {
    setLoadingHistory(true);
    const { data } = await supabase.from('transactions').select('*').eq('savings_goal_id', goalId).order('date', { ascending: false });
    setGoalTransactions(data || []);
    setLoadingHistory(false);
  };

  const totalSaved = goals.reduce((sum, g) => sum + (g.saved_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalMonthlyContribution = goals.filter(g => g.status === 'active').reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);

  if (loading) {
    return (
      <AppLayout title={t("Poupança Inteligente")} subtitle={t("Carregando...")}>
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t("Poupança Inteligente")} subtitle={t("Gerencie suas metas com análise avançada")}>
      <ModuleGuard moduleKey="basic" title={t("Poupança & Metas")} description={t("Acompanhe o seu progresso rumo à liberdade financeira.")}>
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-savings/5 border-savings/20"><CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <PiggyBank className="h-5 w-5 text-savings" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Total Poupado")}</p>
                  <h3 className="text-xl font-bold">{formatPrice(totalSaved)}</h3>
                </div>
              </div>
            </CardContent></Card>
            <Card className="bg-primary/5 border-primary/20"><CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Meta Total")}</p>
                  <h3 className="text-xl font-bold">{formatPrice(totalTarget)}</h3>
                </div>
              </div>
            </CardContent></Card>
            <Card className="bg-success/5 border-success/20"><CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Conclúidas")}</p>
                  <h3 className="text-xl font-bold">{completedGoals}</h3>
                </div>
              </div>
            </CardContent></Card>
            <Card className="bg-success/5 border-success/20"><CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Saldo Disponível")}</p>
                  <h3 className="text-xl font-bold text-success">{formatPrice(budgetBalance)}</h3>
                </div>
              </div>
            </CardContent></Card>
          </div>

          <div className="flex justify-between items-center bg-card p-4 rounded-xl border-2 border-primary/10">
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <TabsList>
                  <TabsTrigger value="cards"><LayoutGrid className="h-4 w-4 mr-2" />{t("Cards")}</TabsTrigger>
                  <TabsTrigger value="chart"><LineChart className="h-4 w-4 mr-2" />{t("Evolução")}</TabsTrigger>
                  <TabsTrigger value="table"><TableIcon className="h-4 w-4 mr-2" />{t("Tabela")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              {t("Nova Meta")}
            </Button>
          </div>

          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <SmartGoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={(g: any) => { setEditingGoal(g); setEditDialogOpen(true); }}
                  onDelete={(id: string) => { if (confirm(t("Tem certeza?"))) deleteGoal(id); }}
                  onDeposit={(g: any) => { setSelectedGoal(g); setTransactionType('deposit'); setDepositDialogOpen(true); }}
                  onWithdraw={(g: any) => { setSelectedGoal(g); setTransactionType('withdraw'); setDepositDialogOpen(true); }}
                  onHistory={(g: any) => { setActiveHistoryGoal(g); fetchGoalHistory(g.id); setHistoryDialogOpen(true); }}
                />
              ))}
            </div>
          )}

          {viewMode === 'chart' && <ReservesEvolutionChart data={chartData} />}
          {viewMode === 'table' && <SavingsTable goals={sortedGoals} onEdit={(g: any) => { setEditingGoal(g); setEditDialogOpen(true); }} onDelete={deleteGoal} />}
        </div>

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("Nova Meta")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                {GOAL_ICONS.map(i => (
                  <button key={i.key} onClick={() => setNewGoal({ ...newGoal, icon: i.icon, color: i.color })} className={cn("p-2 border rounded-lg", newGoal.icon === i.icon ? "border-primary bg-primary/10" : "")}>{i.icon}</button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>{t("Nome")}</Label>
                <Input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Meta Final")}</Label>
                  <Input type="number" value={newGoal.target_amount} onChange={e => setNewGoal({ ...newGoal, target_amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Mensal")}</Label>
                  <Input type="number" value={newGoal.monthly_contribution} onChange={e => setNewGoal({ ...newGoal, monthly_contribution: e.target.value })} />
                </div>
              </div>
              <Button onClick={createGoal} className="w-full">{t("Criar Meta")}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transaction Dialog */}
        <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{transactionType === 'deposit' ? t("Reforçar Poupança") : t("Retirar")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center p-3 bg-success/5 border border-success/20 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">{t("Saldo Disponível")}:</span>
                <span className="text-sm font-bold text-success">{formatPrice(budgetBalance)}</span>
              </div>
              <div className="space-y-2">
                <Label>{t("Valor")}</Label>
                <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleTransaction} className="w-full">{t("Confirmar")}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> {t("Histórico")}: {activeHistoryGoal?.name}</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-auto pt-4">
              {goalTransactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div><p className="text-xs text-muted-foreground">{format(parseISO(tx.date), 'dd/MM/yyyy')}</p><p className="text-sm font-medium">{tx.description}</p></div>
                  <span className={cn("font-bold text-sm", tx.type === 'income' ? "text-success" : "text-destructive")}>{tx.type === 'income' ? '+' : '-'} {formatPrice(tx.amount)}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </ModuleGuard>
    </AppLayout>
  );
}
