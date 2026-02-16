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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Briefcase,
  Plus,
  TrendingUp,
  Wallet,
  ShoppingCart,
  Wrench,
  Building,
  Laptop,
  Home,
  DollarSign,
  Calendar,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Scale,
  Activity,
  Zap,
} from "lucide-react";
import { IncomeAnalysisCard } from "@/components/income/IncomeAnalysisCard";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import { useCurrency } from "@/contexts/CurrencyContext";

const businessTypes = [
  { value: "bico", label: "Bico (Biscate)", icon: Wrench },
  { value: "micro_business", label: "Micro-negócio", icon: ShoppingCart },
  { value: "business", label: "Negócio Estruturado", icon: Building },
  { value: "investment", label: "Investimento", icon: TrendingUp },
  { value: "passive_income", label: "Renda Passiva", icon: Home },
];

const categoryOptions = [
  { value: "e-commerce", label: "E-commerce" },
  { value: "services", label: "Serviços" },
  { value: "food", label: "Alimentação" },
  { value: "fashion", label: "Moda" },
  { value: "tech", label: "Tecnologia" },
  { value: "transport", label: "Transporte" },
  { value: "rentals", label: "Aluguéis" },
  { value: "consulting", label: "Consultoria" },
  { value: "other", label: "Outro" },
];


