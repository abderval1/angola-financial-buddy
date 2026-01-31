import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Target,
  Plus,
  Flame,
  TrendingUp,
  Calendar,
  Wallet,
  Home,
  Car,
  GraduationCap,
  Plane,
  Shield,
  Calculator,
  ChevronRight,
} from "lucide-react";

const goalTypes = [
  { value: "emergency_fund", label: "Fundo de Emergência", icon: Shield },
  { value: "retirement", label: "Aposentadoria", icon: Target },
  { value: "house", label: "Casa Própria", icon: Home },
  { value: "car", label: "Veículo", icon: Car },
  { value: "education", label: "Educação", icon: GraduationCap },
  { value: "travel", label: "Viagem", icon: Plane },
  { value: "fire_number", label: "Número FIRE", icon: Flame },
  { value: "other", label: "Outro", icon: Target },
];

const fireTypes = [
  { value: "lean", label: "Lean FIRE", description: "Vida minimalista, despesas baixas" },
  { value: "regular", label: "FIRE Regular", description: "Estilo de vida moderado" },
  { value: "fat", label: "Fat FIRE", description: "Vida confortável, despesas altas" },
  { value: "coast", label: "Coast FIRE", description: "Investir agora, parar de poupar depois" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function Goals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  
  // FIRE Calculator state
  const [fireCalc, setFireCalc] = useState({
    monthlyExpenses: 500000,
    currentSavings: 1000000,
    monthlySavings: 200000,
    expectedReturn: 8,
    inflationRate: 20,
    withdrawalRate: 4,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: "",
    monthly_contribution: "",
    goal_type: "other",
    target_date: "",
    is_fire_goal: false,
    fire_type: "",
    annual_expenses: "",
    safe_withdrawal_rate: "4",
  });

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["financial-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: typeof formData) => {
      const { error } = await supabase.from("financial_goals").insert({
        user_id: user?.id,
        name: goalData.name,
        description: goalData.description || null,
        target_amount: parseFloat(goalData.target_amount),
        monthly_contribution: parseFloat(goalData.monthly_contribution) || 0,
        goal_type: goalData.goal_type,
        target_date: goalData.target_date || null,
        is_fire_goal: goalData.is_fire_goal,
        fire_type: goalData.is_fire_goal ? goalData.fire_type : null,
        annual_expenses: goalData.annual_expenses ? parseFloat(goalData.annual_expenses) : null,
        safe_withdrawal_rate: parseFloat(goalData.safe_withdrawal_rate) || 4,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      toast.success("Meta criada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar meta");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      target_amount: "",
      monthly_contribution: "",
      goal_type: "other",
      target_date: "",
      is_fire_goal: false,
      fire_type: "",
      annual_expenses: "",
      safe_withdrawal_rate: "4",
    });
  };

  // FIRE calculations
  const calculateFireNumber = () => {
    const annualExpenses = fireCalc.monthlyExpenses * 12;
    const fireNumber = annualExpenses / (fireCalc.withdrawalRate / 100);
    return fireNumber;
  };

  const calculateYearsToFire = () => {
    const fireNumber = calculateFireNumber();
    const realReturn = (fireCalc.expectedReturn - fireCalc.inflationRate) / 100;
    
    if (realReturn <= 0) return Infinity;
    
    let currentSavings = fireCalc.currentSavings;
    let years = 0;
    
    while (currentSavings < fireNumber && years < 100) {
      currentSavings = currentSavings * (1 + realReturn) + (fireCalc.monthlySavings * 12);
      years++;
    }
    
    return years;
  };

  const fireNumber = calculateFireNumber();
  const yearsToFire = calculateYearsToFire();
  const fireProgress = Math.min((fireCalc.currentSavings / fireNumber) * 100, 100);

  const filteredGoals = selectedTab === "all" 
    ? goals 
    : selectedTab === "fire" 
      ? goals.filter(g => g.is_fire_goal)
      : goals.filter(g => !g.is_fire_goal && g.goal_type === selectedTab);

  const getGoalIcon = (type: string) => {
    const goalType = goalTypes.find(t => t.value === type);
    return goalType?.icon || Target;
  };

  return (
    <AppLayout title="Metas & Objetivos" subtitle="Planeje seu futuro financeiro com o método FIRE">
      <div className="space-y-6">
        {/* FIRE Calculator Card */}
        <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Calculadora FIRE</CardTitle>
                  <CardDescription>Financial Independence, Retire Early</CardDescription>
                </div>
              </div>
              <Badge className="badge-fire">
                <Flame className="h-3 w-3 mr-1" />
                Método FIRE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Calculator Inputs */}
              <div className="space-y-4">
                <div>
                  <Label>Despesas Mensais (Kz)</Label>
                  <Input
                    type="number"
                    value={fireCalc.monthlyExpenses}
                    onChange={(e) => setFireCalc(prev => ({ ...prev, monthlyExpenses: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Poupança Atual (Kz)</Label>
                  <Input
                    type="number"
                    value={fireCalc.currentSavings}
                    onChange={(e) => setFireCalc(prev => ({ ...prev, currentSavings: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Poupança Mensal (Kz)</Label>
                  <Input
                    type="number"
                    value={fireCalc.monthlySavings}
                    onChange={(e) => setFireCalc(prev => ({ ...prev, monthlySavings: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Retorno Esperado (%/ano)</Label>
                  <Input
                    type="number"
                    value={fireCalc.expectedReturn}
                    onChange={(e) => setFireCalc(prev => ({ ...prev, expectedReturn: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Inflação Estimada (%/ano)</Label>
                  <Input
                    type="number"
                    value={fireCalc.inflationRate}
                    onChange={(e) => setFireCalc(prev => ({ ...prev, inflationRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Taxa de Retirada Segura (%)</Label>
                  <Input
                    type="number"
                    value={fireCalc.withdrawalRate}
                    onChange={(e) => setFireCalc(prev => ({ ...prev, withdrawalRate: parseFloat(e.target.value) || 4 }))}
                  />
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4 bg-white/50 dark:bg-white/5 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Seu Número FIRE</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(fireNumber)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span className="font-medium">{fireProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={fireProgress} className="h-3" />
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground mb-1">Anos até FIRE</p>
                  <p className="text-2xl font-bold text-primary">
                    {yearsToFire === Infinity ? "∞" : `${yearsToFire} anos`}
                  </p>
                </div>

                <Button className="w-full gradient-accent text-accent-foreground">
                  <Calculator className="h-4 w-4 mr-2" />
                  Simular Cenários
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Section */}
        <div className="flex items-center justify-between">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="fire" className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  FIRE
                </TabsTrigger>
                <TabsTrigger value="emergency_fund">Emergência</TabsTrigger>
                <TabsTrigger value="house">Casa</TabsTrigger>
              </TabsList>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Meta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Meta</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createGoalMutation.mutate(formData);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Nome da Meta</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Fundo de Emergência"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Meta</Label>
                      <Select
                        value={formData.goal_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, goal_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {goalTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valor Alvo (Kz)</Label>
                        <Input
                          type="number"
                          value={formData.target_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                          placeholder="5.000.000"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contribuição Mensal (Kz)</Label>
                        <Input
                          type="number"
                          value={formData.monthly_contribution}
                          onChange={(e) => setFormData(prev => ({ ...prev, monthly_contribution: e.target.value }))}
                          placeholder="200.000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Data Alvo</Label>
                      <Input
                        type="date"
                        value={formData.target_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-amber-500" />
                        <span className="font-medium">Meta FIRE</span>
                      </div>
                      <Switch
                        checked={formData.is_fire_goal}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_fire_goal: checked }))}
                      />
                    </div>

                    {formData.is_fire_goal && (
                      <div className="space-y-4 p-4 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="space-y-2">
                          <Label>Tipo de FIRE</Label>
                          <Select
                            value={formData.fire_type}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, fire_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {fireTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Despesas Anuais (Kz)</Label>
                            <Input
                              type="number"
                              value={formData.annual_expenses}
                              onChange={(e) => setFormData(prev => ({ ...prev, annual_expenses: e.target.value }))}
                              placeholder="6.000.000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Taxa de Retirada (%)</Label>
                            <Input
                              type="number"
                              value={formData.safe_withdrawal_rate}
                              onChange={(e) => setFormData(prev => ({ ...prev, safe_withdrawal_rate: e.target.value }))}
                              placeholder="4"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva sua meta..."
                        rows={2}
                      />
                    </div>

                    <Button type="submit" className="w-full gradient-primary" disabled={createGoalMutation.isPending}>
                      {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <TabsContent value={selectedTab} className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-32 bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredGoals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma meta ainda</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece a planejar seu futuro financeiro criando sua primeira meta.
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Meta
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGoals.map((goal) => {
                    const GoalIcon = getGoalIcon(goal.goal_type);
                    const progress = goal.target_amount > 0 
                      ? ((goal.current_amount || 0) / goal.target_amount) * 100 
                      : 0;

                    return (
                      <Card key={goal.id} className={goal.is_fire_goal ? "border-amber-500/30" : ""}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                              goal.is_fire_goal 
                                ? "bg-gradient-to-br from-amber-500 to-orange-500" 
                                : "bg-primary/10"
                            }`}>
                              {goal.is_fire_goal ? (
                                <Flame className="h-6 w-6 text-white" />
                              ) : (
                                <GoalIcon className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            {goal.is_fire_goal && (
                              <Badge className="badge-fire text-xs">FIRE</Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg mb-1">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {goal.description}
                            </p>
                          )}

                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-medium">{progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatCurrency(goal.current_amount || 0)}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(goal.target_amount)}
                              </span>
                            </div>

                            {goal.target_date && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Meta: {new Date(goal.target_date).toLocaleDateString("pt-AO")}</span>
                              </div>
                            )}
                          </div>

                          <Button variant="ghost" className="w-full mt-4 group">
                            Ver Detalhes
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
