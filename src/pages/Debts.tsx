import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, CreditCard, Trash2, Edit2, CheckCircle, Clock, AlertTriangle,
  TrendingDown, Calendar, Percent, DollarSign
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

interface Debt {
  id: string;
  creditor: string;
  original_amount: number;
  current_amount: number;
  interest_rate: number | null;
  monthly_payment: number | null;
  due_date: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
}

export default function Debts() {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [newDebt, setNewDebt] = useState({
    creditor: '',
    original_amount: '',
    current_amount: '',
    interest_rate: '',
    monthly_payment: '',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchDebts();
    }
  }, [user]);

  const fetchDebts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar dívidas");
      return;
    }

    setDebts(data || []);
    setLoading(false);
  };

  const createOrUpdateDebt = async () => {
    if (!newDebt.creditor || !newDebt.original_amount) {
      toast.error("Preencha o credor e valor original");
      return;
    }

    const debtData = {
      user_id: user?.id,
      creditor: newDebt.creditor,
      original_amount: parseFloat(newDebt.original_amount),
      current_amount: parseFloat(newDebt.current_amount) || parseFloat(newDebt.original_amount),
      interest_rate: parseFloat(newDebt.interest_rate) || 0,
      monthly_payment: parseFloat(newDebt.monthly_payment) || null,
      due_date: newDebt.due_date || null,
      notes: newDebt.notes || null,
      status: 'pending',
    };

    if (editingDebt) {
      const { error } = await supabase
        .from('debts')
        .update(debtData)
        .eq('id', editingDebt.id);

      if (error) {
        toast.error("Erro ao atualizar dívida");
        return;
      }
      toast.success("Dívida atualizada!");
    } else {
      const { error } = await supabase
        .from('debts')
        .insert(debtData);

      if (error) {
        toast.error("Erro ao criar dívida");
        return;
      }
      toast.success("Dívida registrada!");
    }

    resetForm();
    fetchDebts();
  };

  const makePayment = async () => {
    if (!selectedDebt || !paymentAmount) {
      toast.error("Informe o valor do pagamento");
      return;
    }

    const payment = parseFloat(paymentAmount);
    const newAmount = Math.max(0, selectedDebt.current_amount - payment);
    const isPaidOff = newAmount === 0;

    const { error } = await supabase
      .from('debts')
      .update({
        current_amount: newAmount,
        status: isPaidOff ? 'paid' : 'pending',
      })
      .eq('id', selectedDebt.id);

    if (error) {
      toast.error("Erro ao registrar pagamento");
      return;
    }

    if (isPaidOff) {
      toast.success("🎉 Parabéns! Dívida quitada!", { duration: 5000 });
    } else {
      toast.success("Pagamento registrado!");
    }

    setPaymentDialogOpen(false);
    setPaymentAmount('');
    setSelectedDebt(null);
    fetchDebts();
  };

  const deleteDebt = async (id: string) => {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir dívida");
      return;
    }

    toast.success("Dívida excluída");
    fetchDebts();
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingDebt(null);
    setNewDebt({
      creditor: '',
      original_amount: '',
      current_amount: '',
      interest_rate: '',
      monthly_payment: '',
      due_date: '',
      notes: '',
    });
  };

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt);
    setNewDebt({
      creditor: debt.creditor,
      original_amount: debt.original_amount.toString(),
      current_amount: debt.current_amount.toString(),
      interest_rate: debt.interest_rate?.toString() || '',
      monthly_payment: debt.monthly_payment?.toString() || '',
      due_date: debt.due_date || '',
      notes: debt.notes || '',
    });
    setDialogOpen(true);
  };

  const openPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.monthly_payment?.toString() || '');
    setPaymentDialogOpen(true);
  };

  // Stats
  const totalDebt = debts.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.current_amount, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_amount, 0);
  const totalPaid = totalOriginal - totalDebt;
  const paidDebts = debts.filter(d => d.status === 'paid').length;
  const pendingDebts = debts.filter(d => d.status === 'pending').length;

  const totalMonthlyPayment = debts
    .filter(d => d.status === 'pending' && d.monthly_payment)
    .reduce((sum, d) => sum + (d.monthly_payment || 0), 0);

  const getDebtStatus = (debt: Debt) => {
    if (debt.status === 'paid') return { label: 'Quitada', color: 'text-success', bg: 'bg-success/10' };
    if (debt.due_date) {
      const daysUntilDue = differenceInDays(parseISO(debt.due_date), new Date());
      if (daysUntilDue < 0) return { label: 'Vencida', color: 'text-destructive', bg: 'bg-destructive/10' };
      if (daysUntilDue <= 7) return { label: 'Vence em breve', color: 'text-warning', bg: 'bg-warning/10' };
    }
    return { label: 'Em dia', color: 'text-primary', bg: 'bg-primary/10' };
  };

  const calculatePayoffMonths = (debt: Debt) => {
    if (!debt.monthly_payment || debt.monthly_payment <= 0) return null;
    const months = Math.ceil(debt.current_amount / debt.monthly_payment);
    return months;
  };

  if (loading) {
    return (
      <AppLayout title="Dívidas" subtitle="Gerencie e quite suas dívidas">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dívidas" subtitle="Gerencie e quite suas dívidas">
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card-expense p-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="h-5 w-5 text-destructive" />
              <span className="text-sm text-muted-foreground">Dívida Total</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalDebt.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="stat-card-income p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Total Pago</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalPaid.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="card-finance p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Pagamento Mensal</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              Kz {totalMonthlyPayment.toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="card-finance p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Dívidas Quitadas</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {paidDebts} de {debts.length}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {totalOriginal > 0 && (
          <div className="card-finance p-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progresso de Quitação</span>
              <span className="text-sm text-muted-foreground">
                {((totalPaid / totalOriginal) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={(totalPaid / totalOriginal) * 100} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Pago: Kz {totalPaid.toLocaleString('pt-AO')}</span>
              <span>Restante: Kz {totalDebt.toLocaleString('pt-AO')}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4 mr-2" />
                Nova Dívida
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingDebt ? 'Editar Dívida' : 'Registrar Dívida'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Credor / Instituição</Label>
                  <Input
                    placeholder="Ex: Banco XYZ, Cartão Visa..."
                    value={newDebt.creditor}
                    onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Original (Kz)</Label>
                    <Input
                      type="number"
                      placeholder="100000"
                      value={newDebt.original_amount}
                      onChange={(e) => setNewDebt({ ...newDebt, original_amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Atual (Kz)</Label>
                    <Input
                      type="number"
                      placeholder="80000"
                      value={newDebt.current_amount}
                      onChange={(e) => setNewDebt({ ...newDebt, current_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxa de Juros Anual (%)</Label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={newDebt.interest_rate}
                      onChange={(e) => setNewDebt({ ...newDebt, interest_rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pagamento Mensal (Kz)</Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={newDebt.monthly_payment}
                      onChange={(e) => setNewDebt({ ...newDebt, monthly_payment: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={newDebt.due_date}
                    onChange={(e) => setNewDebt({ ...newDebt, due_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Notas adicionais sobre a dívida..."
                    value={newDebt.notes}
                    onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })}
                  />
                </div>

                <Button onClick={createOrUpdateDebt} className="w-full" variant="accent">
                  {editingDebt ? 'Atualizar' : 'Registrar'} Dívida
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Debts List */}
        <div className="space-y-4">
          {debts.length === 0 ? (
            <div className="card-finance p-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">Nenhuma dívida registrada</h3>
              <p className="text-muted-foreground mb-4">Parabéns! Você está livre de dívidas.</p>
            </div>
          ) : (
            debts.map((debt) => {
              const status = getDebtStatus(debt);
              const paidPercentage = ((debt.original_amount - debt.current_amount) / debt.original_amount) * 100;
              const payoffMonths = calculatePayoffMonths(debt);

              return (
                <div key={debt.id} className="card-finance p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-display font-semibold text-lg">{debt.creditor}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Original</p>
                          <p className="font-semibold">Kz {debt.original_amount.toLocaleString('pt-AO')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Atual</p>
                          <p className="font-semibold text-destructive">Kz {debt.current_amount.toLocaleString('pt-AO')}</p>
                        </div>
                        {debt.interest_rate ? (
                          <div>
                            <p className="text-xs text-muted-foreground">Taxa de Juros</p>
                            <p className="font-semibold">{debt.interest_rate}% a.a.</p>
                          </div>
                        ) : null}
                        {debt.monthly_payment ? (
                          <div>
                            <p className="text-xs text-muted-foreground">Pagamento Mensal</p>
                            <p className="font-semibold">Kz {debt.monthly_payment.toLocaleString('pt-AO')}</p>
                          </div>
                        ) : null}
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{paidPercentage.toFixed(0)}% quitado</span>
                          {payoffMonths && debt.status !== 'paid' && (
                            <span className="text-muted-foreground">~{payoffMonths} meses restantes</span>
                          )}
                        </div>
                        <Progress value={paidPercentage} className="h-2" />
                      </div>

                      {debt.due_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Vencimento: {format(parseISO(debt.due_date), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                        </p>
                      )}

                      {debt.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">"{debt.notes}"</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {debt.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => openPaymentDialog(debt)}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(debt)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteDebt(debt.id)}
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

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedDebt && (
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="font-medium">{selectedDebt.creditor}</p>
                  <p className="text-sm text-muted-foreground">
                    Saldo devedor: Kz {selectedDebt.current_amount.toLocaleString('pt-AO')}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Valor do Pagamento (Kz)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <Button onClick={makePayment} className="w-full" variant="accent">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Pagamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
