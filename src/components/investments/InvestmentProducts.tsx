import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  TrendingUp, 
  Zap, 
  Clock, 
  Percent, 
  Coins,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Building,
  Landmark,
  PiggyBank,
  Briefcase,
  LineChart
} from "lucide-react";

interface InvestmentProduct {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  minAmount: number;
  rate: string;
  term: string;
  paymentFrequency: string;
  risk: "low" | "medium" | "high";
}

const SAFE_INVESTMENTS: InvestmentProduct[] = [
  {
    id: "otnr",
    name: "OTNR - Obrigações do Tesouro",
    description: "Títulos de dívida pública com rendimento garantido pelo Estado",
    icon: <Landmark className="h-5 w-5" />,
    minAmount: 100000,
    rate: "15-20% a.a.",
    term: "2-10 anos",
    paymentFrequency: "Juros semestrais",
    risk: "low",
  },
  {
    id: "bt",
    name: "BT - Bilhetes do Tesouro",
    description: "Títulos de curto prazo do governo angolano",
    icon: <Building className="h-5 w-5" />,
    minAmount: 50000,
    rate: "12-18% a.a.",
    term: "91-364 dias",
    paymentFrequency: "Desconto na compra",
    risk: "low",
  },
  {
    id: "deposito",
    name: "Depósito a Prazo",
    description: "Aplicação segura em bancos angolanos com juros garantidos",
    icon: <PiggyBank className="h-5 w-5" />,
    minAmount: 25000,
    rate: "10-15% a.a.",
    term: "3-24 meses",
    paymentFrequency: "Juros no vencimento",
    risk: "low",
  },
  {
    id: "fundos-conservadores",
    name: "Fundos Conservadores",
    description: "Fundos de renda fixa com gestão profissional",
    icon: <Briefcase className="h-5 w-5" />,
    minAmount: 100000,
    rate: "12-16% a.a.",
    term: "Resgate D+1",
    paymentFrequency: "Rendimento diário",
    risk: "low",
  },
];

const MEDIUM_INVESTMENTS: InvestmentProduct[] = [
  {
    id: "obrigacoes-corp",
    name: "Obrigações Corporativas",
    description: "Títulos de empresas angolanas sólidas",
    icon: <Building className="h-5 w-5" />,
    minAmount: 250000,
    rate: "18-25% a.a.",
    term: "2-5 anos",
    paymentFrequency: "Juros semestrais",
    risk: "medium",
  },
  {
    id: "fundos-mistos",
    name: "Fundos Mistos",
    description: "Combinação de renda fixa e variável",
    icon: <LineChart className="h-5 w-5" />,
    minAmount: 150000,
    rate: "15-22% a.a.",
    term: "Resgate D+3",
    paymentFrequency: "Rendimento variável",
    risk: "medium",
  },
  {
    id: "carteira-equilibrada",
    name: "Carteira Equilibrada",
    description: "OTNR + Ações BODIVA pré-montada",
    icon: <Briefcase className="h-5 w-5" />,
    minAmount: 500000,
    rate: "18% esperado",
    term: "2+ anos",
    paymentFrequency: "Dividendos + Juros",
    risk: "medium",
  },
];

const ADVANCED_INVESTMENTS: InvestmentProduct[] = [
  {
    id: "acoes-bodiva",
    name: "Ações na BODIVA",
    description: "Investimento em empresas listadas na bolsa de Angola",
    icon: <TrendingUp className="h-5 w-5" />,
    minAmount: 100000,
    rate: "20-40% a.a.",
    term: "Sem prazo",
    paymentFrequency: "Dividendos + Valorização",
    risk: "high",
  },
  {
    id: "fundos-acoes",
    name: "Fundos de Ações",
    description: "Exposição diversificada ao mercado acionário",
    icon: <LineChart className="h-5 w-5" />,
    minAmount: 200000,
    rate: "25-45% a.a.",
    term: "Resgate D+5",
    paymentFrequency: "Rendimento variável",
    risk: "high",
  },
  {
    id: "carteira-agressiva",
    name: "Carteira Personalizada",
    description: "Portfólio customizado para seu perfil",
    icon: <Zap className="h-5 w-5" />,
    minAmount: 1000000,
    rate: "30%+ esperado",
    term: "3+ anos",
    paymentFrequency: "Múltiplas fontes",
    risk: "high",
  },
];

interface InvestmentProductsProps {
  onSelectProduct: (productId: string) => void;
}

export function InvestmentProducts({ onSelectProduct }: InvestmentProductsProps) {
  const getRiskBadge = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low":
        return <Badge className="bg-success/10 text-success border-success/20">Baixo Risco</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Risco Moderado</Badge>;
      case "high":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Alto Risco</Badge>;
    }
  };

  const ProductCard = ({ product }: { product: InvestmentProduct }) => (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer group border-border/50 hover:border-primary/30"
      onClick={() => onSelectProduct(product.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {product.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {product.name}
              </h4>
              {getRiskBadge(product.risk)}
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {product.description}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Min: {product.minAmount.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-success" />
                <span className="text-success font-medium">{product.rate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{product.term}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{product.paymentFrequency}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Produtos de Investimento</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="safe" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="safe" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Seguros</span>
              <span className="sm:hidden">🟢</span>
            </TabsTrigger>
            <TabsTrigger value="medium" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Intermédios</span>
              <span className="sm:hidden">🟡</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Avançados</span>
              <span className="sm:hidden">🔴</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="safe" className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-success bg-success/5 p-3 rounded-lg mb-4">
              <Shield className="h-4 w-4" />
              <span>Investimentos ideais para iniciantes com rendimento previsível</span>
            </div>
            {SAFE_INVESTMENTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </TabsContent>

          <TabsContent value="medium" className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/5 p-3 rounded-lg mb-4">
              <TrendingUp className="h-4 w-4" />
              <span>Equilíbrio entre risco e retorno para investidores moderados</span>
            </div>
            {MEDIUM_INVESTMENTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-lg mb-4">
              <AlertTriangle className="h-4 w-4" />
              <span>Pode gerar ganhos maiores, mas também perdas. Invista com cuidado.</span>
            </div>
            {ADVANCED_INVESTMENTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
