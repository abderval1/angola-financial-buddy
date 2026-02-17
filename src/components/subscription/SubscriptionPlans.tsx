import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Crown, Upload, Loader2, BookOpen, Zap, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Plan {
  id: string;
  name: string;
  price: number;
  ebook_limit: number;
  features: string[];
  is_active: boolean;
  trial_period_days?: number;
  module_key?: string;
}

interface SubscriptionPlansProps {
  onSuccess?: () => void;
}

export function SubscriptionPlans({ onSuccess }: SubscriptionPlansProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      return data as Plan[];
    },
  });

  const { data: hasHadTrial } = useQuery({
    queryKey: ["user-has-had-trial", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user?.id)
        .eq("is_trial", true)
        .limit(1);

      if (error) return false;
      return (data?.length || 0) > 0;
    },
    enabled: !!user?.id,
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const startTrialMutation = useMutation({
    mutationFn: async (plan: Plan) => {
      if (!plan.trial_period_days) return;

      const trialDays = Number(plan.trial_period_days) || 3;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + trialDays);

      const { error } = await supabase.from("user_subscriptions").insert({
        user_id: user?.id,
        plan_id: plan.id,
        status: "active",
        is_trial: true,
        expires_at: expirationDate.toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Período de teste activado com sucesso! Aproveite os próximos 3 dias.");
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["user-has-had-trial"] });
      queryClient.invalidateQueries({ queryKey: ["module-access"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Erro ao activar teste: ${error.message}`);
    },
  });

  const { data: downloadCount = 0 } = useQuery({
    queryKey: ["ebook-download-count", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebook_downloads")
        .select("id", { count: "exact" })
        .eq("user_id", user?.id)
        .eq("is_free_download", true);

      if (error) return 0;
      return data?.length || 0;
    },
    enabled: !!user?.id,
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, proofUrl }: { planId: string; proofUrl?: string }) => {
      const plan = plans.find(p => p.id === planId);
      const isTrialOrFree = Number(plan?.price) === 0 || (plan?.trial_period_days && plan?.trial_period_days > 0);
      const trialDays = plan?.trial_period_days || 3;

      const { error } = await supabase.from("user_subscriptions").insert({
        user_id: user?.id,
        plan_id: planId,
        payment_proof_url: proofUrl,
        status: isTrialOrFree ? "active" : "pending",
        is_trial: isTrialOrFree,
        expires_at: isTrialOrFree ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString() : null
      });

      if (error) throw error;
    },
    onSuccess: () => {
      const plan = plans.find(p => p.id === selectedPlan?.id);
      const isTrialOrFree = Number(plan?.price) === 0;

      if (isTrialOrFree) {
        toast.success("Módulo activado com sucesso! Aproveite o seu teste de 3 dias.");
      } else {
        toast.success("Assinatura enviada! Aguarde a aprovação do administrador.");
      }
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["module-access"] });
      setDialogOpen(false);
      setSelectedPlan(null);
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao enviar assinatura");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlan || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      // Store the proof URL for later confirmation
      setProofUrl(urlData.publicUrl);
      toast.success("Comprovativo enviado com sucesso! Clique em Confirmar para finalizar.");
    } catch (error) {
      toast.error("Erro ao enviar comprovativo: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes("premium") || planName.toLowerCase().includes("avançado")) return Crown;
    if (planName.toLowerCase().includes("intermediário") || planName.toLowerCase().includes("pro")) return Star;
    if (planName.toLowerCase().includes("essencial")) return Zap;
    return BookOpen;
  };

  const getPlanStyle = (index: number) => {
    if (index === 3) return "subscription-card subscription-card-premium"; // Avançado
    if (index === 2) return "subscription-card subscription-card-intermediate"; // Pro
    if (index === 1) return "subscription-card subscription-card-essencial"; // Essencial
    return "subscription-card subscription-card-basic"; // Básico
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId && currentSubscription?.status === "active";
  };

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Status */}
      {currentSubscription && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Plano {currentSubscription.subscription_plans?.name || t("Atual", "Atual")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Status: {" "}
                    <Badge
                      variant={currentSubscription.status === "active" ? "default" : "secondary"}
                      className={currentSubscription.status === "active" ? "bg-success" : ""}
                    >
                      {currentSubscription.status === "active" ? ((currentSubscription as any).is_trial ? t("Período de Teste", "Período de Teste") : t("Ativo", "Ativo")) :
                        currentSubscription.status === "pending" ? t("Pendente", "Pendente") :
                          currentSubscription.status === "expired" ? t("Expirado", "Expirado") : t("Cancelado", "Cancelado")}
                    </Badge>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {downloadCount}/{currentSubscription.subscription_plans?.ebook_limit || 0}
                </p>
                <p className="text-sm text-muted-foreground">Ebooks baixados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => {
          const PlanIcon = getPlanIcon(plan.name);
          const isCurrent = isCurrentPlan(plan.id);
          const features = Array.isArray(plan.features) ? plan.features : [];
          // RESTRICTION: Trial is only for Basic plan
          const isBasicPlan = plan.name === 'Básico' || plan.name === 'Gratuito';
          const canTakeTrial = plan.trial_period_days && !hasHadTrial && !currentSubscription && isBasicPlan;

          return (
            <div key={plan.id} className={`${getPlanStyle(index)} relative`}>
              {index === 2 && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                  Mais Popular
                </Badge>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${index >= 2 ? "bg-accent/20" : "bg-primary/10"
                  }`}>
                  <PlanIcon className={`h-5 w-5 ${index >= 2 ? "text-accent" : "text-primary"}`} />
                </div>
                <h3 className="font-display text-xl font-bold">
                  {plan.name === 'Gratuito' ? 'Básico' : plan.name}
                </h3>
              </div>

              <div className="mb-6">
                {(plan.module_key === 'basic' || plan.name === 'Básico' || plan.name === 'Gratuito' || plan.trial_period_days > 0) && (
                  <Badge variant="secondary" className="mb-2 bg-success/10 text-success border-success/20">
                    3 Dias de Avaliação
                  </Badge>
                )}
                <div>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground break-all">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-muted-foreground ml-1">Kz/mês</span>
                </div>
                {isBasicPlan && plan.trial_period_days && !hasHadTrial && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    * Grátis nos primeiros 3 dias, depois 2.000 Kz/mês
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span><strong>{plan.ebook_limit}</strong> ebooks inclusos</span>
                </li>
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>{feature.replace('Plano Gratuito', 'Plano Básico')}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                {canTakeTrial ? (
                  <Button
                    className="w-full gradient-success"
                    onClick={() => startTrialMutation.mutate(plan)}
                    disabled={startTrialMutation.isPending}
                  >
                    {startTrialMutation.isPending ? "Activando..." : "Iniciar Teste Grátis"}
                  </Button>
                ) : null}

                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : index >= 2 ? "default" : "outline"}
                  disabled={isCurrent || currentSubscription?.status === "pending"}
                  onClick={() => { setSelectedPlan(plan); setDialogOpen(true); }}
                >
                  {isCurrent ? "Plano Atual" :
                    currentSubscription?.status === "pending" ? "Aguardando Aprovação" :
                      "Assinar Agora"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinar Plano {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Envie o comprovativo de pagamento para ativar sua assinatura.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {Number(selectedPlan?.price) !== 0 && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Valor a pagar:</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground break-all">
                  {selectedPlan && formatPrice(selectedPlan.price)}
                </p>
              </div>
            )}

            {Number(selectedPlan?.price) !== 0 && (
              <div className="space-y-2">
                <Label>Dados para Transferência:</Label>
                <div className="p-4 bg-primary/5 rounded-lg space-y-2 text-sm">
                  <p><strong>IBAN:</strong> AO06.0040.0000.5481.7076.1016.6</p>
                  <p><strong>Banco:</strong> BAI</p>
                  <p><strong>Titular:</strong> Agostinho Francisco Paixão do Rosário</p>
                </div>
              </div>
            )}

            {Number(selectedPlan?.price) !== 0 ? (
              <div className="space-y-3">
                <Label>Comprovativo de Pagamento (Opcional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {proofUrl ? "Comprovativo Enviado" : "Enviar Comprovativo (PDF ou Imagem)"}
                    </>
                  )}
                </Button>
                {proofUrl && (
                  <p className="text-xs text-success text-center flex items-center justify-center gap-1">
                    <Check className="h-3 w-3" /> Comprovativo carregado com sucesso!
                  </p>
                )}
                <Button
                  className="w-full gradient-success"
                  onClick={() => subscribeMutation.mutate({
                    planId: selectedPlan!.id,
                    proofUrl: proofUrl || undefined
                  })}
                  disabled={subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    "Confirmar Assinatura"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  O comprovativo é opcional. Sua assinatura será analisada em até 24h.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-center">
                  <p className="text-sm font-medium text-success">Este plano inclui um período de 3 dias grátis para avaliação.</p>
                </div>
                <Button
                  className="w-full gradient-success"
                  onClick={() => subscribeMutation.mutate({ planId: selectedPlan!.id })}
                  disabled={subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Activando...
                    </>
                  ) : (
                    "Começar meu teste de avaliação"
                  )}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
