import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface OrderBookItem {
  id: string;
  name: string;
  currentPrice: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  demand: number; // 0-100
  supply: number; // 0-100
  volume: string;
}

const SAMPLE_ORDER_BOOK: OrderBookItem[] = [
  {
    id: "otnr-2029",
    name: "OTNR 2029",
    currentPrice: 98.50,
    trend: "stable",
    trendPercentage: 0.2,
    demand: 75,
    supply: 40,
    volume: "2.5M Kz",
  },
  {
    id: "otnr-2027",
    name: "OTNR 2027",
    currentPrice: 99.25,
    trend: "up",
    trendPercentage: 1.5,
    demand: 85,
    supply: 30,
    volume: "4.2M Kz",
  },
  {
    id: "bt-182",
    name: "BT 182 dias",
    currentPrice: 95.80,
    trend: "down",
    trendPercentage: -0.5,
    demand: 60,
    supply: 55,
    volume: "1.8M Kz",
  },
  {
    id: "banco-angola",
    name: "Banco de Angola",
    currentPrice: 1250,
    trend: "up",
    trendPercentage: 3.2,
    demand: 90,
    supply: 25,
    volume: "850K Kz",
  },
];

export function InvestmentOrderBook() {
  const { t } = useTranslation();

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case "stable":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendLabel = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return t("Subindo");
      case "down":
        return t("Caindo");
      case "stable":
        return t("Estável");
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-success";
      case "down":
        return "text-destructive";
      case "stable":
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">{t("Livro de Ordens")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("Tendências do mercado simplificadas")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {SAMPLE_ORDER_BOOK.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📘</span>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.name}</h4>
                    <span className="text-sm text-muted-foreground">Vol: {item.volume}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{item.currentPrice}</span>
                    <Badge
                      variant="outline"
                      className={`${item.trend === "up"
                          ? "bg-success/10 text-success border-success/20"
                          : item.trend === "down"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {getTrendIcon(item.trend)}
                      <span className="ml-1">{getTrendLabel(item.trend)}</span>
                    </Badge>
                  </div>
                  <span className={`text-sm ${getTrendColor(item.trend)}`}>
                    {item.trendPercentage > 0 ? "+" : ""}{item.trendPercentage}%
                  </span>
                </div>
              </div>

              {/* Demand vs Supply */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t("Procura")}</span>
                  <Progress
                    value={item.demand}
                    className="flex-1 h-2 [&>div]:bg-primary"
                  />
                  <span className="text-xs font-medium w-10 text-right">{item.demand}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t("Oferta")}</span>
                  <Progress
                    value={item.supply}
                    className="flex-1 h-2 [&>div]:bg-destructive/60"
                  />
                  <span className="text-xs font-medium w-10 text-right">{item.supply}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {t("Dados ilustrativos. Consulte a BODIVA para informações oficiais.")}
        </p>
      </CardContent>
    </Card>
  );
}
