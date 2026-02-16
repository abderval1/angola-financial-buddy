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
import { FireCalculator } from "@/components/goals/FireCalculator";
import { InvestmentSimulator } from "@/components/investments/InvestmentSimulator";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

// Angolan tax rates for investments
const ANGOLA_TAXES = {
  IAC: 0.10, // Imposto de Aplicação de Capitais - 10% on investment income
  IVA: 0.14, // IVA on bank fees - 14%
  IRT_INTEREST: 0.15, // Imposto sobre Rendimento do Trabalho on interest - 15%
};


export default function Calculators() {
  const { formatPrice } = useCurrency();
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
  const [baseSalary, setBaseSalary] = useState<number>(400000);
  const [monthlyTransitHours, setMonthlyTransitHours] = useState<number>(44);
  const [itemPrice, setItemPrice] = useState<number>(50000);

  // Day Trade / Stock / Crypto Simulators State
  const [tradeCapital, setTradeCapital] = useState<number>(1000000);
  const [tradeLeverage, setTradeLeverage] = useState<number>(1);
  const [tradeWinRate, setTradeWinRate] = useState<number>(50);
  const [tradeRiskReward, setTradeRiskReward] = useState<number>(2);

  // Bank Compare State
  const [bankA_rate, setBankA_rate] = useState<number>(15);
  const [bankB_rate, setBankB_rate] = useState<number>(14);
  const [bankA_fee, setBankA_fee] = useState<number>(2000);
  const [bankB_fee, setBankB_fee] = useState<number>(500);

  // Item Cost State

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
              {activeTab === "goals" && <FireCalculator />}
              {activeTab === "hustle" && renderHustleCalculator()}
              {activeTab === "time-money" && renderTimeMoneyCalculator()}
              {activeTab === "tax-compare" && renderTaxCompareCalculator()}
              {activeTab === "daytrade" && renderDayTradeSimulator()}
              {activeTab === "stocks" && <InvestmentSimulator />}
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
                <p className="text-xl font-bold text-primary">{formatPrice(results.finalBalance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Investido</p>
                <p className="text-xl font-bold">{formatPrice(results.totalInvested)}</p>
              </CardContent>
            </Card>
            <Card className="bg-success/5 border-success/20">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
                <p className="text-xl font-bold text-success">{formatPrice(results.netInterest)}</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Impostos</p>
                <p className="text-xl font-bold text-amber-600">{formatPrice(results.totalTaxes)}</p>
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
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
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
                  <TableBody>{results.monthlyData.map((row, idx) => (<TableRow key={idx}><TableCell className="font-medium">{row.label}</TableCell><TableCell className="text-right">{formatPrice(row.invested)}</TableCell><TableCell className="text-right text-success">{formatPrice(row.grossInterest)}</TableCell><TableCell className="text-right text-amber-600">{formatPrice(row.taxes)}</TableCell><TableCell className="text-right font-bold">{formatPrice(row.balance)}</TableCell></TableRow>))}</TableBody>
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
    return <FireCalculator />;
  }

  function renderHustleCalculator() {
    const annualExpenses = 12 * 500000; // Mock current expenses
    const fireNumber = annualExpenses / 0.04;
    const monthlyExtraInvested = (hustleProfit * hustleInvestPct) / 100;

    // Simulation: How many months to reach fireNumber
    const simulate = (monthlyAporte: number) => {
      let balance = 0;
      let months = 0;
      const rate = 0.12 / 12; // 12% annual
      while (balance < fireNumber && months < 1200) {
        balance = balance * (1 + rate) + monthlyAporte;
        months++;
      }
      return months;
    };

    const monthsNormal = simulate(50000); // Standard saving
    const monthsWithHustle = simulate(50000 + monthlyExtraInvested);
    const yearsSaved = (monthsNormal - monthsWithHustle) / 12;

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" /> Renda Extra & FIRE</CardTitle>
            <CardDescription>Veja o impacto de um negócio adicional no seu tempo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Lucro Mensal Extra (Kz)</Label>
              <Input type="number" value={hustleProfit} onChange={(e) => setHustleProfit(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Quanto desse lucro vai investir? ({hustleInvestPct}%)</Label>
              <input type="range" className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" min="0" max="100" value={hustleInvestPct} onChange={(e) => setHustleInvestPct(parseInt(e.target.value))} />
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Investimento mensal adicional:</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(monthlyExtraInvested)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader><CardTitle>Impacto na Liberdade</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            {yearsSaved > 0 ? (
              <>
                <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
                  <Zap className="h-10 w-10 text-success" />
                </div>
                <p className="text-lg font-medium">Ganhaste aproximadamente</p>
                <p className="text-5xl font-black text-success my-2">{yearsSaved.toFixed(1)}</p>
                <p className="text-lg font-medium">Anos de Liberdade</p>
                <p className="text-sm text-muted-foreground mt-4 italic">"Investir os teus ganhos extras é o atalho mais rápido para o FIRE em Angola."</p>
              </>
            ) : (
              <p className="text-muted-foreground italic">Aumente o lucro ou a % investida para ver o impacto.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderTimeMoneyCalculator() {
    const commuteHours = monthlyTransitHours;
    const workHours = 8 * 22; // Standard 8h/day, 22 days/month
    const totalHours = workHours + commuteHours;
    const hourlyWage = totalHours > 0 ? baseSalary / totalHours : 0;

    const hoursForProduct = hourlyWage > 0 ? itemPrice / hourlyWage : 0;

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" /> Custo em Horas de Vida</CardTitle>
            <CardDescription>Configure o seu salário e tempo de trânsito em Luanda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Teu Salário Base Mensal (Kz)</Label>
              <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Horas Perdidas no Trânsito (Mensal)</Label>
              <Input type="number" value={monthlyTransitHours} onChange={(e) => setMonthlyTransitHours(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2 pt-2">
              <Label>Preço do Produto/Serviço (Kz)</Label>
              <Input type="number" value={itemPrice} onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
              <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                <span>Total de Horas (Trabalho + Trânsito):</span>
                <span>{totalHours}h / mês</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Teu ganho real por hora:</span>
                <span className="text-blue-600">{formatPrice(hourlyWage)}/h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-8 text-center border-blue-500/20">
          <p className="text-muted-foreground font-medium">Para comprar isto, precisas de trabalhar</p>
          <p className="text-6xl font-black text-blue-600 my-4">{hoursForProduct.toFixed(1)}</p>
          <p className="text-xl font-bold">Horas de Vida</p>
          <div className="mt-6 p-3 bg-muted rounded-lg text-sm">
            {hoursForProduct > 160 ? "⚠️ Custa mais de um mês de trabalho!" : hoursForProduct > 40 ? "Custa mais de uma semana de trabalho." : "Este item tem um custo moderado em horas."}
          </div>
          <p className="text-xs text-muted-foreground mt-6 italic">"O dinheiro que gastas é tempo de vida que não volta."</p>
        </Card>
      </div>
    );
  }

  function renderTaxCompareCalculator() {
    const amount = 1000000;
    const yieldA = (amount * bankA_rate / 100) - bankA_fee * 12;
    const yieldB = (amount * bankB_rate / 100) - bankB_fee * 12;

    // Applying IRT on gross interest
    const netA = yieldA * (1 - ANGOLA_TAXES.IRT_INTEREST);
    const netB = yieldB * (1 - ANGOLA_TAXES.IRT_INTEREST);

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Banco A</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Taxa Anual (%)</Label>
                <Input type="number" value={bankA_rate} onChange={(e) => setBankA_rate(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Manutenção Mensal (Kz)</Label>
                <Input type="number" value={bankA_fee} onChange={(e) => setBankA_fee(parseFloat(e.target.value) || 0)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Banco B</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Taxa Anual (%)</Label>
                <Input type="number" value={bankB_rate} onChange={(e) => setBankB_rate(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Manutenção Mensal (Kz)</Label>
                <Input type="number" value={bankB_fee} onChange={(e) => setBankB_fee(parseFloat(e.target.value) || 0)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardHeader><CardTitle className="text-center">Comparativo de Ganho Líquido (1 Ano sobre 1M Kz)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-muted-foreground text-sm">Banco A</p>
                <p className={`text-2xl font-bold ${netA >= netB ? 'text-success' : ''}`}>{formatPrice(netA)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Banco B</p>
                <p className={`text-2xl font-bold ${netB >= netA ? 'text-success' : ''}`}>{formatPrice(netB)}</p>
              </div>
            </div>
            <div className="mt-8 h-4 bg-muted rounded-full overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: `${(netA / (netA + netB)) * 100}%` }} />
              <div className="h-full bg-accent" style={{ width: `${(netB / (netA + netB)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  function renderDayTradeSimulator() {
    // Basic Monte Carlo simulation of account balance
    const riskPerTrade = tradeCapital * 0.01; // 1% risk
    const reward = riskPerTrade * tradeRiskReward;
    const winRateDec = tradeWinRate / 100;

    // Calculate expectancy
    const expectancy = (winRateDec * reward) - ((1 - winRateDec) * riskPerTrade);
    const probRuin = Math.pow((1 - (winRateDec - (1 - winRateDec))) / (1 + (winRateDec - (1 - winRateDec))), 10); // Simplified

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-purple-500" /> Day Trade (Educativo)</CardTitle>
            <CardDescription>Entenda a matemática do risco antes de clicar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Capital Inicial (Kz)</Label>
              <Input type="number" value={tradeCapital} onChange={(e) => setTradeCapital(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Win Rate (%)</Label>
                <Input type="number" value={tradeWinRate} onChange={(e) => setTradeWinRate(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Risk/Reward (1:X)</Label>
                <Input type="number" value={tradeRiskReward} onChange={(e) => setTradeRiskReward(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/10">
              <p className="text-sm font-semibold mb-2">Análise Estatística:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Expectativa Matemática:</span> <span className={expectancy > 0 ? "text-success" : "text-destructive"}>{formatPrice(expectancy)} / trade</span></div>
                <div className="flex justify-between"><span>Probabilidade de Ruína:</span> <span className={probRuin < 0.05 ? "text-success" : "text-destructive"}>{(probRuin * 100).toFixed(1)}%</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-8 text-center border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
          <p className="text-muted-foreground font-medium">Veredito do Simulador</p>
          <div className="my-6">
            {expectancy > 0 ? (
              <div className="space-y-2">
                <ShieldCheck className="h-16 w-16 text-success mx-auto" />
                <p className="text-2xl font-bold text-success">Sistema Lucrativo</p>
                <p className="text-sm text-muted-foreground">A longo prazo, a matemática está do teu lado. Foca na disciplina.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
                <p className="text-2xl font-bold text-destructive">Sistema Falho</p>
                <p className="text-sm text-muted-foreground">Vais perder todo o capital. Aumenta o teu Win Rate ou o teu Risk/Reward.</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground italic mt-auto">"Trading é 10% técnica e 90% psicologia e gestão de risco."</p>
        </Card>
      </div>
    );
  }

  function renderCryptoSimulator() {
    const isBull = tradeWinRate > 50;
    const finalVal = tradeCapital * (isBull ? 5.2 : 0.15); // Simple cycle simulation

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-cyan-500" /> Simulador de Ciclo Cripto</CardTitle>
            <CardDescription>Simule a volatilidade extrema do mercado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Capital para Cripto (Kz)</Label>
              <Input type="number" value={tradeCapital} onChange={(e) => setTradeCapital(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Sentimento de Mercado</Label>
              <Select value={isBull ? "bull" : "bear"} onValueChange={(v) => setTradeWinRate(v === "bull" ? 60 : 40)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bull">Bull Market (Euforia)</SelectItem>
                  <SelectItem value="bear">Bear Market (Medo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
              <p className="text-xs text-muted-foreground">Nota: As criptomoedas são altamente voláteis e não são reguladas pelo BNA em Angola. Invista apenas o que podes perder.</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`flex flex-col items-center justify-center p-8 text-center border-cyan-500/20 ${isBull ? 'bg-success/5' : 'bg-destructive/5'}`}>
          <p className="text-muted-foreground font-medium">Após um ciclo completo (4 anos):</p>
          <p className={`text-4xl font-black my-4 ${isBull ? 'text-success' : 'text-destructive'}`}>{formatPrice(finalVal)}</p>
          <Badge className={isBull ? 'bg-success' : 'bg-destructive'}>
            {isBull ? '+420% Profit' : '-85% Drawdown'}
          </Badge>
          <div className="mt-8 text-sm text-muted-foreground">
            {isBull ? "🚀 Conseguiste 'vencer o mercado'. Lembra-te de realizar lucros em Kz." : "💀 Estás no 'inverno cripto'. Paciência e mãos de diamante são necessárias."}
          </div>
        </Card>
      </div>
    );
  }
}
