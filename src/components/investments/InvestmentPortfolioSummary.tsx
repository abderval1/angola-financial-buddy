import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Shield,
  Calendar,
  Sparkles,
  Activity,
  BarChart3,
  Target,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
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
  portfolioByType?: Array<{ name: string; value: number; color: string; percentage?: number }>;
  investments?: any[];
}

export function InvestmentPortfolioSummary({
  totalInvested,
  totalCurrentValue,
  totalReturn,
  returnPercentage,
  monthlyReturn,
  riskProfile,
  portfolioByType = [],
  investments = [],
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

  // Calculate professional metrics
  const annualizedReturn = returnPercentage * (12 / Math.max(1, investments.length || 1));
  const volatility = investments.length > 1 ? Math.abs(monthlyReturn / totalCurrentValue * 100) * Math.sqrt(12) : 0;
  const sharpeRatio = volatility > 0 ? (annualizedReturn - 5) / volatility : 0; // Assuming 5% risk-free rate
  const ytdReturn = returnPercentage;
  const maxDrawdown = investments.reduce((max, inv) => {
    const loss = ((inv.amount - (inv.current_value || inv.amount)) / inv.amount) * 100;
    return Math.min(max, loss);
  }, 0);

  const getPerformanceLabel = (pct: number) => {
    if (pct >= 20) return { text: "Excelente", color: "text-success" };
    if (pct >= 10) return { text: "Bom", color: "text-success" };
    if (pct >= 0) return { text: "Positivo", color: "text-amber-600" };
    if (pct >= -10) return { text: "Atenção", color: "text-amber-600" };
    return { text: "Crítico", color: "text-destructive" };
  };

  const performanceLabel = getPerformanceLabel(returnPercentage);

  return (
    <div className="space-y-4">
      {/* Main Portfolio Card */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="p-0">
          <div className="p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                  <Wallet className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t("Carteira de Investimentos")}</h2>
                  <p className="text-sm text-muted-foreground">{t("Visão profissional avançada")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${risk.color} text-sm px-3 py-1`}>
                  {risk.icon} {risk.label}
                </Badge>
                <Badge variant="outline" className={`${performanceLabel.color} text-sm px-3 py-1`}>
                  {returnPercentage >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {performanceLabel.text}
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
            {/* Patrimônio Total */}
            <div className="bg-card p-4 lg:p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{t("Patrimônio")}</span>
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">
                {formatPrice(totalCurrentValue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Investido")}: {formatPrice(totalInvested)}
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
                <span className="text-xs text-muted-foreground font-medium">{t("Rendimento")}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'} break-all`}>
                  {totalReturn >= 0 ? '+' : ''}{formatPrice(totalReturn)}
                </p>
              </div>
              <p className={`text-sm font-medium ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totalReturn >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
              </p>
            </div>

            {/* Rendimento Mensal */}
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

            {/* Ativos */}
            <div className="bg-card p-4 lg:p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-accent" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{t("Ativos")}</span>
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                {investments.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {portfolioByType.length} {t("categorias")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Sharpe Ratio */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{t("Sharpe Ratio")}</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-xl font-bold ${sharpeRatio > 1 ? 'text-success' : sharpeRatio > 0 ? 'text-amber-600' : 'text-destructive'}`}>
              {sharpeRatio.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {sharpeRatio > 1 ? 'Risco-benefício favorável' : sharpeRatio > 0 ? 'Aceitável' : 'Desfavorável'}
            </p>
          </CardContent>
        </Card>

        {/* Volatilidade */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{t("Volatilidade")}</span>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-xl font-bold ${volatility < 10 ? 'text-success' : volatility < 20 ? 'text-amber-600' : 'text-destructive'}`}>
              {volatility.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {volatility < 10 ? 'Baixa' : volatility < 20 ? 'Moderada' : 'Alta'} ({t("anualizada")})
            </p>
          </CardContent>
        </Card>

        {/* Retorno Anualizado */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{t("Retorno Anual")}</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-xl font-bold ${annualizedReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
              {annualizedReturn >= 0 ? '+' : ''}{annualizedReturn.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t("Projeção baseada em tendência")}
            </p>
          </CardContent>
        </Card>

        {/* Drawdown Máximo */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{t("Max Drawdown")}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-xl font-bold ${maxDrawdown > -5 ? 'text-success' : maxDrawdown > -15 ? 'text-amber-600' : 'text-destructive'}`}>
              {maxDrawdown.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {maxDrawdown > -5 ? 'Controlado' : maxDrawdown > -15 ? 'Moderado' : 'Elevado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation by Type */}
      {portfolioByType.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              {t("Alocação por Tipo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioByType.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{t(item.name)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatPrice(item.value)}</span>
                      <span className="font-bold">
                        {((item.value / totalCurrentValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(item.value / totalCurrentValue) * 100} 
                    className="h-1.5"
                    style={{ 
                      '--progress-foreground': item.color 
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
