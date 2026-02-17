import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Shield,
  Calendar,
  Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PortfolioSummaryProps {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturn: number;
  returnPercentage: number;
  monthlyReturn: number;
  riskProfile: "conservative" | "moderate" | "aggressive";
}

export function InvestmentPortfolioSummary({
  totalInvested,
  totalCurrentValue,
  totalReturn,
  returnPercentage,
  monthlyReturn,
  riskProfile,
}: PortfolioSummaryProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const getRiskLabel = () => {
    switch (riskProfile) {
      case "conservative":
        return { label: t("Conservador"), color: "bg-success/10 text-success border-success/20", icon: "🛡️" };
      case "moderate":
        return { label: t("Moderado"), color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: "⚖️" };
      case "aggressive":
        return { label: t("Arrojado"), color: "bg-destructive/10 text-destructive border-destructive/20", icon: "🚀" };
    }
  };

  const risk = getRiskLabel();

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t("Minha Carteira")}</h2>
                <p className="text-sm text-muted-foreground">{t("Visão geral dos seus investimentos")}</p>
              </div>
            </div>
            <Badge variant="outline" className={`${risk.color} text-sm px-3 py-1`}>
              {risk.icon} {risk.label}
            </Badge>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
          {/* Total Investido */}
          <div className="bg-card p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("Total Investido")}</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">
              {formatPrice(totalInvested)}
            </p>
          </div>

          {/* Rendimento Total */}
          <div className="bg-card p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${totalReturn >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {totalReturn >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("Rendimento Total")}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'} break-all`}>
                {totalReturn >= 0 ? '+' : ''}{formatPrice(totalReturn)}
              </p>
            </div>
            <p className={`text-sm ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalReturn >= 0 ? '+' : ''}{returnPercentage.toFixed(1)}%
            </p>
          </div>

          {/* Rendimento do Mês */}
          <div className="bg-card p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${monthlyReturn >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("Este Mês")}</span>
            </div>
            <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${monthlyReturn >= 0 ? 'text-success' : 'text-destructive'} break-all`}>
              {monthlyReturn >= 0 ? '+' : ''}{formatPrice(monthlyReturn)}
            </p>
          </div>

          {/* Valor Atual */}
          <div className="bg-card p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("Valor Atual")}</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">
              {formatPrice(totalCurrentValue)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