export default function Income() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpsDialogOpen, setIsOpsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [opType, setOpType] = useState<'deposit' | 'withdraw'>('deposit');
  const [opAmount, setOpAmount] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    business_type: "bico" as const,
    category: "",
    monthly_revenue: "",
    monthly_expenses: "",
    initial_investment: "",
    start_date: "",
    hours_per_week: "",
    income_type: "active",
    scalability: "non_scalable",
    risk_level: "low",
    risk_type: "financial",
    growth_potential: "medium",
    seasonality: "none",
  });

  // Fetch income sources
  const { data: incomeSources = [], isLoading } = useQuery({
    queryKey: ["income-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_sources")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create income source mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const incomeData = {
        user_id: user?.id,
        name: data.name,
        description: data.description || null,
        business_type: data.business_type,
        category: data.category || null,
        monthly_revenue: parseFloat(data.monthly_revenue) || 0,
        monthly_expenses: parseFloat(data.monthly_expenses) || 0,
        initial_investment: parseFloat(data.initial_investment) || 0,
        start_date: data.start_date || null,
        hours_per_week: parseFloat(data.hours_per_week) || 0,
        income_type: data.income_type,
        scalability: data.scalability,
        risk_level: data.risk_level,
        risk_type: data.risk_type,
        growth_potential: data.growth_potential,
        seasonality: data.seasonality,
        // Calculate/Guess action based on simple logic (can be refined)
        action_recommendation: 'maintain'
      };

      if (editingId) {
        const { user_id, ...updateData } = incomeData;
        const { error } = await supabase
          .from("income_sources")
          .update(updateData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("income_sources")
          .insert(incomeData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-sources"] });
      toast.success(editingId ? "Fonte de renda atualizada!" : "Fonte de renda criada!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Erro na fonte de renda:", error);
      toast.error(
        (editingId ? "Erro ao atualizar: " : "Erro ao criar: ") +
        (error.message || "Erro desconhecido")
      );
    },
  });

  // Operation mutation (Deposit/Withdraw)
  const operationMutation = useMutation({
    mutationFn: async ({ sourceId, amount, type, currentBalance }: { sourceId: string, amount: number, type: 'deposit' | 'withdraw', currentBalance: number }) => {
      const newBalance = type === 'deposit' ? currentBalance + amount : currentBalance - amount;

      // 1. Update income source balance
      const { error: updateError } = await (supabase
        .from("income_sources") as any)
        .update({ current_balance: newBalance })
        .eq("id", sourceId);

      if (updateError) throw updateError;

      // 2. Create corresponding transaction
      const { error: transError } = await supabase
        .from("transactions")
        .insert({
          user_id: user?.id,
          amount: amount,
          type: type === 'deposit' ? 'expense' : 'income',
          description: type === 'deposit' ? `Investimento em ${selectedSource?.name}` : `Retirada de lucro de ${selectedSource?.name}`,
          income_source_id: sourceId,
          date: new Date().toISOString().split('T')[0]
        });

      if (transError) throw transError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-sources"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
      toast.success(opType === 'deposit' ? "Depósito realizado!" : "Retirada realizada!");
      setIsOpsDialogOpen(false);
      setOpAmount("");
    },
    onError: (error: any) => {
      toast.error("Erro na operação: " + (error.message || "Erro desconhecido"));
    }
  });

  // Fetch history
  const { data: history = [] } = useQuery({
    queryKey: ["income-history", selectedSource?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("transactions") as any)
        .select("*")
        .eq("income_source_id", selectedSource?.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSource?.id && isHistoryDialogOpen,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("income_sources")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-sources"] });
      toast.success("Fonte de renda eliminada!");
    },
    onError: () => {
      toast.error("Erro ao eliminar fonte de renda");
    },
  });

  const handleEdit = (source: any) => {
    setEditingId(source.id);
    setFormData({
      name: source.name,
      description: source.description || "",
      business_type: source.business_type,
      category: source.category || "",
      monthly_revenue: source.monthly_revenue?.toString() || "",
      monthly_expenses: source.monthly_expenses?.toString() || "",
      initial_investment: source.initial_investment?.toString() || "",
      start_date: source.start_date || "",
      hours_per_week: source.hours_per_week?.toString() || "",
      income_type: source.income_type || "active",
      scalability: source.scalability || "non_scalable",
      risk_level: source.risk_level || "low",
      risk_type: source.risk_type || "financial",
      growth_potential: source.growth_potential || "medium",
      seasonality: source.seasonality || "none",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja eliminar esta fonte de renda?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeposit = (source: any) => {
    setSelectedSource(source);
    setOpType('deposit');
    setIsOpsDialogOpen(true);
  };

  const handleWithdraw = (source: any) => {
    setSelectedSource(source);
    setOpType('withdraw');
    setIsOpsDialogOpen(true);
  };

  const handleHistory = (source: any) => {
    setSelectedSource(source);
    setIsHistoryDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      business_type: "bico",
      category: "",
      monthly_revenue: "",
      monthly_expenses: "",
      initial_investment: "",
      start_date: "",
      hours_per_week: "",
      income_type: "active",
      scalability: "non_scalable",
      risk_level: "low",
      risk_type: "financial",
      growth_potential: "medium",
      seasonality: "none",
    });
    setEditingId(null);
  };

  // Calculate totals
  const totalRevenue = incomeSources.reduce((acc, source) => acc + (source.monthly_revenue || 0), 0);
  const totalExpenses = incomeSources.reduce((acc, source) => acc + (source.monthly_expenses || 0), 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalInvestment = incomeSources.reduce((acc, source) => acc + (source.initial_investment || 0), 0);

  const getBusinessTypeIcon = (type: string) => {
    const businessType = businessTypes.find(t => t.value === type);
    return businessType?.icon || Briefcase;
  };

  const getBusinessTypeLabel = (type: string) => {
    const businessType = businessTypes.find(t => t.value === type);
    return businessType?.label || type;
  };

  return (
    <AppLayout title="Renda Extra & Negócios" subtitle="Gerencie suas fontes de renda adicionais">
      <ModuleGuard
        moduleKey="basic"
        title="Renda Extra & Negócios"
        description="Gerencie os seus pequenos negócios, biscates e fontes de renda passiva. Acompanhe lucros, investimentos e escalabilidade."
      >
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="stat-card-income">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{formatPrice(totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Receita Mensal</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card-expense">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{formatPrice(totalExpenses)}</p>
                    <p className="text-sm text-muted-foreground">Despesas Mensais</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={netIncome >= 0 ? "stat-card-income" : "stat-card-expense"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${netIncome >= 0 ? "bg-success/20" : "bg-destructive/20"
                    }`}>
                    <DollarSign className={`h-5 w-5 ${netIncome >= 0 ? "text-success" : "text-destructive"}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${netIncome >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatPrice(netIncome)}
                    </p>
                    <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card-investment">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-finance-investment/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-finance-investment" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-finance-investment">{formatPrice(totalInvestment)}</p>
                    <p className="text-sm text-muted-foreground">Total Investido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ideas Section */}
          <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-500" />
                Ideias de Renda Extra para Angola
              </CardTitle>
              <CardDescription>
                Explore oportunidades de negócio adaptadas à realidade angolana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Venda de Roupa", profit: "100-500k Kz/mês", icon: ShoppingCart },
                  { name: "Transporte (Kupapata)", profit: "200-800k Kz/mês", icon: Building },
                  { name: "Serviços de TI", profit: "300k-2M Kz/mês", icon: Laptop },
                  { name: "Aluguéis", profit: "100k-1M Kz/mês", icon: Home },
                ].map((idea, index) => (
                  <div key={index} className="p-4 bg-white/50 dark:bg-white/5 rounded-lg text-center">
                    <idea.icon className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                    <p className="font-medium text-sm">{idea.name}</p>
                    <p className="text-xs text-muted-foreground">{idea.profit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Income Sources List */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Minhas Fontes de Renda</h2>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) resetForm();
              setIsDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fonte
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Fonte de Renda" : "Nova Fonte de Renda"}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createMutation.mutate(formData);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Loja de Roupas Online"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Negócio</Label>
                      <Select
                        value={formData.business_type}
                        onValueChange={(value: typeof formData.business_type) =>
                          setFormData(prev => ({ ...prev, business_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((type) => (
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

                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Receita Mensal (Kz)</Label>
                      <Input
                        type="number"
                        value={formData.monthly_revenue}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthly_revenue: e.target.value }))}
                        placeholder="500.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Despesas Mensais (Kz)</Label>
                      <Input
                        type="number"
                        value={formData.monthly_expenses}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthly_expenses: e.target.value }))}
                        placeholder="200.000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Investimento Inicial (Kz)</Label>
                      <Input
                        type="number"
                        value={formData.initial_investment}
                        onChange={(e) => setFormData(prev => ({ ...prev, initial_investment: e.target.value }))}
                        placeholder="1.000.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horas por Semana</Label>
                      <Input
                        type="number"
                        value={formData.hours_per_week}
                        onChange={(e) => setFormData(prev => ({ ...prev, hours_per_week: e.target.value }))}
                        placeholder="Ex: 10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Renda</Label>
                      <Select
                        value={formData.income_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, income_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">🕒 Ativa (Troca tempo por dinheiro)</SelectItem>
                          <SelectItem value="semi_passive">⚙️ Semi-Passiva</SelectItem>
                          <SelectItem value="passive">💰 Passiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Escalabilidade</Label>
                      <Select
                        value={formData.scalability}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, scalability: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scalable">🚀 Escalável</SelectItem>
                          <SelectItem value="non_scalable">❌ Não Escalável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Potencial de Crescimento</Label>
                      <Select
                        value={formData.growth_potential}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, growth_potential: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Alto</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="stagnant">Estagnado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sazonalidade (Comum em Angola)</Label>
                    <Select
                      value={formData.seasonality}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, seasonality: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma (Estável)</SelectItem>
                        <SelectItem value="festive">Festas (Dezembro/Festas)</SelectItem>
                        <SelectItem value="dry_season">Cacimbo (Jun-Ago)</SelectItem>
                        <SelectItem value="rainy_season">Chuvas (Set-Abr)</SelectItem>
                        <SelectItem value="school">Escolar (Início de aulas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nível de Risco</Label>
                      <Select
                        value={formData.risk_level}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, risk_level: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 Baixo</SelectItem>
                          <SelectItem value="medium">🟡 Médio</SelectItem>
                          <SelectItem value="high">🔴 Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Risco</Label>
                      <Select
                        value={formData.risk_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, risk_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="financial">Financeiro</SelectItem>
                          <SelectItem value="physical">Físico</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="market">Mercado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o seu negócio..."
                      rows={2}
                    />
                  </div>

                  <Button type="submit" className="w-full gradient-primary" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Salvando..." : editingId ? "Atualizar Fonte" : "Criar Fonte de Renda"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

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
          ) : incomeSources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma fonte de renda extra</h3>
                <p className="text-muted-foreground mb-4">
                  Comece a registrar suas fontes de renda adicionais para melhor controle financeiro.
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Fonte
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {incomeSources.map((source) => (
                <IncomeAnalysisCard
                  key={source.id}
                  income={source}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDeposit={handleDeposit}
                  onWithdraw={handleWithdraw}
                  onHistory={handleHistory}
                />
              ))}
            </div>
          )}

          {/* Operations Dialog */}
          <Dialog open={isOpsDialogOpen} onOpenChange={setIsOpsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {opType === 'deposit' ? `Depositar em ${selectedSource?.name}` : `Retirar de ${selectedSource?.name}`}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Valor (Kz)</Label>
                  <Input
                    type="number"
                    value={opAmount}
                    onChange={(e) => setOpAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <Button
                  className="w-full gradient-primary"
                  onClick={() => {
                    const amount = parseFloat(opAmount);
                    if (isNaN(amount) || amount <= 0) {
                      toast.error("Insira um valor válido");
                      return;
                    }
                    operationMutation.mutate({
                      sourceId: selectedSource.id,
                      amount,
                      type: opType,
                      currentBalance: selectedSource.current_balance || 0
                    });
                  }}
                  disabled={operationMutation.isPending}
                >
                  {operationMutation.isPending ? "Processando..." : opType === 'deposit' ? "Confirmar Depósito" : "Confirmar Retirada"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* History Dialog */}
          <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Histórico: {selectedSource?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mt-4">
                {history.length > 0 ? (
                  history.map((h: any) => {
                    const isInvestment = h.description?.includes("Investimento");
                    const isWithdrawal = h.description?.includes("Retirada");

                    return (
                      <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isInvestment ? 'bg-investment/20 text-investment' :
                            isWithdrawal ? 'bg-destructive/20 text-destructive' :
                              h.type === 'income' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                            }`}>
                            {isInvestment ? <ArrowUpRight className="h-4 w-4" /> :
                              isWithdrawal ? <ArrowDownRight className="h-4 w-4" /> :
                                h.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{h.description}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(h.date), "dd/MM/yyyy")}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${isInvestment ? 'text-investment' :
                          isWithdrawal ? 'text-destructive' :
                            h.type === 'income' ? 'text-success' : 'text-destructive'
                          }`}>
                          {isInvestment ? '+' : isWithdrawal ? '-' : h.type === 'income' ? '+' : '-'}{h.amount.toLocaleString()} Kz
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhum movimento registrado</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </ModuleGuard>
    </AppLayout>
  );
}
