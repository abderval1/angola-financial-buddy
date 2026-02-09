import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Target,
    GraduationCap,
    Newspaper,
    Check,
    Flame,
    Zap,
    Upload,
    Clock,
    AlertCircle,
    ArrowRight,
    RefreshCw
} from "lucide-react";

export default function Plans() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);

    // No fallback plans - force DB fetch

    const { data: plans = [], isLoading: loadingPlans, refetch: refetchPlans } = useQuery({
        queryKey: ["subscription-plans"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("subscription_plans")
                .select("*")
                .eq("is_active", true)
                .order("price", { ascending: true });

            if (error) throw error;
            return data || [];
        },
    });

    const seedPlansMutation = useMutation({
        mutationFn: async () => {
            // Just trigger a refetch - the migration should have seeded the data
            await refetchPlans();
        },
        onSuccess: () => {
            toast.success("Planos carregados!");
            setTimeout(() => window.location.reload(), 500);
        },
        onError: () => {
            toast.error("Erro ao carregar planos. Tente recarregar a página manualmente.");
        }
    });

    const { data: userSubscriptions = [] } = useQuery({
        queryKey: ["my-subscriptions", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("user_subscriptions")
                .select("*, subscription_plans(*)")
                .eq("user_id", user?.id);

            if (error) throw error;
            return (data as any[]) || [];
        },
        enabled: !!user?.id,
    });

    const purchaseMutation = useMutation({
        mutationFn: async ({ planId, proofUrl }: { planId: string; proofUrl: string }) => {
            const { error } = await supabase
                .from("user_subscriptions")
                .insert({
                    user_id: user?.id,
                    plan_id: planId,
                    payment_proof_url: proofUrl,
                    status: "pending"
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
            toast.success("Pedido de ativação enviado! Aguarde a aprovação do administrador.");
            setPurchaseDialogOpen(false);
            setPaymentProofUrl(null);
        },
        onError: (error: any) => {
            toast.error("Erro ao processar pedido: " + error.message);
        }
    });

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file || !user) return;

            setUploading(true);
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("receipts")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("receipts")
                .getPublicUrl(filePath);

            setPaymentProofUrl(publicUrl);
            toast.success("Comprovativo carregado com sucesso!");
        } catch (error: any) {
            toast.error("Erro no upload: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const hasActiveModule = (planName: string) => {
        return userSubscriptions.some(
            (sub: any) => sub.subscription_plans?.name === planName && sub.status === "active"
        );
    };

    const hasPendingModule = (planName: string) => {
        return userSubscriptions.some(
            (sub: any) => sub.subscription_plans?.name === planName && sub.status === "pending"
        );
    };

    const getModuleIcon = (planName: string) => {
        if (planName.includes("Essencial")) return <Target className="h-6 w-6" />;
        if (planName.includes("Pro")) return <GraduationCap className="h-6 w-6" />;
        if (planName.includes("Avançado")) return <Newspaper className="h-6 w-6" />;
        return <Zap className="h-6 w-6" />;
    };

    return (
        <AppLayout title="Planos & Módulos" subtitle="Escolha os recursos que deseja ativar">
            <div className="space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h2 className="text-3xl font-display font-bold">Potencialize suas Finanças</h2>
                    <p className="text-muted-foreground text-lg">
                        Selecione um ou mais módulos para desbloquear ferramentas exclusivas pensadas para a realidade de Angola.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loadingPlans ? (
                        [1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse h-[400px] bg-muted/20 border-border/50" />
                        ))
                    ) : plans.length === 0 ? (
                        <Card className="md:col-span-3 border-dashed border-2 py-12">
                            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                                <AlertCircle className="h-12 w-12 text-muted-foreground opacity-50" />
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">Nenhum plano encontrado no banco de dados</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        Os planos automáticos de reserva não carregaram ou o banco de dados está vazio.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => queryClient.invalidateQueries({ queryKey: ["subscription-plans"] })}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Tentar Novamente
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => seedPlansMutation.mutate()}
                                        disabled={seedPlansMutation.isPending}
                                    >
                                        <Zap className="mr-2 h-4 w-4" />
                                        {seedPlansMutation.isPending ? "Restaurando..." : "Restaurar Planos (Admin)"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        plans.map((plan: any) => {
                            const active = hasActiveModule(plan.name);
                            const pending = hasPendingModule(plan.name);

                            return (
                                <Card key={plan.id} className={`flex flex-col overflow-hidden border-2 transition-all hover:shadow-lg ${active ? 'border-success/30 bg-success/5 shadow-none hover:shadow-none' : 'border-primary/10'}`}>
                                    <CardHeader className="text-center pb-2">
                                        <div className={`mx-auto h-16 w-16 mb-4 flex items-center justify-center rounded-2xl ${active ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary animate-pulse-subtle'}`}>
                                            {getModuleIcon(plan.name)}
                                        </div>
                                        <CardTitle className="text-2xl font-display">{plan.name}</CardTitle>
                                        <CardDescription className="text-2xl font-bold text-foreground mt-2">
                                            {`${new Intl.NumberFormat("pt-AO").format(plan.price)} Kz/mês`}
                                            {plan.trial_period_days > 0 && (
                                                <div className="text-xs text-success font-semibold uppercase tracking-wider mt-1">
                                                    7 Dias de Avaliação Gratuita
                                                </div>
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 pt-6 border-t border-dashed">
                                        <ul className="space-y-3">
                                            {plan.features?.map((feature: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm">
                                                    <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <Check className="h-3 w-3 text-success" />
                                                    </div>
                                                    <span className="text-muted-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="pt-6">
                                        {active ? (
                                            <Button disabled className="w-full bg-success/10 text-success hover:bg-success/10">
                                                <Check className="mr-2 h-4 w-4" />
                                                Módulo Ativo
                                            </Button>
                                        ) : pending ? (
                                            <Button disabled variant="secondary" className="w-full">
                                                <Clock className="mr-2 h-4 w-4" />
                                                Aguardando Aprovação
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full h-11 gradient-accent text-accent-foreground"
                                                onClick={() => {
                                                    setSelectedPlan(plan);
                                                    setPurchaseDialogOpen(true);
                                                }}
                                            >
                                                {plan.trial_period_days ? "Iniciar Teste" : "Ativar Módulo"}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Existing Subscriptions / Info */}
                {(userSubscriptions.length > 0) && (
                    <div className="mt-12">
                        <h3 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Estado das suas Ativações
                        </h3>
                        <div className="space-y-4">
                            {userSubscriptions.map((sub: any) => (
                                <div key={sub.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                            {getModuleIcon(sub.subscription_plans?.name || "")}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{sub.plan_name || "Módulo"}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {sub.expires_at ? `Expira em: ${new Date(sub.expires_at).toLocaleDateString()}` : 'Aguardando validação'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={sub.status === 'active' ? 'default' : sub.status === 'pending' ? 'secondary' : 'destructive'}>
                                        {sub.status === 'active' ? 'Ativo' : sub.status === 'pending' ? 'Pendente' : 'Inativo'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Purchase Dialog */}
                <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Ativar {selectedPlan?.name}</DialogTitle>
                            <DialogDescription>
                                Siga os passos abaixo para ativar seu acesso por 30 dias.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="bg-muted p-4 rounded-xl space-y-3">
                                <p className="text-sm font-semibold">Dados para Pagamento (IBAN):</p>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-mono text-wrap">IBAN: AO06.0040.0000.5481.7076.1016.6</p>
                                    <p className="text-xs text-muted-foreground">Titular: Agostinho Francisco Paixão do Rosário</p>
                                </div>
                                <div className="pt-2 border-t border-border/50 text-center">
                                    <p className="text-sm">Valor: <span className="font-bold">{selectedPlan?.price.toLocaleString()} Kz</span></p>
                                    {selectedPlan?.trial_period_days && (
                                        <p className="text-xs text-success font-medium mt-1">Inclui {selectedPlan.trial_period_days} dias de teste grátis</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="proof">Carregar Comprovativo (PDF ou Imagem)</Label>
                                <Input
                                    id="proof"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                {uploading && <p className="text-sm text-muted-foreground animate-pulse">A carregar...</p>}
                                {paymentProofUrl && (
                                    <p className="text-sm text-success font-medium flex items-center gap-2">
                                        <Check className="h-4 w-4" /> Comprovativo carregado com sucesso!
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Cancelar</Button>
                            <Button
                                disabled={!paymentProofUrl || purchaseMutation.isPending}
                                className="gradient-accent text-accent-foreground"
                                onClick={() => purchaseMutation.mutate({ planId: selectedPlan.id, proofUrl: paymentProofUrl! })}
                            >
                                {purchaseMutation.isPending ? "A processar..." : "Confirmar Pagamento"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
