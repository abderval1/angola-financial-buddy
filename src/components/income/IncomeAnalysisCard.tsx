import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Zap,
    Target,
    BarChart2,
    Scale,
    Calendar,
    Briefcase,
    Edit,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface IncomeSource {
    id: string;
    name: string;
    monthly_revenue: number | null;
    monthly_expenses: number | null;
    hours_per_week: number | null;
    income_type: string | null;
    scalability: string | null;
    risk_level: string | null;
    risk_type: string | null;
    growth_potential: string | null;
    seasonality: string | null;
    action_recommendation: string | null;
    business_type: string;
    current_balance?: number | null;
}

interface IncomeAnalysisCardProps {
    income: IncomeSource;
    onEdit: (income: IncomeSource) => void;
    onDelete: (id: string) => void;
    onDeposit: (income: IncomeSource) => void;
    onWithdraw: (income: IncomeSource) => void;
    onHistory: (income: IncomeSource) => void;
}

export function IncomeAnalysisCard({
    income,
    onEdit,
    onDelete,
    onDeposit,
    onWithdraw,
    onHistory
}: IncomeAnalysisCardProps) {
    const profit = (income.monthly_revenue || 0) - (income.monthly_expenses || 0);
    const hourlyRate = income.hours_per_week && income.hours_per_week > 0
        ? profit / (income.hours_per_week * 4)
        : 0;

    // Efficiency Classification
    const getEfficiencyStatus = () => {
        // This logic can be refined based on user's context (e.g. minimum wage in Angola)
        // Assuming 500kz/h is a low baseline
        if (hourlyRate < 500) return { color: "text-destructive", icon: TrendingDown, label: "Ineficiente" };
        if (hourlyRate < 2000) return { color: "text-warning", icon: Scale, label: "Aceitável" };
        return { color: "text-success", icon: TrendingUp, label: "Estratégica" };
    };

    const efficiency = getEfficiencyStatus();

    // Color mapping helpers
    const getRiskColor = (level: string | null) => {
        switch (level) {
            case 'low': return "text-success bg-success/10 border-success/20";
            case 'medium': return "text-warning bg-warning/10 border-warning/20";
            case 'high': return "text-destructive bg-destructive/10 border-destructive/20";
            default: return "text-muted-foreground bg-muted/10";
        }
    };

    const getActionColor = (action: string | null) => {
        switch (action) {
            case 'increase': return "text-success";
            case 'maintain': return "text-blue-500";
            case 'reduce': return "text-warning";
            case 'abandon': return "text-destructive";
            default: return "text-muted-foreground";
        }
    };

    // Recommendations Generation
    const getCoachInsight = () => {
        const insights = [];

        if (income.scalability === 'scalable') {
            insights.push("Esta renda tem potencial de escala. Considere reinvestir o lucro.");
        } else if (income.scalability === 'non_scalable' && profit > 50000) {
            insights.push("Boa margem, mas difícil de escalar. Focar em eficiência.");
        }

        if (efficiency.label === "Ineficiente") {
            insights.push("O retorno por hora é baixo. Tente aumentar o preço ou reduzir o tempo gasto.");
        }

        if (income.income_type === 'passive') {
            insights.push("Excelente! Renda passiva ajuda a acelerar sua liberdade financeira.");
        }

        if (income.risk_level === 'high') {
            insights.push("Cuidado com a exposição ao risco. Mantenha uma reserva de emergência robusta.");
        }

        // Specific advice based on business type (User Request 7)
        if (income.business_type === 'bico') {
            insights.push("Bicos são ótimos para gerar caixa rápido, mas não escalam. Use o lucro para investir.");
        } else if (income.business_type === 'micro_business' || income.business_type === 'business') {
            insights.push("Negócios podem ser escalados. Considere reinvestir para crescer e delegar tarefas.");
        }

        if (income.seasonality && income.seasonality !== 'none') {
            insights.push(`Atenção à sazonalidade (${income.seasonality}). Guarde dinheiro nos meses bons para cobrir os ruins.`);
        }

        return insights[insights.length - 1] || "Continue monitorando o desempenho desta fonte.";
    };

    // Calculations for FIRE impact (simplified estimation)
    // Assuming a standard FIRE number or using a rough multiplier
    // If user saves different amounts, this is just illustrative "speed up"
    const fireAcceleration = profit > 0 ? (profit / 10000).toFixed(0) : 0; // Dummy calc: every 10k profit = 'acceleration points'

    return (
        <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: efficiency.label === 'Estratégica' ? '#22c55e' : efficiency.label === 'Ineficiente' ? '#ef4444' : '#eab308' }}>
            <CardHeader className="pb-2 bg-muted/30">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            {income.name}
                            <Badge variant="outline" className={`${getRiskColor(income.risk_level)} text-xs ml-2`}>
                                Risco {income.risk_level === 'low' ? 'Baixo' : income.risk_level === 'medium' ? 'Médio' : 'Alto'}
                            </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {income.hours_per_week || 0}h/sem
                            <span>•</span>
                            <span className={efficiency.color}>{hourlyRate.toLocaleString()} Kz/h</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(income)}>
                                <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => onDelete(income.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <Badge variant="secondary" className="mb-1">
                            {income.income_type === 'active' ? 'Ativa' : income.income_type === 'passive' ? 'Passiva' : 'Semi-Passiva'}
                        </Badge>
                        <span className={`text-xs font-bold ${efficiency.color} flex items-center`}>
                            <efficiency.icon className="w-3 h-3 mr-1" /> {efficiency.label}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

                {/* Balance & Impact Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <span className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                            <Wallet className="w-3 h-3" /> Saldo Atual
                        </span>
                        <p className="font-bold text-xl text-primary">
                            {(income.current_balance || 0).toLocaleString()} Kz
                        </p>
                    </div>
                    <div className="space-y-1 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                        <span className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" /> Lucro Bruto
                        </span>
                        <p className={`font-bold text-xl ${profit > 0 ? 'text-success' : 'text-destructive'}`}>
                            {profit.toLocaleString()} Kz
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-success/5 hover:bg-success/10 border-success/20 text-success h-9"
                        onClick={() => onDeposit(income)}
                    >
                        <ArrowUpRight className="w-4 h-4 mr-1" /> Depositar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-destructive/5 hover:bg-destructive/10 border-destructive/20 text-destructive h-9"
                        onClick={() => onWithdraw(income)}
                    >
                        <ArrowDownRight className="w-4 h-4 mr-1" /> Retirar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-muted h-9"
                        onClick={() => onHistory(income)}
                    >
                        <Calendar className="w-4 h-4 mr-1" /> Histórico
                    </Button>
                </div>

                {/* Coach Insight */}
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <div className="flex gap-2 items-start">
                        <div className="bg-primary/20 p-1.5 rounded-full">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-primary mb-0.5">Coach Virtual</p>
                            <p className="text-sm text-foreground/90 leading-snug">
                                "{getCoachInsight()}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Attributes Tags */}
                <div className="flex flex-wrap gap-2">
                    {income.scalability === 'scalable' ? (
                        <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">🚀 Escalável</Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">❌ Não Escalável</Badge>
                    )}

                    {income.growth_potential === 'high' && (
                        <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700">📈 Crescimento Alto</Badge>
                    )}

                    {income.risk_type && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">⚠️ Risco {income.risk_type}</Badge>
                    )}

                    {income.seasonality && income.seasonality !== 'none' && (
                        <Badge variant="outline" className="text-xs text-amber-600 bg-amber-50 border-amber-200">
                            <Calendar className="w-3 h-3 mr-1" />
                            Sazonal
                        </Badge>
                    )}
                </div>

                {/* Action Recommendation */}
                <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Ação Recomendada:</span>
                    <div className={`flex items-center gap-1 font-bold uppercase text-sm ${getActionColor(income.action_recommendation)}`}>
                        {income.action_recommendation === 'increase' && <TrendingUp className="w-4 h-4" />}
                        {income.action_recommendation === 'reduce' && <TrendingDown className="w-4 h-4" />}
                        {income.action_recommendation === 'maintain' && <CheckCircle2 className="w-4 h-4" />}
                        {income.action_recommendation === 'abandon' && <AlertTriangle className="w-4 h-4" />}

                        {income.action_recommendation === 'increase' ? 'Aumentar' :
                            income.action_recommendation === 'maintain' ? 'Manter' :
                                income.action_recommendation === 'reduce' ? 'Reduzir' :
                                    income.action_recommendation === 'abandon' ? 'Abandonar' : 'Analisar'}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
