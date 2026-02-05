import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, TrendingUp, TrendingDown, Trash2, Edit2, 
  Wallet, PieChart, BarChart3, Coins, Building, Landmark, LineChart,
  ChevronRight, Calendar, Eye
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

// Import new components
import { InvestmentPortfolioSummary } from "@/components/investments/InvestmentPortfolioSummary";
import { InvestmentQuickActions } from "@/components/investments/InvestmentQuickActions";
import { InvestmentProducts } from "@/components/investments/InvestmentProducts";
import { InvestmentSimulator } from "@/components/investments/InvestmentSimulator";
import { InvestmentEducation } from "@/components/investments/InvestmentEducation";
import { InvestmentOrderBook } from "@/components/investments/InvestmentOrderBook";

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number | null;
  expected_return: number | null;
  actual_return: number | null;
  start_date: string | null;
  maturity_date: string | null;
  risk_level: string | null;
  status: string | null;
  notes: string | null;
}

const INVESTMENT_TYPES = [
  { value: 'poupanca', label: 'Poupança', icon: '🏦', color: 'hsl(160 84% 39%)' },
  { value: 'deposito_prazo', label: 'Depósito a Prazo', icon: '📅', color: 'hsl(200 90% 45%)' },
  { value: 'obrigacoes', label: 'Obrigações do Tesouro', icon: '🏛️', color: 'hsl(270 60% 55%)' },
  { value: 'acoes', label: 'Ações', icon: '📈', color: 'hsl(25 95% 53%)' },
  { value: 'fundos', label: 'Fundos de Investimento', icon: '💼', color: 'hsl(340 75% 55%)' },
  { value: 'imobiliario', label: 'Imobiliário', icon: '🏠', color: 'hsl(45 93% 47%)' },
  { value: 'cripto', label: 'Criptomoedas', icon: '₿', color: 'hsl(30 100% 50%)' },
  { value: 'outro', label: 'Outro', icon: '💰', color: 'hsl(220 10% 45%)' },
];

const RISK_LEVELS = [
  { value: 'low', label: 'Baixo', color: 'text-success' },
  { value: 'medium', label: 'Médio', color: 'text-warning' },
  { value: 'high', label: 'Alto', color: 'text-destructive' },
];

