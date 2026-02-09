import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp,
  Info,
  RefreshCw,
  DollarSign,
  Percent,
  Calendar,
  PiggyBank,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Flame,
  Clock,
  BarChart2,
  Cpu,
  ShieldCheck,
  Zap,
  Target,
  Scale,
  BookOpen,
} from "lucide-react";
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";

// Angolan tax rates for investments
const ANGOLA_TAXES = {
  IAC: 0.10, // Imposto de Aplicação de Capitais - 10% on investment income
  IVA: 0.14, // IVA on bank fees - 14%
  IRT_INTEREST: 0.15, // Imposto sobre Rendimento do Trabalho on interest - 15%
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function Calculators() {
  const [activeTab, setActiveTab] = useState<string>("hub");

  // Compound Interest State
  const [initialAmount, setInitialAmount] = useState<number>(100000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [interestRate, setInterestRate] = useState<number>(15);
  const [rateType, setRateType] = useState<"anual" | "mensal">("anual");
  const [period, setPeriod] = useState<number>(5);
  const [periodType, setPeriodType] = useState<"anos" | "meses">("anos");
  const [applyTaxes, setApplyTaxes] = useState<boolean>(true);

  // Real Return State
  const [nominalReturn, setNominalReturn] = useState<number>(15);
  const [inflationRate, setInflationRate] = useState<number>(25);

  // Evaluation Tool State
  const [evalReturn, setEvalReturn] = useState<number>(12);
  const [evalInflation] = useState<number>(25);
  const [evalRisk, setEvalRisk] = useState<string>("medium");

  // Goal Planner State
  const [goalTarget, setGoalTarget] = useState<number>(10000000);
  const [goalYears, setGoalYears] = useState<number>(5);
  const [goalExpectedReturn, setGoalExpectedReturn] = useState<number>(15);

  // Side Hustle Impact State
  const [hustleProfit, setHustleProfit] = useState<number>(200000);
  const [hustleInvestPct, setHustleInvestPct] = useState<number>(50);

  // Time vs Money State
  const [hoursWorked, setHoursWorked] = useState<number>(20);
  const [hustleMonthlyProfit, setHustleMonthlyProfit] = useState<number>(150000);

  // Day Trade / Stock / Crypto Simulators State
  const [tradeCapital, setTradeCapital] = useState<number>(1000000);
  const [tradeLeverage, setTradeLeverage] = useState<number>(1);
  const [tradeWinRate, setTradeWinRate] = useState<number>(50);
  const [tradeRiskReward, setTradeRiskReward] = useState<number>(2);

  const compoundResults = useMemo(() => {
    const monthlyRate = rateType === "anual" ? interestRate / 100 / 12 : interestRate / 100;
    const totalMonths = periodType === "anos" ? period * 12 : period;

    let data = [];
    let currentBalance = initialAmount;
    let totalInvested = initialAmount;
    let totalInterest = 0;
    let totalTaxes = 0;

    const iacOnInitial = applyTaxes ? initialAmount * ANGOLA_TAXES.IAC : 0;
    currentBalance -= iacOnInitial;
    totalTaxes += iacOnInitial;

    for (let month = 1; month <= totalMonths; month++) {
      const monthlyInterest = currentBalance * monthlyRate;
      const irtTax = applyTaxes ? monthlyInterest * ANGOLA_TAXES.IRT_INTEREST : 0;
      const netInterest = monthlyInterest - irtTax;
      totalInterest += monthlyInterest;
      totalTaxes += irtTax;
      currentBalance += netInterest;
      if (monthlyContribution > 0) {
        const iacOnContribution = applyTaxes ? monthlyContribution * ANGOLA_TAXES.IAC : 0;
        totalTaxes += iacOnContribution;
        currentBalance += monthlyContribution - iacOnContribution;
        totalInvested += monthlyContribution;
      }
      if (month <= 12 || month % 12 === 0 || month === totalMonths) {
        data.push({
          month,
          label: month <= 12 ? `Mês ${month}` : `Ano ${Math.floor(month / 12)}`,
          balance: currentBalance,
          invested: totalInvested,
          interest: totalInterest - totalTaxes + iacOnInitial,
          taxes: totalTaxes,
          grossInterest: totalInterest,
        });
      }
    }

    return {
      finalBalance: currentBalance,
      totalInvested,
      totalInterest,
      totalTaxes,
      netInterest: totalInterest - totalTaxes,
      monthlyData: data,
    };
  }, [initialAmount, monthlyContribution, interestRate, rateType, period, periodType, applyTaxes]);

  const calculators = [
    { id: "compound", title: "Juros Compostos", desc: "Simule crescimento com impostos", icon: TrendingUp, color: "text-primary", category: "Essencial" },
    { id: "real-return", title: "Retorno Real", desc: "Desconto da inflação em Angola", icon: AlertTriangle, color: "text-amber-500", category: "Essencial" },
    { id: "worth-it", title: "Vale a Pena?", desc: "Avaliação de risco e retorno", icon: ShieldCheck, color: "text-success", category: "Decisão" },
    { id: "goals", title: "Plano de Metas", desc: "Quanto poupar para chegar lá", icon: Target, color: "text-finance-savings", category: "Essencial" },
    { id: "hustle", title: "Renda Extra → FIRE", desc: "Impacto no tempo de liberdade", icon: Flame, color: "text-orange-500", category: "Negócios" },
    { id: "time-money", title: "Tempo vs Dinheiro", desc: "Cálculo de ganho por hora", icon: Clock, color: "text-blue-500", category: "Negócios" },
    { id: "tax-compare", title: "Banco A vs Banco B", desc: "Compare impostos e taxas", icon: Scale, color: "text-slate-500", category: "Comparação" },
    { id: "daytrade", title: "Day Trade Sim", desc: "Simulador educativo de trading", icon: Zap, color: "text-purple-500", category: "Avançado" },
    { id: "stocks", title: "Simulador de Ações", desc: "Investimento em bolsa", icon: BarChart2, color: "text-indigo-500", category: "Avançado" },
    { id: "crypto", title: "Simulador Cripto", desc: "Simulação de alta volatilidade", icon: Cpu, color: "text-cyan-500", category: "Avançado" },
  ];

  const handleReset = () => {
    setInitialAmount(100000);
    setMonthlyContribution(10000);
    setInterestRate(15);
    setRateType("anual");
    setPeriod(5);
    setPeriodType("anos");
    setApplyTaxes(true);
  };

  return (
    <AppLayout title="Calculadoras Financeiras" subtitle="Ferramentas para planeamento em Angola">
      <ModuleGuard
        moduleKey="education"
        title="Calculadoras Avançadas"
        description="Aceda a simuladores exclusivos de ações, cripto, day trade e planeamento FIRE para tomar decisões mais seguras."
      >
        <div className="space-y-6">
          {activeTab !== "hub" && (
            <Button
              variant="ghost"
              onClick={() => setActiveTab("hub")}
              className="mb-4 group"
            >
              <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Voltar para as Calculadoras
            </Button>
          )}

          {activeTab === "hub" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calculators.map((calc) => (
                <Card
                  key={calc.id}
                  className="group cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/20 relative overflow-hidden"
                  onClick={() => setActiveTab(calc.id)}
                >
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{calc.category}</Badge>
                  </div>
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-2 transition-colors`}>
                      <calc.icon className={`h-6 w-6 ${calc.color}`} />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">{calc.title}</CardTitle>
                    <CardDescription>{calc.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Abrir Calculadora <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === "compound" && renderCompoundCalculator()}
              {activeTab === "real-return" && renderRealReturnCalculator()}
              {activeTab === "worth-it" && renderWorthItCalculator()}
              {activeTab === "goals" && renderGoalCalculator()}
              {activeTab === "hustle" && renderHustleCalculator()}
              {activeTab === "time-money" && renderTimeMoneyCalculator()}
              {activeTab === "tax-compare" && renderTaxCompareCalculator()}
              {activeTab === "daytrade" && renderDayTradeSimulator()}
              {activeTab === "stocks" && renderStockSimulator()}
              {activeTab === "crypto" && renderCryptoSimulator()}
            </div>
          )}
        </div>
      </ModuleGuard>
    </AppLayout>
  );

  function renderCompoundCalculator() {
    const results = compoundResults;
    return (
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Simulador de Juros Compostos
            </CardTitle>
            <CardDescription>Configure os parâmetros do investimento em Kz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /> Valor Inicial</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Kz</span>
                <Input type="number" value={initialAmount} onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Percent className="h-4 w-4 text-muted-foreground" /> Taxa de Juros</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input type="number" value={interestRate} onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)} className="pr-8" step="0.1" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <Select value={rateType} onValueChange={(v: "anual" | "mensal") => setRateType(v)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="anual">Anual</SelectItem><SelectItem value="mensal">Mensal</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Período</Label>
              <div className="flex gap-2">
                <Input type="number" value={period} onChange={(e) => setPeriod(parseInt(e.target.value) || 0)} className="flex-1" min="1" />
                <Select value={periodType} onValueChange={(v: "anos" | "meses") => setPeriodType(v)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="anos">Anos</SelectItem><SelectItem value="meses">Meses</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /> Aporte Mensal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Kz</span>
                <Input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)} className="pl-10" />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Aplicar Impostos Angolanos
                </Label>
                <Switch checked={applyTaxes} onCheckedChange={setApplyTaxes} />
              </div>
              {applyTaxes && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• IAC: 10% sobre rendimentos</p>
                  <p>• IRT: 15% sobre juros</p>
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={handleReset}><RefreshCw className="h-4 w-4 mr-2" /> Reiniciar</Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Valor Final</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(results.finalBalance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Investido</p>
                <p className="text-xl font-bold">{formatCurrency(results.totalInvested)}</p>
              </CardContent>
            </Card>
            <Card className="bg-success/5 border-success/20">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
                <p className="text-xl font-bold text-success">{formatCurrency(results.netInterest)}</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Impostos</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(results.totalTaxes)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Projeção de Crescimento</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="invested" name="Investido" stackId="1" stroke="#888" fill="#eee" />
                    <Area type="monotone" dataKey="interest" name="Juros Líquidos" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tabela de Evolução</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Período</TableHead><TableHead className="text-right">Investido</TableHead><TableHead className="text-right">Juros Brutos</TableHead><TableHead className="text-right">Impostos</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                  <TableBody>{results.monthlyData.map((row, idx) => (<TableRow key={idx}><TableCell className="font-medium">{row.label}</TableCell><TableCell className="text-right">{formatCurrency(row.invested)}</TableCell><TableCell className="text-right text-success">{formatCurrency(row.grossInterest)}</TableCell><TableCell className="text-right text-amber-600">{formatCurrency(row.taxes)}</TableCell><TableCell className="text-right font-bold">{formatCurrency(row.balance)}</TableCell></TableRow>))}</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> O que são Juros Compostos?</CardTitle></CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <p>Os <strong>juros compostos</strong> são juros calculados não apenas sobre o valor inicial, mas sobre a soma do montante inicial mais os juros acumulados ao longo do tempo.</p>
              <h4>Fórmula</h4>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-center my-4">M = C × (1 + i)^t</div>
              <h4>Dicas</h4>
              <ol><li>Comece cedo</li><li>Aportes regulares</li><li>Reinvista rendimentos</li></ol>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function renderRealReturnCalculator() {
    const nominalDec = nominalReturn / 100;
    const inflationDec = inflationRate / 100;
    const realReturn = ((1 + nominalDec) / (1 + inflationDec) - 1) * 100;
    const isLosing = realReturn < 0;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Retorno REAL</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2"><Label>Retorno Nominal (%)</Label><Input type="number" value={nominalReturn} onChange={(e) => setNominalReturn(parseFloat(e.target.value) || 0)} /></div>
                <div className="space-y-2"><Label>Inflação (%)</Label><Input type="number" value={inflationRate} onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)} /></div>
              </div>
              <div className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center text-center ${isLosing ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5'}`}>
                <p className="text-3xl font-bold mb-2">{realReturn.toFixed(2)}%</p>
                <Badge className={isLosing ? 'bg-destructive' : 'bg-success'}>{isLosing ? 'Perda' : 'Ganho'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderWorthItCalculator() {
    const isWorthIt = evalReturn > evalInflation + 5;
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader><CardTitle>Vale a pena?</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2"><Label>Retorno esperado (%)</Label><Input type="number" value={evalReturn} onChange={(e) => setEvalReturn(parseFloat(e.target.value) || 0)} /></div>
                <div className="space-y-2"><Label>Risco</Label><Select value={evalRisk} onValueChange={setEvalRisk}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixo</SelectItem><SelectItem value="medium">Médio</SelectItem><SelectItem value="high">Alto</SelectItem></SelectContent></Select></div>
              </div>
              <div className="text-center">{isWorthIt ? "Sim" : "Não"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderGoalCalculator() {
    const months = goalYears * 12;
    const monthlyRate = goalExpectedReturn / 100 / 12;
    const monthlyAporte = monthlyRate > 0 ? (goalTarget * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1) : goalTarget / months;
    return (
      <Card><CardHeader><CardTitle>Meta</CardTitle></CardHeader><CardContent><p>Aporte: {formatCurrency(monthlyAporte)}</p></CardContent></Card>
    );
  }

  function renderHustleCalculator() { return <Card><CardContent>Simulador Renda Extra</CardContent></Card>; }
  function renderTimeMoneyCalculator() { return <Card><CardContent>Tempo vs Dinheiro</CardContent></Card>; }
  function renderTaxCompareCalculator() { return <Card><CardContent>Comparativo Bancos</CardContent></Card>; }
  function renderDayTradeSimulator() { return <Card><CardContent>Day Trade (Educativo)</CardContent></Card>; }
  function renderStockSimulator() { return <Card><CardContent>Simulador Ações</CardContent></Card>; }
  function renderCryptoSimulator() { return <Card><CardContent>Simulador Cripto</CardContent></Card>; }
}
