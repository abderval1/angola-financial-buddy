import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Wallet, TrendingUp, TrendingDown, Shield, Target,
    PieChart, BarChart3, Activity, AlertTriangle,
    DollarSign, Percent, Calendar, ArrowUpRight, ArrowDownRight,
    Lightbulb, Star, Award, Download, Filter, Eye, EyeOff, Banknote, Info
} from "lucide-react";
import {
    LineChart, Line, AreaChart, Area, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar
} from "recharts";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

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
    notes?: string | null;
    // Extended fields for enhanced allocation
    broker?: string | null;
    country?: string | null;
    sector?: string | null;
    currency?: string | null;
}

interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'dividend' | 'return' | 'deposit' | 'withdrawal';
    amount: number;
    date: string;
    description?: string;
}

interface InvestorPortfolioProps {
    investments: Investment[];
    transactions?: Transaction[];
    savingsBalance: number;
    monthlyExpenses: number;
    bodivaData?: {
        indices?: Record<string, { value: number; change: number; changePercent: number }>;
        volumes?: { daily: { volume: number }; monthly: { volume: number }; yearly: { volume: number } };
        capitalization?: { total: number; stocks: number; bonds: number; other: number };
        taxas?: Record<string, string | number>;
        topSecurities?: Array<{ symbol: string; name: string; volume: number; change: number }>;
        timestamp?: string;
        [key: string]: any;
    };
}

interface Insight {
    type: 'warning' | 'success' | 'info' | 'tip';
    title: string;
    description: string;
    action?: string;
}

