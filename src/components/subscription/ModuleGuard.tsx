import React from "react";
import { useModuleAccess, ModuleKey } from "@/hooks/useModuleAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Play, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ModuleGuardProps {
    moduleKey: ModuleKey;
    children: React.ReactNode;
    title: string;
    description: string;
}

export function ModuleGuard({ moduleKey, children, title, description }: ModuleGuardProps) {
    const { data: accessInfo, isLoading } = useModuleAccess(moduleKey);
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Check if user has already had a trial
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

    // Fetch the Basic plan for trial activation
    const { data: basicPlan } = useQuery({
        queryKey: ["basic-plan-for-trial"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("subscription_plans")
                .select("*")
                .or('name.eq.Básico,name.eq.Gratuito')
                .eq("is_active", true)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
    });

    const startTrialMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id || !basicPlan) throw new Error("Usuário ou plano não encontrado");

            const trialDays = Number(basicPlan.trial_period_days) || 3;
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + trialDays);

            const { error } = await supabase.from("user_subscriptions").insert({
                user_id: user.id,
                plan_id: basicPlan.id,
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
        },
        onError: (error: any) => {
            toast.error(`Erro ao activar teste: ${error.message}`);
        },
    });

    // Destructure access info with fallbacks
    const hasAccess = accessInfo?.hasAccess ?? false;
    const isExpired = accessInfo?.isExpired ?? false;

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <Card className="mx-auto max-w-2xl border-2 border-dashed border-primary/20 bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Lock className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold">
                        {isExpired ? "O seu teste terminou!" : title}
                    </h2>
                    <p className="mb-8 text-muted-foreground whitespace-pre-line">
                        {isExpired
                            ? "O seu período de teste de 3 dias chegou ao fim.\nAtive o plano mensal por apenas 2.000 Kz para continuar a utilizar este módulo."
                            : description}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {(!hasHadTrial && !isExpired && basicPlan) && (
                            <Button
                                className="gradient-success text-white"
                                onClick={() => startTrialMutation.mutate()}
                                disabled={startTrialMutation.isPending}
                            >
                                {startTrialMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Play className="mr-2 h-4 w-4" />
                                )}
                                Iniciar Avaliação 3 dias grátis
                            </Button>
                        )}
                        <Button
                            className="gradient-accent text-accent-foreground"
                            onClick={() => navigate("/plans")}
                        >
                            {isExpired ? "Renovar por 2.000 Kz" : "Ativar Módulo Agora"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/dashboard")}>
                            Voltar ao Início
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return <>{children}</>;
}
