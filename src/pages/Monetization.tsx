import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Wallet,
  Gift,
  Copy,
  Share2,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Banknote,
  Smartphone,
  Zap,
  Info,
  Star,
  Target,
  Award
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Monetization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<string>("");
  const [payoutDetails, setPayoutDetails] = useState({
    bank_name: "",
    account_number: "",
    iban: "",
    phone: "",
  });

  // Fetch referral code
  const { data: referralCode, isLoading: loadingCode } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      // First try to get existing code
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      // If no code exists, call function to create one
      if (!data) {
        const { data: newCode, error: fnError } = await supabase
          .rpc("ensure_user_referral_code", { p_user_id: user?.id });

        if (fnError) throw fnError;

        // Fetch the newly created code
        const { data: createdCode } = await supabase
          .from("referral_codes")
          .select("*")
          .eq("user_id", user?.id)
          .single();

        return createdCode;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user balance
  const { data: balance } = useQuery({
    queryKey: ["user-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_user_balance", { p_user_id: user?.id });

      if (error) throw error;
      return data?.[0] || { total_earned: 0, total_pending: 0, total_paid: 0, available_balance: 0 };
    },
    enabled: !!user?.id,
  });

  // Fetch earnings history
  const { data: earnings = [] } = useQuery({
    queryKey: ["user-earnings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_earnings")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch referrals
  const { data: referrals = [] } = useQuery({
    queryKey: ["user-referrals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_referrals")
        .select("*")
        .eq("referrer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch payout requests
  const { data: payouts = [] } = useQuery({
    queryKey: ["payout-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch monetization settings
  const { data: settings = {} } = useQuery({
    queryKey: ["monetization-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monetization_settings")
        .select("*");

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data?.forEach(s => {
        settingsMap[s.setting_key] = s.setting_value;
      });
      return settingsMap;
    },
  });

  // Create payout request mutation
  const createPayoutMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(payoutAmount);
      const minPayout = settings.minimum_payout?.amount || 5000;

      if (amount < minPayout) {
        throw new Error(`Valor mínimo para levantamento: ${minPayout.toLocaleString()} Kz`);
      }

      if (amount > (balance?.available_balance || 0)) {
        throw new Error("Saldo insuficiente");
      }

      const { error } = await supabase
        .from("payout_requests")
        .insert({
          user_id: user?.id,
          amount,
          payment_method: payoutMethod,
          payment_details: payoutMethod === "bank_transfer"
            ? { bank_name: payoutDetails.bank_name, account_number: payoutDetails.account_number, iban: payoutDetails.iban }
            : { phone: payoutDetails.phone },
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      toast.success("Pedido de levantamento criado com sucesso!");
      setPayoutDialogOpen(false);
      setPayoutAmount("");
      setPayoutMethod("");
      setPayoutDetails({ bank_name: "", account_number: "", iban: "", phone: "" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode?.code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const shareReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode?.code}`;
    const text = `Junte-se a mim no Angola Finance e ganhe ${settings.referral_signup_bonus?.referred || 250} Kz de bónus! Use o meu código: ${referralCode?.code}`;

    if (navigator.share) {
      navigator.share({ title: "Angola Finance - Finanças Pessoais", text, url: link });
    } else {
      navigator.clipboard.writeText(`${text}\n${link}`);
      toast.success("Texto e link copiados!");
    }
  };

  const getEarningTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      referral_signup: "Indicação",
      referral_subscription: "Comissão Assinatura",
      referral_purchase: "Comissão Compra",
      marketplace_sale: "Venda Marketplace",
      challenge_reward: "Recompensa Desafio",
      content_bonus: "Bónus Conteúdo",
    };
    return labels[type] || type;
  };

  const getEarningTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      referral_signup: Users,
      referral_subscription: Star,
      referral_purchase: TrendingUp,
      marketplace_sale: Wallet,
      challenge_reward: Award,
      content_bonus: Gift,
    };
    const Icon = icons[type] || Gift;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      approved: { variant: "default", label: "Aprovado" },
      paid: { variant: "outline", label: "Pago" },
      cancelled: { variant: "destructive", label: "Cancelado" },
      processing: { variant: "secondary", label: "Processando" },
      completed: { variant: "default", label: "Concluído" },
      rejected: { variant: "destructive", label: "Rejeitado" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const minPayout = settings.minimum_payout?.amount || 5000;
  const availableBalance = balance?.available_balance || 0;
  const canRequestPayout = availableBalance >= minPayout;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Centro de Monetização
          </h1>
          <p className="text-muted-foreground mt-1">
            Ganhe dinheiro indicando amigos e vendendo no marketplace
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {availableBalance.toLocaleString()} Kz
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
              {availableBalance >= minPayout && (
                <Button
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => setPayoutDialogOpen(true)}
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Solicitar Levantamento
                </Button>
              )}
              {availableBalance < minPayout && availableBalance > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso para levantamento</span>
                    <span>{Math.round((availableBalance / minPayout) * 100)}%</span>
                  </div>
                  <Progress value={(availableBalance / minPayout) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Faltam {(minPayout - availableBalance).toLocaleString()} Kz
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ganho</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {(balance?.total_earned || 0).toLocaleString()} Kz
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {(balance?.total_pending || 0).toLocaleString()} Kz
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pago</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {(balance?.total_paid || 0).toLocaleString()} Kz
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Programa de Afiliados</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Convide amigos e ganhe <span className="font-bold text-primary">{settings.referral_signup_bonus?.referrer || 500} Kz</span> por cada registo.
                  Seu amigo também ganha <span className="font-bold text-primary">{settings.referral_signup_bonus?.referred || 250} Kz</span>!
                </p>

                <div className="flex items-center gap-3 p-3 bg-background/80 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Seu código de convite</p>
                    <p className="text-xl font-mono font-bold tracking-wider text-primary">
                      {loadingCode ? "..." : referralCode?.code || "Gerando..."}
                    </p>
                  </div>
                  <Button variant="outline" size="icon" onClick={copyReferralLink} disabled={!referralCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={shareReferralLink} disabled={!referralCode}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:w-64">
                <div className="text-center p-4 bg-background/80 rounded-lg border">
                  <p className="text-3xl font-bold text-primary">{referralCode?.total_referrals || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Indicados</p>
                </div>
                <div className="text-center p-4 bg-background/80 rounded-lg border">
                  <p className="text-3xl font-bold text-success">{referralCode?.successful_referrals || 0}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-4 bg-muted/30">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong>Como funciona:</strong> Partilhe seu código. Quando alguém se registar usando o código,
                ambos recebem bónus! Você também ganha {settings.referral_subscription_commission?.percentage || 10}%
                de comissão quando seus indicados fazem uma assinatura.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="earnings" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ganhos
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Indicados
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Levantamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Ganhos</CardTitle>
                <CardDescription>
                  Todos os seus ganhos na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {earnings.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum ganho ainda</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Comece a indicar amigos para ganhar recompensas!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earnings.map((earning: any) => (
                      <div
                        key={earning.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            {getEarningTypeIcon(earning.earning_type)}
                          </div>
                          <div>
                            <p className="font-medium">{getEarningTypeLabel(earning.earning_type)}</p>
                            <p className="text-sm text-muted-foreground">
                              {earning.description || format(new Date(earning.created_at), "dd MMM yyyy", { locale: pt })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-success">+{earning.amount.toLocaleString()} Kz</p>
                          {getStatusBadge(earning.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Seus Indicados</CardTitle>
                <CardDescription>
                  Pessoas que se registaram com o seu código
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum indicado ainda</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Partilhe seu código e comece a ganhar!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((referral: any) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Usuário Indicado</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(referral.created_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {referral.reward_earned > 0 && (
                            <p className="font-bold text-success">+{referral.reward_earned.toLocaleString()} Kz</p>
                          )}
                          {getStatusBadge(referral.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pedidos de Levantamento</CardTitle>
                  <CardDescription>
                    Histórico de pedidos de pagamento
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setPayoutDialogOpen(true)}
                  disabled={!canRequestPayout}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Novo Pedido
                </Button>
              </CardHeader>
              <CardContent>
                {!canRequestPayout && (
                  <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>Saldo mínimo:</strong> Você precisa de pelo menos {minPayout.toLocaleString()} Kz
                      para solicitar um levantamento. Saldo atual: {availableBalance.toLocaleString()} Kz
                    </p>
                  </div>
                )}

                {payouts.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum pedido de levantamento</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout: any) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            {payout.payment_method === "bank_transfer" && <Banknote className="h-5 w-5" />}
                            {payout.payment_method === "mobile_money" && <Smartphone className="h-5 w-5" />}
                            {payout.payment_method === "express" && <Zap className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium">
                              {payout.payment_method === "bank_transfer" && "Transferência Bancária"}
                              {payout.payment_method === "mobile_money" && "Mobile Money"}
                              {payout.payment_method === "express" && "Unitel Money"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payout.created_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{payout.amount.toLocaleString()} Kz</p>
                          {getStatusBadge(payout.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payout Dialog */}
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar Levantamento</DialogTitle>
              <DialogDescription>
                Saldo disponível: {availableBalance.toLocaleString()} Kz
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Valor (Kz)</Label>
                <Input
                  type="number"
                  placeholder={`Mínimo ${minPayout.toLocaleString()}`}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={availableBalance}
                />
              </div>

              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Transferência Bancária
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {payoutMethod === "bank_transfer" && (
                <>
                  <div className="space-y-2">
                    <Label>Nome do Banco</Label>
                    <Input
                      placeholder="Ex: BFA, BAI, BIC..."
                      value={payoutDetails.bank_name}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, bank_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número da Conta</Label>
                    <Input
                      placeholder="Número da conta bancária"
                      value={payoutDetails.account_number}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, account_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN (opcional)</Label>
                    <Input
                      placeholder="IBAN"
                      value={payoutDetails.iban}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, iban: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createPayoutMutation.mutate()}
                disabled={
                  createPayoutMutation.isPending ||
                  !payoutMethod ||
                  !payoutAmount ||
                  parseFloat(payoutAmount) < minPayout ||
                  (payoutMethod === "bank_transfer" && (!payoutDetails.bank_name || !payoutDetails.account_number))
                }
              >
                {createPayoutMutation.isPending ? "Processando..." : "Confirmar Pedido"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
