import React from "react";
import { useModuleAccess, ModuleKey } from "@/hooks/useModuleAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModuleGuardProps {
    moduleKey: ModuleKey;
    children: React.ReactNode;
    title: string;
    description: string;
}

export function ModuleGuard({ moduleKey, children, title, description }: ModuleGuardProps) {
    const { data: accessInfo, isLoading } = useModuleAccess(moduleKey);
    const navigate = useNavigate();

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
                            ? "O seu período de teste de 7 dias chegou ao fim.\nAtive o plano mensal por apenas 2.000 Kz para continuar a utilizar este módulo."
                            : description}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
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
