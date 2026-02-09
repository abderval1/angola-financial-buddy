
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, TrendingDown, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface FireCalculatorProps {
    initialValues?: {
        monthlyExpenses: number;
        currentSavings: number;
        monthlySavings: number;
        expectedReturn: number;
        inflationRate: number;
    };
}

export function FireCalculator({ initialValues }: FireCalculatorProps) {
    const [values, setValues] = useState({
        monthlyExpenses: initialValues?.monthlyExpenses || 500000,
        currentSavings: initialValues?.currentSavings || 1000000,
        monthlySavings: initialValues?.monthlySavings || 200000,
        expectedReturn: initialValues?.expectedReturn || 12,
        inflationRate: initialValues?.inflationRate || 15,
        withdrawalRate: 4,
    });

    const [results, setResults] = useState({
        fireNumber: 0,
        yearsToFire: 0,
        realReturn: 0,
        progress: 0,
        isAchievable: true,
    });

    useEffect(() => {
        calculateFire();
    }, [values]);

    const calculateFire = () => {
        // 1. Calculate FIRE Number (Annual Expenses / Withdrawal Rate)
        const annualExpenses = values.monthlyExpenses * 12;
        const fireNumber = annualExpenses / (values.withdrawalRate / 100);

        // 2. Calculate Real Return (Fisher Equation)
        // (1 + nominal) = (1 + real) * (1 + inflation)
        // real = (1 + nominal) / (1 + inflation) - 1
        const nominalRate = values.expectedReturn / 100;
        const inflationRate = values.inflationRate / 100;
        const realReturn = ((1 + nominalRate) / (1 + inflationRate)) - 1;

        // 3. Time to FIRE
        let years = 0;
        let isAchievable = true;

        if (realReturn <= 0 && values.monthlySavings <= 0) {
            years = Infinity;
            isAchievable = false;
        } else if (values.currentSavings >= fireNumber) {
            years = 0;
        } else {
            // Future Value formula solved for n (time)
            // FV = PMT * (((1 + r)^n - 1) / r) + PV * (1 + r)^n
            // This requires iteration or logarithm. For simplicity/robustness with irregular inputs:
            // We'll simulate year by year up to 100 years.

            let currentPot = values.currentSavings;
            // We use Real Return for accumulation because FIRE Number is in "today's money"
            // If we used Nominal Return, we'd need to inflate the FIRE Number every year.
            // Using Real Return simplifies the math relative to purchasing power.

            const effectiveRate = realReturn;

            if (effectiveRate <= 0) {
                // Linear accumulation (losing value if negative real return, but let's just sum for simplicity if effectively 0)
                const needed = fireNumber - currentPot;
                if (values.monthlySavings > 0) {
                    years = needed / (values.monthlySavings * 12);
                } else {
                    years = Infinity;
                    isAchievable = false; // Savings lose value, expenses stay same (in real terms), goal moves away
                }
            } else {
                // Compound growth
                let accumulated = currentPot;
                const annualContribution = values.monthlySavings * 12;

                while (accumulated < fireNumber && years < 100) {
                    accumulated = accumulated * (1 + effectiveRate) + annualContribution;
                    years++;
                }
                if (years >= 100) isAchievable = false;
            }
        }

        const progress = Math.min((values.currentSavings / fireNumber) * 100, 100);

        setResults({
            fireNumber,
            yearsToFire: years,
            realReturn: realReturn * 100,
            progress,
            isAchievable,
        });
    };

    const formatKz = (value: number) => {
        return new Intl.NumberFormat("pt-AO", {
            style: "currency",
            currency: "AOA",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Simulador FIRE
                    </CardTitle>
                    <CardDescription>
                        Ajuste os valores para simular sua liberdade financeira em Angola.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Monthly Expenses */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Despesas Mensais (Estilo de Vida)</Label>
                            <span className="text-primary font-bold">{formatKz(values.monthlyExpenses)}</span>
                        </div>
                        <Slider
                            value={[values.monthlyExpenses]}
                            min={50000}
                            max={2000000}
                            step={10000}
                            onValueChange={(v) => setValues({ ...values, monthlyExpenses: v[0] })}
                        />
                    </div>

                    {/* Current Savings */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Património Atual (Investido)</Label>
                            <span className="text-primary font-bold">{formatKz(values.currentSavings)}</span>
                        </div>
                        <Input
                            type="number"
                            value={values.currentSavings}
                            onChange={(e) => setValues({ ...values, currentSavings: parseFloat(e.target.value) || 0 })}
                        />
                    </div>

                    {/* Monthly Savings */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Aporte Mensal (Poupança)</Label>
                            <span className="text-primary font-bold">{formatKz(values.monthlySavings)}</span>
                        </div>
                        <Slider
                            value={[values.monthlySavings]}
                            min={0}
                            max={1000000}
                            step={5000}
                            onValueChange={(v) => setValues({ ...values, monthlySavings: v[0] })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Expected Return */}
                        <div className="space-y-2">
                            <Label className="text-xs">Retorno Nominal (% a.a.)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={values.expectedReturn}
                                    onChange={(e) => setValues({ ...values, expectedReturn: parseFloat(e.target.value) || 0 })}
                                    className="h-9"
                                />
                                <span className="text-muted-foreground">%</span>
                            </div>
                        </div>

                        {/* Inflation */}
                        <div className="space-y-2">
                            <Label className="text-xs">Inflação Estimada (% a.a.)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={values.inflationRate}
                                    onChange={(e) => setValues({ ...values, inflationRate: parseFloat(e.target.value) || 0 })}
                                    className="h-9"
                                />
                                <span className="text-muted-foreground">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Real Return Display */}
                    <div className={`text-xs p-2 rounded flex justify-between items-center ${results.realReturn > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        <span>Retorno Real (Acima da Inflação):</span>
                        <span className="font-bold">{results.realReturn.toFixed(2)}%</span>
                    </div>

                    {results.realReturn <= 0 && (
                        <div className="text-xs text-muted-foreground flex gap-1 items-start">
                            <AlertCircle className="h-3 w-3 mt-0.5 text-destructive shrink-0" />
                            <p>Cuidado: Seus investimentos perdem valor real para a inflação. Considere ativos atrelados ao Dólar ou OTNRs indexadas.</p>
                        </div>
                    )}

                </CardContent>
            </Card>

            {/* Results Section */}
            <div className="space-y-6">

                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Seu Número FIRE</CardTitle>
                        <CardDescription>O montante necessário para viver de renda</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary mb-2">
                            {formatKz(results.fireNumber)}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progresso Atual</span>
                                <span>{results.progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={results.progress} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Tempo Restante</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {results.isAchievable
                                    ? (results.yearsToFire > 0 ? `${results.yearsToFire.toFixed(1)} Anos` : "Atingido! 🎉")
                                    : "Inviável 🔴"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {results.isAchievable ? `Vivendo de renda em ${new Date().getFullYear() + Math.ceil(results.yearsToFire)}` : "Aumente aportes ou retorno."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Renda Passiva</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {formatKz((results.fireNumber * (values.withdrawalRate / 100)) / 12)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Mensal (na aposentadoria)
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Smart Tips */}
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Análise do Consultor</AlertTitle>
                    <AlertDescription className="text-xs mt-1 space-y-1">
                        {!results.isAchievable && (
                            <p>🔴 Com os juros reais atuais, seu patrimônio não cresce o suficiente. Tente buscar investimentos que paguem acima da inflação ({values.inflationRate}%).</p>
                        )}
                        {results.isAchievable && results.yearsToFire > 30 && (
                            <p>🟡 O prazo está longo. Pagar-se primeiro (aumentar o aporte mensal) é a forma mais rápida de reduzir este tempo.</p>
                        )}
                        {results.isAchievable && results.yearsToFire <= 15 && results.yearsToFire > 0 && (
                            <p>🟢 Excelente! Você está num caminho rápido para a liberdade financeira. Mantenha a disciplina.</p>
                        )}
                        {results.realReturn < 3 && results.realReturn > 0 && (
                            <p>💡 Seu retorno real é baixo. Em Angola, diversificar em negócios próprios ou imóveis pode acelerar seus ganhos.</p>
                        )}
                    </AlertDescription>
                </Alert>

            </div>
        </div>
    );
}
