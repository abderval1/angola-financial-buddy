import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, TrendingUp, TrendingDown, Trash2, Edit2, AlertTriangle,
  Briefcase, Car, Home, Heart, GraduationCap, Gamepad2, Shirt, FileText, UtensilsCrossed, Laptop
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

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
  is_active: boolean;
  category_name?: string;
  spent?: number;
}

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  
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
  });

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTransactions(), fetchCategories(), fetchAlerts()]);
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar transações");
      return;
    }

    setTransactions(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('transaction_categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error("Erro ao carregar categorias");
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
      setAlerts(data);
    }
  };

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user?.id,
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category_id: newTransaction.category_id || null,
        date: newTransaction.date,
      });

    if (error) {
      toast.error("Erro ao adicionar transação");
      return;
    }

    toast.success("Transação adicionada com sucesso!");
    setDialogOpen(false);
    setNewTransaction({
      type: 'expense',
      amount: '',
      description: '',
      category_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    fetchTransactions();
    checkBudgetAlerts();
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir transação");
      return;
    }

    toast.success("Transação excluída");
    fetchTransactions();
  };

  const addBudgetAlert = async () => {
    if (!newAlert.category_id || !newAlert.limit_amount) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { error } = await supabase
      .from('budget_alerts')
      .insert({
        user_id: user?.id,
        category_id: newAlert.category_id,
        limit_amount: parseFloat(newAlert.limit_amount),
        is_active: true,
      });

    if (error) {
      toast.error("Erro ao criar alerta");
      return;
    }

    toast.success("Alerta de orçamento criado!");
    setAlertDialogOpen(false);
    setNewAlert({ category_id: '', limit_amount: '' });
    fetchAlerts();
  };

  const checkBudgetAlerts = () => {
    alerts.forEach(alert => {
      const category = categories.find(c => c.id === alert.category_id);
      if (!category) return;

      const spent = transactions
        .filter(t => t.category_id === alert.category_id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      if (spent >= alert.limit_amount * 0.8) {
        toast.warning(`Atenção: Você já gastou ${((spent / alert.limit_amount) * 100).toFixed(0)}% do limite de ${category.name}`, {
          duration: 5000,
        });
      }
    });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = categories
    .filter(c => c.type === 'expense')
    .map(category => {
      const total = transactions
        .filter(t => t.category_id === category.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        value: total,
        color: COLOR_MAP[category.color] || COLOR_MAP.gray,
      };
    })
    .filter(c => c.value > 0);

  // Chart data for daily expenses
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    return {
      date: format(date, 'dd/MM'),
      receita: dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      despesa: dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  }).slice(-14);

  const filteredCategories = categories.filter(c => c.type === newTransaction.type);

  const getCategoryInfo = (categoryId: string | null) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat || { name: 'Sem categoria', icon: 'FileText', color: 'gray' };
  };

  if (loading) {
    return (
      <AppLayout title="Orçamento" subtitle="Gerencie suas receitas e despesas">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Orçamento" subtitle="Gerencie suas receitas e despesas">
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card-income p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Receitas</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalIncome.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="stat-card-expense p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <span className="text-sm text-muted-foreground">Despesas</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalExpense.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className={`stat-card p-6 ${balance >= 0 ? 'stat-card-income' : 'stat-card-expense'}`}>
            <div className="flex items-center gap-3 mb-2">
              {balance >= 0 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              <span className="text-sm text-muted-foreground">Saldo</span>
            </div>
            <p className={`text-2xl font-display font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              Kz {balance.toLocaleString('pt-AO')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Transação</DialogTitle>
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
                    Receita
                  </Button>
                  <Button
                    type="button"
                    variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                    className={`flex-1 ${newTransaction.type === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category_id: '' })}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Despesa
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Valor (Kz)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Ex: Salário, Supermercado..."
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
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
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>

                <Button onClick={addTransaction} className="w-full" variant="accent">
                  Adicionar Transação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Criar Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Alerta de Orçamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={newAlert.category_id}
                    onValueChange={(value) => setNewAlert({ ...newAlert, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
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
                  <Label>Limite Mensal (Kz)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 50000"
                    value={newAlert.limit_amount}
                    onChange={(e) => setNewAlert({ ...newAlert, limit_amount: e.target.value })}
                  />
                </div>

                <Button onClick={addBudgetAlert} className="w-full" variant="accent">
                  Criar Alerta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cash Flow Chart */}
          <div className="card-finance">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Fluxo de Caixa (14 dias)</h3>
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

          {/* Expenses by Category */}
          <div className="card-finance">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Despesas por Categoria</h3>
            {expensesByCategory.length > 0 ? (
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `Kz ${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 ml-4">
                  {expensesByCategory.slice(0, 5).map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma despesa registrada
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="card-finance">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Transações de {format(currentMonth, 'MMMM yyyy', { locale: pt })}
            </h3>
          </div>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma transação registrada este mês.</p>
                <p className="text-sm mt-1">Clique em "Nova Transação" para começar.</p>
              </div>
            ) : (
              transactions.map((tx) => {
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
                          {catInfo.name} • {format(parseISO(tx.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'income' ? '+' : '-'}Kz {tx.amount.toLocaleString('pt-AO')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => deleteTransaction(tx.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
