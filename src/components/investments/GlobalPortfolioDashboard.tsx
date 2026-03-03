import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Globe, TrendingUp, TrendingDown, DollarSign,
    PieChart, BarChart3, Wallet, RefreshCw, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar,
    PieChart as RechartsPie, Pie, Cell, LineChart, Line
} from "recharts";
import { useTranslation } from "react-i18next";

interface Investment {
    id: string;
    name: string;
    type: string;
    amount: number;
    current_value: number | null;
    expected_return: number | null;
    actual_return: number | null;
    start_date: string | null;
    risk_level: string | null;
    currency?: string;
    country?: string;
    broker?: string;
}

interface SavingsGoal {
    id: string;
    name: string;
    target: number;
    current_amount: number;
    currency?: string;
}

// Exchange rates (base: AOA - Angolan Kwanza)
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
    'aoa': 1,        // Base currency
    'usd': 0.0012,   // 1 AOA = 0.0012 USD (approx 830 AOA per USD)
    'eur': 0.0011,   // 1 AOA = 0.0011 EUR
    'gbp': 0.00095,  // 1 AOA = 0.00095 GBP
    'brl': 0.006,    // 1 AOA = 0.006 BRL
};

const CURRENCY_INFO: Record<string, { label: string; symbol: string; flag: string }> = {
    'aoa': { label: 'Kwanza (AOA)', symbol: 'Kz', flag: '🇦🇴' },
    'usd': { label: 'Dólar (USD)', symbol: '$', flag: '🇺🇸' },
    'eur': { label: 'Euro (EUR)', symbol: '€', flag: '🇪🇺' },
    'gbp': { label: 'Libra (GBP)', symbol: '£', flag: '🇬🇧' },
    'brl': { label: 'Real (BRL)', symbol: 'R$', flag: '🇧🇷' },
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

interface GlobalPortfolioDashboardProps {
    investments: Investment[];
    savingsGoals: SavingsGoal[];
}

export function GlobalPortfolioDashboard({ investments, savingsGoals }: GlobalPortfolioDashboardProps) {
    const { t } = useTranslation();
    const [baseCurrency, setBaseCurrency] = useState<string>('aoa');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_EXCHANGE_RATES);
    const [isLoadingRates, setIsLoadingRates] = useState(false);

    // Fetch exchange rates from API (free API)
    useEffect(() => {
        const fetchExchangeRates = async () => {
            setIsLoadingRates(true);
            try {
                // Using exchangerate.host free API (no key required)
                const response = await fetch('https://api.exchangerate.host/latest?base=AOA');
                const data = await response.json();
                if (data && data.rates) {
                    setExchangeRates({
                        'aoa': 1,
                        'usd': data.rates.USD || DEFAULT_EXCHANGE_RATES.usd,
                        'eur': data.rates.EUR || DEFAULT_EXCHANGE_RATES.eur,
                        'gbp': data.rates.GBP || DEFAULT_EXCHANGE_RATES.gbp,
                        'brl': data.rates.BRL || DEFAULT_EXCHANGE_RATES.brl,
                    });
                }
            } catch (error) {
                console.log('Using default exchange rates');
            } finally {
                setIsLoadingRates(false);
            }
        };

        fetchExchangeRates();
    }, []);

    // Convert amount to base currency
    const convertToBase = (amount: number, currency: string): number => {
        if (currency === baseCurrency || !currency) return amount;
        const rate = exchangeRates[currency] || 1;
        // If converting to AOA: multiply by rate (e.g., USD * 830)
        // If converting from AOA: divide by rate
        if (baseCurrency === 'aoa') {
            return amount / rate;
        }
        // For other currencies, first convert to AOA then to target
        const amountInAOA = amount / rate;
        const targetRate = exchangeRates[baseCurrency] || 1;
        return amountInAOA * targetRate;
    };

    // Calculate totals
    const totals = useMemo(() => {
        let totalInvestments = 0;
        let totalInvested = 0;
        let totalSavings = 0;

        investments.forEach(inv => {
            const value = inv.current_value || inv.amount;
            totalInvestments += convertToBase(value, inv.currency || 'aoa');
            totalInvested += convertToBase(inv.amount, inv.currency || 'aoa');
        });

        savingsGoals.forEach(goal => {
            totalSavings += convertToBase(goal.current_amount, goal.currency || 'aoa');
        });

        const totalPortfolio = totalInvestments + totalSavings;
        const totalReturn = totalInvestments - totalInvested;
        const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

        return {
            investments: totalInvestments,
            invested: totalInvested,
            savings: totalSavings,
            portfolio: totalPortfolio,
            return: totalReturn,
            returnPercent
        };
    }, [investments, savingsGoals, baseCurrency, exchangeRates]);

    // Currency exposure analysis
    const currencyExposure = useMemo(() => {
        const exposure: Record<string, { value: number; percentage: number; count: number }> = {};
        const total = totals.portfolio || 1;

        investments.forEach(inv => {
            const currency = inv.currency || 'aoa';
            const value = convertToBase(inv.current_value || inv.amount, currency);
            if (!exposure[currency]) {
                exposure[currency] = { value: 0, percentage: 0, count: 0 };
            }
            exposure[currency].value += value;
            exposure[currency].count += 1;
        });

        savingsGoals.forEach(goal => {
            const currency = goal.currency || 'aoa';
            const value = convertToBase(goal.current_amount, currency);
            if (!exposure[currency]) {
                exposure[currency] = { value: 0, percentage: 0, count: 0 };
            }
            exposure[currency].value += value;
            exposure[currency].count += 1;
        });

        Object.keys(exposure).forEach(key => {
            exposure[key].percentage = (exposure[key].value / total) * 100;
        });

        return Object.entries(exposure)
            .map(([currency, data]) => ({
                currency,
                ...CURRENCY_INFO[currency] || { label: currency, symbol: currency, flag: '🌍' },
                ...data
            }))
            .sort((a, b) => b.value - a.value);
    }, [investments, savingsGoals, totals.portfolio, baseCurrency, exchangeRates]);

    // Country exposure analysis
    const countryExposure = useMemo(() => {
        const exposure: Record<string, { value: number; percentage: number; count: number }> = {};
        const total = totals.portfolio || 1;

        const countryLabels: Record<string, string> = {
            'ao': 'Angola',
            'pt': 'Portugal',
            'us': 'Estados Unidos',
            'eu': 'Europa',
            'br': 'Brasil',
            'uk': 'Reino Unido',
            'cn': 'China',
            'global': 'Global',
            'outro': 'Outro'
        };

        investments.forEach(inv => {
            const country = inv.country || 'ao';
            const value = convertToBase(inv.current_value || inv.amount, inv.currency || 'aoa');
            if (!exposure[country]) {
                exposure[country] = { value: 0, percentage: 0, count: 0 };
            }
            exposure[country].value += value;
            exposure[country].count += 1;
        });

        // Assume savings are in Angola
        savingsGoals.forEach(goal => {
            if (!exposure['ao']) {
                exposure['ao'] = { value: 0, percentage: 0, count: 0 };
            }
            exposure['ao'].value += convertToBase(goal.current_amount, goal.currency || 'aoa');
            exposure['ao'].count += 1;
        });

        Object.keys(exposure).forEach(key => {
            exposure[key].percentage = (exposure[key].value / total) * 100;
        });

        return Object.entries(exposure)
            .map(([country, data]) => ({
                country,
                label: countryLabels[country] || country,
                ...data
            }))
            .sort((a, b) => b.value - a.value);
    }, [investments, savingsGoals, totals.portfolio, baseCurrency, exchangeRates]);

    // Calculate CAGR (simplified - using expected return or actual return)
    const cagr = useMemo(() => {
        if (investments.length === 0 || totals.invested === 0) return 0;

        let totalWeightedReturn = 0;
        let totalWeight = 0;

        investments.forEach(inv => {
            const weight = inv.amount;
            const returnRate = (inv.actual_return !== null)
                ? inv.actual_return
                : (inv.expected_return || 0);
            totalWeightedReturn += returnRate * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? totalWeightedReturn / totalWeight : 0;
    }, [investments, totals.invested]);

    // YTD performance (simplified - would need historical data for real YTD)
    const ytdPerformance = useMemo(() => {
        // For now, use a simplified calculation
        // In a real app, you'd track historical portfolio values
        return totals.returnPercent;
    }, [totals.returnPercent]);

    // Performance by currency chart data
    const performanceByCurrency = useMemo(() => {
        return currencyExposure.map(item => ({
            name: item.label,
            value: item.value,
            percentage: item.percentage,
            fill: CHART_COLORS[currencyExposure.indexOf(item) % CHART_COLORS.length]
        }));
    }, [currencyExposure]);

    // Format currency display
    const formatDisplay = (value: number): string => {
        const info = CURRENCY_INFO[baseCurrency];
        if (baseCurrency === 'aoa') {
            return `${info.symbol} ${value.toLocaleString('pt-AO', { maximumFractionDigits: 0 })}`;
        }
        return `${info.symbol} ${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-6">
            {/* Header with Currency Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Globe className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold">{t('Dashboard Global')}</h2>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('Moeda Base')}:</span>
                    <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(CURRENCY_INFO).map(([code, info]) => (
                                <SelectItem key={code} value={code}>
                                    {info.flag} {info.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        disabled={isLoadingRates}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Wallet className="h-4 w-4" />
                            <span className="text-sm">{t('Patrimônio Total')}</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-primary">
                            {formatDisplay(totals.portfolio)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            {totals.return >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                            <span className="text-sm">{t('Lucro/Prejuízo')}</span>
                        </div>
                        <p className={`text-xl sm:text-2xl font-bold ${totals.return >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {totals.return >= 0 ? '+' : ''}{formatDisplay(totals.return)}
                        </p>
                        <p className={`text-xs ${totals.return >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {totals.returnPercent >= 0 ? '+' : ''}{totals.returnPercent.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm">CAGR</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold">
                            {cagr >= 0 ? '+' : ''}{cagr.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">{t('Retorno Anual')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <BarChart3 className="h-4 w-4" />
                            <span className="text-sm">YTD</span>
                        </div>
                        <p className={`text-xl sm:text-2xl font-bold ${ytdPerformance >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {ytdPerformance >= 0 ? '+' : ''}{ytdPerformance.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">{t('Este Ano')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="currency" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="currency" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {t('Moeda')}
                    </TabsTrigger>
                    <TabsTrigger value="country" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {t('País')}
                    </TabsTrigger>
                    <TabsTrigger value="composition" className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        {t('Composição')}
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {t('Performance')}
                    </TabsTrigger>
                </TabsList>

                {/* Currency Exposure Tab */}
                <TabsContent value="currency" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t('Exposição por Moeda')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie>
                                            <Pie
                                                data={performanceByCurrency}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                label={({ percentage }) => `${percentage.toFixed(0)}%`}
                                            >
                                                {performanceByCurrency.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value: number) => formatDisplay(value)} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t('Detalhes por Moeda')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {currencyExposure.map((item) => (
                                        <div key={item.currency} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.flag}</span>
                                                <div>
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-xs text-muted-foreground">{item.count} {t('ativos')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{formatDisplay(item.value)}</p>
                                                <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Local vs International */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('Exposição Cambial')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                    <p className="text-sm text-muted-foreground">{t('Mercado Local (Kz)')}</p>
                                    <p className="text-2xl font-bold">
                                        {(currencyExposure.find(c => c.currency === 'aoa')?.percentage || 0).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                                    <p className="text-sm text-muted-foreground">{t('Mercado Internacional')}</p>
                                    <p className="text-2xl font-bold">
                                        {(100 - (currencyExposure.find(c => c.currency === 'aoa')?.percentage || 0)).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Country Exposure Tab */}
                <TabsContent value="country" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t('Exposição por País')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={countryExposure} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" tickFormatter={(v) => formatDisplay(v)} />
                                            <YAxis type="category" dataKey="label" width={100} />
                                            <RechartsTooltip formatter={(value: number) => formatDisplay(value)} />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t('Detalhes por País')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {countryExposure.map((item) => (
                                        <div key={item.country} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                                                    {countryExposure.indexOf(item) + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-xs text-muted-foreground">{item.count} {t('ativos')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{formatDisplay(item.value)}</p>
                                                <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Composition Tab */}
                <TabsContent value="composition" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Wallet className="h-4 w-4" />
                                    <span className="text-sm">{t('Investimentos')}</span>
                                </div>
                                <p className="text-2xl font-bold">{formatDisplay(totals.investments)}</p>
                                <div className="mt-2">
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${totals.portfolio > 0 ? (totals.investments / totals.portfolio) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {totals.portfolio > 0 ? ((totals.investments / totals.portfolio) * 100).toFixed(1) : 0}% {t('do portfólio')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <PiggyBank className="h-4 w-4" />
                                    <span className="text-sm">{t('Poupanças')}</span>
                                </div>
                                <p className="text-2xl font-bold">{formatDisplay(totals.savings)}</p>
                                <div className="mt-2">
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-success"
                                            style={{ width: `${totals.portfolio > 0 ? (totals.savings / totals.portfolio) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {totals.portfolio > 0 ? ((totals.savings / totals.portfolio) * 100).toFixed(1) : 0}% {t('do portfólio')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="text-sm">{t('Total Investido')}</span>
                                </div>
                                <p className="text-2xl font-bold">{formatDisplay(totals.invested)}</p>
                                <div className="mt-2">
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-warning"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t('Valor original investido')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t('Performance por Moeda')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {currencyExposure.map((item) => (
                                        <div key={item.currency} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-xl">{item.flag}</span>
                                                    {item.label}
                                                </span>
                                                <Badge variant={item.percentage > 20 ? 'default' : 'secondary'}>
                                                    {item.percentage.toFixed(1)}%
                                                </Badge>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">{t('Resumo de Performance')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span>{t('Retorno Total')}</span>
                                        <span className={`font-bold ${totals.return >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            {totals.return >= 0 ? '+' : ''}{formatDisplay(totals.return)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span>{t('Percentual de Retorno')}</span>
                                        <span className={`font-bold ${totals.returnPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            {totals.returnPercent >= 0 ? '+' : ''}{totals.returnPercent.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span>CAGR</span>
                                        <span className={`font-bold ${cagr >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            {cagr >= 0 ? '+' : ''}{cagr.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span>YTD</span>
                                        <span className={`font-bold ${ytdPerformance >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            {ytdPerformance >= 0 ? '+' : ''}{ytdPerformance.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
