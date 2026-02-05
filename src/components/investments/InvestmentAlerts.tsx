import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Coins, 
  RefreshCw, 
  TrendingDown, 
  Calendar,
  ChevronRight,
  X
} from "lucide-react";
import { useState } from "react";

interface Alert {
  id: string;
  type: "payment" | "reinvest" | "drop" | "maturity";
  title: string;
  message: string;
  date: string;
  actionLabel?: string;
  priority: "high" | "medium" | "low";
}

const SAMPLE_ALERTS: Alert[] = [
  {
    id: "1",
    type: "payment",
    title: "Juros Pagos",
    message: "Seus juros de OTNR 2027 foram creditados: +12.500 Kz",
    date: "Hoje",
    priority: "high",
  },
  {
    id: "2",
    type: "reinvest",
    title: "Oportunidade de Reinvestir",
    message: "Você tem 45.000 Kz disponíveis para reinvestir",
    date: "Hoje",
    actionLabel: "Reinvestir",
    priority: "medium",
  },
  {
    id: "3",
    type: "drop",
    title: "Variação de Preço",
    message: "BT 182 dias caiu 0.5% hoje",
    date: "Há 2h",
    priority: "low",
  },
  {
    id: "4",
    type: "maturity",
    title: "Vencimento Próximo",
    message: "Depósito a Prazo vence em 15 dias",
    date: "Há 1 dia",
    actionLabel: "Ver Opções",
    priority: "medium",
  },
];

export function InvestmentAlerts() {
  const [alerts, setAlerts] = useState(SAMPLE_ALERTS);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleAlerts = alerts.filter(a => !dismissedIds.includes(a.id));

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "payment":
        return <Coins className="h-4 w-4" />;
      case "reinvest":
        return <RefreshCw className="h-4 w-4" />;
      case "drop":
        return <TrendingDown className="h-4 w-4" />;
      case "maturity":
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getAlertColors = (type: Alert["type"]) => {
    switch (type) {
      case "payment":
        return "bg-success/10 text-success border-success/20";
      case "reinvest":
        return "bg-primary/10 text-primary border-primary/20";
      case "drop":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "maturity":
        return "bg-accent/10 text-accent border-accent/20";
    }
  };

  const dismissAlert = (id: string) => {
    setDismissedIds([...dismissedIds, id]);
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Alertas e Notificações</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {visibleAlerts.length} novo{visibleAlerts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleAlerts.slice(0, 4).map((alert) => (
            <div 
              key={alert.id} 
              className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertColors(alert.type)} transition-all`}
            >
              <div className="mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                  <span className="text-xs opacity-70">{alert.date}</span>
                </div>
                <p className="text-sm opacity-80">{alert.message}</p>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {alert.actionLabel && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    {alert.actionLabel}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-50 hover:opacity-100"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
