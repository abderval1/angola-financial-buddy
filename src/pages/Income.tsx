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
} from "lucide-react";

const businessTypes = [
  { value: "side_hustle", label: "Biscate", icon: Wrench },
  { value: "freelance", label: "Freelance", icon: Laptop },
  { value: "small_business", label: "Pequeno Negócio", icon: Building },
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function Income() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    business_type: "side_hustle" as const,
    category: "",
    monthly_revenue: "",
    monthly_expenses: "",
    initial_investment: "",
    start_date: "",
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
      const { error } = await supabase.from("income_sources").insert({
        user_id: user?.id,
        name: data.name,
        description: data.description || null,
        business_type: data.business_type,
        category: data.category || null,
        monthly_revenue: parseFloat(data.monthly_revenue) || 0,
        monthly_expenses: parseFloat(data.monthly_expenses) || 0,
        initial_investment: parseFloat(data.initial_investment) || 0,
        start_date: data.start_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-sources"] });
      toast.success("Fonte de renda criada!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar fonte de renda");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      business_type: "side_hustle",
      category: "",
      monthly_revenue: "",
      monthly_expenses: "",
      initial_investment: "",
      start_date: "",
    });
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
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="stat-card-income">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
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
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                  <p className="text-sm text-muted-foreground">Despesas Mensais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={netIncome >= 0 ? "stat-card-income" : "stat-card-expense"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  netIncome >= 0 ? "bg-success/20" : "bg-destructive/20"
                }`}>
                  <DollarSign className={`h-5 w-5 ${netIncome >= 0 ? "text-success" : "text-destructive"}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${netIncome >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(netIncome)}
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
                  <p className="text-2xl font-bold text-finance-investment">{formatCurrency(totalInvestment)}</p>
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Fonte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Fonte de Renda</DialogTitle>
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
                  {createMutation.isPending ? "Criando..." : "Criar Fonte de Renda"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeSources.map((source) => {
              const BusinessIcon = getBusinessTypeIcon(source.business_type);
              const profit = (source.monthly_revenue || 0) - (source.monthly_expenses || 0);
              const roi = source.initial_investment && source.initial_investment > 0
                ? ((profit * 12) / source.initial_investment) * 100
                : 0;

              return (
                <Card key={source.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BusinessIcon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline">
                        {getBusinessTypeLabel(source.business_type)}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-lg mb-1">{source.name}</h3>
                    {source.category && (
                      <p className="text-sm text-muted-foreground mb-4">{source.category}</p>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Receita</span>
                        <span className="font-medium text-success">
                          +{formatCurrency(source.monthly_revenue || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Despesas</span>
                        <span className="font-medium text-destructive">
                          -{formatCurrency(source.monthly_expenses || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="font-medium">Lucro</span>
                        <span className={`font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(profit)}
                        </span>
                      </div>
                      {roi > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">ROI Anual</span>
                          <span className="font-medium text-finance-investment">
                            {roi.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