export default function Investments() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [activeView, setActiveView] = useState<"home" | "details">("home");

  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: '',
    amount: '',
    current_value: '',
    expected_return: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    maturity_date: '',
    risk_level: 'medium',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  const fetchInvestments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar investimentos");
      return;
    }

    setInvestments(data || []);
    setLoading(false);
  };

  const createOrUpdateInvestment = async () => {
    if (!newInvestment.name || !newInvestment.type || !newInvestment.amount) {
      toast.error("Preencha nome, tipo e valor investido");
      return;
    }

    const investmentData = {
      user_id: user?.id,
      name: newInvestment.name,
      type: newInvestment.type,
      amount: parseFloat(newInvestment.amount),
      current_value: parseFloat(newInvestment.current_value) || parseFloat(newInvestment.amount),
      expected_return: parseFloat(newInvestment.expected_return) || null,
      start_date: newInvestment.start_date || null,
      maturity_date: newInvestment.maturity_date || null,
      risk_level: newInvestment.risk_level,
      notes: newInvestment.notes || null,
      status: 'active',
    };

    if (editingInvestment) {
      const { error } = await supabase
        .from('investments')
        .update(investmentData)
        .eq('id', editingInvestment.id);

      if (error) {
        toast.error("Erro ao atualizar investimento");
        return;
      }
      toast.success("Investimento atualizado!");
    } else {
      const { error } = await supabase
        .from('investments')
        .insert(investmentData);

      if (error) {
        toast.error("Erro ao criar investimento");
        return;
      }
      toast.success("Investimento registrado! 📈");
    }

    resetForm();
    fetchInvestments();
  };

  const deleteInvestment = async (id: string) => {
    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir investimento");
      return;
    }

    toast.success("Investimento excluído");
    fetchInvestments();
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingInvestment(null);
    setNewInvestment({
      name: '',
      type: '',
      amount: '',
      current_value: '',
      expected_return: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      maturity_date: '',
      risk_level: 'medium',
      notes: '',
    });
  };

  const openEditDialog = (investment: Investment) => {
    setEditingInvestment(investment);
    setNewInvestment({
      name: investment.name,
      type: investment.type,
      amount: investment.amount.toString(),
      current_value: investment.current_value?.toString() || '',
      expected_return: investment.expected_return?.toString() || '',
      start_date: investment.start_date || '',
      maturity_date: investment.maturity_date || '',
      risk_level: investment.risk_level || 'medium',
      notes: investment.notes || '',
    });
    setDialogOpen(true);
  };

  // Stats
  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
  const totalCurrentValue = investments.reduce((sum, i) => sum + (i.current_value || i.amount), 0);
  const totalReturn = totalCurrentValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const monthlyReturn = useMemo(() => {
    // Simplified monthly return estimate
    return totalReturn > 0 ? totalReturn * 0.08 : 0;
  }, [totalReturn]);

  // Determine risk profile based on investments
  const riskProfile = useMemo(() => {
    if (investments.length === 0) return "conservative" as const;
    const riskScores = investments.map(i => {
      switch (i.risk_level) {
        case "high": return 3;
        case "medium": return 2;
        default: return 1;
      }
    });
    const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    if (avgRisk > 2.3) return "aggressive" as const;
    if (avgRisk > 1.5) return "moderate" as const;
    return "conservative" as const;
  }, [investments]);

  // Portfolio by type
  const portfolioByType = INVESTMENT_TYPES.map(type => {
    const typeInvestments = investments.filter(i => i.type === type.value);
    const totalValue = typeInvestments.reduce((sum, i) => sum + (i.current_value || i.amount), 0);
    return {
      name: type.label,
      value: totalValue,
      color: type.color,
      icon: type.icon,
    };
  }).filter(t => t.value > 0);

  const getTypeInfo = (type: string) => {
    return INVESTMENT_TYPES.find(t => t.value === type) || INVESTMENT_TYPES[INVESTMENT_TYPES.length - 1];
  };

  const getRiskInfo = (risk: string | null) => {
    return RISK_LEVELS.find(r => r.value === risk) || RISK_LEVELS[1];
  };

  const calculateReturnPercentage = (investment: Investment) => {
    const currentValue = investment.current_value || investment.amount;
    return ((currentValue - investment.amount) / investment.amount) * 100;
  };

  if (loading) {
    return (
      <AppLayout title="Investimentos" subtitle="Sua carteira de investimentos">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Investimentos" subtitle="Sua carteira de investimentos">
      <div className="space-y-6 animate-fade-in">
        {/* View Toggle */}
        {investments.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant={activeView === "home" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("home")}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Visão Geral
            </Button>
            <Button
              variant={activeView === "details" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView("details")}
            >
              <Eye className="h-4 w-4 mr-2" />
              Meus Investimentos
            </Button>
          </div>
        )}

        {activeView === "home" ? (
          <>
            {/* Portfolio Summary */}
            <InvestmentPortfolioSummary
              totalInvested={totalInvested}
              totalCurrentValue={totalCurrentValue}
              totalReturn={totalReturn}
              returnPercentage={returnPercentage}
              monthlyReturn={monthlyReturn}
              riskProfile={riskProfile}
            />


            {/* Quick Actions */}
            <InvestmentQuickActions
              onInvestNow={() => setDialogOpen(true)}
              onReinvest={() => setDialogOpen(true)}
              onWithdraw={() => toast.info("Funcionalidade de resgate em breve!")}
              onViewDetails={() => setActiveView("details")}
            />

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Investment Products */}
              <InvestmentProducts
                onSelectProduct={(productId) => {
                  // Pre-fill investment based on product
                  const productMap: Record<string, { type: string; name: string; risk: string }> = {
                    "otnr": { type: "obrigacoes", name: "OTNR", risk: "low" },
                    "bt": { type: "obrigacoes", name: "Bilhetes do Tesouro", risk: "low" },
                    "deposito": { type: "deposito_prazo", name: "Depósito a Prazo", risk: "low" },
                    "fundos-conservadores": { type: "fundos", name: "Fundo Conservador", risk: "low" },
                    "obrigacoes-corp": { type: "obrigacoes", name: "Obrigações Corporativas", risk: "medium" },
                    "fundos-mistos": { type: "fundos", name: "Fundo Misto", risk: "medium" },
                    "carteira-equilibrada": { type: "fundos", name: "Carteira Equilibrada", risk: "medium" },
                    "acoes-bodiva": { type: "acoes", name: "Ações BODIVA", risk: "high" },
                    "fundos-acoes": { type: "fundos", name: "Fundo de Ações", risk: "high" },
                    "carteira-agressiva": { type: "fundos", name: "Carteira Personalizada", risk: "high" },
                  };
                  const product = productMap[productId];
                  if (product) {
                    setNewInvestment({
                      ...newInvestment,
                      type: product.type,
                      name: product.name,
                      risk_level: product.risk,
                    });
                    setDialogOpen(true);
                  }
                }}
              />

              {/* Right Column */}
              <div className="space-y-6">
                {/* Simulator */}
                <InvestmentSimulator />
                
                {/* Order Book */}
                <InvestmentOrderBook />
              </div>
            </div>

            {/* Education Section */}
            <InvestmentEducation />
          </>
        ) : (
          /* Details View - Existing Investments */
          <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => setActiveView("home")}>
              ← Voltar à Visão Geral
            </Button>

            {/* Portfolio Distribution */}
            {investments.length > 0 && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="h-48 w-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={portfolioByType}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {portfolioByType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {portfolioByType.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{item.icon}</span>
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">
                              {((item.value / totalCurrentValue) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo Rápido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Investido</span>
                      <span className="font-bold">{totalInvested.toLocaleString('pt-AO')} Kz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Atual</span>
                      <span className="font-bold">{totalCurrentValue.toLocaleString('pt-AO')} Kz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rendimento</span>
                      <span className={`font-bold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString('pt-AO')} Kz ({returnPercentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ativos</span>
                      <span className="font-bold">{investments.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Investment List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Meus Investimentos</CardTitle>
                <Button variant="accent" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              </CardHeader>
              <CardContent>
                {investments.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum investimento ainda</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece a investir e acompanhe seu patrimônio crescer
                    </p>
                    <Button variant="accent" onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Primeiro Investimento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {investments.map((investment) => {
                      const typeInfo = getTypeInfo(investment.type);
                      const riskInfo = getRiskInfo(investment.risk_level);
                      const returnPct = calculateReturnPercentage(investment);
                      const currentValue = investment.current_value || investment.amount;

                      return (
                        <div
                          key={investment.id}
                          className="p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{typeInfo.icon}</div>
                              <div>
                                <h4 className="font-semibold text-foreground">{investment.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {typeInfo.label}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      investment.risk_level === 'low' 
                                        ? 'bg-success/10 text-success border-success/20'
                                        : investment.risk_level === 'high'
                                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    }`}
                                  >
                                    Risco {riskInfo.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(investment)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteInvestment(investment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                            <div>
                              <span className="text-xs text-muted-foreground">Investido</span>
                              <p className="font-semibold">{investment.amount.toLocaleString('pt-AO')} Kz</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Valor Atual</span>
                              <p className="font-semibold">{currentValue.toLocaleString('pt-AO')} Kz</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Rendimento</span>
                              <p className={`font-semibold ${returnPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {investment.maturity_date && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Vencimento: {format(new Date(investment.maturity_date), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingInvestment ? 'Editar Investimento' : 'Registrar Investimento'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Nome do Investimento</Label>
                <Input
                  placeholder="Ex: Poupança BFA, Obrigações 2027..."
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Investimento</Label>
                <Select
                  value={newInvestment.type}
                  onValueChange={(value) => setNewInvestment({ ...newInvestment, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Investido (Kz)</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={newInvestment.amount}
                    onChange={(e) => setNewInvestment({ ...newInvestment, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Atual (Kz)</Label>
                  <Input
                    type="number"
                    placeholder="105000"
                    value={newInvestment.current_value}
                    onChange={(e) => setNewInvestment({ ...newInvestment, current_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Retorno Esperado (% a.a.)</Label>
                  <Input
                    type="number"
                    placeholder="8"
                    value={newInvestment.expected_return}
                    onChange={(e) => setNewInvestment({ ...newInvestment, expected_return: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nível de Risco</Label>
                  <Select
                    value={newInvestment.risk_level}
                    onValueChange={(value) => setNewInvestment({ ...newInvestment, risk_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={newInvestment.start_date}
                    onChange={(e) => setNewInvestment({ ...newInvestment, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={newInvestment.maturity_date}
                    onChange={(e) => setNewInvestment({ ...newInvestment, maturity_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Observações sobre este investimento..."
                  value={newInvestment.notes}
                  onChange={(e) => setNewInvestment({ ...newInvestment, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button variant="accent" onClick={createOrUpdateInvestment}>
                  {editingInvestment ? 'Atualizar' : 'Registrar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
