import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Target, PiggyBank, Calendar, TrendingUp, Award, 
  Play, Pause, Trash2, Sparkles, Trophy, Star, Zap
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInMonths, addMonths, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

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

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  points: number | null;
  category: string | null;
  requirement: unknown;
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
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    monthly_contribution: '',
    interest_rate: '0',
    end_date: '',
    icon: '🎯',
    color: 'gray',
  });

  const [simulator, setSimulator] = useState({
    initial: 0,
    monthly: 5000,
    rate: 5,
    years: 5,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGoals(), fetchAchievements()]);
    setLoading(false);
  };

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar metas");
      return;
    }

    setGoals(data || []);
  };

  const fetchAchievements = async () => {
    const { data: allAchievements, error: achError } = await supabase
      .from('achievements')
      .select('*')
      .eq('category', 'savings');

    if (achError) {
      console.error('Error fetching achievements:', achError);
      return;
    }

    const { data: userAch } = await supabase
      .from('user_achievements')
      .select('achievement_id');

    setAchievements(allAchievements || []);
    setUserAchievements((userAch || []).map(a => a.achievement_id));
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
      toast.error("Erro ao criar meta");
      return;
    }

    toast.success("Meta criada com sucesso! 🎯");
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

  const makeDeposit = async () => {
    if (!selectedGoal || !depositAmount) {
      toast.error("Informe o valor do depósito");
      return;
    }

    const newSavedAmount = selectedGoal.saved_amount + parseFloat(depositAmount);
    const isCompleted = newSavedAmount >= selectedGoal.target_amount;

    const { error } = await supabase
      .from('savings_goals')
      .update({
        saved_amount: newSavedAmount,
        status: isCompleted ? 'completed' : 'active',
      })
      .eq('id', selectedGoal.id);

    if (error) {
      toast.error("Erro ao fazer depósito");
      return;
    }

    if (isCompleted) {
      toast.success("🎉 Parabéns! Você atingiu sua meta!", { duration: 5000 });
      // Check for achievement
      checkAndAwardAchievement();
    } else {
      toast.success("Depósito realizado com sucesso! 💰");
    }

    setDepositDialogOpen(false);
    setDepositAmount('');
    setSelectedGoal(null);
    fetchGoals();
  };

  const checkAndAwardAchievement = async () => {
    // Find the "goal completed" achievement
    const goalAchievement = achievements.find(a => 
      a.requirement && JSON.parse(JSON.stringify(a.requirement)).type === 'goal_completed'
    );
    
    if (goalAchievement && !userAchievements.includes(goalAchievement.id)) {
      await supabase
        .from('user_achievements')
        .insert({
          user_id: user?.id,
          achievement_id: goalAchievement.id,
        });
      
      toast.success(`🏆 Conquista desbloqueada: ${goalAchievement.name}!`, { duration: 5000 });
      fetchAchievements();
    }
  };

  const toggleGoalStatus = async (goal: SavingsGoal) => {
    const newStatus = goal.status === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase
      .from('savings_goals')
      .update({ status: newStatus })
      .eq('id', goal.id);

    if (error) {
      toast.error("Erro ao atualizar meta");
      return;
    }

    toast.success(newStatus === 'paused' ? "Meta pausada" : "Meta reativada");
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

  // Simulator calculations
  const calculateSimulation = () => {
    const { initial, monthly, rate, years } = simulator;
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;
    const data = [];
    
    let balance = initial;
    for (let m = 0; m <= months; m++) {
      data.push({
        month: m,
        saldo: Math.round(balance),
        contribuido: initial + (monthly * m),
      });
      balance = balance * (1 + monthlyRate) + monthly;
    }
    
    return data;
  };

  const simulationData = calculateSimulation();
  const finalBalance = simulationData[simulationData.length - 1]?.saldo || 0;
  const totalContributed = simulator.initial + (simulator.monthly * simulator.years * 12);
  const totalInterest = finalBalance - totalContributed;

  // Stats
  const totalSaved = goals.reduce((sum, g) => sum + g.saved_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;

  // Monthly schedule for active goals
  const monthlySchedule = goals
    .filter(g => g.status === 'active' && g.monthly_contribution > 0)
    .map(g => ({
      goal: g.name,
      amount: g.monthly_contribution,
      remaining: Math.ceil((g.target_amount - g.saved_amount) / g.monthly_contribution),
    }));

  const totalMonthlyContribution = monthlySchedule.reduce((sum, s) => sum + s.amount, 0);

  if (loading) {
    return (
      <AppLayout title="Metas de Poupança" subtitle="Alcance seus objetivos financeiros">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Metas de Poupança" subtitle="Alcance seus objetivos financeiros">
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card-savings p-6">
            <div className="flex items-center gap-3 mb-2">
              <PiggyBank className="h-5 w-5 text-savings" />
              <span className="text-sm text-muted-foreground">Total Poupado</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalSaved.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="stat-card-investment p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-investment" />
              <span className="text-sm text-muted-foreground">Meta Total</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalTarget.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="stat-card-income p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Metas Concluídas</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{completedGoals}</p>
          </div>

          <div className="card-finance p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Poupança Mensal</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalMonthlyContribution.toLocaleString('pt-AO')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Meta de Poupança</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Icon Selection */}
                <div className="space-y-2">
                  <Label>Tipo de Meta</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {GOAL_ICONS.map((g) => (
                      <button
                        key={g.name}
                        type="button"
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                          newGoal.icon === g.icon 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setNewGoal({ ...newGoal, icon: g.icon, color: g.color })}
                      >
                        <span className="text-2xl">{g.icon}</span>
                        <span className="text-xs text-muted-foreground">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome da Meta</Label>
                  <Input
                    placeholder="Ex: Fundo de emergência"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor da Meta (Kz)</Label>
                    <Input
                      type="number"
                      placeholder="500000"
                      value={newGoal.target_amount}
                      onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contribuição Mensal (Kz)</Label>
                    <Input
                      type="number"
                      placeholder="25000"
                      value={newGoal.monthly_contribution}
                      onChange={(e) => setNewGoal({ ...newGoal, monthly_contribution: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxa de Juros Anual (%)</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={newGoal.interest_rate}
                      onChange={(e) => setNewGoal({ ...newGoal, interest_rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Limite (Opcional)</Label>
                    <Input
                      type="date"
                      value={newGoal.end_date}
                      onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={createGoal} className="w-full" variant="accent">
                  <Target className="h-4 w-4 mr-2" />
                  Criar Meta
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Simulador de Poupança
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Simulador de Crescimento</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Inicial (Kz)</Label>
                    <Input
                      type="number"
                      value={simulator.initial}
                      onChange={(e) => setSimulator({ ...simulator, initial: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Depósito Mensal (Kz)</Label>
                    <Input
                      type="number"
                      value={simulator.monthly}
                      onChange={(e) => setSimulator({ ...simulator, monthly: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa Anual (%)</Label>
                    <Input
                      type="number"
                      value={simulator.rate}
                      onChange={(e) => setSimulator({ ...simulator, rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período (Anos)</Label>
                    <Input
                      type="number"
                      value={simulator.years}
                      onChange={(e) => setSimulator({ ...simulator, years: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulationData}>
                      <defs>
                        <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(200 90% 45%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(200 90% 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(v) => `${Math.floor(v/12)}a`}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(v: number) => `Kz ${v.toLocaleString()}`}
                        labelFormatter={(v) => `Mês ${v}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="saldo" 
                        stroke="hsl(200 90% 45%)" 
                        fill="url(#saldoGrad)" 
                        strokeWidth={2}
                        name="Saldo Total"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="contribuido" 
                        stroke="hsl(220 10% 45%)" 
                        strokeDasharray="5 5"
                        name="Total Contribuído"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="card-finance p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Saldo Final</p>
                    <p className="text-xl font-bold text-savings">Kz {finalBalance.toLocaleString()}</p>
                  </div>
                  <div className="card-finance p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Contribuído</p>
                    <p className="text-xl font-bold text-foreground">Kz {totalContributed.toLocaleString()}</p>
                  </div>
                  <div className="card-finance p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Juros Ganhos</p>
                    <p className="text-xl font-bold text-success">Kz {totalInterest.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="schedule">Cronograma</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="mt-6">
            {goals.length === 0 ? (
              <div className="card-finance p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma meta criada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece a poupar criando sua primeira meta financeira.
                </p>
                <Button variant="accent" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Meta
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => {
                  const progress = (goal.saved_amount / goal.target_amount) * 100;
                  const remaining = goal.target_amount - goal.saved_amount;
                  const monthsLeft = goal.monthly_contribution > 0 
                    ? Math.ceil(remaining / goal.monthly_contribution) 
                    : null;
                  
                  return (
                    <div 
                      key={goal.id} 
                      className={`card-finance group relative ${goal.status === 'completed' ? 'ring-2 ring-success' : ''}`}
                    >
                      {goal.status === 'completed' && (
                        <div className="absolute -top-2 -right-2 bg-success text-success-foreground rounded-full p-1">
                          <Trophy className="h-4 w-4" />
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{goal.icon || '🎯'}</span>
                          <div>
                            <h4 className="font-semibold text-foreground">{goal.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              goal.status === 'active' ? 'bg-success/20 text-success' :
                              goal.status === 'completed' ? 'bg-primary/20 text-primary' :
                              goal.status === 'paused' ? 'bg-warning/20 text-warning' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {goal.status === 'active' ? 'Ativa' :
                               goal.status === 'completed' ? 'Concluída' :
                               goal.status === 'paused' ? 'Pausada' : 'Cancelada'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {goal.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleGoalStatus(goal)}
                            >
                              {goal.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Poupado</p>
                            <p className="font-semibold text-success">
                              Kz {goal.saved_amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Meta</p>
                            <p className="font-semibold text-foreground">
                              Kz {goal.target_amount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {monthsLeft && goal.status === 'active' && (
                          <p className="text-xs text-muted-foreground text-center">
                            ~{monthsLeft} {monthsLeft === 1 ? 'mês' : 'meses'} restantes
                          </p>
                        )}

                        {goal.status === 'active' && (
                          <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setDepositDialogOpen(true);
                            }}
                          >
                            <PiggyBank className="h-4 w-4 mr-2" />
                            Depositar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <div className="card-finance">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Cronograma de Poupança Mensal
              </h3>
              
              {monthlySchedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma contribuição mensal programada.</p>
                  <p className="text-sm mt-1">Defina contribuições mensais nas suas metas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlySchedule.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-savings/20 flex items-center justify-center">
                          <PiggyBank className="h-5 w-5 text-savings" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.goal}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.remaining} {item.remaining === 1 ? 'mês' : 'meses'} restantes
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-savings">
                        Kz {item.amount.toLocaleString()}/mês
                      </p>
                    </div>
                  ))}
                  
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Total Mensal</p>
                      <p className="text-xl font-bold text-savings">
                        Kz {totalMonthlyContribution.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach) => {
                const isUnlocked = userAchievements.includes(ach.id);
                return (
                  <div 
                    key={ach.id}
                    className={`card-finance relative transition-all ${
                      isUnlocked ? 'ring-2 ring-accent' : 'opacity-60'
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute -top-2 -right-2">
                        <Star className="h-6 w-6 text-accent fill-accent" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                        isUnlocked ? 'bg-accent/20' : 'bg-muted'
                      }`}>
                        {ach.icon === 'PiggyBank' ? <PiggyBank className="h-7 w-7" /> :
                         ach.icon === 'Target' ? <Target className="h-7 w-7" /> :
                         <Award className="h-7 w-7" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{ach.name}</h4>
                        <p className="text-sm text-muted-foreground">{ach.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Zap className="h-3 w-3 text-accent" />
                          <span className="text-xs font-medium text-accent">{ach.points} pontos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Deposit Dialog */}
        <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Fazer Depósito</DialogTitle>
            </DialogHeader>
            {selectedGoal && (
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Meta</p>
                  <p className="font-semibold text-foreground">{selectedGoal.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Faltam Kz {(selectedGoal.target_amount - selectedGoal.saved_amount).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Valor do Depósito (Kz)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>

                <Button onClick={makeDeposit} className="w-full" variant="accent">
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Confirmar Depósito
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
