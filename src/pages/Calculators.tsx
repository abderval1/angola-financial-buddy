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
  Calculator,
  TrendingUp,
  Info,
  RefreshCw,
  DollarSign,
  Percent,
  Calendar,
  PiggyBank,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Angolan tax rates for investments
const ANGOLA_TAXES = {
  IAC: 0.001, // Imposto de Aplicação de Capitais - 0.1% on deposit
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

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default function Calculators() {
  // Form state
  const [initialAmount, setInitialAmount] = useState<number>(100000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [interestRate, setInterestRate] = useState<number>(15);
  const [rateType, setRateType] = useState<"anual" | "mensal">("anual");
  const [period, setPeriod] = useState<number>(5);
  const [periodType, setPeriodType] = useState<"anos" | "meses">("anos");
  const [applyTaxes, setApplyTaxes] = useState<boolean>(true);

  // Calculate results
  const results = useMemo(() => {
    const monthlyRate = rateType === "anual" ? interestRate / 100 / 12 : interestRate / 100;
    const totalMonths = periodType === "anos" ? period * 12 : period;

    let data = [];
    let currentBalance = initialAmount;
    let totalInvested = initialAmount;
    let totalInterest = 0;
    let totalTaxes = 0;

    // IAC tax on initial deposit
    const iacOnInitial = applyTaxes ? initialAmount * ANGOLA_TAXES.IAC : 0;
    currentBalance -= iacOnInitial;
    totalTaxes += iacOnInitial;

    for (let month = 1; month <= totalMonths; month++) {
      // Monthly interest
      const monthlyInterest = currentBalance * monthlyRate;
      
      // IRT tax on interest (15%)
      const irtTax = applyTaxes ? monthlyInterest * ANGOLA_TAXES.IRT_INTEREST : 0;
      const netInterest = monthlyInterest - irtTax;
      
      totalInterest += monthlyInterest;
      totalTaxes += irtTax;
      
      currentBalance += netInterest;
      
      // Monthly contribution
      if (monthlyContribution > 0) {
        const iacOnContribution = applyTaxes ? monthlyContribution * ANGOLA_TAXES.IAC : 0;
        totalTaxes += iacOnContribution;
        currentBalance += monthlyContribution - iacOnContribution;
        totalInvested += monthlyContribution;
      }

      // Store monthly data (show every month for first 12, then yearly)
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

    // Final calculation without taxes for comparison
    let balanceWithoutTax = initialAmount;
    for (let month = 1; month <= totalMonths; month++) {
      balanceWithoutTax += balanceWithoutTax * monthlyRate;
      balanceWithoutTax += monthlyContribution;
    }

    return {
      finalBalance: currentBalance,
      totalInvested,
      totalInterest,
      totalTaxes,
      netInterest: totalInterest - totalTaxes,
      balanceWithoutTax,
      taxImpact: balanceWithoutTax - currentBalance,
      monthlyData: data,
      effectiveRate: totalMonths > 0 ? ((currentBalance / totalInvested - 1) * 100) : 0,
    };
  }, [initialAmount, monthlyContribution, interestRate, rateType, period, periodType, applyTaxes]);

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
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            Calculadora de Juros Compostos
          </h1>
          <p className="text-muted-foreground">
            Simule seus investimentos em Kwanza com os impostos angolanos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calculator Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Simulador
              </CardTitle>
              <CardDescription>Configure os parâmetros do investimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Valor Inicial
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    Kz
                  </span>
                  <Input
                    type="number"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    placeholder="100.000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  Taxa de Juros
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                      className="pr-8"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  <Select value={rateType} onValueChange={(v: "anual" | "mensal") => setRateType(v)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Período
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(parseInt(e.target.value) || 0)}
                    className="flex-1"
                    min="1"
                  />
                  <Select value={periodType} onValueChange={(v: "anos" | "meses") => setPeriodType(v)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anos">Anos</SelectItem>
                      <SelectItem value="meses">Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Aporte Mensal
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    Kz
                  </span>
                  <Input
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    placeholder="10.000"
                  />
                </div>
              </div>

              {/* Tax Toggle */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Aplicar Impostos Angolanos
                  </Label>
                  <Switch checked={applyTaxes} onCheckedChange={setApplyTaxes} />
                </div>
                {applyTaxes && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• IAC: 0,1% sobre depósitos</p>
                    <p>• IRT: 15% sobre juros</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
                <Button className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Valor Final</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(results.finalBalance)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Investido</p>
                  <p className="text-2xl font-bold">{formatCurrency(results.totalInvested)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-success/10 to-success/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Juros Líquidos</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(results.netInterest)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Impostos Pagos</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(results.totalTaxes)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Patrimônio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="invested" 
                        name="Investido" 
                        stackId="1"
                        stroke="hsl(var(--muted-foreground))" 
                        fill="hsl(var(--muted))" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="interest" 
                        name="Juros Líquidos" 
                        stackId="1"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tabela de Evolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Investido</TableHead>
                        <TableHead className="text-right">Juros Brutos</TableHead>
                        <TableHead className="text-right">Impostos</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.monthlyData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.invested)}</TableCell>
                          <TableCell className="text-right text-success">{formatCurrency(row.grossInterest)}</TableCell>
                          <TableCell className="text-right text-amber-600">{formatCurrency(row.taxes)}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(row.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Educational Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              O que são Juros Compostos?
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Os <strong>juros compostos</strong> são juros calculados não apenas sobre o valor inicial, 
              mas sobre a soma do montante inicial mais os juros acumulados ao longo do tempo, 
              resultando no famoso <strong>"juros sobre juros"</strong>.
            </p>
            
            <h4>Fórmula dos Juros Compostos</h4>
            <div className="bg-muted/50 p-4 rounded-lg font-mono text-center my-4">
              M = C × (1 + i)<sup>t</sup>
            </div>
            <ul>
              <li><strong>M</strong> = Montante total (capital + juros)</li>
              <li><strong>C</strong> = Capital inicial</li>
              <li><strong>i</strong> = Taxa de juros por período</li>
              <li><strong>t</strong> = Número de períodos</li>
            </ul>

            <h4>Impostos em Angola</h4>
            <p>
              Em Angola, os rendimentos de investimentos estão sujeitos a alguns impostos importantes:
            </p>
            <ul>
              <li>
                <strong>IAC (Imposto de Aplicação de Capitais)</strong>: 0,1% cobrado sobre o valor 
                depositado nos bancos.
              </li>
              <li>
                <strong>IRT sobre Juros</strong>: 15% cobrado sobre os rendimentos (juros) obtidos 
                em aplicações financeiras.
              </li>
              <li>
                <strong>IVA</strong>: 14% sobre taxas e comissões bancárias (não incluído nesta 
                calculadora por variar conforme o banco).
              </li>
            </ul>

            <h4>Dicas para Maximizar seus Rendimentos</h4>
            <ol>
              <li>Comece a investir o mais cedo possível</li>
              <li>Faça aportes regulares mensais</li>
              <li>Reinvista todos os rendimentos</li>
              <li>Compare taxas entre diferentes bancos e produtos</li>
              <li>Considere investimentos de longo prazo para aproveitar o efeito dos juros compostos</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
