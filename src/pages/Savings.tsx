import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Target, PiggyBank, Calendar, Trophy,
  Play, Pause, Trash2, Edit2,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useAchievements } from "@/hooks/useAchievements";

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
  { name: 'Emergência', icon: '🛡️', color: 'emerald' },
  { name: 'Viagem', icon: '✈️', color: 'blue' },
  { name: 'Casa', icon: '🏠', color: 'orange' },
  { name: 'Carro', icon: '🚗', color: 'purple' },
  { name: 'Educação', icon: '🎓', color: 'pink' },
  { name: 'Casamento', icon: '💍', color: 'yellow' },
  { name: 'Aposentadoria', icon: '🏖️', color: 'cyan' },
  { name: 'Outro', icon: '🎯', color: 'gray' },
];

export default function Savings() {
  const { user } = useAuth();
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
  const [loadingHistory, setLoadingHistory] = useState(false);

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
    await fetchGoals();
    setLoading(false);
  };

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar metas: ${error.message}`);
      return;
    }

    setGoals(data || []);
  };


  const createGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) {
      toast.error("Preencha o nome e valor da meta");
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
      toast.error(`Erro ao criar meta: ${error.message}`);
      return;
    }

    toast.success("Meta criada com sucesso! 🎯");
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
      toast.error("Erro ao atualizar meta");
      return;
    }

    toast.success("Meta atualizada com sucesso! 🎯");
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
      toast.error("Erro ao excluir meta");
      return;
    }

    toast.success("Meta excluída");
    fetchGoals();
  };


  const handleTransaction = async () => {
    if (!selectedGoal || !depositAmount) {
      toast.error("Informe o valor");
      return;
    }

    const amount = parseFloat(depositAmount);
    const isDeposit = transactionType === 'deposit';

    if (!isDeposit && (selectedGoal.saved_amount || 0) < amount) {
      toast.error("Saldo insuficiente na meta");
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
      toast.error("Erro ao processar transação");
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
    // User Logic: Deposit = Increase Savings (+), Withdrawal = Decrease Savings (-)
    // We map: Deposit -> 'income' (Green/+), Withdrawal -> 'expense' (Red/-)
    const catName = isDeposit ? 'Poupança' : 'Resgate de Poupança';
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
        description: `${isDeposit ? 'Depósito' : 'Retirada'} em: ${selectedGoal.name}`,
        category_id: catData?.id || null,
        savings_goal_id: selectedGoal.id,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

    if (txError) {
      console.error("Error creating transaction:", txError);
      toast.error(`Erro ao registrar transação no histórico: ${txError.message}`);
      // We don't return here because the goal balance was already updated above
    }

    queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
    toast.success(isDeposit ? "Depósito realizado! 💰" : "Levantamento realizado! 💸");
    setDepositDialogOpen(false);
    setDepositAmount('');
    setSelectedGoal(null);
    fetchGoals();
  };

  const toggleGoalStatus = async (goal: SavingsGoal) => {
    const newStatus = goal.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('savings_goals')
      .update({ status: newStatus })
      .eq('id', goal.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success(newStatus === 'paused' ? "Meta pausada" : "Meta reativada");
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
      toast.error("Erro ao carregar histórico");
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
      <AppLayout title="Poupança" subtitle="Carregando seus planos...">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Minha Poupança" subtitle="Gerencie suas metas de economia">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-finance p-6 border-l-4 border-savings bg-savings/5">
            <div className="flex items-center gap-3 mb-2">
              <PiggyBank className="h-5 w-5 text-savings" />
              <span className="text-sm font-medium text-muted-foreground">Total Poupado</span>
            </div>
            <p className="text-2xl font-bold">Kz {totalSaved.toLocaleString('pt-AO')}</p>
          </div>

          <div className="card-finance p-6 border-l-4 border-primary bg-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Meta Total</span>
            </div>
            <p className="text-2xl font-bold">Kz {totalTarget.toLocaleString('pt-AO')}</p>
          </div>

          <div className="card-finance p-6 border-l-4 border-success bg-success/5">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-muted-foreground">Concluídas</span>
            </div>
            <p className="text-2xl font-bold">{completedGoals}</p>
          </div>

          <div className="card-finance p-6 border-l-4 border-accent bg-accent/5">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-muted-foreground">Poupança Mensal</span>
            </div>
            <p className="text-2xl font-bold text-accent">Kz {totalMonthlyContribution.toLocaleString('pt-AO')}</p>
          </div>
        </div>


        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Objetivos de Poupança</h3>
            <Button onClick={() => setDialogOpen(true)} className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.length === 0 ? (
              <div className="col-span-full py-12 text-center card-finance">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Você ainda não tem metas. Comece agora!</p>
              </div>
            ) : (
              goals.map((goal) => {
                const progress = Math.min(((goal.saved_amount || 0) / goal.target_amount) * 100, 100);
                const isCompleted = (goal.saved_amount || 0) >= goal.target_amount;

                return (
                  <Card key={goal.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${isCompleted ? 'border-success/30 bg-success/5' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`text-4xl p-3 rounded-2xl bg-${goal.color || 'gray'}-500/10`}>
                          {goal.icon}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={() => {
                              setEditingGoal(goal);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir esta meta?")) {
                                deleteGoal(goal.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <h4 className="text-xl font-bold mb-1">{goal.name}</h4>
                      <div className="flex justify-between text-sm mb-4">
                        <span className="text-muted-foreground">
                          {goal.monthly_contribution ? `Kz ${goal.monthly_contribution.toLocaleString()}/mês` : 'Sem contribuição'}
                        </span>
                        <span className={`${isCompleted ? 'text-success font-bold' : 'text-primary'}`}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>

                      <Progress value={progress} className={`h-3 mb-2 ${isCompleted ? 'bg-success/20' : ''}`} />

                      {!isCompleted && goal.monthly_contribution && goal.monthly_contribution > 0 && (
                        <div className="text-center mb-4">
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const remaining = goal.target_amount - (goal.saved_amount || 0);
                              const monthsRemaining = Math.ceil(remaining / goal.monthly_contribution);
                              const years = Math.floor(monthsRemaining / 12);
                              const months = monthsRemaining % 12;

                              if (monthsRemaining <= 0) return "Meta atingida!";
                              if (years > 0 && months > 0) return `Faltam ${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
                              if (years > 0) return `Faltam ${years} ${years === 1 ? 'ano' : 'anos'}`;
                              return `Faltam ${months} ${months === 1 ? 'mês' : 'meses'}`;
                            })()}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Acumulado</p>
                          <p className="text-lg font-bold">Kz {(goal.saved_amount || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Objetivo</p>
                          <p className="text-lg font-medium">Kz {goal.target_amount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gradient-savings h-9 text-xs"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setTransactionType('deposit');
                            setDepositDialogOpen(true);
                          }}
                        >
                          Poupar
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 h-9 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setTransactionType('withdraw');
                            setDepositDialogOpen(true);
                          }}
                        >
                          Retirar
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0 rounded-full hover:bg-muted"
                          onClick={() => {
                            setActiveHistoryGoal(goal);
                            fetchGoalHistory(goal.id);
                            setHistoryDialogOpen(true);
                          }}
                        >
                          <History className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0 rounded-full hover:bg-muted"
                          onClick={() => toggleGoalStatus(goal)}
                        >
                          {goal.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>


        {/* Dialogs */}
        {/* Create Goal Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
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
                    <span className="text-[10px] truncate w-full text-center">{g.name}</span>
                  </button>
                ))}
              </div>
              <div className="grid gap-2">
                <Label>Nome da Meta</Label>
                <Input value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valor Alvo (Kz)</Label>
                  <Input type="number" value={newGoal.target_amount} onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Contribuição Mensal</Label>
                  <Input type="number" value={newGoal.monthly_contribution} onChange={(e) => setNewGoal({ ...newGoal, monthly_contribution: e.target.value })} />
                </div>
              </div>
              <Button onClick={createGoal} className="w-full gradient-primary">Criar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transaction Dialog */}
        <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{transactionType === 'deposit' ? 'Reforçar Poupança' : 'Retirar Valor'}</DialogTitle>
            </DialogHeader>
            {selectedGoal && (
              <div className="space-y-4 py-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Meta Selecionada</p>
                  <p className="font-bold text-lg">{selectedGoal.icon} {selectedGoal.name}</p>
                </div>
                <div className="grid gap-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handleTransaction} className="w-full gradient-savings">{transactionType === 'deposit' ? 'Confirmar Depósito' : 'Confirmar Retirada'}</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Goal Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Meta</DialogTitle>
            </DialogHeader>
            {editingGoal && (
              <div className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label>Nome da Meta</Label>
                  <Input value={editingGoal.name} onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Valor Alvo (Kz)</Label>
                    <Input type="number" value={editingGoal.target_amount} onChange={(e) => setEditingGoal({ ...editingGoal, target_amount: parseFloat(e.target.value) })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contribuição Mensal</Label>
                    <Input type="number" value={editingGoal.monthly_contribution || ''} onChange={(e) => setEditingGoal({ ...editingGoal, monthly_contribution: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <Button onClick={() => updateGoal(editingGoal.id, editingGoal)} className="w-full gradient-primary">Salvar Alterações</Button>
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
                Histórico: {activeHistoryGoal?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : goalTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum registo encontrado para esta meta.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {goalTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(tx.date), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-sm font-medium">{tx.description}</span>
                      </div>
                      <span className={cn(
                        "font-bold text-sm",
                        tx.type === 'income' ? "text-success" : "text-destructive"
                      )}>
                        {tx.type === 'income' ? '+' : '-'} Kz {tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => setHistoryDialogOpen(false)} className="w-full">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout >
  );
}
