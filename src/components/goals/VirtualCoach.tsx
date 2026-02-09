
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Brain,
    Lightbulb,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    Target,
    Banknote,
    Milestone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { GoalActionDialog } from "./GoalActionDialog";

interface VirtualCoachProps {
    totalNetWorth: number;
    emergencyFundTotal: number;
    monthlyExpenses: number;
    investmentDistribution: Record<string, number>; // e.g. { 'poupanca': 50000, 'otnr': 100000 }
    inflationRate?: number;
    expenseSource?: 'default' | 'history' | 'alerts' | 'manual' | 'budget';
    hasBudgetAlerts?: boolean;
}

export function VirtualCoach({
    totalNetWorth,
    emergencyFundTotal,
    monthlyExpenses,
    investmentDistribution,
    inflationRate = 18, // Default Angolan inflation estimate
    expenseSource = 'default',
    hasBudgetAlerts = false
}: VirtualCoachProps) {
    const navigate = useNavigate();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [goalAction, setGoalAction] = useState<{ name: string, target: number, icon: string } | null>(null);

    // Logic Engine: 6-Step Financial Staircase (The "Dave Ramsey" style for Angola)
    const determineStep = () => {
        const monthsCovered = emergencyFundTotal / (monthlyExpenses || 1);

        // Step 1: Organization
        // Rigorous Check: User MUST have Budget Alerts (Registered Budget) to pass Step 1.
        // Merely having a Manual Total or Transaction History is not enough.

        if (!hasBudgetAlerts) return {
            step: 1,
            title: "Organização Inicial",
            desc: "Você não tem categorias definidas no Orçamento. Crie Alertas de Orçamento para organizar suas finanças.",
            action: "Criar Orçamento",
            route: "/budget",
            icon: <Milestone className="h-5 w-5 text-primary" />
        };

        // Step 2: Starter Emergency Fund (1 Month)
        if (monthsCovered < 1) return {
            step: 2,
            title: "Fundo de Segurança Inicial",
            desc: "Antes de investir, guarde pelo menos 1 mês de despesas para pequenos imprevistos.",
            targetParams: { months: 1 },
            action: "Criar Meta Agora",
            route: "/savings",
            isGoalAction: true,
            goalData: {
                name: "Fundo de Emergência Inicial",
                target: monthlyExpenses,
                icon: "🛡️"
            },
            icon: <ShieldCheck className="h-5 w-5 text-destructive" />
        };

        // Step 3: Full Emergency Fund (3-6 Months)
        if (monthsCovered < 6) {
            const target = monthlyExpenses * 6;
            let sourceText = "";

            if (expenseSource === 'manual') sourceText = "seu valor definido manualmente";
            else if (expenseSource === 'alerts') sourceText = "seus alertas de orçamento";
            else if (expenseSource === 'budget') sourceText = "seus alertas de orçamento"; // Legacy fallback
            else if (expenseSource === 'history') sourceText = "sua média real de gastos";
            else sourceText = "uma estimativa padrão (defina seu orçamento!)";

            return {
                step: 3,
                title: "Blindagem Financeira",
                desc: `Com base em ${sourceText}, você gasta ${monthlyExpenses.toLocaleString()} Kz/mês. Para blindar suas finanças, sua Reserva deve chegar a ${target.toLocaleString()} Kz.`,
                targetParams: { months: 6 },
                action: "Criar Meta Completa",
                route: "/savings",
                isGoalAction: true,
                goalData: {
                    name: "Fundo de Emergência Completo",
                    target: target,
                    icon: "🛡️"
                },
                icon: <ShieldCheck className="h-5 w-5 text-amber-500" />
            };
        }

        // Step 4: Inflation Protection (Fixed Income Base)
        const cash = investmentDistribution['poupanca'] || 0;
        const cashPct = totalNetWorth > 0 ? (cash / totalNetWorth) * 100 : 0;

        if (cashPct > 40) return {
            step: 4,
            title: "Proteção da Inflação",
            desc: `Muito dinheiro parado! Para vencer a inflação de ${inflationRate}%, mova capital para OTNRs ou Depósitos a Prazo.`,
            allocation: { fixed: 70, variable: 10, cash: 20 },
            action: "Investir em Renda Fixa",
            route: "/investments",
            icon: <TrendingUp className="h-5 w-5 text-blue-500" />
        };

        // Step 5: Wealth Acceleration
        return {
            step: 5,
            title: "Aceleração de Riqueza",
            desc: "Sua base é sólida. Acelere com Renda Variável (Ações, Negócios) e Imóveis para multiplicar patrimônio.",
            allocation: { fixed: 40, variable: 50, cash: 10 },
            action: "Diversificar Agora",
            route: "/investments",
            icon: <Target className="h-5 w-5 text-emerald-500" />
        };
    };

    const currentStep = determineStep();

    // Recommendations based on Allocation
    const getAssetAllocationAdvice = () => {
        if (currentStep.step < 4) return null;

        return (
            <div className="mt-4 p-3 bg-muted/40 rounded-lg space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" /> Sugestão de Carteira Ideal
                </h4>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs items-center">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Renda Fixa (Segurança)</span>
                        <span className="font-bold">{currentStep.allocation?.fixed}%</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div>Renda Variável (Crescimento)</span>
                        <span className="font-bold">{currentStep.allocation?.variable}%</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Liquidez (Oportunidade)</span>
                        <span className="font-bold">{currentStep.allocation?.cash}%</span>
                    </div>
                </div>
            </div>
        );
    };

    const getBorderColor = (step: number) => {
        switch (step) {
            case 1: return 'border-muted bg-muted/5';
            case 2: return 'border-destructive/50 bg-destructive/5';
            case 3: return 'border-amber-500/50 bg-amber-500/5';
            case 4: return 'border-blue-500/50 bg-blue-500/5';
            case 5: return 'border-emerald-500/50 bg-emerald-500/5';
            default: return 'border-primary/20 bg-primary/5';
        }
    };

    return (
        <Card className={`border-2 ${getBorderColor(currentStep.step)} transition-all shadow-md`}>
            <CardHeader className="pb-2 flex flex-row items-center gap-4 space-y-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <h1 className="text-6xl font-black">{currentStep.step}</h1>
                </div>

                <div className="relative z-10">
                    <div className="h-12 w-12 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-sm">
                        <Brain className="h-7 w-7 text-primary animate-pulse" />
                    </div>
                    <Badge className="absolute -bottom-2 -right-2 px-1 py-0.5 text-[9px]" variant="secondary">COACH</Badge>
                </div>
                <div className="z-10">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        {currentStep.icon}
                        Passo {currentStep.step}: {currentStep.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Plano Estratégico Personalizado</p>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <p className="text-sm leading-relaxed font-medium mb-3">
                    "{currentStep.desc}"
                </p>

                {/* Progress Bar for Steps */}
                <div className="flex items-center gap-1 mb-4 w-full">
                    {[1, 2, 3, 4, 5].map((step) => (
                        <div
                            key={step}
                            className={`h-1.5 flex-1 rounded-full transition-all ${step <= currentStep.step ? 'bg-primary' : 'bg-muted'}`}
                            title={`Passo ${step}`}
                        />
                    ))}
                </div>

                {getAssetAllocationAdvice()}

                {/* Source Badge */}
                <div className="flex justify-end mb-2">
                    <Badge variant="outline" className="text-[9px] text-muted-foreground font-normal">
                        Base de Cálculo: {expenseSource === 'budget' || expenseSource === 'alerts' ? 'Orçamento Definido' : expenseSource === 'manual' ? 'Valor Fixo (Manual)' : expenseSource === 'history' ? 'Histórico de Gastos' : 'Estimativa Padrão'}
                    </Badge>
                </div>

                <Separator className="my-3" />

                <div className="flex gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs h-8"
                        onClick={() => {
                            if (currentStep.isGoalAction && currentStep.goalData) {
                                setGoalAction({
                                    name: currentStep.goalData.name,
                                    target: currentStep.goalData.target,
                                    icon: currentStep.goalData.icon
                                });
                                setGoalDialogOpen(true);
                            } else {
                                navigate(currentStep.route);
                            }
                        }}
                    >
                        {currentStep.action} <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>

                    {goalAction && (
                        <GoalActionDialog
                            open={goalDialogOpen}
                            onOpenChange={setGoalDialogOpen}
                            defaultValues={{
                                name: goalAction.name,
                                target_amount: goalAction.target,
                                icon: goalAction.icon
                            }}
                            onSuccess={() => {
                                // Refresh logic could go here if needed, but QueryClient handles it
                            }}
                        />
                    )}

                    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                Saber Mais
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {currentStep.icon}
                                    Detalhes do Passo {currentStep.step}
                                </DialogTitle>
                                <DialogDescription>
                                    Entenda por que este passo é fundamental para sua liberdade financeira.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                <div className="bg-muted p-4 rounded-lg text-sm">
                                    <p className="font-semibold mb-2">Análise do Coach 🧠</p>
                                    <p className="text-muted-foreground mb-2">{currentStep.desc}</p>

                                    {expenseSource === 'default' && (
                                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                                            ⚠️ <strong>Atenção:</strong> Estou usando um valor padrão (500k).
                                            <br />👉 Defina seu Custo de Vida abaixo para eu calibrar sua meta!
                                        </div>
                                    )}

                                    {/* Transparency Debugger for User */}
                                    <div className="text-xs text-muted-foreground bg-slate-50 p-2 rounded border mt-2 font-mono">
                                        🔍 <strong>Radiografia do Coach:</strong>
                                        <div className="grid grid-cols-2 gap-1 mt-1">
                                            <span>• Fundo Detectado:</span> <span className="font-bold">{emergencyFundTotal.toLocaleString()} Kz</span>

                                            <span className="flex items-center gap-1">
                                                • Gasto Mensal:
                                                <EditBudgetDialog
                                                    currentValue={monthlyExpenses}
                                                    onSave={() => window.location.reload()}
                                                />
                                            </span>
                                            <span className={expenseSource === 'manual' ? "text-blue-600 font-bold" : ""}>
                                                {monthlyExpenses.toLocaleString()} Kz
                                                {expenseSource === 'manual' && " (Definido)"}
                                            </span>

                                            <span>• Cobertura:</span> <span className={emergencyFundTotal / (monthlyExpenses || 1) >= 6 ? "text-success font-bold" : ""}>{(emergencyFundTotal / (monthlyExpenses || 1)).toFixed(1)} meses</span>
                                            <span>• Passo Atual:</span> <span className="font-bold">{currentStep.step}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Plano de Ação</h4>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                        {currentStep.step === 1 && (
                                            <>
                                                <li>Reveja seus gastos mensais.</li>
                                                <li>Corte despesas não essenciais.</li>
                                                <li>Defina um limite de gastos para o próximo mês.</li>
                                            </>
                                        )}
                                        {currentStep.step === 2 && (
                                            <>
                                                <li>Abra uma conta poupança separada.</li>
                                                <li>Nomeie a meta como "Fundo de Emergência" (para eu reconhecer!).</li>
                                                <li>Venda itens parados para gerar caixa rápido.</li>
                                            </>
                                        )}
                                        {currentStep.step === 3 && (
                                            <>
                                                <li>Seu Gasto Mensal Atual: <strong>{monthlyExpenses.toLocaleString()} Kz</strong></li>
                                                <li>Sua Meta (6 Meses): <strong>{(monthlyExpenses * 6).toLocaleString()} Kz</strong></li>
                                                <li>Se você já tem esse valor numa meta com outro nome, renomeie para "Reserva" ou "Emergência".</li>
                                            </>
                                        )}
                                        {currentStep.step === 4 && (
                                            <>
                                                <li>Pesquise sobre OTNR (Obrigações do Tesouro).</li>
                                                <li>Procure Depósitos a Prazo com taxas acima de 15%.</li>
                                                <li>Reduza a quantia na conta corrente.</li>
                                            </>
                                        )}
                                        {currentStep.step === 5 && (
                                            <>
                                                <li>Estude sobre ações na BODIVA.</li>
                                                <li>Considere fundos de investimento imobiliário.</li>
                                                <li>Diversifique para não depender de apenas uma fonte.</li>
                                            </>
                                        )}
                                    </ul>
                                </div>

                                <Button className="w-full" onClick={() => {
                                    if (currentStep.isGoalAction && currentStep.goalData) {
                                        setGoalAction({
                                            name: currentStep.goalData.name,
                                            target: currentStep.goalData.target,
                                            icon: currentStep.goalData.icon
                                        });
                                        setGoalDialogOpen(true);
                                    } else {
                                        navigate(currentStep.route);
                                    }
                                    setIsDetailsOpen(false);
                                }}>
                                    Agir Agora
                                </Button>
                                {goalAction && (
                                    <GoalActionDialog
                                        open={goalDialogOpen}
                                        onOpenChange={setGoalDialogOpen}
                                        defaultValues={{
                                            name: goalAction.name,
                                            target_amount: goalAction.target,
                                            icon: goalAction.icon
                                        }}
                                        onSuccess={() => {
                                            setIsDetailsOpen(false);
                                        }}
                                    />
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card >
    );
}

function EditBudgetDialog({ currentValue, onSave }: { currentValue: number, onSave: () => void }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(currentValue.toString());
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Save to User Metadata (No DB Migration needed)
            const { data, error } = await supabase.auth.updateUser({
                data: { monthly_budget: parseFloat(value) }
            });

            if (error) throw error;

            setOpen(false);
            onSave(); // Refresh parent
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-slate-200 rounded-full">
                    <span className="sr-only">Editar</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                    </svg>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Definir Custo de Vida Mensal</DialogTitle>
                    <DialogDescription>
                        Informe seu gasto mensal médio para calibrar as metas do Coach.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="budget" className="text-sm font-medium">Gasto Mensal (Kz)</label>
                        <input
                            id="budget"
                            type="number"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Salvando..." : "Salvar Definição"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
