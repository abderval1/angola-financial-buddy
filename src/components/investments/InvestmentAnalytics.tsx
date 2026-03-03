import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Target, DollarSign, Percent, ArrowUpDown, Activity } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InvestmentTransaction {
    id: string;
    investment_id: string;
    type: string;
    amount: number;
    previous_value: number;
    new_value: number;
    source: string;
    destination: string;
    notes: string;
    transaction_date: string;
}

interface Investment {
    id: string;
    name: string;
    type: string;
    amount: number;
    current_value: number | null;
    expected_return: number | null;
    start_date: string | null;
    risk_level: string | null;
}

interface InvestmentAnalyticsProps {
    transactions: InvestmentTransaction[];
    investments: Investment[];
}

type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'all';
type ChartView = 'value' | 'gains' | 'transactions';

export function InvestmentAnalytics({ transactions, investments }: InvestmentAnalyticsProps) {
    const { t } = useTranslation();
    const { formatPrice } = useCurrency();
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
    const [chartView, setChartView] = useState<ChartView>('value');

    // Filter transactions by time period
    const filteredTransactions = useMemo(() => {
        if (timePeriod === 'all') return transactions;

        const now = new Date();
        let startDate: Date;

        switch (timePeriod) {
            case '7d':
                startDate = subDays(now, 7);
                break;
            case '30d':
                startDate = subDays(now, 30);
                break;
            case '90d':
                startDate = subMonths(now, 3);
                break;
            case '1y':
                startDate = subMonths(now, 12);
                break;
            default:
                startDate = subDays(now, 30);
        }

        return transactions.filter(tx =>
            new Date(tx.transaction_date) >= startDate
        );
    }, [transactions, timePeriod]);

    // Calculate KPIs
    const kpis = useMemo(() => {
        const totalInvested = filteredTransactions
            .filter(tx => tx.type === 'investment')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const totalWithdrawn = filteredTransactions
            .filter(tx => tx.type === 'withdrawal')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const totalGains = filteredTransactions
            .filter(tx => tx.type === 'market_adjustment' || tx.type === 'dividend')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const currentValue = investments.reduce((sum, inv) =>
            sum + (inv.current_value || inv.amount), 0
        );

        const totalInitialValue = investments.reduce((sum, inv) =>
            sum + inv.amount, 0
        );

        const totalReturn = currentValue - totalInitialValue;
        const returnPercentage = totalInitialValue > 0
            ? (totalReturn / totalInitialValue) * 100
            : 0;

        const numberOfTransactions = filteredTransactions.length;
        const numberOfInvestments = investments.length;

        // Calculate daily average gain/loss
        const daysInPeriod = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 :
            timePeriod === '90d' ? 90 : 365;
        const dailyAverage = totalReturn / daysInPeriod;

        // Best and worst performing investments
        const investmentPerformance = investments.map(inv => ({
            name: inv.name,
            return: ((inv.current_value || inv.amount) - inv.amount) / inv.amount * 100,
            value: inv.current_value || inv.amount
        }));

        const bestPerformer = investmentPerformance.length > 0
            ? investmentPerformance.reduce((best, curr) => curr.return > best.return ? curr : best)
            : null;

        const worstPerformer = investmentPerformance.length > 0
            ? investmentPerformance.reduce((worst, curr) => curr.return < worst.return ? curr : worst)
            : null;

        // Distribution by type
        const typeDistribution = investments.reduce((acc, inv) => {
            const type = inv.type || 'outro';
            acc[type] = (acc[type] || 0) + (inv.current_value || inv.amount);
            return acc;
        }, {} as Record<string, number>);

        // Distribution by risk level
        const riskDistribution = investments.reduce((acc, inv) => {
            const risk = inv.risk_level || 'medium';
            acc[risk] = (acc[risk] || 0) + (inv.current_value || inv.amount);
            return acc;
        }, {} as Record<string, number>);

        return {
            totalInvested,
            totalWithdrawn,
            totalGains,
            currentValue,
            totalReturn,
            returnPercentage,
            numberOfTransactions,
            numberOfInvestments,
            dailyAverage,
            bestPerformer,
            worstPerformer,
            typeDistribution,
            riskDistribution
        };
    }, [filteredTransactions, investments, timePeriod]);

    // Generate chart data
    const chartData = useMemo(() => {
        if (timePeriod === 'all') {
            // Group by month for all time
            const months = eachMonthOfInterval({
                start: new Date(2020, 0, 1),
                end: new Date()
            });

            return months.map(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);

                const monthTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.transaction_date);
                    return isWithinInterval(txDate, { start: monthStart, end: monthEnd });
                });

                const invested = monthTransactions
                    .filter(tx => tx.type === 'investment')
                    .reduce((sum, tx) => sum + tx.amount, 0);

                const withdrawn = monthTransactions
                    .filter(tx => tx.type === 'withdrawal')
                    .reduce((sum, tx) => sum + tx.amount, 0);

                const gains = monthTransactions
                    .filter(tx => tx.type === 'market_adjustment' || tx.type === 'dividend')
                    .reduce((sum, tx) => sum + tx.amount, 0);

                return {
                    period: format(month, 'MMM yyyy', { locale: pt }),
                    invested,
                    withdrawn,
                    gains,
                    net: invested - withdrawn + gains
                };
            }).filter(d => d.invested > 0 || d.withdrawn > 0 || d.gains !== 0);
        } else {
            // Group by day for shorter periods
            const days = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 :
                timePeriod === '90d' ? 90 : 365;

            const interval = eachDayOfInterval({
                start: subDays(new Date(), days),
                end: new Date()
            });

            return interval.map(day => {
                const dayTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.transaction_date);
                    return format(txDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                });

                const invested = dayTransactions
                    .filter(tx => tx.type === 'investment')
                    .reduce((sum, tx) => sum + tx.amount, 0);

                const withdrawn = dayTransactions
                    .filter(tx => tx.type === 'withdrawal')
                    .reduce((sum, tx) => sum + tx.amount, 0);

                const gains = dayTransactions
                    .filter(tx => tx.type === 'market_adjustment' || tx.type === 'dividend')
                    .reduce((sum, tx) => sum + tx.amount, 0);

                return {
                    period: format(day, 'dd MMM', { locale: pt }),
                    invested,
                    withdrawn,
                    gains,
                    net: invested - withdrawn + gains
                };
            });
        }
    }, [transactions, timePeriod]);

    const getTransactionTypeLabel = (type: string) => {
        switch (type) {
            case 'investment': return t('Depósito');
            case 'withdrawal': return t('Levantamento');
            case 'reinforcement': return t('Reforço');
            case 'return': return t('Retorno');
            case 'market_adjustment': return t('Ajuste Mercado');
            case 'dividend': return t('Dividendo');
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'investment': return 'text-success';
            case 'withdrawal': return 'text-destructive';
            case 'reinforcement': return 'text-warning';
            case 'return': return 'text-success';
            case 'market_adjustment': return 'text-info';
            case 'dividend': return 'text-success';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <div className="space-y-6">
            {/* Time Period Selector */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
                <h3 className="text-xl font-bold">{t('Análise de Investimentos')}</h3>
                <div className="flex gap-2">
                    <Select value={timePeriod} onValueChange={(v: TimePeriod) => setTimePeriod(v)}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">{t('Últimos 7 dias')}</SelectItem>
                            <SelectItem value="30d">{t('Últimos 30 dias')}</SelectItem>
                            <SelectItem value="90d">{t('Últimos 3 meses')}</SelectItem>
                            <SelectItem value="1y">{t('Último ano')}</SelectItem>
                            <SelectItem value="all">{t('Todo o período')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Valor Atual')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(kpis.currentValue)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Rendimento Total')}</CardTitle>
                        {kpis.totalReturn >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${kpis.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {kpis.totalReturn >= 0 ? '+' : ''}{formatPrice(kpis.totalReturn)}
                        </div>
                        <p className={`text-xs ${kpis.returnPercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {kpis.returnPercentage >= 0 ? '+' : ''}{kpis.returnPercentage.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Investido')}</CardTitle>
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(kpis.totalInvested)}</div>
                        <p className="text-xs text-muted-foreground">
                            {kpis.numberOfTransactions} {t('transações')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Média Diária')}</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${kpis.dailyAverage >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {kpis.dailyAverage >= 0 ? '+' : ''}{formatPrice(kpis.dailyAverage)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('por dia')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kpis.bestPerformer && (
                    <Card className="bg-success/5 border-success/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-success">{t('Melhor Performance')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-bold">{kpis.bestPerformer.name}</div>
                            <p className="text-sm text-success">+{kpis.bestPerformer.return.toFixed(2)}%</p>
                        </CardContent>
                    </Card>
                )}

                {kpis.worstPerformer && kpis.worstPerformer.return < 0 && (
                    <Card className="bg-destructive/5 border-destructive/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-destructive">{t('Pior Performance')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-bold">{kpis.worstPerformer.name}</div>
                            <p className="text-sm text-destructive">{kpis.worstPerformer.return.toFixed(2)}%</p>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Total Investimentos')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.numberOfInvestments}</div>
                        <p className="text-xs text-muted-foreground">{t('Ativos')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart and Distribution Tabs */}
            <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chart">{t('Evolução')}</TabsTrigger>
                    <TabsTrigger value="type">{t('Por Tipo')}</TabsTrigger>
                    <TabsTrigger value="risk">{t('Por Risco')}</TabsTrigger>
                </TabsList>

                <TabsContent value="chart" className="space-y-4">
                    <div className="flex gap-2">
                        <Button
                            variant={chartView === 'value' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartView('value')}
                        >
                            {t('Valor')}
                        </Button>
                        <Button
                            variant={chartView === 'gains' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartView('gains')}
                        >
                            {t('Ganhos')}
                        </Button>
                        <Button
                            variant={chartView === 'transactions' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartView('transactions')}
                        >
                            {t('Transações')}
                        </Button>
                    </div>

                    {/* Simple bar chart visualization */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="h-[300px] flex items-end gap-1">
                                {chartData.slice(-12).map((data, idx) => {
                                    const maxValue = Math.max(
                                        ...chartData.slice(-12).map(d =>
                                            chartView === 'gains' ? Math.abs(d.gains) :
                                                chartView === 'transactions' ? d.invested + d.withdrawn :
                                                    d.net
                                        )
                                    );

                                    const height = maxValue > 0
                                        ? ((chartView === 'gains' ? Math.abs(data.gains) :
                                            chartView === 'transactions' ? data.invested + data.withdrawn :
                                                data.net) / maxValue) * 250
                                        : 0;

                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center">
                                            <div
                                                className={`w-full rounded-t ${chartView === 'gains'
                                                    ? data.gains >= 0 ? 'bg-success' : 'bg-destructive'
                                                    : data.net >= 0 ? 'bg-primary' : 'bg-destructive'
                                                    }`}
                                                style={{ height: `${Math.max(height, 2)}px` }}
                                                title={`${data.period}: ${formatPrice(chartView === 'gains' ? data.gains : chartView === 'transactions' ? data.invested + data.withdrawn : data.net)}`}
                                            />
                                            <span className="text-[10px] mt-1 rotate-45 origin-left text-muted-foreground whitespace-nowrap">
                                                {data.period.split(' ')[0]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="type">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {Object.entries(kpis.typeDistribution).map(([type, value]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${type === 'acoes' ? 'bg-orange-500' :
                                                type === 'obrigacoes' ? 'bg-purple-500' :
                                                    type === 'fundos' ? 'bg-pink-500' :
                                                        type === 'poupanca' ? 'bg-green-500' :
                                                            type === 'deposito_prazo' ? 'bg-blue-500' :
                                                                'bg-gray-500'
                                                }`} />
                                            <span className="font-medium">{t(`investment_${type}`)}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{formatPrice(value)}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {((value / kpis.currentValue) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="risk">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {Object.entries(kpis.riskDistribution).map(([risk, value]) => (
                                    <div key={risk} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${risk === 'low' ? 'bg-green-500' :
                                                risk === 'medium' ? 'bg-yellow-500' :
                                                    risk === 'high' ? 'bg-red-500' :
                                                        'bg-gray-500'
                                                }`} />
                                            <span className="font-medium">
                                                {risk === 'low' ? t('Baixo') :
                                                    risk === 'medium' ? t('Médio') :
                                                        risk === 'high' ? t('Alto') : risk}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{formatPrice(value)}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {((value / kpis.currentValue) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Transações Recentes')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredTransactions.slice(0, 10).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${tx.type === 'investment' ? 'bg-success' :
                                        tx.type === 'withdrawal' ? 'bg-destructive' :
                                            tx.type === 'market_adjustment' ? 'bg-blue-500' :
                                                'bg-gray-500'
                                        }`} />
                                    <div>
                                        <p className="font-medium text-sm">{getTransactionTypeLabel(tx.type)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(tx.transaction_date), 'dd MMM yyyy', { locale: pt })}
                                        </p>
                                    </div>
                                </div>
                                <div className={`font-bold ${getTypeColor(tx.type)}`}>
                                    {tx.type === 'withdrawal' ? '-' : '+'}{formatPrice(tx.amount)}
                                </div>
                            </div>
                        ))}
                        {filteredTransactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                {t('Nenhuma transação neste período')}
                            </p>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
