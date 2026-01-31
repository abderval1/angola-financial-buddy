import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, TrendingUp, TrendingDown, Trash2, Edit2, 
  Wallet, PieChart, BarChart3, Coins, Building, Landmark, LineChart
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInMonths } from "date-fns";
import { pt } from "date-fns/locale";

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

  // Portfolio by risk
  const portfolioByRisk = RISK_LEVELS.map(level => {
    const riskInvestments = investments.filter(i => i.risk_level === level.value);
    const totalValue = riskInvestments.reduce((sum, i) => sum + (i.current_value || i.amount), 0);
    return {
      name: level.label,
      value: totalValue,
      percentage: totalCurrentValue > 0 ? (totalValue / totalCurrentValue) * 100 : 0,
    };
  });

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
      <AppLayout title="Investimentos" subtitle="Acompanhe sua carteira de investimentos">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Investimentos" subtitle="Acompanhe sua carteira de investimentos">
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card-investment p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-5 w-5 text-investment" />
              <span className="text-sm text-muted-foreground">Total Investido</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalInvested.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="card-finance p-6">
            <div className="flex items-center gap-3 mb-2">
              <LineChart className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Valor Atual</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalCurrentValue.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className={`${totalReturn >= 0 ? 'stat-card-income' : 'stat-card-expense'} p-6`}>
            <div className="flex items-center gap-3 mb-2">
              {totalReturn >= 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm text-muted-foreground">Retorno Total</span>
            </div>
            <p className={`text-2xl font-display font-bold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalReturn >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {totalReturn >= 0 ? '+' : ''}Kz {totalReturn.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="card-finance p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{investments.length}</p>
          </div>
        </div>

        {/* Portfolio Charts */}
        {investments.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Portfolio by Type */}
            <div className="card-finance p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Distribuição por Tipo</h3>
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
            </div>

            {/* Portfolio by Risk */}
            <div className="card-finance p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Perfil de Risco</h3>
              <div className="space-y-4">
                {portfolioByRisk.map((risk, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{risk.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Kz {risk.value.toLocaleString('pt-AO')} ({risk.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress 
                      value={risk.percentage} 
                      className={`h-2 ${
                        index === 0 ? '[&>div]:bg-success' : 
                        index === 1 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'
                      }`} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4 mr-2" />
                Novo Investimento
              </Button>
            </DialogTrigger>
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
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Notas adicionais..."
                    value={newInvestment.notes}
                    onChange={(e) => setNewInvestment({ ...newInvestment, notes: e.target.value })}
                  />
                </div>

                <Button onClick={createOrUpdateInvestment} className="w-full" variant="accent">
                  {editingInvestment ? 'Atualizar' : 'Registrar'} Investimento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Investments List */}
        <div className="space-y-4">
          {investments.length === 0 ? (
            <div className="card-finance p-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">Nenhum investimento registrado</h3>
              <p className="text-muted-foreground mb-4">Comece a construir sua carteira hoje!</p>
            </div>
          ) : (
            investments.map((investment) => {
              const typeInfo = getTypeInfo(investment.type);
              const riskInfo = getRiskInfo(investment.risk_level);
              const returnPct = calculateReturnPercentage(investment);
              const currentValue = investment.current_value || investment.amount;

              return (
                <div key={investment.id} className="card-finance p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{typeInfo.icon}</span>
                        <div>
                          <h3 className="font-display font-semibold text-lg">{investment.name}</h3>
                          <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full bg-secondary ${riskInfo.color}`}>
                          Risco {riskInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Investido</p>
                          <p className="font-semibold">Kz {investment.amount.toLocaleString('pt-AO')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Atual</p>
                          <p className="font-semibold">Kz {currentValue.toLocaleString('pt-AO')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Retorno</p>
                          <p className={`font-semibold ${returnPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                          </p>
                        </div>
                        {investment.expected_return && (
                          <div>
                            <p className="text-xs text-muted-foreground">Retorno Esperado</p>
                            <p className="font-semibold">{investment.expected_return}% a.a.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                        {investment.start_date && (
                          <span>Início: {format(parseISO(investment.start_date), "dd/MM/yyyy")}</span>
                        )}
                        {investment.maturity_date && (
                          <span>Vencimento: {format(parseISO(investment.maturity_date), "dd/MM/yyyy")}</span>
                        )}
                      </div>

                      {investment.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">"{investment.notes}"</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(investment)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteInvestment(investment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
