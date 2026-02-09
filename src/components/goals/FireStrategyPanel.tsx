
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TrendingUp,
    TrendingDown,
    Flame,
    AlertTriangle,
    Target,
    Calculator,
    RotateCcw,
    Clock,
    Calendar
} from "lucide-react";

interface FireStrategyPanelProps {
    totalNetWorth: number; // Sum of Savings + Investments
    currentMonthlySavings: number; // From Income - Expenses or specific inputs
    monthlyExpenses: number; // From Budget or input
}

export function FireStrategyPanel({
    totalNetWorth,
    currentMonthlySavings,
    monthlyExpenses
}: FireStrategyPanelProps) {

    // Real-time Simulation State (initialized with actual data)
    const [simulatedExpenses, setSimulatedExpenses] = useState(monthlyExpenses);
    const [simulatedSavings, setSimulatedSavings] = useState(currentMonthlySavings);
    const [expectedReturn, setExpectedReturn] = useState(15); // Nominal Return (Angola Avg)
    const [inflationRate, setInflationRate] = useState(12); // Inflation Assumption
    const [withdrawalRate, setWithdrawalRate] = useState(4); // Safe Withdrawal Rate

    // Advanced Planning State
    const [targetYears, setTargetYears] = useState(10); // "I want to retire in X years"

    // Derived Values
    const fireNumber = (simulatedExpenses * 12) / (withdrawalRate / 100);
    const realReturn = ((1 + expectedReturn / 100) / (1 + inflationRate / 100)) - 1;
    const progress = Math.min((totalNetWorth / fireNumber) * 100, 100);

    // Time Calculation
    const calculateYearsToFire = () => {
        if (realReturn <= 0 && simulatedSavings <= 0) return Infinity;
        if (totalNetWorth >= fireNumber) return 0;

        let pot = totalNetWorth;
        let years = 0;
        const annualContribution = simulatedSavings * 12;

        // Simulation cap at 60 years
        while (pot < fireNumber && years < 60) {
            if (realReturn > 0) {
                pot = pot * (1 + realReturn) + annualContribution;
            } else {
                // losing purchasing power on pot, but adding savings
                pot = pot + annualContribution - (pot * Math.abs(realReturn));
            }
            years++;
        }
        return years >= 60 ? Infinity : years;
    };

    const yearsToFire = calculateYearsToFire();

    // Future Expenses Calculation (Inflation Impact)
    const calculateFutureExpenses = (years: number) => {
        // FV = PV * (1 + r)^n
        return simulatedExpenses * Math.pow(1 + inflationRate / 100, years);
    };

    // Required Savings Calculation (PMT)
    const calculateRequiredSavings = () => {
        // Complex PMT formula or iterative solver needed for accurate "Inflation-Adjusted Savings Goal"
        // Simpler approach: Target Amount (FV) needed in X years
        // But determining Target Amount is tricky because Expenses also grow.
        // Let's use Real Return approach (keeping everything in today's money)

        if (targetYears <= 0) return 0;

        const r = realReturn;
        const n = targetYears;
        const PV = totalNetWorth;
        const FV = fireNumber; // In today's money

        // FV = PV*(1+r)^n + PMT * (((1+r)^n - 1) / r)
        // PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)

        if (Math.abs(r) < 0.001) {
            // Linear if return is 0 real
            return (FV - PV) / (n * 12);
        }

        const growthFactor = Math.pow(1 + r, n);
        const annualSavings = (FV - PV * growthFactor) * r / (growthFactor - 1);

        return Math.max(0, annualSavings / 12);
    };

    const requiredMonthlySavings = calculateRequiredSavings();

    // Reset Simulation
    const handleReset = () => {
        setSimulatedExpenses(monthlyExpenses);
        setSimulatedSavings(currentMonthlySavings);
        setExpectedReturn(15);
        setInflationRate(12);
        setTargetYears(10);
    };

    const formatKz = (val: number) =>
        new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">

                {/* Left: Strategic Metrics */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Flame className="h-5 w-5 text-orange-500" />
                                        Independência Financeira
                                    </CardTitle>
                                    <CardDescription>O seu mapa para a liberdade.</CardDescription>
                                </div>
                                <Badge className={yearsToFire === Infinity ? "bg-destructive hover:bg-destructive/80" : yearsToFire < 10 ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/80"}>
                                    {yearsToFire === Infinity ? "Inviável" : yearsToFire === 0 ? "Atingido!" : `${yearsToFire} Anos`}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-muted-foreground">Progresso FIRE</span>
                                    <span className="font-bold">{progress.toFixed(1)}%</span>
                                </div>
                                <Progress value={progress} className="h-3" />
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                    <span>Hoje: {formatKz(totalNetWorth)}</span>
                                    <span>Meta: {formatKz(fireNumber)}</span>
                                </div>
                            </div>

                            {/* Inflation Reality Check */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2 text-amber-700 font-medium text-xs">
                                    <Clock className="h-3 w-3" />
                                    Máquina do Tempo da Inflação ({inflationRate}% a.a.)
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <span className="text-muted-foreground block">Gasto Mensal Hoje</span>
                                        <span className="font-bold text-foreground">{formatKz(simulatedExpenses)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Em {targetYears} anos será</span>
                                        <span className="font-bold text-destructive">{formatKz(calculateFutureExpenses(targetYears))}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground pt-1">
                                    Para manter o mesmo padrão de vida, você precisará de muito mais Kwanzas no futuro.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-background/50 rounded-lg border">
                                    <div className="text-xs text-muted-foreground mb-1">Renda Passiva Mensal</div>
                                    <div className="text-lg font-bold text-primary">
                                        {formatKz(fireNumber * (withdrawalRate / 100) / 12)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">Baseado no poder de compra de hoje</div>
                                </div>
                                <div className="p-3 bg-background/50 rounded-lg border">
                                    <div className="text-xs text-muted-foreground mb-1">Retorno Real</div>
                                    <div className={`text-lg font-bold ${realReturn > 0 ? "text-success" : "text-destructive"}`}>
                                        {(realReturn * 100).toFixed(2)}%
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">Acima da inflação</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alert / Insight based on Simulation */}
                    {realReturn <= 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Perda de Poder de Compra</AlertTitle>
                            <AlertDescription>
                                Com inflação de {inflationRate}%, seus investimentos precisam render mais que {inflationRate}% apenas para manter o valor.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Right: Advanced Simulation Controls */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-muted-foreground" />
                                Simulador & Planeamento
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={handleReset} title="Resetar Simulador">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="simulate" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="simulate">Simular Cenários</TabsTrigger>
                                <TabsTrigger value="plan">Planear Meta</TabsTrigger>
                            </TabsList>

                            <TabsContent value="simulate" className="space-y-6">
                                {/* Monthly Expenses Slider */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <label>Despesas Mensais Futuras</label>
                                        <span className="font-mono text-primary">{formatKz(simulatedExpenses)}</span>
                                    </div>
                                    <Slider
                                        value={[simulatedExpenses]}
                                        min={50000}
                                        max={Math.max(2000000, monthlyExpenses * 1.5)}
                                        step={10000}
                                        onValueChange={(v) => setSimulatedExpenses(v[0])}
                                    />
                                    <p className="text-xs text-muted-foreground">Reduzir despesas acelera sua liberdade exponecialmente.</p>
                                </div>

                                {/* Monthly Savings Slider */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <label>Aporte Mensal (Poupança)</label>
                                        <span className="font-mono text-primary">{formatKz(simulatedSavings)}</span>
                                    </div>
                                    <Slider
                                        value={[simulatedSavings]}
                                        min={0}
                                        max={Math.max(1000000, currentMonthlySavings * 2)}
                                        step={5000}
                                        onValueChange={(v) => setSimulatedSavings(v[0])}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="plan" className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Daqui a quantos anos quer ser livre?</label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[targetYears]}
                                            min={1}
                                            max={40}
                                            step={1}
                                            onValueChange={(v) => setTargetYears(v[0])}
                                            className="flex-1"
                                        />
                                        <div className="bg-secondary px-3 py-1 rounded text-sm font-bold min-w-[3rem] text-center">
                                            {targetYears}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg text-center space-y-2">
                                    <div className="text-sm text-muted-foreground">Para atingir o FIRE em {targetYears} anos, precisas poupar:</div>
                                    <div className="text-2xl font-bold text-primary">
                                        {formatKz(requiredMonthlySavings)}
                                        <span className="text-sm font-normal text-muted-foreground"> /mês</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        (Assumindo Retorno Real de {(realReturn * 100).toFixed(1)}%)
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t mt-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Retorno Estimado (%)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={expectedReturn}
                                        onChange={(e) => setExpectedReturn(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Inflação Estimada (%)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={inflationRate}
                                        onChange={(e) => setInflationRate(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
