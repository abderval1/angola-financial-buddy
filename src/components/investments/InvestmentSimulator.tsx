import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  Coins, 
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";

export function InvestmentSimulator() {
  const [amount, setAmount] = useState(500000);
  const [years, setYears] = useState(3);
  const [rate, setRate] = useState(15);

  const results = useMemo(() => {
    const principal = amount;
    const annualRate = rate / 100;
    const periods = years;
    
    // Compound interest: A = P(1 + r)^n
    const finalAmount = principal * Math.pow(1 + annualRate, periods);
    const totalGain = finalAmount - principal;
    const gainPercentage = (totalGain / principal) * 100;
    
    // Monthly breakdown
    const monthlyEquivalentRate = Math.pow(1 + annualRate, 1/12) - 1;
    const monthlyGain = principal * monthlyEquivalentRate;
    
    return {
      principal,
      finalAmount,
      totalGain,
      gainPercentage,
      monthlyGain,
    };
  }, [amount, years, rate]);

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Simulador de Investimento</CardTitle>
            <CardDescription>Veja quanto seu dinheiro pode render</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid gap-6">
          {/* Amount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                Quanto quer investir?
              </Label>
              <span className="text-sm font-semibold text-primary">
                {amount.toLocaleString('pt-AO')} Kz
              </span>
            </div>
            <Slider
              value={[amount]}
              onValueChange={(value) => setAmount(value[0])}
              min={50000}
              max={10000000}
              step={50000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50.000 Kz</span>
              <span>10.000.000 Kz</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Por quanto tempo?
              </Label>
              <span className="text-sm font-semibold text-primary">
                {years} {years === 1 ? 'ano' : 'anos'}
              </span>
            </div>
            <Slider
              value={[years]}
              onValueChange={(value) => setYears(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 ano</span>
              <span>10 anos</span>
            </div>
          </div>

          {/* Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Taxa anual esperada
              </Label>
              <span className="text-sm font-semibold text-success">
                {rate}% a.a.
              </span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={(value) => setRate(value[0])}
              min={5}
              max={40}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5% (Poupança)</span>
              <span>40% (Ações)</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl bg-gradient-to-r from-success/10 to-accent/10 p-5 border border-success/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-success" />
            <span className="font-semibold text-foreground">Resultado da Simulação</span>
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total investido:</span>
              <span className="font-medium">{results.principal.toLocaleString('pt-AO')} Kz</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 py-2">
              <ArrowRight className="h-5 w-5 text-success" />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ganho estimado:</span>
              <span className="font-bold text-success text-lg">
                +{Math.round(results.totalGain).toLocaleString('pt-AO')} Kz
              </span>
            </div>
            
            <div className="pt-3 border-t border-success/20">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Valor final:</span>
                <div className="text-right">
                  <span className="font-bold text-xl text-success">
                    {Math.round(results.finalAmount).toLocaleString('pt-AO')} Kz
                  </span>
                  <Badge className="ml-2 bg-success/10 text-success border-success/20">
                    +{results.gainPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          * Simulação ilustrativa. Rendimentos passados não garantem resultados futuros.
        </p>
      </CardContent>
    </Card>
  );
}
