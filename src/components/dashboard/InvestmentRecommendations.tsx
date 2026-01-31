import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Building, 
  Coins, 
  PiggyBank,
  ChevronRight,
  Star,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Recommendation {
  title: string;
  description: string;
  icon: any;
  risk: "low" | "medium" | "high";
  expectedReturn: string;
  reason: string;
  link?: string;
}

export function InvestmentRecommendations() {
  const { user } = useAuth();

  // Fetch user's financial profile
  const { data: profile } = useQuery({
    queryKey: ["financial-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user's existing investments
  const { data: investments = [] } = useQuery({
    queryKey: ["user-investments-summary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("type, amount")
        .eq("user_id", user?.id)
        .eq("status", "active");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get recommendations based on profile
  const getRecommendations = (): Recommendation[] => {
    const riskProfile = profile?.risk_profile || "moderate";
    const recommendations: Recommendation[] = [];

    // Check existing investment types
    const investmentTypes = investments.map(i => i.type);
    const hasFixedIncome = investmentTypes.some(t => ["poupanca", "deposito_prazo", "obrigacoes"].includes(t));
    const hasStocks = investmentTypes.includes("acoes");
    const hasRealEstate = investmentTypes.includes("imobiliario");

    // Base recommendations on risk profile and existing investments
    if (riskProfile === "conservative" || riskProfile === "moderate") {
      if (!hasFixedIncome) {
        recommendations.push({
          title: "Obrigações do Tesouro",
          description: "Títulos de dívida pública angolana com rendimento garantido",
          icon: Building,
          risk: "low",
          expectedReturn: "15-20% a.a.",
          reason: "Segurança e rendimento previsível para seu perfil conservador",
        });
      }

      recommendations.push({
        title: "Depósito a Prazo",
        description: "Aplicação em bancos angolanos com juros garantidos",
        icon: PiggyBank,
        risk: "low",
        expectedReturn: "10-15% a.a.",
        reason: "Ideal para reserva de emergência com rendimento",
      });
    }

    if (riskProfile === "moderate" || riskProfile === "aggressive") {
      if (!hasStocks) {
        recommendations.push({
          title: "Ações na BODIVA",
          description: "Investimento em empresas listadas na bolsa de Angola",
          icon: TrendingUp,
          risk: "high",
          expectedReturn: "20-40% a.a.",
          reason: "Potencial de crescimento com empresas angolanas",
        });
      }

      if (!hasRealEstate) {
        recommendations.push({
          title: "Fundos Imobiliários",
          description: "Investimento indireto em imóveis comerciais",
          icon: Building,
          risk: "medium",
          expectedReturn: "12-18% a.a.",
          reason: "Diversificação com renda passiva de aluguéis",
        });
      }
    }

    if (riskProfile === "aggressive") {
      recommendations.push({
        title: "Startups & Venture Capital",
        description: "Investimento em empresas emergentes angolanas",
        icon: Zap,
        risk: "high",
        expectedReturn: "50%+ a.a.",
        reason: "Alto risco com potencial de retornos expressivos",
      });
    }

    // Always recommend diversification
    if (investments.length < 3) {
      recommendations.push({
        title: "Diversifique sua Carteira",
        description: "Distribua investimentos em diferentes classes de ativos",
        icon: Shield,
        risk: "low",
        expectedReturn: "Varia",
        reason: "Reduz riscos e melhora retornos no longo prazo",
        link: "/investments",
      });
    }

    return recommendations.slice(0, 4);
  };

  const recommendations = getRecommendations();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-success/10 text-success border-success/20";
      case "medium": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low": return "Baixo Risco";
      case "medium": return "Risco Moderado";
      case "high": return "Alto Risco";
      default: return risk;
    }
  };

  if (recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Recomendações para Você</CardTitle>
              <CardDescription>
                Baseadas no seu perfil de investidor
              </CardDescription>
            </div>
          </div>
          <Link to="/investments">
            <Button variant="ghost" size="sm">
              Ver Investimentos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <rec.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {rec.title}
                    </h4>
                    <Badge variant="outline" className={`text-xs ${getRiskColor(rec.risk)}`}>
                      {getRiskLabel(rec.risk)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {rec.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-success font-medium">{rec.expectedReturn}</span>
                    </div>
                    {rec.link && (
                      <Link to={rec.link}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Ver Mais
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {rec.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
