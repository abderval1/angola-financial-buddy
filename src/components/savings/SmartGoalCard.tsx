import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, History, Pause, Play, AlertTriangle, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInMonths, addMonths, format } from "date-fns";
import { pt } from "date-fns/locale";

interface SavingsGoal {
    id: string;
    name: string;
    target_amount: number;
    saved_amount: number | null;
    monthly_contribution: number | null;
    interest_rate: number | null;
    start_date: string | null;
    end_date: string | null;
    status: string | null;
    icon: string | null;
    color: string | null;
    transactions?: any[];
}

interface SmartGoalCardProps {
    goal: SavingsGoal;
    onEdit: (goal: SavingsGoal) => void;
    onDelete: (id: string) => void;
    onDeposit: (goal: SavingsGoal) => void;
    onWithdraw: (goal: SavingsGoal) => void;
    onHistory: (goal: SavingsGoal) => void;
    onToggleStatus: (goal: SavingsGoal) => void;
}

export function SmartGoalCard({
    goal,
    onEdit,
    onDelete,
    onDeposit,
    onWithdraw,
    onHistory,
    onToggleStatus
}: SmartGoalCardProps) {
    // 1. Calculate Progress
    const saved = goal.saved_amount || 0;
    const target = goal.target_amount;
    const progress = Math.min((saved / target) * 100, 100);
    const isCompleted = saved >= target;

    // 2. Calculate Smart Metrics (Probability & Projection)
    const metrics = useMemo(() => {
        if (isCompleted) return { probability: 100, projectedDate: null, status: 'completed', timeRemaining: null };

        const plannedContribution = goal.monthly_contribution || 0;
        const remainingAmount = target - saved;
        let monthsToCompletion = 0;
        let projectedDate = null;
        let timeRemaining = "";

        if (plannedContribution > 0) {
            monthsToCompletion = Math.ceil(remainingAmount / plannedContribution);
            projectedDate = addMonths(new Date(), monthsToCompletion);

            const years = Math.floor(monthsToCompletion / 12);
            const months = monthsToCompletion % 12;

            if (years > 0) timeRemaining = `${years} ano${years > 1 ? 's' : ''}`;
            if (months > 0) timeRemaining += `${years > 0 ? ' e ' : ''}${months} m${months !== 1 ? 'eses' : 'ês'}`;
            if (monthsToCompletion === 0) timeRemaining = "Este mês";
        }

        // Probability Logic
        let probability = 95;
        if (!plannedContribution) probability -= 40;
        if (remainingAmount > 0 && monthsToCompletion > 60) probability -= 20;
        if (goal.status === 'paused') probability -= 30;
        probability = Math.max(5, Math.min(99, probability));

        let status: 'on_track' | 'at_risk' | 'behind' | 'completed' = 'on_track';
        if (probability < 50) status = 'at_risk';
        if (goal.status === 'paused') status = 'behind';

        return {
            probability,
            projectedDate,
            status,
            timeRemaining
        };
    }, [goal, saved, target, isCompleted]);

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'on_track': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'at_risk': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'behind': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4",
            isCompleted ? "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-l-primary"
        )}>
            <CardContent className="p-4">
                {/* Header - Compact */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-center">
                        <div className={cn(
                            "text-xl p-2 rounded-xl flex items-center justify-center w-10 h-10 shadow-sm",
                            `bg-${goal.color || 'gray'}-100 dark:bg-${goal.color || 'gray'}-900/50 text-${goal.color || 'gray'}-600`
                        )}>
                            {goal.icon || '🎯'}
                        </div>
                        <div>
                            <h4 className="text-base font-bold leading-tight">{goal.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {!isCompleted && (
                                    <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-normal", getStatusColor(metrics.status))}>
                                        {metrics.status === 'on_track' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                        {metrics.status === 'at_risk' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                        {metrics.probability}%
                                    </Badge>
                                )}
                                {goal.status === 'paused' && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Pausada</Badge>}
                            </div>
                        </div>
                    </div>

                    {/* Actions Menu (Simplified) */}
                    <div className="flex -mr-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/70 hover:text-primary" onClick={() => onEdit(goal)}>
                            <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => onDelete(goal.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Progress & Projection */}
                <div className="space-y-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className={cn("h-2", isCompleted && "bg-emerald-100 dark:bg-emerald-950/30")} />

                    <div className="flex justify-between items-end pt-1">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Acumulado</p>
                            <p className="text-lg font-bold font-display">Kz {saved.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Meta: Kz {target.toLocaleString()}</p>
                            {!isCompleted && metrics.timeRemaining && (
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center text-xs text-primary font-medium">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {metrics.timeRemaining}
                                    </div>
                                    {metrics.projectedDate && (
                                        <span className="text-[10px] text-muted-foreground">
                                            Prev: {format(metrics.projectedDate, 'MMM yyyy', { locale: pt })}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions - Compact */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                    <Button className="col-span-2 gradient-savings h-8 text-xs font-medium" onClick={() => onDeposit(goal)}>
                        Poupar
                    </Button>
                    <Button variant="outline" className="col-span-1 h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/10 px-0" onClick={() => onWithdraw(goal)}>
                        Retirar
                    </Button>
                    <Button variant="ghost" className="col-span-1 h-8 p-0" onClick={() => onHistory(goal)}>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
