
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MetricCardProps {
    title: string;
    value: number;
    previousValue?: number;
    formatter?: (value: number) => string;
    type?: "neutral" | "reverse"; // neutral: more is better (income), reverse: less is better (expense)
    icon?: React.ElementType;
    valueClassName?: string;
    trendLabel?: string;
}

export function MetricCard({
    title,
    value,
    previousValue,
    formatter = (v) => v.toString(),
    type = "neutral",
    icon: Icon,
    valueClassName,
    trendLabel
}: MetricCardProps) {
    const { t } = useTranslation();
    const defaultTrendLabel = trendLabel || t("vs mês anterior");
    const hasPrevious = previousValue !== undefined && previousValue !== null;
    const diff = hasPrevious ? value - previousValue : 0;

    // Logic for Smart Percentage
    let percentage = 0;
    let smartLabel: string | null = null;
    let isSmartLabel = false;

    if (hasPrevious) {
        if (previousValue === 0) {
            if (value > 0) {
                smartLabel = t("Novo crescimento");
                isSmartLabel = true;
            } else if (value < 0) {
                smartLabel = t("Novo registo (negativo)");
                isSmartLabel = true;
            } else {
                smartLabel = t("Sem variação");
                isSmartLabel = true;
            }
        } else if ((previousValue < 0 && value > 0) || (previousValue > 0 && value < 0)) {
            smartLabel = value > 0 ? t("Recuperação") : t("Reversão");
            isSmartLabel = true;
        } else {
            percentage = (diff / previousValue) * 100;
        }
    }

    let trendColor = "text-muted-foreground";
    let TrendIcon = Minus;

    if (diff > 0) {
        trendColor = type === "neutral" ? "text-success" : "text-destructive";
        TrendIcon = ArrowUp;
    } else if (diff < 0) {
        trendColor = type === "neutral" ? "text-destructive" : "text-success";
        TrendIcon = ArrowDown;
    }

    // Cap extreme percentages for display
    const displayPercentage = Math.abs(percentage) > 999 ? ">999%" : `${Math.abs(percentage).toFixed(1)}%`;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold break-all ${valueClassName || ''}`}>{formatter(value)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {hasPrevious ? (
                        isSmartLabel ? (
                            <span className={`font-medium ${value > previousValue! ? 'text-success' : (value < previousValue! ? 'text-destructive' : 'text-muted-foreground')}`}>
                                {smartLabel}
                            </span>
                        ) : previousValue !== 0 ? (
                            <>
                                <TrendIcon className={`h-4 w-4 mr-1 ${trendColor}`} />
                                <span className={`font-medium ${trendColor}`}>
                                    {displayPercentage}
                                </span>
                                <span className="ml-1">{defaultTrendLabel}</span>
                            </>
                        ) : (
                            <span>{t("Sem variação")}</span>
                        )
                    ) : (
                        <span>&nbsp;</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
