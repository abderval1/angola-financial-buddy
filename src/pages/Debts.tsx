import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, CreditCard, Trash2, Edit2, CheckCircle, AlertTriangle,
  TrendingDown, TrendingUp, Calendar, DollarSign, Users, AlertCircle, Shield, Eye, Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import { DebtCalendar } from "@/components/debts/DebtCalendar";
import { useTranslation } from "react-i18next";

interface Debt {
  id: string;
  creditor: string;
  original_amount: number;
  current_amount: number;
  interest_rate: number | null;
  monthly_payment: number | null;
  due_date: string | null;
  contract_date?: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
}

interface Loan {
  id: string;
  borrower_name: string;
  borrower_contact: string | null;
  original_amount: number;
  current_amount: number;
  interest_rate: number | null;
  loan_date?: string | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  status: string;
  notes: string | null;
  created_at: string | null;
  user_id?: string;
}

interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

interface LoanCollection {
  id: string;
  loan_id: string;
  amount: number;
  collection_date: string;
  notes: string | null;
  created_at: string;
}

export default function Debts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("debts");
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [debtHistoryOpen, setDebtHistoryOpen] = useState(false);
  const [loanHistoryOpen, setLoanHistoryOpen] = useState(false);

  // Payment history
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [loanCollections, setLoanCollections] = useState<LoanCollection[]>([]);

  // Editing
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Form values
  const [paymentAmount, setPaymentAmount] = useState('');
  const [collectionAmount, setCollectionAmount] = useState('');

  const [newDebt, setNewDebt] = useState({
    creditor: '',
    original_amount: '',
    current_amount: '',
    interest_rate: '',
    monthly_payment: '',
    contract_date: '',
    due_date: '',
    notes: '',
  });

  const [newLoan, setNewLoan] = useState({
    borrower_name: '',
    borrower_contact: '',
    original_amount: '',
    current_amount: '',
    interest_rate: '',
    loan_date: '',
    expected_return_date: '',
    notes: '',
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [debtsRes, loansRes] = await Promise.all([
      supabase.from('debts').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('loans').select('*').order('created_at', { ascending: false })
    ]);
    console.log('Debts query result:', debtsRes);
    console.log('Loans query result:', loansRes);
    console.log('User ID:', user?.id);
    if (debtsRes.error) console.error('Debts error:', debtsRes.error);
    if (loansRes.error) console.error('Loans error:', loansRes.error);
    if (debtsRes.data) setDebts(debtsRes.data as Debt[]);
    if (loansRes.data) setLoans(loansRes.data as Loan[]);
    setLoading(false);
  };

  // Debt operations
  const createOrUpdateDebt = async () => {
    if (!newDebt.creditor || !newDebt.original_amount) {
      toast.error(t('Preencha o credor e valor'));
      return;
    }
    const debtData = {
      user_id: user?.id,
      creditor: newDebt.creditor,
      original_amount: parseFloat(newDebt.original_amount),
      current_amount: parseFloat(newDebt.current_amount) || parseFloat(newDebt.original_amount),
      interest_rate: parseFloat(newDebt.interest_rate) || 0,
      monthly_payment: parseFloat(newDebt.monthly_payment) || null,
      contract_date: newDebt.contract_date || null,
      due_date: newDebt.due_date || null,
      notes: newDebt.notes || null,
      status: 'pending',
    };
    if (editingDebt) {
      await supabase.from('debts').update(debtData).eq('id', editingDebt.id);
      toast.success(t('Dívida atualizada!'));
    } else {
      await supabase.from('debts').insert(debtData);
      toast.success(t('Dívida registrada!'));
    }
    resetDebtForm();
    fetchDebts();
  };

  const makePayment = async () => {
    if (!selectedDebt || !paymentAmount) return;
    const payment = parseFloat(paymentAmount);
    const newAmount = Math.max(0, selectedDebt.current_amount - payment);

    // Update debt amount and status
    await supabase.from('debts').update({
      current_amount: newAmount,
      status: newAmount === 0 ? 'paid' : 'pending',
    }).eq('id', selectedDebt.id);

    // Record payment in history
    await (supabase as any).from('debt_payments').insert({
      debt_id: selectedDebt.id,
      user_id: user?.id,
      amount: payment,
      payment_date: new Date().toISOString(),
    });

    if (newAmount === 0) toast.success("🎉 " + t('Dívida quitada!'));
    else toast.success(t('Pagamento registrado!'));
    setPaymentDialogOpen(false);
    setPaymentAmount('');
    setSelectedDebt(null);
    fetchDebts();
  };

  const deleteDebt = async (id: string) => {
    await supabase.from('debts').delete().eq('id', id);
    toast.success(t('Dívida excluída'));
    fetchDebts();
  };

  const fetchDebts = async () => {
    const { data } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
    if (data) setDebts(data);
  };

  const resetDebtForm = () => {
    setDebtDialogOpen(false);
    setEditingDebt(null);
    setNewDebt({ creditor: '', original_amount: '', current_amount: '', interest_rate: '', monthly_payment: '', contract_date: '', due_date: '', notes: '' });
  };

  const openViewDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setNewDebt({
      creditor: debt.creditor,
      original_amount: debt.original_amount.toString(),
      current_amount: debt.current_amount.toString(),
      interest_rate: debt.interest_rate?.toString() || '',
      monthly_payment: debt.monthly_payment?.toString() || '',
      contract_date: debt.contract_date || '',
      due_date: debt.due_date || '',
      notes: debt.notes || '',
    });
    setDebtDialogOpen(true);
  };

  const openEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setNewDebt({
      creditor: debt.creditor,
      original_amount: debt.original_amount.toString(),
      current_amount: debt.current_amount.toString(),
      interest_rate: debt.interest_rate?.toString() || '',
      monthly_payment: debt.monthly_payment?.toString() || '',
      contract_date: debt.contract_date || '',
      due_date: debt.due_date || '',
      notes: debt.notes || '',
    });
    setDebtDialogOpen(true);
  };

  // Loan operations
  const createOrUpdateLoan = async () => {
    if (!newLoan.borrower_name || !newLoan.original_amount) {
      toast.error(t('Preencha o nome e valor'));
      return;
    }
    const loanData = {
      user_id: user?.id,
      borrower_name: newLoan.borrower_name,
      borrower_contact: newLoan.borrower_contact || null,
      original_amount: parseFloat(newLoan.original_amount),
      current_amount: parseFloat(newLoan.current_amount) || parseFloat(newLoan.original_amount),
      interest_rate: parseFloat(newLoan.interest_rate) || 0,
      loan_date: newLoan.loan_date || null,
      expected_return_date: newLoan.expected_return_date || null,
      notes: newLoan.notes || null,
      status: 'pending',
    };
    if (editingLoan) {
      await (supabase as any).from('loans').update(loanData).eq('id', editingLoan.id);
      toast.success(t('Empréstimo atualizado!'));
    } else {
      await (supabase as any).from('loans').insert(loanData);
      toast.success(t('Empréstimo registrado!'));
    }
    resetLoanForm();
    fetchLoans();
  };

  const recordCollection = async () => {
    if (!selectedLoan || !collectionAmount) return;
    const collection = parseFloat(collectionAmount);
    const newAmount = Math.max(0, selectedLoan.current_amount - collection);

    // Update loan amount and status
    await (supabase as any).from('loans').update({
      current_amount: newAmount,
      status: newAmount === 0 ? 'paid' : (newAmount < selectedLoan.original_amount ? 'partial' : 'pending'),
      actual_return_date: newAmount === 0 ? new Date().toISOString().split('T')[0] : null,
    }).eq('id', selectedLoan.id);

    // Record collection in history
    await (supabase as any).from('loan_collections').insert({
      loan_id: selectedLoan.id,
      user_id: user?.id,
      amount: collection,
      collection_date: new Date().toISOString(),
    });

    if (newAmount === 0) toast.success("🎉 " + t('Emprestimo recuperado!'));
    else toast.success(t('Recebimento registrado!'));
    setCollectionDialogOpen(false);
    setCollectionAmount('');
    setSelectedLoan(null);
    fetchLoans();
  };

  const deleteLoan = async (id: string) => {
    await (supabase as any).from('loans').delete().eq('id', id);
    toast.success(t('Empréstimo excluído'));
    fetchLoans();
  };

  const fetchLoans = async () => {
    const { data } = await (supabase as any).from('loans').select('*').order('created_at', { ascending: false });
    if (data) setLoans(data);
  };

  // Payment history functions
  const fetchDebtPayments = async (debtId: string) => {
    const { data } = await (supabase as any).from('debt_payments').select('*').eq('debt_id', debtId).order('payment_date', { ascending: false });
    if (data) setDebtPayments(data);
  };

  const fetchLoanCollections = async (loanId: string) => {
    const { data } = await (supabase as any).from('loan_collections').select('*').eq('loan_id', loanId).order('collection_date', { ascending: false });
    if (data) setLoanCollections(data);
  };

  const deleteDebtPayment = async (payment: DebtPayment) => {
    // Reverse the payment by adding amount back to current_amount
    const debt = debts.find(d => d.id === payment.debt_id);
    if (!debt) return;
    const newAmount = debt.current_amount + payment.amount;
    await supabase.from('debts').update({
      current_amount: newAmount,
      status: 'pending',
    }).eq('id', payment.debt_id);
    // Delete the payment record
    await (supabase as any).from('debt_payments').delete().eq('id', payment.id);
    toast.success(t('Pagamento eliminado'));
    fetchDebtPayments(payment.debt_id);
    fetchDebts();
  };

  const deleteLoanCollection = async (collection: LoanCollection) => {
    // Reverse the collection by adding amount back to current_amount
    const loan = loans.find(l => l.id === collection.loan_id);
    if (!loan) return;
    const newAmount = loan.current_amount + collection.amount;
    await (supabase as any).from('loans').update({
      current_amount: newAmount,
      status: newAmount === 0 ? 'paid' : (newAmount < loan.original_amount ? 'partial' : 'pending'),
      actual_return_date: null,
    }).eq('id', collection.loan_id);
    // Delete the collection record
    await (supabase as any).from('loan_collections').delete().eq('id', collection.id);
    toast.success(t('Recebimento eliminado'));
    fetchLoanCollections(collection.loan_id);
    fetchLoans();
  };

  const openDebtHistory = async (debt: Debt) => {
    setSelectedDebt(debt);
    await fetchDebtPayments(debt.id);
    setDebtHistoryOpen(true);
  };

  const openLoanHistory = async (loan: Loan) => {
    setSelectedLoan(loan);
    await fetchLoanCollections(loan.id);
    setLoanHistoryOpen(true);
  };

  const resetLoanForm = () => {
    setLoanDialogOpen(false);
    setEditingLoan(null);
    setNewLoan({ borrower_name: '', borrower_contact: '', original_amount: '', current_amount: '', interest_rate: '', loan_date: '', expected_return_date: '', notes: '' });
  };

  const openViewLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setNewLoan({
      borrower_name: loan.borrower_name,
      borrower_contact: loan.borrower_contact || '',
      original_amount: loan.original_amount.toString(),
      current_amount: loan.current_amount.toString(),
      interest_rate: loan.interest_rate?.toString() || '',
      loan_date: loan.loan_date || '',
      expected_return_date: loan.expected_return_date || '',
      notes: loan.notes || '',
    });
    setLoanDialogOpen(true);
  };

  const openEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setNewLoan({
      borrower_name: loan.borrower_name,
      borrower_contact: loan.borrower_contact || '',
      original_amount: loan.original_amount.toString(),
      current_amount: loan.current_amount.toString(),
      interest_rate: loan.interest_rate?.toString() || '',
      loan_date: loan.loan_date || '',
      expected_return_date: loan.expected_return_date || '',
      notes: loan.notes || '',
    });
    setLoanDialogOpen(true);
  };

  // Risk Analysis
  const totalDebt = debts.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.current_amount, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_amount, 0);
  const totalPaid = totalOriginal - totalDebt;
  const paidDebts = debts.filter(d => d.status === 'paid').length;
  const totalMonthlyPayment = debts.filter(d => d.status === 'pending' && d.monthly_payment).reduce((sum, d) => sum + (d.monthly_payment || 0), 0);

  const totalLoansOutstanding = loans.filter(l => l.status !== 'paid').reduce((sum, l) => sum + l.current_amount, 0);
  const totalLoansOriginal = loans.reduce((sum, l) => sum + l.original_amount, 0);
  const totalCollected = totalLoansOriginal - totalLoansOutstanding;
  const overdueLoansCount = loans.filter(l => l.expected_return_date && differenceInDays(parseISO(l.expected_return_date), new Date()) < 0 && l.status !== 'paid').length;
  const netPosition = totalLoansOutstanding - totalDebt;

  const recommendations = useMemo(() => {
    const recs = [];
    if (totalDebt > totalLoansOutstanding * 2) recs.push({ type: 'danger', text: t('Suas dívidas excedem muito o que tem a receber. Priorize quitar dívidas.') });
    if (netPosition < 0) recs.push({ type: 'warning', text: t('Posição líquida negativa. Cuidado com novos empréstimos.') });
    if (overdueLoansCount > 0) recs.push({ type: 'info', text: `${overdueLoansCount} ${t('empréstimo(s) atrasado(s). Contacte os devedores.')}` });
    if (totalDebt === 0 && totalLoansOutstanding === 0) recs.push({ type: 'success', text: t('Parabéns! Sem dívidas nem empréstimos pendentes!') });
    return recs;
  }, [totalDebt, totalLoansOutstanding, overdueLoansCount, netPosition]);

  const getDebtStatus = (debt: Debt) => {
    if (debt.status === 'paid') return { label: 'Quitada', color: 'bg-green-500' };
    if (debt.due_date) {
      const days = differenceInDays(parseISO(debt.due_date), new Date());
      if (days < 0) return { label: 'Vencida', color: 'bg-red-500' };
      if (days <= 7) return { label: 'Vence em breve', color: 'bg-yellow-500' };
    }
    return { label: 'Em dia', color: 'bg-blue-500' };
  };

  const getLoanStatus = (loan: Loan) => {
    if (loan.status === 'paid') return { label: 'Recuperado', color: 'bg-green-500' };
    if (loan.expected_return_date) {
      const days = differenceInDays(parseISO(loan.expected_return_date), new Date());
      if (days < 0) return { label: 'Atrasado', color: 'bg-red-500' };
      if (days <= 7) return { label: 'Vence em breve', color: 'bg-yellow-500' };
    }
    return { label: 'Em dia', color: 'bg-blue-500' };
  };

  if (loading) {
    return (
      <AppLayout title="Dívidas & Empréstimos" subtitle="Gerencie suas finanças">
        <div className="flex items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dívidas & Empréstimos" subtitle="Gerencie suas finanças">
      <ModuleGuard moduleKey="basic" title={t('Controle de Dívidas')} description={t('Gerencie o que você deve e o que os outros lhe devem')}>
        <div className="space-y-6 animate-fade-in">
          {/* Risk Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className={netPosition < 0 ? 'border-red-500 bg-red-500/10' : 'card-finance'}>
              <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2"><TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" /> {t('Dívida Total')}</CardTitle></CardHeader>
              <CardContent><p className="text-sm sm:text-xl md:text-2xl font-bold break-all">Kz {totalDebt.toLocaleString('pt-AO')}</p></CardContent>
            </Card>
            <Card className="card-finance">
              <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2"><TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" /> {t('A Receber')}</CardTitle></CardHeader>
              <CardContent><p className="text-sm sm:text-xl md:text-2xl font-bold break-all">Kz {totalLoansOutstanding.toLocaleString('pt-AO')}</p></CardContent>
            </Card>
            <Card className={netPosition < 0 ? 'border-red-500 bg-red-500/10' : 'card-finance'}>
              <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2"><Shield className="h-3 w-3 sm:h-4 sm:w-4" /> {t('Posição Líquida')}</CardTitle></CardHeader>
              <CardContent><p className={`text-sm sm:text-xl md:text-2xl font-bold break-all ${netPosition < 0 ? 'text-red-500' : 'text-green-500'}`}>{netPosition >= 0 ? '+' : ''}Kz {netPosition.toLocaleString('pt-AO')}</p></CardContent>
            </Card>
            <Card className={overdueLoansCount > 0 ? 'border-red-500 bg-red-500/10' : 'card-finance'}>
              <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2"><AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" /> {t('Atrasos')}</CardTitle></CardHeader>
              <CardContent><p className="text-sm sm:text-lg md:text-2xl font-bold">{overdueLoansCount}</p></CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> {t('Análise de Risco')}</h4>
              {recommendations.map((rec, idx) => (
                <div key={idx} className={`flex items-start gap-2 text-sm ${rec.type === 'danger' ? 'text-red-500' : rec.type === 'warning' ? 'text-yellow-500' : rec.type === 'info' ? 'text-blue-500' : 'text-green-500'}`}>
                  {rec.type === 'danger' && <AlertTriangle className="h-4 w-4 mt-0.5" />}
                  {rec.type === 'warning' && <AlertCircle className="h-4 w-4 mt-0.5" />}
                  {rec.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5" />}
                  {rec.text}
                </div>
              ))}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
              <TabsTrigger value="debts" className="flex items-center gap-1 text-xs md:text-sm"><CreditCard className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">{t('Dívidas')}</span><span className="sm:hidden">{t('Dív')}</span> ({debts.length})</TabsTrigger>
              <TabsTrigger value="loans" className="flex items-center gap-1 text-xs md:text-sm"><Users className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">{t('Empréstimos')}</span><span className="sm:hidden">{t('Emp')}</span> ({loans.length})</TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1 text-xs md:text-sm"><Calendar className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden md:inline">{t('Calendário de Vencimentos')}</span><span className="md:hidden">{t('Calendário')}</span></TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-1 text-xs md:text-sm"><TrendingUp className="h-3 w-3 md:h-4 md:w-4" /> {t('Progresso')}</TabsTrigger>
            </TabsList>

            {/* DEBTS TAB */}
            <TabsContent value="debts" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <div className="stat-card-expense p-2 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground">{t('Total Pago')}</p><p className="text-sm sm:text-lg md:text-xl font-bold text-green-500 break-all">Kz {totalPaid.toLocaleString('pt-AO')}</p></div>
                <div className="card-finance p-2 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground">{t('Pagamento Mensal')}</p><p className="text-sm sm:text-lg md:text-xl font-bold break-all">Kz {totalMonthlyPayment.toLocaleString('pt-AO')}</p></div>
                <div className="card-finance p-2 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground">{t('Quitadas')}</p><p className="text-sm sm:text-lg md:text-xl font-bold">{paidDebts} {t('de')} {debts.length}</p></div>
              </div>

              <div className="flex gap-3">
                <Dialog open={debtDialogOpen} onOpenChange={(open) => { if (!open) resetDebtForm(); else setDebtDialogOpen(true); }}>
                  <DialogTrigger asChild><Button variant="accent"><Plus className="h-4 w-4 mr-2" /> {t('Nova Dívida')}</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editingDebt ? t('Editar') : t('Nova')} {t('Dívida')}</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2"><Label>{t('Credor')}</Label><Input placeholder={t('Banco, Cartão...')} value={newDebt.creditor} onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>{t('Valor (Kz)')}</Label><Input type="number" placeholder="100000" value={newDebt.original_amount} onChange={(e) => setNewDebt({ ...newDebt, original_amount: e.target.value })} /></div>
                        <div className="space-y-2"><Label>{t('Saldo (Kz)')}</Label><Input type="number" placeholder="80000" value={newDebt.current_amount} onChange={(e) => setNewDebt({ ...newDebt, current_amount: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>{t('Juros (%)')}</Label><Input type="number" placeholder="15" value={newDebt.interest_rate} onChange={(e) => setNewDebt({ ...newDebt, interest_rate: e.target.value })} /></div>
                        <div className="space-y-2"><Label>{t('Pagamento Mensal')}</Label><Input type="number" placeholder="10000" value={newDebt.monthly_payment} onChange={(e) => setNewDebt({ ...newDebt, monthly_payment: e.target.value })} /></div>
                      </div>
                      <div className="space-y-2"><Label>{t('Data Vencimento')}</Label><Input type="date" value={newDebt.due_date} onChange={(e) => setNewDebt({ ...newDebt, due_date: e.target.value })} /></div>
                      <div className="space-y-2"><Label>{t('Data da Dívida')}</Label><Input type="date" value={newDebt.contract_date} onChange={(e) => setNewDebt({ ...newDebt, contract_date: e.target.value })} /></div>
                      <div className="space-y-2"><Label>{t('Notas')}</Label><Textarea placeholder={t('Observações...')} value={newDebt.notes} onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })} /></div>
                      <Button onClick={createOrUpdateDebt} className="w-full" variant="accent">{editingDebt ? t('Atualizar') : t('Registrar')} {t('Dívida')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Debts List */}
              {debts.length === 0 ? (
                <div className="card-finance p-12 text-center"><CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="font-display text-lg font-semibold mb-2">{t('Nenhuma dívida registrada')}</h3></div>
              ) : (
                <div className="space-y-4">
                  {debts.map((debt) => {
                    const status = getDebtStatus(debt);
                    const paidPct = ((debt.original_amount - debt.current_amount) / debt.original_amount) * 100;
                    return (
                      <div key={debt.id} className="card-finance p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2"><h3 className="font-semibold">{debt.creditor}</h3><Badge className={status.color}>{status.label}</Badge></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div><p className="text-muted-foreground">{t('Original')}</p><p className="font-medium">Kz {debt.original_amount.toLocaleString('pt-AO')}</p></div>
                              <div><p className="text-muted-foreground">{t('Atual')}</p><p className="font-medium text-red-500">Kz {debt.current_amount.toLocaleString('pt-AO')}</p></div>
                              {debt.monthly_payment && <div><p className="text-muted-foreground">{t('Mensal')}</p><p className="font-medium">Kz {debt.monthly_payment.toLocaleString('pt-AO')}</p></div>}
                              {debt.due_date && <div><p className="text-muted-foreground">{t('Vencimento')}</p><p className="font-medium">{format(parseISO(debt.due_date), 'dd/MM/yyyy')}</p></div>}
                            </div>
                            <Progress value={paidPct} className="h-2 mt-3" />
                          </div>
                          <div className="flex gap-2 ml-4">
                            {debt.status !== 'paid' && <Button size="sm" variant="accent" onClick={() => { setSelectedDebt(debt); setPaymentAmount(debt.monthly_payment?.toString() || ''); setPaymentDialogOpen(true); }}><DollarSign className="h-4 w-4" /></Button>}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline"><Clock className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDebtHistory(debt)}><Eye className="h-4 w-4 mr-2" />{t('Ver Histórico')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDebt(debt)}><Edit2 className="h-4 w-4 mr-2" />{t('Editar')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteDebt(debt.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t('Eliminar')}</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* LOANS TAB */}
            <TabsContent value="loans" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <div className="stat-card-income p-2 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground">{t('Total Recuperado')}</p><p className="text-sm sm:text-lg md:text-xl font-bold text-green-500 break-all">Kz {totalCollected.toLocaleString('pt-AO')}</p></div>
                <div className="card-finance p-2 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground">{t('Pendente')}</p><p className="text-sm sm:text-lg md:text-xl font-bold break-all">Kz {totalLoansOutstanding.toLocaleString('pt-AO')}</p></div>
                <div className="card-finance p-2 sm:p-4"><p className="text-xs sm:text-sm text-muted-foreground">{t('Recuperados')}</p><p className="text-sm sm:text-lg md:text-xl font-bold">{loans.filter(l => l.status === 'paid').length} {t('de')} {loans.length}</p></div>
              </div>

              <div className="flex gap-3">
                <Dialog open={loanDialogOpen} onOpenChange={(open) => { if (!open) resetLoanForm(); else setLoanDialogOpen(true); }}>
                  <DialogTrigger asChild><Button variant="accent"><Plus className="h-4 w-4 mr-2" /> {t('Novo Empréstimo')}</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editingLoan ? t('Editar') : t('Novo')} {t('Empréstimo')}</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2"><Label>{t('Nome do Devedor')}</Label><Input placeholder={t('João Silva...')} value={newLoan.borrower_name} onChange={(e) => setNewLoan({ ...newLoan, borrower_name: e.target.value })} /></div>
                      <div className="space-y-2"><Label>{t('Contacto')}</Label><Input placeholder={t('Telefone/Email...')} value={newLoan.borrower_contact} onChange={(e) => setNewLoan({ ...newLoan, borrower_contact: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>{t('Valor (Kz)')}</Label><Input type="number" placeholder="50000" value={newLoan.original_amount} onChange={(e) => setNewLoan({ ...newLoan, original_amount: e.target.value })} /></div>
                        <div className="space-y-2"><Label>{t('Saldo (Kz)')}</Label><Input type="number" placeholder="50000" value={newLoan.current_amount} onChange={(e) => setNewLoan({ ...newLoan, current_amount: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>{t('Juros (%)')}</Label><Input type="number" placeholder="5" value={newLoan.interest_rate} onChange={(e) => setNewLoan({ ...newLoan, interest_rate: e.target.value })} /></div>
                        <div className="space-y-2"><Label>{t('Data Prevista')}</Label><Input type="date" value={newLoan.expected_return_date} onChange={(e) => setNewLoan({ ...newLoan, expected_return_date: e.target.value })} /></div>
                        <div className="space-y-2"><Label>{t('Data do Empréstimo')}</Label><Input type="date" value={newLoan.loan_date} onChange={(e) => setNewLoan({ ...newLoan, loan_date: e.target.value })} /></div>
                      </div>
                      <div className="space-y-2"><Label>{t('Notas')}</Label><Textarea placeholder={t('Observações...')} value={newLoan.notes} onChange={(e) => setNewLoan({ ...newLoan, notes: e.target.value })} /></div>
                      <Button onClick={createOrUpdateLoan} className="w-full" variant="accent">{editingLoan ? t('Atualizar') : t('Registrar')} {t('Empréstimo')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Loans List */}
              {loans.length === 0 ? (
                <div className="card-finance p-12 text-center"><Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="font-display text-lg font-semibold mb-2">{t('Nenhum empréstimo registrado')}</h3></div>
              ) : (
                <div className="space-y-4">
                  {loans.map((loan) => {
                    const status = getLoanStatus(loan);
                    const collectedPct = ((loan.original_amount - loan.current_amount) / loan.original_amount) * 100;
                    return (
                      <div key={loan.id} className="card-finance p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2"><h3 className="font-semibold">{loan.borrower_name}</h3><Badge className={status.color}>{status.label}</Badge></div>
                            {loan.borrower_contact && <p className="text-sm text-muted-foreground mb-2">{loan.borrower_contact}</p>}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div><p className="text-muted-foreground">{t('Original')}</p><p className="font-medium">Kz {loan.original_amount.toLocaleString('pt-AO')}</p></div>
                              <div><p className="text-muted-foreground">{t('Pendente')}</p><p className="font-medium text-orange-500">Kz {loan.current_amount.toLocaleString('pt-AO')}</p></div>
                              {loan.interest_rate && <div><p className="text-muted-foreground">{t('Juros')}</p><p className="font-medium">{loan.interest_rate}%</p></div>}
                              {loan.expected_return_date && <div><p className="text-muted-foreground">{t('Data Prevista')}</p><p className="font-medium">{format(parseISO(loan.expected_return_date), 'dd/MM/yyyy')}</p></div>}
                            </div>
                            <Progress value={collectedPct} className="h-2 mt-3" />
                          </div>
                          <div className="flex gap-2 ml-4">
                            {loan.status !== 'paid' && <Button size="sm" variant="accent" onClick={() => { setSelectedLoan(loan); setCollectionDialogOpen(true); }}><DollarSign className="h-4 w-4" /></Button>}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline"><Clock className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openLoanHistory(loan)}><Eye className="h-4 w-4 mr-2" />{t('Ver Histórico')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditLoan(loan)}><Edit2 className="h-4 w-4 mr-2" />{t('Editar')}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteLoan(loan.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t('Eliminar')}</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Calendar Tab */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="calendar" className="mt-4">
              <DebtCalendar debts={debts} loans={loans} />
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Debt Progress */}
                <Card>
                  <CardHeader><CardTitle>{t('Progresso das Dívidas')}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {debts.length === 0 ? <p className="text-muted-foreground">{t('Sem dívidas registadas')}</p> : debts.map(debt => {
                      const paid = debt.original_amount - debt.current_amount;
                      const pct = (paid / debt.original_amount) * 100;
                      return (
                        <div key={debt.id} className="space-y-2">
                          <div className="flex justify-between text-sm"><span>{debt.creditor}</span><span>{pct.toFixed(0)}%</span></div>
                          <Progress value={pct} className="h-3" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Loan Progress */}
                <Card>
                  <CardHeader><CardTitle>{t('Progresso dos Empréstimos')}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {loans.length === 0 ? <p className="text-muted-foreground">{t('Sem empréstimos registados')}</p> : loans.map(loan => {
                      const collected = loan.original_amount - loan.current_amount;
                      const pct = (collected / loan.original_amount) * 100;
                      return (
                        <div key={loan.id} className="space-y-2">
                          <div className="flex justify-between text-sm"><span>{loan.borrower_name}</span><span>{pct.toFixed(0)}%</span></div>
                          <Progress value={pct} className="h-3" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Payment Dialog */}
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{t('Registrar Pagamento')}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedDebt && <div className="p-4 bg-secondary/50 rounded-lg"><p className="font-medium">{selectedDebt.creditor}</p><p className="text-sm text-muted-foreground">{t('Saldo (Kz)')}: Kz {selectedDebt.current_amount.toLocaleString('pt-AO')}</p></div>}
                <div className="space-y-2"><Label>{t('Valor (Kz)')}</Label><Input type="number" placeholder="10000" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /></div>
                <Button onClick={makePayment} className="w-full" variant="accent"><CheckCircle className="h-4 w-4 mr-2" />{t('Confirmar')}</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Collection Dialog */}
          <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{t('Registrar Recebimento')}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedLoan && <div className="p-4 bg-secondary/50 rounded-lg"><p className="font-medium">{selectedLoan.borrower_name}</p><p className="text-sm text-muted-foreground">{t('Pendente')}: Kz {selectedLoan.current_amount.toLocaleString('pt-AO')}</p></div>}
                <div className="space-y-2"><Label>{t('Valor (Kz)')}</Label><Input type="number" placeholder="10000" value={collectionAmount} onChange={(e) => setCollectionAmount(e.target.value)} /></div>
                <Button onClick={recordCollection} className="w-full" variant="accent"><CheckCircle className="h-4 w-4 mr-2" />{t('Confirmar')}</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Debt History Dialog */}
          <Dialog open={debtHistoryOpen} onOpenChange={setDebtHistoryOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>{t('Histórico de Pagamentos')}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedDebt && <div className="p-4 bg-secondary/50 rounded-lg"><p className="font-medium">{selectedDebt.creditor}</p><p className="text-sm text-muted-foreground">{t('Pendente')}: Kz {selectedDebt.current_amount.toLocaleString('pt-AO')}</p></div>}
                {debtPayments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t('Nenhum pagamento registrado')}</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {debtPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-medium text-green-600">- Kz {payment.amount.toLocaleString('pt-AO')}</p>
                          <p className="text-xs text-muted-foreground">{payment.payment_date ? format(parseISO(payment.payment_date), 'dd/MM/yyyy HH:mm') : ''}</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteDebtPayment(payment)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Loan History Dialog */}
          <Dialog open={loanHistoryOpen} onOpenChange={setLoanHistoryOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>{t('Histórico de Recebimentos')}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedLoan && <div className="p-4 bg-secondary/50 rounded-lg"><p className="font-medium">{selectedLoan.borrower_name}</p><p className="text-sm text-muted-foreground">{t('Pendente')}: Kz {selectedLoan.current_amount.toLocaleString('pt-AO')}</p></div>}
                {loanCollections.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t('Nenhum recebimento registrado')}</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {loanCollections.map((collection) => (
                      <div key={collection.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-medium text-green-600">+ Kz {collection.amount.toLocaleString('pt-AO')}</p>
                          <p className="text-xs text-muted-foreground">{collection.collection_date ? format(parseISO(collection.collection_date), 'dd/MM/yyyy HH:mm') : ''}</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteLoanCollection(collection)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
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