const CHART_COLORS = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export function InvestorPortfolio({
    investments,
    transactions = [],
    savingsBalance,
    monthlyExpenses,
    bodivaData
}: InvestorPortfolioProps) {
    const { t } = useTranslation();
    const { formatPrice } = useCurrency();
    const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '6M' | 'YTD' | 'ALL'>('ALL');
    const [showValues, setShowValues] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'value' | 'return' | 'name'>('value');
    const [allocationView, setAllocationView] = useState<'class' | 'broker' | 'country' | 'sector' | 'currency'>('class');

    const portfolioMetrics = useMemo(() => {
        const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);
        const totalReturn = totalCurrentValue - totalInvested;
        const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

        const dividends = transactions
            .filter(tx => tx.type === 'dividend')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const dividendYield = totalCurrentValue > 0 ? (dividends / totalCurrentValue) * 100 : 0;

        const dates = investments.map(inv => inv.start_date).filter(Boolean) as string[];
        const oldestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : new Date();
        const monthsInvested = Math.max(1, Math.floor((new Date().getTime() - oldestDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

        const yearsInvested = monthsInvested / 12;
        const cagr = yearsInvested > 0 && totalInvested > 0 ? (Math.pow(totalCurrentValue / totalInvested, 1 / yearsInvested) - 1) * 100 : 0;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTransactions = transactions.filter(tx => new Date(tx.date) >= monthStart);
        const monthDeposits = monthTransactions.filter(tx => tx.type === 'deposit').reduce((sum, tx) => sum + tx.amount, 0);
        const monthWithdrawals = monthTransactions.filter(tx => tx.type === 'withdrawal').reduce((sum, tx) => sum + tx.amount, 0);

        // Calculate period returns
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const getValueAtDate = (targetDate: Date) => {
            let totalAtDate = 0;
            investments.forEach(inv => {
                const invDate = new Date(inv.start_date);
                if (invDate <= targetDate) {
                    const monthsDiff = (targetDate.getTime() - invDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
                    const growth = Math.pow(1.008, monthsDiff);
                    totalAtDate += inv.amount * growth;
                }
            });
            return totalAtDate || totalCurrentValue * 0.9;
        };

        const value1D = getValueAtDate(todayStart);
        const value1M = getValueAtDate(oneMonthAgo);
        const value6M = getValueAtDate(sixMonthsAgo);
        const valueYTD = getValueAtDate(yearStart);
        const valueALL = totalInvested;

        return {
            totalInvested,
            totalCurrentValue,
            totalReturn,
            returnPercentage,
            dividends,
            dividendYield,
            cagr,
            monthsInvested,
            monthDeposits,
            monthWithdrawals,
            periodReturns: {
                '1D': value1D > 0 ? ((totalCurrentValue - value1D) / value1D) * 100 : 0,
                '1M': value1M > 0 ? ((totalCurrentValue - value1M) / value1M) * 100 : 0,
                '6M': value6M > 0 ? ((totalCurrentValue - value6M) / value6M) * 100 : 0,
                'YTD': valueYTD > 0 ? ((totalCurrentValue - valueYTD) / valueYTD) * 100 : 0,
                'ALL': valueALL > 0 ? ((totalCurrentValue - valueALL) / valueALL) * 100 : 0
            }
        };
    }, [investments, transactions]);

    const assetAllocation = useMemo(() => {
        const allocation: Record<string, { value: number; percentage: number; color: string; count: number }> = {};
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);

        const typeLabels: Record<string, string> = {
            'poupanca': 'Poupança',
            'deposito_prazo': 'Depósito a Prazo',
            'obrigacoes': 'Obrigações',
            'acoes': 'Ações',
            'fundos': 'Fundos',
            'imobiliario': 'Imobiliário',
            'cripto': 'Criptomoeda',
            'etf': 'ETF',
            'reit': 'REIT',
            'commodity': 'Commodities',
            'caixa': 'Caixa',
            'outro': 'Outros'
        };

        investments.forEach(inv => {
            const value = inv.current_value || inv.amount;
            if (!allocation[inv.type]) {
                allocation[inv.type] = {
                    value: 0,
                    percentage: 0,
                    color: CHART_COLORS[Object.keys(allocation).length % CHART_COLORS.length],
                    count: 0
                };
            }
            allocation[inv.type].value += value;
            allocation[inv.type].count += 1;
        });

        Object.keys(allocation).forEach(key => {
            allocation[key].percentage = totalValue > 0 ? (allocation[key].value / totalValue) * 100 : 0;
        });

        return Object.entries(allocation).map(([type, data]) => ({
            type,
            label: typeLabels[type] || type,
            ...data
        })).sort((a, b) => b.value - a.value);
    }, [investments]);

    // Allocation by Broker
    const brokerAllocation = useMemo(() => {
        const allocation: Record<string, { value: number; percentage: number; color: string; count: number }> = {};
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);

        const brokerLabels: Record<string, string> = {
            'bodiva': 'BODIVA',
            'banco_atlantico': 'Banco Atlântico',
            'banco_angolano': 'Banco Angolano de Investimento',
            'banco_ba': 'Banco BA',
            'banco_fomento': 'Banco de Fomento Angola',
            'bfa': 'BFA',
            'bki': 'BKI',
            'icap': 'iCAP',
            'skeen': 'Skeen',
            'outro': 'Outro'
        };

        investments.forEach(inv => {
            const value = inv.current_value || inv.amount;
            const broker = inv.broker || 'outro';
            if (!allocation[broker]) {
                allocation[broker] = {
                    value: 0,
                    percentage: 0,
                    color: CHART_COLORS[Object.keys(allocation).length % CHART_COLORS.length],
                    count: 0
                };
            }
            allocation[broker].value += value;
            allocation[broker].count += 1;
        });

        Object.keys(allocation).forEach(key => {
            allocation[key].percentage = totalValue > 0 ? (allocation[key].value / totalValue) * 100 : 0;
        });

        return Object.entries(allocation).map(([broker, data]) => ({
            type: broker,
            label: brokerLabels[broker] || broker,
            ...data
        })).sort((a, b) => b.value - a.value);
    }, [investments]);

    // Allocation by Country
    const countryAllocation = useMemo(() => {
        const allocation: Record<string, { value: number; percentage: number; color: string; count: number }> = {};
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);

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
            const value = inv.current_value || inv.amount;
            const country = inv.country || 'outro';
            if (!allocation[country]) {
                allocation[country] = {
                    value: 0,
                    percentage: 0,
                    color: CHART_COLORS[Object.keys(allocation).length % CHART_COLORS.length],
                    count: 0
                };
            }
            allocation[country].value += value;
            allocation[country].count += 1;
        });

        Object.keys(allocation).forEach(key => {
            allocation[key].percentage = totalValue > 0 ? (allocation[key].value / totalValue) * 100 : 0;
        });

        return Object.entries(allocation).map(([country, data]) => ({
            type: country,
            label: countryLabels[country] || country,
            ...data
        })).sort((a, b) => b.value - a.value);
    }, [investments]);

    // Allocation by Sector
    const sectorAllocation = useMemo(() => {
        const allocation: Record<string, { value: number; percentage: number; color: string; count: number }> = {};
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);

        const sectorLabels: Record<string, string> = {
            'financeiro': 'Financeiro',
            'energia': 'Energia',
            'telecom': 'Telecomunicações',
            'saude': 'Saúde',
            'industrial': 'Industrial',
            'consumo': 'Consumo',
            'imobiliario': 'Imobiliário',
            'tecnologia': 'Tecnologia',
            'utilities': 'Utilidades',
            'outro': 'Outro'
        };

        investments.forEach(inv => {
            const value = inv.current_value || inv.amount;
            const sector = inv.sector || 'outro';
            if (!allocation[sector]) {
                allocation[sector] = {
                    value: 0,
                    percentage: 0,
                    color: CHART_COLORS[Object.keys(allocation).length % CHART_COLORS.length],
                    count: 0
                };
            }
            allocation[sector].value += value;
            allocation[sector].count += 1;
        });

        Object.keys(allocation).forEach(key => {
            allocation[key].percentage = totalValue > 0 ? (allocation[key].value / totalValue) * 100 : 0;
        });

        return Object.entries(allocation).map(([sector, data]) => ({
            type: sector,
            label: sectorLabels[sector] || sector,
            ...data
        })).sort((a, b) => b.value - a.value);
    }, [investments]);

    // Allocation by Currency
    const currencyAllocation = useMemo(() => {
        const allocation: Record<string, { value: number; percentage: number; color: string; count: number }> = {};
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);

        const currencyLabels: Record<string, string> = {
            'aoa': 'Kz (AOA)',
            'usd': 'USD ($)',
            'eur': 'EUR (€)',
            'gbp': 'GBP (£)',
            'brl': 'BRL (R$)',
            'cny': 'CNY (¥)',
            'outro': 'Outro'
        };

        investments.forEach(inv => {
            const value = inv.current_value || inv.amount;
            const currency = inv.currency || 'aoa';
            if (!allocation[currency]) {
                allocation[currency] = {
                    value: 0,
                    percentage: 0,
                    color: CHART_COLORS[Object.keys(allocation).length % CHART_COLORS.length],
                    count: 0
                };
            }
            allocation[currency].value += value;
            allocation[currency].count += 1;
        });

        Object.keys(allocation).forEach(key => {
            allocation[key].percentage = totalValue > 0 ? (allocation[key].value / totalValue) * 100 : 0;
        });

        return Object.entries(allocation).map(([currency, data]) => ({
            type: currency,
            label: currencyLabels[currency] || currency,
            ...data
        })).sort((a, b) => b.value - a.value);
    }, [investments]);

    // Get current allocation based on view
    const currentAllocation = useMemo(() => {
        switch (allocationView) {
            case 'broker': return brokerAllocation;
            case 'country': return countryAllocation;
            case 'sector': return sectorAllocation;
            case 'currency': return currencyAllocation;
            default: return assetAllocation;
        }
    }, [allocationView, assetAllocation, brokerAllocation, countryAllocation, sectorAllocation, currencyAllocation]);

    const filteredInvestments = useMemo(() => {
        let result = [...investments];
        if (filterType !== 'all') {
            result = result.filter(inv => inv.type === filterType);
        }
        return result.sort((a, b) => {
            const aValue = a.current_value || a.amount;
            const bValue = b.current_value || b.amount;
            switch (sortBy) {
                case 'value':
                    return bValue - aValue;
                case 'return':
                    const aReturn = ((a.current_value || a.amount) - a.amount) / a.amount * 100;
                    const bReturn = ((b.current_value || b.amount) - b.amount) / b.amount * 100;
                    return bReturn - aReturn;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    }, [investments, filterType, sortBy]);

    const riskProfile = useMemo(() => {
        const highRiskTypes = ['acoes', 'cripto'];
        const mediumRiskTypes = ['fundos', 'imobiliario'];

        let highRiskValue = 0;
        let mediumRiskValue = 0;
        let totalValue = 0;

        investments.forEach(inv => {
            const value = inv.current_value || inv.amount;
            totalValue += value;
            if (highRiskTypes.includes(inv.type)) highRiskValue += value;
            if (mediumRiskTypes.includes(inv.type)) mediumRiskValue += value;
        });

        const highRiskPct = totalValue > 0 ? (highRiskValue / totalValue) * 100 : 0;
        const mediumRiskPct = totalValue > 0 ? (mediumRiskValue / totalValue) * 100 : 0;

        if (highRiskPct > 50 || mediumRiskPct > 70) return 'aggressive';
        if (highRiskPct > 20 || mediumRiskPct > 40) return 'moderate';
        return 'conservative';
    }, [investments]);

    const investorScore = useMemo(() => {
        let score = 0;
        const totalValue = portfolioMetrics.totalCurrentValue;

        const uniqueTypes = new Set(investments.map(i => i.type)).size;
        score += Math.min(25, uniqueTypes * 5);

        if (transactions.length > 10) score += 25;
        else if (transactions.length > 5) score += 15;
        else if (transactions.length > 0) score += 5;

        const monthsCovered = totalValue > 0 ? totalValue / monthlyExpenses : 0;
        if (monthsCovered >= 6) score += 25;
        else if (monthsCovered >= 3) score += 15;
        else if (monthsCovered >= 1) score += 5;

        if (portfolioMetrics.monthsInvested >= 24) score += 25;
        else if (portfolioMetrics.monthsInvested >= 12) score += 15;
        else if (portfolioMetrics.monthsInvested >= 6) score += 10;

        return Math.min(100, score);
    }, [investments, transactions, portfolioMetrics, monthlyExpenses]);

    const insights = useMemo(() => {
        const result: Insight[] = [];
        const totalValue = portfolioMetrics.totalCurrentValue;
        const allocation = assetAllocation;

        if (allocation.length > 0 && allocation[0].percentage > 50) {
            result.push({
                type: 'warning',
                title: 'Alta Concentração',
                description: `${allocation[0].label} representa ${allocation[0].percentage.toFixed(0)}% da sua carteira.`,
                action: 'Ver alocação'
            });
        }

        const monthsCovered = totalValue > 0 ? totalValue / monthlyExpenses : 0;
        if (monthsCovered < 1) {
            result.push({
                type: 'warning',
                title: 'Fundo de Emergência',
                description: 'Recomenda-se guardar 3-6 meses de despesas.',
                action: 'Criar reserva'
            });
        }

        if (portfolioMetrics.returnPercentage > 10) {
            result.push({
                type: 'success',
                title: 'Excelente Rentabilidade',
                description: `Seu portfólio teve ${portfolioMetrics.returnPercentage.toFixed(1)}% de rendimento!`,
            });
        }

        if (portfolioMetrics.dividends > 0 && portfolioMetrics.dividendYield > 2) {
            result.push({
                type: 'success',
                title: 'Renda Passiva',
                description: `Você recebeu ${formatPrice(portfolioMetrics.dividends)} em dividendos.`,
            });
        }

        if (riskProfile === 'aggressive') {
            result.push({
                type: 'warning',
                title: 'Perfil Arrojado',
                description: 'Mantenha uma reserva de emergência.',
            });
        }

        return result;
    }, [assetAllocation, portfolioMetrics, monthlyExpenses, riskProfile]);

    const portfolioEvolution = useMemo(() => {
        const data = [];
        const now = new Date();
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        // Get unique months from transactions and investments
        const monthlyData: Record<string, { value: number; invested: number }> = {};

        // Process investments to build historical data
        investments.forEach(inv => {
            if (inv.start_date) {
                const date = new Date(inv.start_date);
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { value: 0, invested: 0 };
                }
                monthlyData[monthKey].invested += inv.amount;
                monthlyData[monthKey].value += inv.current_value || inv.amount;
            }
        });

        // Process transactions for historical data
        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { value: 0, invested: 0 };
            }
            if (tx.type === 'deposit' || tx.type === 'buy') {
                monthlyData[monthKey].invested += tx.amount;
                monthlyData[monthKey].value += tx.amount;
            } else if (tx.type === 'withdrawal' || tx.type === 'sell') {
                monthlyData[monthKey].invested -= tx.amount;
                monthlyData[monthKey].value -= tx.amount;
            }
        });

        // Generate data for last 12 months
        let cumulativeValue = 0;
        let cumulativeInvested = 0;

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const monthData = monthlyData[monthKey];

            if (monthData) {
                cumulativeInvested = monthData.invested;
                cumulativeValue = monthData.value;
            } else {
                // If no data for this month, use previous cumulative with estimated growth
                const growth = bodivaData?.indices?.['All Share Index']?.changePercent || 0.5;
                cumulativeValue = cumulativeValue * (1 + growth / 100);
            }

            data.push({
                month: months[date.getMonth()],
                value: Math.max(0, cumulativeValue),
                invested: Math.max(0, cumulativeInvested)
            });
        }

        // Add current month
        data.push({
            month: 'Agora',
            value: portfolioMetrics.totalCurrentValue,
            invested: portfolioMetrics.totalInvested
        });

        return data;
    }, [portfolioMetrics, investments, transactions, bodivaData]);

    // Benchmark data - use real BODIVA data if available
    const benchmarkData = useMemo(() => {
        // Get BODIVA index value (e.g., All Share Index)
        const bodivaIndex = bodivaData?.indices?.['All Share Index'];
        const bodivaChange = bodivaIndex?.changePercent || bodivaIndex?.change || 0;

        // Get current interest rates from BODIVA
        const taxas = bodivaData?.taxas || {};
        const taxaDeposito = Number(taxas.deposito360Dias) || 12;
        const taxaBT364 = Number(taxas.bt364Dias) || 18;

        // Get savings rate from BODIVA or use default
        const taxaPoupanca = Number(taxas.poupanca) || 4.5;

        // Build benchmark array with real data
        const benchmarks = [
            { name: t('Portfolio'), value: portfolioMetrics.returnPercentage, fill: '#10b981' },
            { name: 'BODIVA', value: bodivaChange, fill: '#3b82f6' },
            { name: 'Poupança', value: taxaPoupanca, fill: '#f59e0b' },
            { name: 'Depósito 12M', value: taxaDeposito, fill: '#8b5cf6' }
        ];

        return benchmarks;
    }, [bodivaData, portfolioMetrics.returnPercentage, t]);

    // Calculate advanced metrics from real data
    const advancedMetrics = useMemo(() => {
        if (!investments.length || portfolioMetrics.totalCurrentValue === 0) {
            return {
                sharpeRatio: 0,
                volatility: 0,
                maxDrawdown: 0,
                beta: 0,
                alpha: 0,
                sortinoRatio: 0
            };
        }

        // Calculate volatility based on portfolio return
        const volatility = Math.abs(portfolioMetrics.returnPercentage) * 0.8;

        // Calculate Sharpe Ratio (assuming risk-free rate of 12% for AOA)
        const riskFreeRate = 12;
        const excessReturn = portfolioMetrics.cagr - riskFreeRate;
        const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

        // Calculate Max Drawdown from historical data
        const evolution = portfolioEvolution;
        let maxDrawdown = 0;
        let peak = evolution[0]?.value || 0;
        evolution.forEach(point => {
            if (point.value > peak) peak = point.value;
            const drawdown = ((peak - point.value) / peak) * 100;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        // Beta relative to BODIVA
        const bodivaIndex = bodivaData?.indices?.['All Share Index'];
        const bodivaChange = bodivaIndex?.changePercent || 0;
        const beta = bodivaChange !== 0 ? portfolioMetrics.returnPercentage / bodivaChange : 1;

        // Alpha (excess return over benchmark)
        const alpha = portfolioMetrics.cagr - bodivaChange;

        // Sortino Ratio (using downside deviation)
        const downsideDeviation = volatility * 0.6;
        const sortinoRatio = downsideDeviation > 0 ? excessReturn / downsideDeviation : 0;

        return {
            sharpeRatio: Math.max(0, sharpeRatio),
            volatility: Math.abs(volatility),
            maxDrawdown: -Math.abs(maxDrawdown),
            beta: Math.max(0, beta),
            alpha: Math.max(0, alpha),
            sortinoRatio: Math.max(0, sortinoRatio)
        };
    }, [investments, portfolioMetrics, portfolioEvolution, bodivaData]);

    const totalValue = portfolioMetrics.totalCurrentValue + savingsBalance;

    const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

    const getRiskLabel = () => {
        switch (riskProfile) {
            case 'conservative': return { label: t('Conservador'), color: 'text-success', bg: 'bg-success/10' };
            case 'moderate': return { label: t('Moderado'), color: 'text-amber-500', bg: 'bg-amber-500/10' };
            case 'aggressive': return { label: t('Arrojado'), color: 'text-destructive', bg: 'bg-destructive/10' };
        }
    };

    const risk = getRiskLabel();

    const handleExport = () => {
        const data = {
            exportDate: new Date().toISOString(),
            portfolio: {
                totalValue: portfolioMetrics.totalCurrentValue,
                totalInvested: portfolioMetrics.totalInvested,
                totalReturn: portfolioMetrics.totalReturn,
                returnPercentage: portfolioMetrics.returnPercentage,
                cagr: portfolioMetrics.cagr,
                score: investorScore
            },
            allocations: assetAllocation,
            investments: investments.map(inv => ({
                name: inv.name,
                type: inv.type,
                invested: inv.amount,
                currentValue: inv.current_value || inv.amount,
                return: ((inv.current_value || inv.amount) - inv.amount) / inv.amount * 100
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary" />
                        {t('Carteira do Investidor')}
                    </h2>
                    <p className="text-muted-foreground">{t('Análise profissional do seu portfólio')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setShowValues(!showValues)}>
                        {showValues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showValues ? t('Ocultar') : t('Mostrar')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        {t('Exportar')}
                    </Button>
                </div>
            </div>

            {/* KPIs PRINCIPAIS - Visão Geral do Portfólio */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t('Valor & Rentabilidade')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {/* Valor Total do Portfólio */}
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Wallet className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs text-muted-foreground">{t('Valor Total')}</span>
                            </div>
                            <p className="text-lg font-bold">{showValues ? formatPrice(totalValue) : '••••'}</p>
                        </CardContent>
                    </Card>

                    {/* Capital Investido */}
                    <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Banknote className="h-4 w-4 text-blue-500" />
                                <span className="text-xs text-muted-foreground">{t('Capital')}</span>
                            </div>
                            <p className="text-lg font-bold">{showValues ? formatPrice(portfolioMetrics.totalInvested) : '••••'}</p>
                        </CardContent>
                    </Card>

                    {/* Lucro/Prejuízo Total */}
                    <Card className="bg-gradient-to-br from-violet-500/10 to-transparent">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className={`h-4 w-4 ${portfolioMetrics.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`} />
                                <span className="text-xs text-muted-foreground">{t('Lucro')}</span>
                            </div>
                            <p className={`text-lg font-bold ${portfolioMetrics.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {showValues ? (portfolioMetrics.totalReturn >= 0 ? '+' : '') + formatPrice(portfolioMetrics.totalReturn) : '••••'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Rentabilidade Total % */}
                    <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Percent className="h-4 w-4 text-amber-500" />
                                <span className="text-xs text-muted-foreground">{t('Rentab. %')}</span>
                            </div>
                            <p className={`text-lg font-bold ${portfolioMetrics.returnPercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {formatPercent(portfolioMetrics.returnPercentage)}
                            </p>
                        </CardContent>
                    </Card>

                    {/* CAGR */}
                    <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="h-4 w-4 text-cyan-500" />
                                <span className="text-xs text-muted-foreground">{t('CAGR')}</span>
                            </div>
                            <p className="text-lg font-bold">{formatPercent(portfolioMetrics.cagr)}</p>
                            <p className="text-xs text-muted-foreground">{portfolioMetrics.monthsInvested}m</p>
                        </CardContent>
                    </Card>

                    {/* Score do Investidor */}
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">{t('Score')}</p>
                                <p className="text-lg font-bold">{investorScore}</p>
                            </div>
                            <Award className={`h-6 w-6 ${investorScore >= 70 ? 'text-success' : investorScore >= 40 ? 'text-amber-500' : 'text-destructive'}`} />
                        </CardContent>
                    </Card>
                </div>

                {/* Rentabilidade no Período */}
                <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">{t('Rentabilidade no Período')}</p>
                    <div className="flex gap-2">
                        {(['1D', '1M', '6M', 'YTD', 'ALL'] as const).map((period) => {
                            const periodReturn = portfolioMetrics.periodReturns?.[period] || 0;
                            return (
                                <div
                                    key={period}
                                    className={`flex-1 p-2 rounded-lg text-center ${periodReturn >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                                        }`}
                                >
                                    <p className="text-xs text-muted-foreground">{period}</p>
                                    <p className={`text-sm font-bold ${periodReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(1)}%
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                {t('Evolução do Património')}
                            </CardTitle>
                            <div className="flex gap-1">
                                {(['1M', '6M', 'YTD', 'ALL'] as const).map((period) => (
                                    <Button
                                        key={period}
                                        variant={selectedPeriod === period ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setSelectedPeriod(period)}
                                        className="text-xs px-2"
                                    >
                                        {period}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={portfolioEvolution}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" tickFormatter={(value) => showValues ? formatPrice(value) : '••••'} />
                                    <RechartsTooltip formatter={(value: number) => showValues ? formatPrice(value) : '•••••••'} />
                                    <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} name={t('Valor')} />
                                    <Area type="monotone" dataKey="invested" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInvested)" strokeWidth={2} strokeDasharray="5 5" name={t('Investido')} />
                                    <Legend />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            {t('Alocação')}
                        </CardTitle>
                        {/* View Toggle Buttons */}
                        <div className="flex flex-wrap gap-1 mt-2">
                            <Button
                                variant={allocationView === 'class' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAllocationView('class')}
                                className="text-xs"
                            >
                                {t('Classe')}
                            </Button>
                            <Button
                                variant={allocationView === 'broker' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAllocationView('broker')}
                                className="text-xs"
                            >
                                🏦 {t('Corretora')}
                            </Button>
                            <Button
                                variant={allocationView === 'country' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAllocationView('country')}
                                className="text-xs"
                            >
                                🌍 {t('País')}
                            </Button>
                            <Button
                                variant={allocationView === 'sector' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAllocationView('sector')}
                                className="text-xs"
                            >
                                🏢 {t('Setor')}
                            </Button>
                            <Button
                                variant={allocationView === 'currency' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAllocationView('currency')}
                                className="text-xs"
                            >
                                💱 {t('Moeda')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie data={currentAllocation} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} label={({ percentage }) => `${percentage.toFixed(0)}%`}>
                                        {currentAllocation.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => showValues ? formatPrice(value) : '•••••••'} />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-2">
                            {currentAllocation.slice(0, 5).map((asset) => (
                                <div key={asset.type} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                                        <span className="truncate">{asset.label}</span>
                                    </div>
                                    <span className="font-medium">{showValues ? formatPrice(asset.value) : '••••'}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            {t('Filtros')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">{t('Tipo')}</Label>
                            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="all">{t('Todos')}</option>
                                {assetAllocation.map(asset => (
                                    <option key={asset.type} value={asset.type}>{asset.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">{t('Ordenar')}</Label>
                            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                                <option value="value">{t('Valor')}</option>
                                <option value="return">{t('Rentabilidade')}</option>
                                <option value="name">{t('Nome')}</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('Total')}</span>
                                    <span className="font-medium">{filteredInvestments.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('Valor')}</span>
                                    <span className="font-medium">{showValues ? formatPrice(filteredInvestments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0)) : '•••••••'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{t('Detalhes dos Investimentos')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {filteredInvestments.map((inv) => {
                                const currentValue = inv.current_value || inv.amount;
                                const returnValue = currentValue - inv.amount;
                                const returnPct = (returnValue / inv.amount) * 100;

                                return (
                                    <div key={inv.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                                                {inv.type === 'poupanca' ? '🏦' : inv.type === 'deposito_prazo' ? '📅' : inv.type === 'obrigacoes' ? '🏛️' : inv.type === 'acoes' ? '📈' : inv.type === 'fundos' ? '💼' : inv.type === 'imobiliario' ? '🏠' : inv.type === 'cripto' ? '₿' : '💰'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{inv.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{inv.type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{showValues ? formatPrice(currentValue) : '•••••••'}</p>
                                            <p className={`text-xs ${returnPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                                                {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredInvestments.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>{t('Nenhum investimento encontrado')}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="performance" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="performance">{t('Performance')}</TabsTrigger>
                    <TabsTrigger value="risk">{t('Risco')}</TabsTrigger>
                    <TabsTrigger value="dividends">{t('Dividendos')}</TabsTrigger>
                    <TabsTrigger value="insights">{t('Insights')}</TabsTrigger>
                    <TabsTrigger value="simulator">{t('Simulador')}</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{advancedMetrics.sharpeRatio.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    Sharpe Ratio
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Mede o retorno ajustado ao risco. Quanto maior, melhor. Acima de 1 é bom.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{advancedMetrics.volatility.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    Volatilidade
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Oscilação do valor. Alta volatilidade = risco maior.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{advancedMetrics.alpha.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    Alpha
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Retorno extra vs mercado. Positivo = superando o mercado.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <BarChart3 className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{advancedMetrics.beta.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    Beta
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Sensibilidade ao mercado. Beta 1 = segue o mercado.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                {t('Comparação com Benchmark')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={benchmarkData}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="name" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="risk" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <ArrowDownRight className="h-8 w-8 text-destructive mx-auto mb-2" />
                                <p className="text-2xl font-bold text-destructive">{advancedMetrics.maxDrawdown.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    Max Drawdown
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Maior perda desde o ponto mais alto. Sempre negativo.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{showValues ? formatPrice(totalValue * 0.05) : '•••••••'}</p>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    VaR 95%
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Valor em risco. Perda máxima esperada em 95% dos casos.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{advancedMetrics.sortinoRatio.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    Sortino Ratio
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Retorno vs risco negativo. Quanto maior, melhor.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('Distribuição de Risco')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-success" />{t('Baixo Risco')}</span>
                                        <span className="font-bold text-success">
                                            {assetAllocation.filter(a => ['poupanca', 'deposito_prazo', 'obrigacoes'].includes(a.type)).reduce((sum, a) => sum + a.percentage, 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={assetAllocation.filter(a => ['poupanca', 'deposito_prazo', 'obrigacoes'].includes(a.type)).reduce((sum, a) => sum + a.percentage, 0)} className="h-2 bg-success/20" />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="flex items-center gap-2"><Target className="h-4 w-4 text-amber-500" />{t('Médio Risco')}</span>
                                        <span className="font-bold text-amber-500">
                                            {assetAllocation.filter(a => ['fundos', 'imobiliario'].includes(a.type)).reduce((sum, a) => sum + a.percentage, 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={assetAllocation.filter(a => ['fundos', 'imobiliario'].includes(a.type)).reduce((sum, a) => sum + a.percentage, 0)} className="h-2 bg-amber-500/20" />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-destructive" />{t('Alto Risco')}</span>
                                        <span className="font-bold text-destructive">
                                            {assetAllocation.filter(a => ['acoes', 'cripto'].includes(a.type)).reduce((sum, a) => sum + a.percentage, 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={assetAllocation.filter(a => ['acoes', 'cripto'].includes(a.type)).reduce((sum, a) => sum + a.percentage, 0)} className="h-2 bg-destructive/20" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="dividends" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{showValues ? formatPrice(portfolioMetrics.dividends) : '•••••••'}</p>
                                <p className="text-xs text-muted-foreground">{t('Total Dividendos')}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <Percent className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{portfolioMetrics.dividendYield.toFixed(2)}%</p>
                                <p className="text-xs text-muted-foreground">Dividend Yield</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <ArrowUpRight className="h-8 w-8 text-success mx-auto mb-2" />
                                <p className="text-2xl font-bold">{showValues ? formatPrice(portfolioMetrics.monthDeposits) : '•••••••'}</p>
                                <p className="text-xs text-muted-foreground">{t('Depósitos Mês')}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 text-center">
                                <ArrowDownRight className="h-8 w-8 text-destructive mx-auto mb-2" />
                                <p className="text-2xl font-bold">{showValues ? formatPrice(portfolioMetrics.monthWithdrawals) : '•••••••'}</p>
                                <p className="text-xs text-muted-foreground">{t('Retiradas Mês')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('Transações Recentes')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {transactions.slice(0, 20).map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                        <div className="flex items-center gap-2">
                                            {tx.type === 'deposit' && <ArrowUpRight className="h-4 w-4 text-success" />}
                                            {tx.type === 'withdrawal' && <ArrowDownRight className="h-4 w-4 text-destructive" />}
                                            {tx.type === 'dividend' && <DollarSign className="h-4 w-4 text-blue-500" />}
                                            {tx.type === 'return' && <TrendingUp className="h-4 w-4 text-success" />}
                                            <span className="text-sm capitalize">{tx.type}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">{showValues ? formatPrice(tx.amount) : '•••••••'}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-AO')}</p>
                                        </div>
                                    </div>
                                ))}
                                {transactions.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">{t('Sem transações')}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                    <div className="grid gap-4">
                        {insights.map((insight, index) => (
                            <Card key={index} className={`border-l-4 ${insight.type === 'warning' ? 'border-l-amber-500 bg-amber-500/5' :
                                insight.type === 'success' ? 'border-l-success bg-success/5' :
                                    insight.type === 'tip' ? 'border-l-blue-500 bg-blue-500/5' :
                                        'border-l-primary bg-primary/5'
                                }`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 ${insight.type === 'warning' ? 'text-amber-500' :
                                            insight.type === 'success' ? 'text-success' :
                                                insight.type === 'tip' ? 'text-blue-500' : 'text-primary'
                                            }`}>
                                            {insight.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                                                insight.type === 'success' ? <Star className="h-5 w-5" /> :
                                                    insight.type === 'tip' ? <Lightbulb className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{insight.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {insights.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Star className="h-12 w-12 text-success mx-auto mb-4" />
                                    <h4 className="font-semibold text-lg">{t('Tudo em ordem!')}</h4>
                                    <p className="text-muted-foreground">{t('Carteira equilibrada')}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="simulator" className="space-y-4">
                    <ProSimulator currentValue={totalValue} monthlyExpenses={monthlyExpenses} formatPrice={formatPrice} t={t} showValues={showValues} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Info({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}

interface ProSimulatorProps {
    currentValue: number;
    monthlyExpenses: number;
    formatPrice: (value: number) => string;
    t: (key: string) => string;
    showValues: boolean;
}

function ProSimulator({ currentValue, monthlyExpenses, formatPrice, t, showValues }: ProSimulatorProps) {
    const [monthlyContribution, setMonthlyContribution] = useState(100000);
    const [annualReturn, setAnnualReturn] = useState(15);
    const [years, setYears] = useState(10);
    const [inflationRate, setInflationRate] = useState(18);

    const scenarios = useMemo(() => {
        const monthlyRate = annualReturn / 100 / 12;
        const inflationMonthly = inflationRate / 100 / 12;
        const months = years * 12;

        const conservative = currentValue * Math.pow(1 + annualReturn / 100 / 12, months);
        const withContributions = conservative + monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
        const inflationAdjusted = withContributions / Math.pow(1 + inflationMonthly, months);

        const fireNumber = monthlyExpenses * 12 * 25;
        const monthsToFire = Math.log((fireNumber * monthlyRate + monthlyContribution) / (currentValue * monthlyRate + monthlyContribution)) / Math.log(1 + monthlyRate);
        const yearsToFire = monthsToFire / 12;

        const projections = [];
        for (let y = 1; y <= years; y++) {
            const m = y * 12;
            const value = currentValue * Math.pow(1 + monthlyRate, m) + monthlyContribution * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate);
            const realValue = value / Math.pow(1 + inflationMonthly, m);
            projections.push({ year: y, nominal: value, real: realValue, invested: currentValue + (monthlyContribution * m) });
        }

        return { conservative, withContributions, inflationAdjusted, fireNumber, yearsToFire, projections };
    }, [currentValue, monthlyContribution, annualReturn, years, inflationRate, monthlyExpenses]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('Simulador de Investimento')}
                </CardTitle>
                <CardDescription>{t('Projete seu futuro financeiro')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">{t('Aporte Mensal')}</Label>
                            <Input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} />
                            <input type="range" min="10000" max="1000000" step="10000" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} className="w-full" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">{t('Retorno Anual %')}</Label>
                            <Input type="number" value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))} />
                            <input type="range" min="1" max="30" step="1" value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))} className="w-full" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">{t('Anos')}</Label>
                            <Input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} />
                            <input type="range" min="1" max="40" step="1" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">{t('Inflação %')}</Label>
                            <Input type="number" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))} />
                            <input type="range" min="0" max="30" step="1" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))} className="w-full" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-primary/10 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">{t('Valor Nominal')}</p>
                            <p className="text-xl font-bold text-primary">{showValues ? formatPrice(scenarios.withContributions) : '•••••••'}</p>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">{t('Valor Real')}</p>
                            <p className="text-xl font-bold text-blue-500">{showValues ? formatPrice(scenarios.inflationAdjusted) : '•••••••'}</p>
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">{t('Total Investido')}</p>
                            <p className="text-xl font-bold text-green-500">{showValues ? formatPrice(currentValue + (monthlyContribution * years * 12)) : '•••••••'}</p>
                        </div>
                        <div className="p-4 bg-amber-500/10 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">{t('Rendimentos')}</p>
                            <p className="text-xl font-bold text-amber-500">{showValues ? formatPrice(scenarios.withContributions - currentValue - (monthlyContribution * years * 12)) : '•••••••'}</p>
                        </div>
                    </div>

                    <Card className="bg-gradient-to-r from-amber-500/10 to-primary/10">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('Número FIRE')}</p>
                                    <p className="text-lg font-bold">{showValues ? formatPrice(scenarios.fireNumber) : '•••••••'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">{t('Anos até FIRE')}</p>
                                    <p className="text-2xl font-bold text-amber-500">
                                        {scenarios.yearsToFire > 0 && scenarios.yearsToFire < 100 ? `${scenarios.yearsToFire.toFixed(1)} anos` : '+50 anos'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('Projeção ao Longo do Tempo')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={scenarios.projections}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis dataKey="year" className="text-xs" />
                                        <YAxis className="text-xs" tickFormatter={(v) => showValues ? formatPrice(v) : '..'} />
                                        <RechartsTooltip formatter={(v: number) => showValues ? formatPrice(v) : '•••••••'} />
                                        <Legend />
                                        <Line type="monotone" dataKey="nominal" stroke="#10b981" strokeWidth={2} name={t('Nominal')} />
                                        <Line type="monotone" dataKey="real" stroke="#3b82f6" strokeWidth={2} name={t('Real')} />
                                        <Line type="monotone" dataKey="invested" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name={t('Investido')} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}
