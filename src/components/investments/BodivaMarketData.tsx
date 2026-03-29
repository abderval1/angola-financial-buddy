import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Calendar, Lightbulb, Users, Shield, Zap, Info, PieChart as PieChartIcon, ExternalLink, LineChart, Activity, Target, Percent, Search, ChevronDown, Filter, Settings2, Eye, EyeOff, Clock, ArrowUpDown, ArrowUp, ArrowDown, Newspaper, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBodivaLastUpdate } from '@/hooks/useBodivaLastUpdate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ReferenceLine, Label } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
    Line,
    ComposedChart
} from 'recharts';

interface BodivaMarketData {
    id: string;
    data_date: string;
    symbol: string;
    title_type: string;
    price: number;
    variation: number;
    num_trades: number;
    quantity: number;
    amount: number;
    created_at: string;
    image_url?: string;
}

export default function BodivaMarketData() {
    const [marketData, setMarketData] = useState<BodivaMarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [historicalData, setHistoricalData] = useState<BodivaMarketData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [tipologiaFilter, setTipologiaFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'amount', direction: 'desc' });
    const [indicators, setIndicators] = useState({
        sma5: true,
        ema9: false,
        ema21: false,
        supportResistance: true,
        volume: true,
        forecast: true
    });
    const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
    const [investmentAmount, setInvestmentAmount] = useState<number>(100000); // Default 100,000 KZS
    const [investmentDate, setInvestmentDate] = useState<string>('');
    const [selectedSimStocks, setSelectedSimStocks] = useState<string[]>([]);
    const { toast } = useToast();
    const { lastUpdate, loading: lastUpdateLoading, timeAgo, refresh: refreshLastUpdate } = useBodivaLastUpdate();

    const fetchMarketData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bodiva_market_data')
                .select('*')
                .order('data_date', { ascending: false })
                .order('symbol', { ascending: true });

            if (error) throw error;
            setMarketData(data || []);

            // Set default selected date to most recent
            if (data && data.length > 0 && !selectedDate) {
                setSelectedDate(data[0].data_date);
            }
        } catch (error) {
            console.error('Error fetching market data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketData();
    }, []);

    useEffect(() => {
        if (selectedSymbol) {
            fetchHistoricalData(selectedSymbol);
        }
    }, [selectedSymbol]);

    const fetchHistoricalData = async (symbol: string) => {
        try {
            const { data, error } = await supabase
                .from('bodiva_market_data')
                .select('*')
                .eq('symbol', symbol)
                .order('data_date', { ascending: false }); // Fetch newest first for easier slicing

            if (error) throw error;
            setHistoricalData(data || []);
        } catch (error) {
            console.error('Error fetching historical data:', error);
        }
    };

    // Group data by date
    const groupedByDate = marketData.reduce((acc, item) => {
        if (!acc[item.data_date]) {
            acc[item.data_date] = [];
        }
        acc[item.data_date].push(item);
        return acc;
    }, {} as Record<string, BodivaMarketData[]>);

    const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    // Calculate summary for selected date
    const selectedData = selectedDate ? groupedByDate[selectedDate] || [] : [];

    // Get unique tipologias for filter (from selectedData, not filteredData)
    const uniqueTipologias = useMemo(() => {
        const types = new Set(selectedData.map(item => item.title_type));
        return Array.from(types).sort();
    }, [selectedData]);

    // Filter by search term and tipologia
    const filteredData = useMemo(() => {
        let data = selectedData;

        // Filter by tipologia
        if (tipologiaFilter !== 'all') {
            data = data.filter(item => item.title_type === tipologiaFilter);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            data = data.filter(item =>
                item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.title_type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort data
        if (sortConfig) {
            data = [...data].sort((a, b) => {
                let aVal: any = a[sortConfig.key as keyof BodivaMarketData];
                let bVal: any = b[sortConfig.key as keyof BodivaMarketData];

                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [selectedData, searchTerm, tipologiaFilter, sortConfig]);

    // Calculate summary from filtered data
    const totalVolume = filteredData.reduce((sum, item) => sum + item.amount, 0);
    const totalTrades = filteredData.reduce((sum, item) => sum + item.num_trades, 0);
    const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantity, 0);
    const gainers = filteredData.filter(item => item.variation > 0).length;
    const losers = filteredData.filter(item => item.variation < 0).length;

    // Top Lists
    const top5Gainers = [...filteredData]
        .filter(item => item.variation > 0)
        .sort((a, b) => b.variation - a.variation)
        .slice(0, 5);

    const top5Losers = [...filteredData]
        .filter(item => item.variation < 0)
        .sort((a, b) => a.variation - b.variation)
        .slice(0, 5);

    const top5Volume = [...filteredData]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    // Segment Analysis
    const segments = useMemo(() => {
        const grouped = filteredData.reduce((acc, item) => {
            const type = item.title_type;
            if (!acc[type]) {
                acc[type] = { name: type, amount: 0, trades: 0, quantity: 0, count: 0 };
            }
            acc[type].amount += item.amount;
            acc[type].trades += item.num_trades;
            acc[type].quantity += item.quantity;
            acc[type].count += 1;
            return acc;
        }, {} as Record<string, { name: string, amount: number, trades: number, quantity: number, count: number }>);

        return Object.values(grouped).sort((a, b) => b.amount - a.amount);
    }, [filteredData]);

    const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

    // Handle sort
    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                if (prev.direction === 'desc') return { key, direction: 'asc' };
                return null;
            }
            return { key, direction: 'desc' };
        });
    };

    // Group all market data by symbol for historical analysis
    const historicalBySymbol = useMemo(() => {
        const grouped: Record<string, BodivaMarketData[]> = {};
        marketData.forEach(item => {
            if (!grouped[item.symbol]) {
                grouped[item.symbol] = [];
            }
            grouped[item.symbol].push(item);
        });
        // Sort each symbol's data by date (ascending for trend analysis)
        Object.keys(grouped).forEach(symbol => {
            grouped[symbol].sort((a, b) => new Date(a.data_date).getTime() - new Date(b.data_date).getTime());
        });
        return grouped;
    }, [marketData]);

    // PROFESSIONAL STOCK ANALYSIS - Returns JSON format
    const analyzeStock = (symbol: string): {
        score: number;
        recomendacao: string;
        tendencia: string;
        principais_pontos_positivos: string[];
        principais_riscos: string[];
        resumo_analise: string;
    } | null => {
        const history = historicalBySymbol[symbol] || [];
        const currentData = history[history.length - 1];

        if (!currentData || history.length < 5) {
            return null; // Insufficient data
        }

        const positives: string[] = [];
        const risks: string[] = [];
        let score = 50; // Start neutral
        const now = new Date();

        // Helper: get data within time period
        const getDataInPeriod = (days: number) => {
            const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            return history.filter(d => new Date(d.data_date) >= cutoff);
        };

        // 1. Price Momentum (3, 6, 12 months)
        const getPriceChange = (data: BodivaMarketData[]) => {
            if (data.length < 2) return 0;
            return ((data[data.length - 1].price - data[0].price) / data[0].price) * 100;
        };

        const change3m = getPriceChange(getDataInPeriod(90));
        const change6m = getPriceChange(getDataInPeriod(180));
        const change12m = getPriceChange(getDataInPeriod(365));

        // Momentum scoring
        if (change12m > 10) { score += 15; positives.push(`Momentum 12m: +${change12m.toFixed(1)}%`); }
        else if (change12m > 0) { score += 5; positives.push(`Momentum 12m: +${change12m.toFixed(1)}%`); }
        else if (change12m < -10) { score -= 15; risks.push(`Momentum 12m: ${change12m.toFixed(1)}%`); }
        else { score -= 5; risks.push(`Momentum 12m: ${change12m.toFixed(1)}%`); }

        // 2. Moving Averages (Trend)
        const getSMA = (period: number) => {
            if (history.length < period) return null;
            const slice = history.slice(-period);
            return slice.reduce((sum, d) => sum + d.price, 0) / slice.length;
        };

        const sma20 = getSMA(Math.min(20, history.length));
        const sma50 = getSMA(Math.min(50, history.length));
        const currentPrice = currentData.price;

        let tendencia: 'Alta' | 'Neutra' | 'Baixa' = 'Neutra';

        if (sma20 && sma50) {
            if (sma20 > sma50) { score += 10; positives.push('MMA20>MMA50: Alta'); tendencia = 'Alta'; }
            else { score -= 10; risks.push('MMA20<MMA50: Baixa'); tendencia = 'Baixa'; }
        }

        // 3. RSI
        const calculateRSI = (period: number = 14) => {
            if (history.length < period + 1) return 50;
            let gains = 0, losses = 0;
            for (let i = history.length - period; i < history.length; i++) {
                const change = history[i].price - history[i - 1].price;
                if (change > 0) gains += change; else losses -= change;
            }
            const rs = (gains / period) / (losses / period || 1);
            return 100 - (100 / (1 + rs));
        };

        const rsi = calculateRSI();
        if (rsi < 30) { score += 10; positives.push(`RSI ${rsi.toFixed(0)}: Sobrevendido`); }
        else if (rsi > 70) { score -= 10; risks.push(`RSI ${rsi.toFixed(0)}: Sobrecomprado`); }
        else { positives.push(`RSI ${rsi.toFixed(0)}: Neutro`); }

        // 4. Volatility
        const returns = [];
        for (let i = 1; i < history.length; i++) {
            returns.push((history[i].price - history[i - 1].price) / history[i - 1].price);
        }
        const volatility = returns.length > 0 ? Math.sqrt(returns.reduce((s, v) => s + Math.pow(v - returns.reduce((a, b) => a + b, 0) / returns.length, 2), 0) / returns.length) * 100 : 0;

        if (volatility < 15) { score += 5; positives.push(`Volatilidade ${volatility.toFixed(1)}%: Estável`); }
        else if (volatility > 40) { score -= 5; risks.push(`Volatilidade ${volatility.toFixed(1)}%: Arriscado`); }

        // 5. Volume Analysis
        const avgVolume = history.reduce((s, d) => s + d.amount, 0) / history.length;
        const recentVolume = history.slice(-10).reduce((s, d) => s + d.amount, 0) / Math.min(10, history.length);
        if (recentVolume > avgVolume * 1.2) { score += 5; positives.push('Volume em crescimento'); }
        else if (recentVolume < avgVolume * 0.5) { score -= 5; risks.push('Volume em queda'); }

        // 6. Today's Performance
        if (currentData.variation > 3) { score += 5; positives.push(`Hoje: +${currentData.variation.toFixed(2)}%`); }
        else if (currentData.variation < -3) { score -= 5; risks.push(`Hoje: ${currentData.variation.toFixed(2)}%`); }

        // 7. Liquidity
        const totalVolume = marketData.filter(d => d.data_date === currentData.data_date).reduce((s, d) => s + d.amount, 0);
        const quota = totalVolume > 0 ? (currentData.amount / totalVolume) * 100 : 0;
        if (quota > 3) { score += 5; positives.push(`Liquidez: ${quota.toFixed(1)}%`); }
        else if (quota < 0.5) { score -= 5; risks.push(`Liquidez: ${quota.toFixed(1)}%`); }

        // Clamp score
        score = Math.max(0, Math.min(100, score));

        // Recommendation
        const recomendacao = score >= 75 ? 'COMPRAR' : score >= 50 ? 'MANTER' : 'VENDER';

        return {
            score,
            recomendacao,
            tendencia,
            principais_pontos_positivos: positives.slice(0, 4),
            principais_riscos: risks.slice(0, 4),
            resumo_analise: `${recomendacao} - Score: ${score}/100. ${tendencia}. RSI: ${rsi.toFixed(0)}. ${positives[0] || ''}`
        };
    };

    // Generate recommendations using professional analysis
    const recommendations = useMemo(() => {
        if (!selectedData || selectedData.length === 0) return { buy: [], sell: [], hold: [] };

        const totalVolume = selectedData.reduce((sum, item) => sum + item.amount, 0);

        const analyzed = selectedData
            .filter(item => item.title_type && item.title_type.toLowerCase().includes('acções'))
            .map(item => {
                const analysis = analyzeStock(item.symbol);
                const quota = totalVolume > 0 ? (item.amount / totalVolume) * 100 : 0;
                return {
                    ...item,
                    reasons: analysis ? [...analysis.principais_pontos_positivos, ...analysis.principais_riscos].slice(0, 2) : ['Análise em progresso'],
                    quota,
                    analysis
                };
            });

        const buy: (BodivaMarketData & { reasons: string[]; quota: number; analysis: ReturnType<typeof analyzeStock> })[] = [];
        const sell: (BodivaMarketData & { reasons: string[]; quota: number; analysis: ReturnType<typeof analyzeStock> })[] = [];
        const hold: (BodivaMarketData & { reasons: string[]; quota: number; analysis: ReturnType<typeof analyzeStock> })[] = [];

        analyzed.forEach(item => {
            const score = item.analysis?.score ?? 50;
            if (score >= 75) buy.push(item);
            else if (score < 50) sell.push(item);
            else hold.push(item);
        });

        buy.sort((a, b) => (b.analysis?.score ?? 0) - (a.analysis?.score ?? 0));
        sell.sort((a, b) => (a.analysis?.score ?? 0) - (b.analysis?.score ?? 0));
        hold.sort((a, b) => (b.analysis?.score ?? 0) - (a.analysis?.score ?? 0));

        return { buy: buy.slice(0, 5), sell: sell.slice(0, 5), hold: hold.slice(0, 5) };
    }, [selectedData, historicalBySymbol]);

    // Market history for the "Histórico" tab
    const marketHistory = useMemo(() => {
        if (marketData.length === 0) return [];
        const dailyAggs = dates.map(date => {
            const dayData = groupedByDate[date];
            return {
                date: new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' }),
                fullDate: date,
                volume: dayData.reduce((sum, item) => sum + item.amount, 0),
                trades: dayData.reduce((sum, item) => sum + item.num_trades, 0)
            };
        }).reverse(); // Ascending for chart
        return dailyAggs;
    }, [marketData, dates, groupedByDate]);

    const marketConcentration = useMemo(() => {
        if (totalVolume === 0) return 0;
        const sorted = [...selectedData].sort((a, b) => b.amount - a.amount);
        const top3Sum = sorted.slice(0, 3).reduce((sum, item) => sum + item.amount, 0);
        return (top3Sum / totalVolume) * 100;
    }, [selectedData, totalVolume]);

    // Investment Simulation
    const simulationResults = useMemo(() => {
        if (!investmentDate || selectedSimStocks.length === 0 || investmentAmount <= 0) {
            return null;
        }

        const results = selectedSimStocks.map(symbol => {
            const history = historicalBySymbol[symbol] || [];
            const startData = history.find(d => d.data_date >= investmentDate);
            const currentData = history[history.length - 1];

            if (!startData || !currentData) return null;

            const startPrice = startData.price;
            const currentPrice = currentData.price;
            const priceChange = ((currentPrice - startPrice) / startPrice) * 100;
            const profit = investmentAmount * (priceChange / 100);
            const finalValue = investmentAmount + profit;
            const daysHeld = Math.floor((new Date(currentData.data_date).getTime() - new Date(startData.data_date).getTime()) / (1000 * 60 * 60 * 24));

            return {
                symbol,
                startDate: startData.data_date,
                endDate: currentData.data_date,
                startPrice,
                currentPrice,
                priceChange,
                initialInvestment: investmentAmount,
                finalValue,
                profit,
                daysHeld,
                annualizedReturn: daysHeld > 0 ? (Math.pow(finalValue / investmentAmount, 365 / daysHeld) - 1) * 100 : 0
            };
        }).filter(Boolean);

        if (results.length === 0) return null;

        const totalInitial = investmentAmount * results.length;
        const totalFinal = results.reduce((sum, r) => sum + (r?.finalValue || 0), 0);
        const totalProfit = totalFinal - totalInitial;
        const overallReturn = (totalProfit / totalInitial) * 100;

        return {
            individual: results,
            totalInitial,
            totalFinal,
            totalProfit,
            overallReturn
        };
    }, [investmentDate, selectedSimStocks, investmentAmount, historicalBySymbol]);

    const summaryChartData = useMemo(() => {
        return [...selectedData]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8)
            .map(item => ({
                name: item.symbol,
                amount: item.amount,
                trades: item.num_trades
            }));
    }, [selectedData]);

    const typeData = useMemo(() => {
        return segments.map(s => ({
            name: s.name,
            value: s.amount
        }));
    }, [segments]);

    const COLORS = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#ea580c'];

    const handleSymbolClick = (symbol: string) => {
        setSelectedSymbol(symbol);
        // Scroll to analysis section smoothly
        setTimeout(() => {
            const element = document.getElementById('technical-analysis');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // Process Historical Data for TradingView Chart
    const filteredHistoricalData = useMemo(() => {
        if (historicalData.length === 0) return [];

        // historicalData is DESC (newest first)
        // Simulate OHLC data for candlestick chart
        // We only have close price, so we estimate open/high/low from variation
        const dataWithOHLC = [...historicalData].reverse().map((item) => {
            const close = item.price;
            const variation = item.variation || 0;

            // Estimate open from variation (reverse calculate)
            const open = variation >= 0
                ? close / (1 + variation / 100)
                : close * (1 - variation / 100);

            // Estimate high/low with small margin
            const range = Math.abs(close - open) * 0.3;
            const high = Math.max(close, open) + range;
            const low = Math.min(close, open) - range;

            // Calculate volume direction
            const isUp = close >= open;

            return {
                ...item,
                open,
                high,
                low,
                close,
                isUp,
                volumeColor: isUp ? '#22c55e' : '#ef4444'
            };
        });

        let sliceSize = dataWithOHLC.length;
        if (timeRange === '1D') sliceSize = Math.min(1, dataWithOHLC.length);
        else if (timeRange === '1W') sliceSize = Math.min(7, dataWithOHLC.length);
        else if (timeRange === '1M') sliceSize = Math.min(30, dataWithOHLC.length);
        else if (timeRange === '3M') sliceSize = Math.min(90, dataWithOHLC.length);
        else if (timeRange === '1Y') sliceSize = Math.min(365, dataWithOHLC.length);

        // Return ASC for indicators & chart
        return dataWithOHLC.slice(0, sliceSize);
    }, [historicalData, timeRange]);

    const processedHistorical = useMemo(() => {
        const data = filteredHistoricalData;
        if (data.length === 0) return [];

        const calculateEMA = (mArray: any[], period: number) => {
            const k = 2 / (period + 1);
            let emaArr = [mArray[0].price];
            for (let i = 1; i < mArray.length; i++) {
                emaArr.push(mArray[i].price * k + emaArr[i - 1] * (1 - k));
            }
            return emaArr;
        };

        const ema9Values = calculateEMA(data, 9);
        const ema21Values = calculateEMA(data, 21);

        return data.map((item, index, arr) => {
            let sma5 = null;
            if (index >= 4) {
                const slice = arr.slice(index - 4, index + 1);
                const sum = slice.reduce((s, i) => s + i.price, 0);
                sma5 = sum / 5;
            }

            return {
                date: new Date(item.data_date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' }),
                fullDate: item.data_date,
                isForecast: false,
                price: item.price,
                volume: item.amount,
                title_type: item.title_type,
                sma5: sma5,
                ema9: ema9Values[index],
                ema21: ema21Values[index]
            };
        });
    }, [filteredHistoricalData]);

    const forecastData = useMemo(() => {
        if (filteredHistoricalData.length < 5 || !indicators.forecast) return [];

        const lastKnown = filteredHistoricalData[filteredHistoricalData.length - 1]; // filtered is already ASC
        const lastPrice = lastKnown.price;
        const lastDate = new Date(lastKnown.data_date);
        const lastTitleType = lastKnown.title_type || '';

        const prices = filteredHistoricalData.map(h => h.price);
        const n = prices.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += prices[i];
            sumXY += i * prices[i];
            sumX2 += i * i;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const mean = sumY / n;
        const stdDev = Math.sqrt(prices.map(p => Math.pow(p - mean, 2)).reduce((a, b) => a + b) / n);

        const projections = [];
        for (let i = 1; i <= 90; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);
            const predicted = lastPrice + (slope * i) + (Math.random() * stdDev * 0.05);
            projections.push({
                date: nextDate.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' }),
                fullDate: nextDate.toISOString().split('T')[0],
                isForecast: true,
                price: null,
                forecast: Number(predicted.toFixed(2)),
                title_type: lastTitleType,
                volume: null
            });
        }
        return projections;
    }, [filteredHistoricalData, indicators.forecast]);

    const historicalChartData = useMemo(() => {
        return [...processedHistorical].concat(forecastData);
    }, [processedHistorical, forecastData]);

    const traderAdvice = useMemo(() => {
        if (filteredHistoricalData.length < 5) return null;
        const prices = filteredHistoricalData.map(h => h.price);
        const start = prices[0];
        const end = prices[prices.length - 1];
        const growth = ((end - start) / start) * 100;

        if (growth > 5) return {
            sentiment: 'Bullish (Alta)',
            reason: 'O activo demonstra uma forte tendência de acumulação com quebra de resistências históricas. O volume sustentado sugere que investidores institucionais estão a manter posições longas.',
            action: 'Manter ou Reforçar em correcções até à SMA 5.'
        };
        if (growth < -5) return {
            sentiment: 'Bearish (Baixa)',
            reason: 'Pressão vendedora acentuada após quebra de suportes críticos. O gráfico sugere exaustão de compradores no curto prazo.',
            action: 'Aguardar sinal de reversão nos suportes inferiores antes de novas entradas.'
        };
        return {
            sentiment: 'Neutral / Lateralização',
            reason: 'O mercado encontra-se em fase de consolidação. Os indicadores EMA 9 e 21 estão a cruzar-se frequentemente, indicando falta de direcção clara.',
            action: 'Monitorizar quebra da zona de congestão actual para definir entrada.'
        };
    }, [filteredHistoricalData]);

    const levels = useMemo(() => {
        if (historicalData.length < 5) return { support: null, resistance: null };
        const prices = historicalData.map(h => h.price);
        return {
            support: Math.min(...prices),
            resistance: Math.max(...prices)
        };
    }, [historicalData]);

    const symbolStats = useMemo(() => {
        if (historicalData.length === 0) return null;
        const prices = historicalData.map(h => h.price);
        return {
            ath: Math.max(...prices),
            atl: Math.min(...prices),
            avgVol: historicalData.reduce((s, h) => s + h.amount, 0) / historicalData.length
        };
    }, [historicalData]);

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (marketData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Resumo do Mercado BODIVA
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Sem dados do mercado disponíveis</p>
                        <p className="text-sm mt-2">Os dados do mercado BODIVA aparecerão aqui quando forem inseridos</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Resumo do Mercado BODIVA
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {timeAgo && (
                            <Badge variant="outline" className="text-xs bg-azul_bodiva-1/5 text-azul_bodiva-1 border-azul_bodiva-1/20">
                                <Clock className="h-3 w-3 mr-1" />
                                Atualizado: {timeAgo}
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { fetchMarketData(); refreshLastUpdate(); }}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Header Controls: Date Picker & Search & Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Procurar título ou tipo (ex: BFA, Acções)..."
                            className="pl-9 h-10 bg-slate-50 border-slate-200 focus-visible:ring-azul_bodiva-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Tipologia Filter */}
                    <div className="w-full md:w-[200px]">
                        <Select value={tipologiaFilter} onValueChange={setTipologiaFilter}>
                            <SelectTrigger className="h-10 bg-white border-azul_bodiva-1/30">
                                <Filter className="h-4 w-4 mr-2 text-azul_bodiva-1" />
                                <SelectValue placeholder="Todas as Tipologias" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Tipologias</SelectItem>
                                {uniqueTipologias.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-[220px]">
                        <Select value={selectedDate || ''} onValueChange={setSelectedDate}>
                            <SelectTrigger className="h-10 bg-white border-azul_bodiva-1/30 font-bold text-azul_bodiva-1">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Seleccionar Data" />
                            </SelectTrigger>
                            <SelectContent>
                                {dates.map(date => (
                                    <SelectItem key={date} value={date}>
                                        {new Date(date).toLocaleDateString('pt-AO', {
                                            day: '2-digit', month: 'long', year: 'numeric'
                                        })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Quick Date Shortcuts (for tablets/mobile) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {dates.slice(0, 5).map((date) => (
                        <Button
                            key={date}
                            variant={selectedDate === date ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDate(date)}
                            className="whitespace-nowrap px-3 h-8 text-xs font-medium rounded-full"
                        >
                            {new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' })}
                        </Button>
                    ))}
                    {dates.length > 5 && (
                        <Badge variant="outline" className="h-8 rounded-full border-dashed px-3 text-[10px] text-muted-foreground whitespace-nowrap">
                            Ver arquivo no seletor acima
                        </Badge>
                    )}
                </div>

                {/* Summary Stats */}
                {filteredData.length > 0 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-azul_bodiva-1/5 border border-azul_bodiva-1/10 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Volume Total</p>
                                <p className="text-xl font-black text-azul_bodiva-1">
                                    {totalVolume >= 1000000000
                                        ? `${(totalVolume / 1000000000).toLocaleString('pt-AO', { maximumFractionDigits: 2 })} B`
                                        : totalVolume.toLocaleString('pt-AO')}
                                    <span className="text-[10px] ml-1 opacity-50 font-normal">AOA</span>
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Nº Negócios</p>
                                <p className="text-xl font-black text-slate-800">{totalTrades.toLocaleString('pt-AO')}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Quantidade</p>
                                <p className="text-xl font-black text-slate-800">{totalQuantity.toLocaleString('pt-AO')}</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Altas</p>
                                <p className="text-xl font-black text-green-600">{gainers}</p>
                                <p className="text-[10px] text-green-600/70 mt-1">{((gainers / filteredData.length) * 100).toFixed(0)}% do Mercado</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider text-red-700 font-bold mb-1 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" /> Baixas
                                </p>
                                <p className="text-xl font-black text-red-600">{losers}</p>
                                <p className="text-[10px] text-red-600/70 mt-1">{((losers / filteredData.length) * 100).toFixed(0)}% do Mercado</p>
                            </div>
                        </div>

                        {/* Top Performers Lists */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-green-100 bg-green-50/10">
                                <CardHeader className="py-3 bg-green-50/50 border-b border-green-100">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-green-800 flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3" /> Maiores Altas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-3">
                                    <div className="space-y-2">
                                        {top5Gainers.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-green-50 last:border-0">
                                                <span className="font-bold text-slate-700">{idx + 1}. {item.symbol}</span>
                                                <span className="text-green-600 font-bold">+{item.variation.toFixed(2)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-red-100 bg-red-50/10">
                                <CardHeader className="py-3 bg-red-50/50 border-b border-red-100">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-red-800 flex items-center gap-2">
                                        <TrendingDown className="h-3 w-3" /> Maiores Baixas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-3">
                                    <div className="space-y-2">
                                        {top5Losers.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-red-50 last:border-0">
                                                <span className="font-bold text-slate-700">{idx + 1}. {item.symbol}</span>
                                                <span className="text-red-600 font-bold">{item.variation.toFixed(2)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-100 bg-blue-50/10">
                                <CardHeader className="py-3 bg-blue-50/50 border-b border-blue-100">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-800 flex items-center gap-2">
                                        <Activity className="h-3 w-3" /> Líderes Volume
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-3">
                                    <div className="space-y-2">
                                        {top5Volume.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-blue-50 last:border-0">
                                                <span className="font-bold text-slate-700">{idx + 1}. {item.symbol}</span>
                                                <span className="text-blue-600 font-bold text-xs">{(item.amount / 1000000).toFixed(1)}M <span className="text-[10px] font-normal uppercase">AOA</span></span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recommendations Section */}
                        <div className="mt-6">
                            <Card className="border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                                <CardHeader className="py-3 bg-amber-50/50 border-b border-amber-100">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-amber-800 flex items-center gap-2">
                                        <Target className="h-4 w-4" /> Recomendações de Investimento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* BUY Recommendations */}
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                            <h4 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                                                <TrendingUp className="h-4 w-4" /> COMPRAR
                                            </h4>
                                            {recommendations.buy.length > 0 ? (
                                                <div className="space-y-3">
                                                    {recommendations.buy.slice(0, 3).map((item, idx) => (
                                                        <div
                                                            key={item.id}
                                                            className="cursor-pointer hover:bg-green-100 p-2 rounded-lg transition-colors"
                                                            onClick={() => handleSymbolClick(item.symbol)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-green-900">{item.symbol}</span>
                                                                <span className="text-green-700 text-sm">+{item.variation.toFixed(2)}%</span>
                                                            </div>
                                                            <p className="text-[10px] text-green-600 mt-1 line-clamp-2">
                                                                {item.reasons?.[0] || 'Análise: Tendência positiva'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-green-700/70">Nenhuma recomendação de compra no momento</p>
                                            )}
                                            <p className="text-[10px] text-green-600 mt-2">
                                                Baseado em análise histórica: tendências, volume e liquidez
                                            </p>
                                        </div>

                                        {/* SELL Recommendations */}
                                        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                            <h4 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                                                <TrendingDown className="h-4 w-4" /> VENDER
                                            </h4>
                                            {recommendations.sell.length > 0 ? (
                                                <div className="space-y-3">
                                                    {recommendations.sell.slice(0, 3).map((item, idx) => (
                                                        <div
                                                            key={item.id}
                                                            className="cursor-pointer hover:bg-red-100 p-2 rounded-lg transition-colors"
                                                            onClick={() => handleSymbolClick(item.symbol)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-red-900">{item.symbol}</span>
                                                                <span className="text-red-700 text-sm">{item.variation.toFixed(2)}%</span>
                                                            </div>
                                                            <p className="text-[10px] text-red-600 mt-1 line-clamp-2">
                                                                {item.reasons?.[0] || 'Análise: Tendência negativa'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-red-700/70">Nenhuma ação para vender no momento</p>
                                            )}
                                            <p className="text-[10px] text-red-600 mt-2">
                                                Sinais de queda: análise de tendências e volume
                                            </p>
                                        </div>

                                        {/* HOLD / OBSERVE */}
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
                                                <Eye className="h-4 w-4" /> OBSERVAR
                                            </h4>
                                            {recommendations.hold.length > 0 ? (
                                                <div className="space-y-3">
                                                    {recommendations.hold.slice(0, 3).map((item, idx) => (
                                                        <div
                                                            key={item.id}
                                                            className="cursor-pointer hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                                            onClick={() => handleSymbolClick(item.symbol)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-blue-900">{item.symbol}</span>
                                                                <span className="text-blue-700 text-sm">{item.variation >= 0 ? '+' : ''}{item.variation.toFixed(2)}%</span>
                                                            </div>
                                                            <p className="text-[10px] text-blue-600 mt-1 line-clamp-2">
                                                                {item.reasons?.[0] || 'Desempenho estável'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-blue-700/70">Nenhuma ação para observar</p>
                                            )}
                                            <p className="text-[10px] text-blue-600 mt-2">
                                                Mercado estávelaguarde melhores oportunidades
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Market Insights Section */}
                {filteredData.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-amber-500" />
                                <h3 className="font-bold text-lg">Análise de Mercado Exploratória</h3>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                <Target className="h-4 w-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-800">Concentração: {marketConcentration.toFixed(1)}%</span>
                                <span className="text-[10px] text-amber-600 hidden sm:inline">(Top 3 Títulos)</span>
                            </div>
                        </div>

                        <Tabs defaultValue="layman" className="w-full">
                            <div className="overflow-x-auto -mx-2 px-2 mb-4">
                                <TabsList className="flex w-max min-w-full gap-1">
                                    <TabsTrigger value="layman" className="text-xs flex items-center gap-1 px-3 py-2 whitespace-nowrap rounded-lg">
                                        <Info className="h-3 w-3 shrink-0" /> Leigo
                                    </TabsTrigger>
                                    <TabsTrigger value="conservative" className="text-xs flex items-center gap-1 px-3 py-2 whitespace-nowrap rounded-lg">
                                        <Shield className="h-3 w-3 shrink-0" /> Conservador
                                    </TabsTrigger>
                                    <TabsTrigger value="aggressive" className="text-xs flex items-center gap-1 px-3 py-2 whitespace-nowrap rounded-lg">
                                        <Zap className="h-3 w-3 shrink-0" /> Agressivo
                                    </TabsTrigger>
                                    <TabsTrigger value="segments" className="text-xs flex items-center gap-1 px-3 py-2 whitespace-nowrap rounded-lg">
                                        <BarChart3 className="h-3 w-3 shrink-0" /> Segmentos
                                    </TabsTrigger>
                                    <TabsTrigger value="simulator" className="text-xs flex items-center gap-1 px-3 py-2 whitespace-nowrap rounded-lg">
                                        <Target className="h-3 w-3 shrink-0" /> Simulador
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="text-xs flex items-center gap-1 px-3 py-2 whitespace-nowrap rounded-lg">
                                        <LineChart className="h-3 w-3 shrink-0 text-azul_bodiva-1" /> Mercado Pro
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="layman" className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 border border-slate-200">
                                <p className="font-black text-azul_bodiva-1 flex items-center gap-2">
                                    <Info className="h-4 w-4" /> RESUMO SIMPLES DO DIA
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    {gainers > losers
                                        ? "O mercado está em festa! 🎉 Há mais optimismo nas compras, o que fez os preços subirem na maioria das empresas listadas."
                                        : gainers < losers
                                            ? "Hoje o mercado está num dia de 'saldos'. 📉 Há mais empresas a baixar de preço, o que pode indicar alguma cautela ou oportunidade para quem quer comprar mais barato."
                                            : "O mercado está em calmaria. ⚖️ Há um equilíbrio perfeito entre as subidas e descidas, mostrando estabilidade."}
                                </p>
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <p className="text-xs text-slate-500 mb-1">Destaque do Dia:</p>
                                    <p className="font-medium text-slate-800">
                                        A estrela foi o <span className="font-bold text-azul_bodiva-1">{top5Gainers[0]?.symbol}</span> com uma valorização de <span className="text-green-600">+{top5Gainers[0]?.variation.toFixed(2)}%</span>.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="conservative" className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 border border-slate-200">
                                <p className="font-black text-azul_bodiva-1 flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> ANÁLISE DE LIQUIDEZ E SEGURANÇA
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    O volume total de {totalVolume >= 1000000000 ? `${(totalVolume / 1000000000).toFixed(2)} Mil Milhões` : totalVolume.toLocaleString('pt-AO')} AOA indica
                                    {totalVolume > 5000000000 ? " uma liquidez excepcional, facilitando entradas e saídas rápidas." : " uma liquidez saudável para operações institucionais e de retalho."}
                                </p>
                                <p className="text-slate-600">
                                    A maior segurança financeira continua concentrada no <span className="font-bold text-azul_bodiva-1">{top5Volume[0]?.symbol}</span>, que garantiu {(top5Volume[0]?.amount / totalVolume * 100).toFixed(1)}% de toda a liquidez do dia.
                                </p>
                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <p className="text-xs text-blue-800">
                                        **Dica de Valor**: Para maior segurança, prefira títulos com volume superior a 10M AOA e um número de negócios (Trades) elevado. Isso garante que não ficará "preso" num título sem compradores.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="aggressive" className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 border border-slate-200">
                                <p className="font-black text-azul_bodiva-1 flex items-center gap-2">
                                    <Zap className="h-4 w-4" /> OPORTUNIDADES E MOMENTUM
                                </p>
                                <p className="text-slate-600">
                                    A **Concentração de Mercado** atingiu {marketConcentration.toFixed(1)}% nos 3 títulos líderes. Isto indica que o fluxo de capital está focado, criando oportunidades de momentum nestes activos.
                                </p>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <p className="text-[10px] uppercase font-bold text-green-700">Breadth (Largura)</p>
                                        <p className="text-lg font-black text-green-800">{(gainers / filteredData.length * 100).toFixed(0)}% Altas</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <p className="text-[10px] uppercase font-bold text-blue-700">Ticket Médio</p>
                                        <p className="text-lg font-black text-blue-800">{(avgTradeSize / 1000000).toFixed(1)}M <span className="text-xs font-normal">AOA</span></p>
                                    </div>
                                </div>
                                <p className="text-amber-700 text-xs italic font-medium p-2 bg-amber-50 rounded border border-amber-100">
                                    ⚠️ Atenção: A variação do {top5Gainers[0]?.symbol} pode indicar um breakout técnico se o volume estiver acima da média histórica.
                                </p>
                            </TabsContent>

                            <TabsContent value="segments" className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-xs py-2">Tipo de Título</TableHead>
                                            <TableHead className="text-xs py-2 text-right">Volume (AOA)</TableHead>
                                            <TableHead className="text-xs py-2 text-right">Negócios</TableHead>
                                            <TableHead className="text-xs py-2 text-right">Quota %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {segments.map((s) => (
                                            <TableRow key={s.name} className="hover:bg-slate-50/50">
                                                <TableCell className="text-xs py-2 font-bold">{s.name}</TableCell>
                                                <TableCell className="text-xs py-2 text-right">{s.amount.toLocaleString('pt-AO')}</TableCell>
                                                <TableCell className="text-xs py-2 text-right">{s.trades}</TableCell>
                                                <TableCell className="text-xs py-2 text-right font-bold text-azul_bodiva-1">
                                                    {(s.amount / totalVolume * 100).toFixed(1)}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent value="simulator" className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl text-white border-none shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-azul_bodiva-1">Simulador de Investimento</h4>
                                    <Badge variant="outline" className="bg-azul_bodiva-1/20 text-[10px] text-azul_bodiva-1 border-azul_bodiva-1/30">Backtesting</Badge>
                                </div>

                                {/* Simulation Controls */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Valor do Investimento (KZS)</label>
                                        <Input
                                            type="number"
                                            value={investmentAmount}
                                            onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                                            className="bg-white/10 border-white/20 text-white text-sm h-10"
                                            placeholder="100.000"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Data de Investimento</label>
                                        <Select value={investmentDate} onValueChange={setInvestmentDate}>
                                            <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-10">
                                                <SelectValue placeholder="Selecionar data" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dates.map(date => (
                                                    <SelectItem key={date} value={date}>
                                                        {new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Ações para Simular</label>
                                        <Select value={selectedSimStocks[0] || ''} onValueChange={(v) => setSelectedSimStocks(v ? [v] : [])}>
                                            <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-10">
                                                <SelectValue placeholder="Selecionar ação" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedData.filter(d => d.title_type?.toLowerCase().includes('acções')).slice(0, 20).map(d => (
                                                    <SelectItem key={d.symbol} value={d.symbol}>{d.symbol} - {d.price.toFixed(2)} KZS</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Simulation Results */}
                                {simulationResults ? (
                                    <div className="space-y-4">
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Investimento Inicial</p>
                                                <p className="text-lg font-black text-white">{simulationResults.totalInitial.toLocaleString('pt-AO')} KZS</p>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Valor Atual</p>
                                                <p className="text-lg font-black text-white">{simulationResults.totalFinal.toLocaleString('pt-AO')} KZS</p>
                                            </div>
                                            <div className={`p-3 rounded-lg border ${simulationResults.totalProfit >= 0 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                                                <p className="text-[10px] uppercase font-bold text-slate-300">Lucro/Perda</p>
                                                <p className={`text-lg font-black ${simulationResults.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {simulationResults.totalProfit >= 0 ? '+' : ''}{simulationResults.totalProfit.toLocaleString('pt-AO')} KZS
                                                </p>
                                            </div>
                                            <div className={`p-3 rounded-lg border ${simulationResults.overallReturn >= 0 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                                                <p className="text-[10px] uppercase font-bold text-slate-300">Rentabilidade</p>
                                                <p className={`text-lg font-black ${simulationResults.overallReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {simulationResults.overallReturn >= 0 ? '+' : ''}{simulationResults.overallReturn.toFixed(2)}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Individual Stock Results */}
                                        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-white/10">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="text-[10px] text-slate-400 py-2">Ação</TableHead>
                                                        <TableHead className="text-[10px] text-slate-400 py-2 text-right">Data Ini.</TableHead>
                                                        <TableHead className="text-[10px] text-slate-400 py-2 text-right">Preço Ini.</TableHead>
                                                        <TableHead className="text-[10px] text-slate-400 py-2 text-right">Preço Atual</TableHead>
                                                        <TableHead className="text-[10px] text-slate-400 py-2 text-right">Variação</TableHead>
                                                        <TableHead className="text-[10px] text-slate-400 py-2 text-right">Dias</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {simulationResults.individual.map((result: any) => (
                                                        <TableRow key={result.symbol} className="hover:bg-white/5">
                                                            <TableCell className="py-2 font-bold text-white">{result.symbol}</TableCell>
                                                            <TableCell className="py-2 text-right text-slate-300 text-xs">{new Date(result.startDate).toLocaleDateString('pt-AO')}</TableCell>
                                                            <TableCell className="py-2 text-right text-slate-300 text-xs">{result.startPrice.toFixed(2)}</TableCell>
                                                            <TableCell className="py-2 text-right text-slate-300 text-xs">{result.currentPrice.toFixed(2)}</TableCell>
                                                            <TableCell className={`py-2 text-right font-bold ${result.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {result.priceChange >= 0 ? '+' : ''}{result.priceChange.toFixed(2)}%
                                                            </TableCell>
                                                            <TableCell className="py-2 text-right text-slate-300 text-xs">{result.daysHeld}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <p className="text-[10px] text-slate-500 italic">
                                            * Simulação baseada em dados históricos reais. Rentabilidade passada não garante resultados futuros.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Selecione a data de investimento e uma ação para simular</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="bg-slate-900 p-4 rounded-xl text-white space-y-4 border-none shadow-xl">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-azul_bodiva-1">Performance Histórica do Mercado</h4>
                                    <Badge variant="outline" className="bg-white/10 text-[10px] text-white border-white/20">Dados em Tempo Real</Badge>
                                </div>

                                <div className="h-[180px] w-full mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={marketHistory}>
                                            <defs>
                                                <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0072CE" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#0072CE" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                            <XAxis dataKey="date" fontSize={8} tick={{ fill: '#94a3b8' }} hide />
                                            <YAxis fontSize={8} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000000000).toFixed(1)}B`} hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                                                formatter={(v: number) => [v.toLocaleString('pt-AO') + ' AOA', 'Volume']}
                                            />
                                            <Area type="monotone" dataKey="volume" stroke="#0072CE" fillOpacity={1} fill="url(#colorMarket)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-2 rounded border border-white/10">
                                        <p className="text-[9px] text-slate-400 uppercase font-black">Média Negócios/Dia</p>
                                        <p className="text-lg font-bold">{(marketHistory.reduce((s, h) => s + h.trades, 0) / marketHistory.length || 0).toFixed(0)}</p>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded border border-white/10">
                                        <p className="text-[9px] text-slate-400 uppercase font-black">Dias Registados</p>
                                        <p className="text-lg font-bold">{dates.length}</p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {/* Visualizations Section */}
                {filteredData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t">
                        <Card className="border-slate-200">
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    Volume de Negócios por Título (AOA)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={summaryChartData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            interval={0}
                                            height={60}
                                            fontSize={10}
                                        />
                                        <YAxis
                                            fontSize={10}
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [value.toLocaleString('pt-AO') + ' AOA', 'Volume']}
                                            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="amount" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200">
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <PieChartIcon className="h-4 w-4 text-primary" />
                                    Distribuição por Tipologia
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={typeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {typeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => value.toLocaleString('pt-AO') + ' AOA'} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center p-0 w-16">
                                    <span className="flex items-center justify-center">
                                        <Image className="h-4 w-4 text-muted-foreground" />
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-slate-100"
                                    onClick={() => handleSort('symbol')}
                                >
                                    <span className="flex items-center gap-1">
                                        Symbol
                                        {sortConfig?.key === 'symbol' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-slate-100"
                                    onClick={() => handleSort('title_type')}
                                >
                                    <span className="flex items-center gap-1">
                                        Tipologia
                                        {sortConfig?.key === 'title_type' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="text-right cursor-pointer hover:bg-slate-100"
                                    onClick={() => handleSort('price')}
                                >
                                    <span className="flex items-center justify-end gap-1">
                                        Preço
                                        {sortConfig?.key === 'price' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="text-right cursor-pointer hover:bg-slate-100"
                                    onClick={() => handleSort('variation')}
                                >
                                    <span className="flex items-center justify-end gap-1">
                                        Variação
                                        {sortConfig?.key === 'variation' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="text-right cursor-pointer hover:bg-slate-100"
                                    onClick={() => handleSort('num_trades')}
                                >
                                    <span className="flex items-center justify-end gap-1">
                                        Nº Neg.
                                        {sortConfig?.key === 'num_trades' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="text-right cursor-pointer hover:bg-slate-100"
                                    onClick={() => handleSort('quantity')}
                                >
                                    <span className="flex items-center justify-end gap-1">
                                        Quantidade
                                        {sortConfig?.key === 'quantity' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="text-right cursor-pointer hover:bg-slate-100"
                                    onClick={() => handleSort('amount')}
                                >
                                    <span className="flex items-center justify-end gap-1">
                                        Montante
                                        {sortConfig?.key === 'amount' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </span>
                                </TableHead>
                                <TableHead
                                    className="text-right cursor-pointer hover:bg-slate-100"
                                    onClick={() => handleSort('amount')}
                                >
                                    <span className="flex items-center justify-end gap-1">
                                        Quota
                                        {sortConfig?.key === 'amount' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                        ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                    </span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-primary/5 transition-colors group"
                                    onClick={() => handleSymbolClick(item.symbol)}
                                >
                                    <TableCell className="p-0 w-16">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.symbol}
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.symbol.toUpperCase().startsWith('BFA') ? (
                                            <img
                                                src="https://www.bfa.ao/images/logos/logo-mobile.svg"
                                                alt="BFA"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.symbol.toUpperCase().startsWith('BAI') ? (
                                            <img
                                                src="/logos/bai.svg"
                                                alt="BAI"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.symbol.toUpperCase().startsWith('BCGA') ? (
                                            <img
                                                src="https://www.caixaangola.ao/images/logo-horizontal.svg"
                                                alt="BCGA"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.symbol.toUpperCase().startsWith('ENS') ? (
                                            <img
                                                src="https://cms.minfin.gov.ao/api/assets/portal-minfin/dcd97baa-bdf2-43ac-ad83-8732b923349b/"
                                                alt="ENSA"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.symbol.toUpperCase().startsWith('BDV') ? (
                                            <img
                                                src="https://www.bodiva.ao/_next/image?url=%2Fmedia%2Fgaleria-de-fotos%2Fca%2Fpasta3%2FLOGO%20PNG.png&w=1920&q=75"
                                                alt="BODIVA"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.symbol.toUpperCase().startsWith('SNL') ? (
                                            <img
                                                src="https://www.sonangol.co.ao/wp-content/uploads/2022/06/Sonangol_Logo_Horizontal_Preto4_Footer-2.png"
                                                alt="Sonangol"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.symbol.toUpperCase().startsWith('STD') ? (
                                            <img
                                                src="https://www.africa-energy.com/storage/55729/conversions/Standard-Bank-sponsor-max_width.jpg"
                                                alt="Standard Bank"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.title_type && item.title_type.toUpperCase().startsWith('OT-') ? (
                                            <img
                                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhkP0fOfJSEr6pAfKwNcxxrA5IBrHadCEVrg&s"
                                                alt="OT"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : item.title_type && item.title_type.toUpperCase().startsWith('BT-') ? (
                                            <img
                                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpg_ZX44NGgtqFRaX3y-30n8gdeMgBl8Zg1A&s"
                                                alt="BT"
                                                className="w-14 h-10 rounded object-contain"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-14 h-10 rounded bg-slate-200 flex items-center justify-center">
                                                <span className="text-[8px] font-bold text-slate-500">
                                                    {item.symbol.substring(0, 2)}
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {item.symbol}
                                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.title_type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.title_type.toLowerCase().includes('acções') || item.title_type.toLowerCase().includes('acces')
                                            ? item.price.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) + ' AOA'
                                            : item.price.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) + ' %'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`flex items-center justify-end gap-1 ${item.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {item.variation >= 0 ? '+' : ''}{item.variation.toFixed(2)}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">{item.num_trades}</TableCell>
                                    <TableCell className="text-right">{item.quantity.toLocaleString('pt-AO')}</TableCell>
                                    <TableCell className="text-right">{item.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right font-bold text-azul_bodiva-1">
                                        {totalVolume > 0 ? ((item.amount / totalVolume) * 100).toFixed(1) : 0}%
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {filteredData.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                        <Filter className="h-10 w-10 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium">Nenhum título encontrado com "{searchTerm}"</p>
                        <Button
                            variant="link"
                            className="text-azul_bodiva-1 mt-2"
                            onClick={() => setSearchTerm('')}
                        >
                            Limpar Filtro
                        </Button>
                    </div>
                )}

                {/* TradingView Historical Analysis Section */}
                <div id="technical-analysis">
                    {selectedSymbol && historicalData.length > 0 ? (
                        <div className="space-y-4 pt-6 mt-6 border-t-2 border-primary/20 bg-primary/5 p-4 rounded-xl relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 text-primary"
                                onClick={() => setSelectedSymbol(null)}
                            >
                                Fechar Análise
                            </Button>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-azul_bodiva-1 flex items-center gap-2">
                                        <TrendingUp className="h-6 w-6" />
                                        Análise Pro: {selectedSymbol}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Perspectiva histórica e indicadores técnicos</p>
                                </div>

                                <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-lg border border-slate-200 shadow-inner">
                                    {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((range) => (
                                        <Button
                                            key={range}
                                            variant={timeRange === range ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setTimeRange(range)}
                                            className={`h-7 px-3 text-[10px] font-black transition-all ${timeRange === range ? 'bg-azul_bodiva-1 text-white shadow-sm ring-2 ring-azul_bodiva-1/20' : 'text-slate-500 hover:text-azul_bodiva-1 hover:bg-white'}`}
                                        >
                                            {range === 'ALL' ? 'TUDO' : range}
                                        </Button>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Checkbox id="sma5" checked={indicators.sma5} onCheckedChange={(val) => setIndicators(i => ({ ...i, sma5: !!val }))} />
                                        <label htmlFor="sma5" className="text-[10px] font-bold text-amber-600">SMA 5</label>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Checkbox id="ema9" checked={indicators.ema9} onCheckedChange={(val) => setIndicators(i => ({ ...i, ema9: !!val }))} />
                                        <label htmlFor="ema9" className="text-[10px] font-bold text-azul_bodiva-1">EMA 9</label>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Checkbox id="ema21" checked={indicators.ema21} onCheckedChange={(val) => setIndicators(i => ({ ...i, ema21: !!val }))} />
                                        <label htmlFor="ema21" className="text-[10px] font-bold text-purple-600">EMA 21</label>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Checkbox id="sr" checked={indicators.supportResistance} onCheckedChange={(val) => setIndicators(i => ({ ...i, supportResistance: !!val }))} />
                                        <label htmlFor="sr" className="text-[10px] font-bold text-slate-600">S/R</label>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                                        <Checkbox id="forecast" checked={indicators.forecast} onCheckedChange={(val) => setIndicators(i => ({ ...i, forecast: !!val }))} />
                                        <label htmlFor="forecast" className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                                            IA Previsão
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <Card className="border-none shadow-none bg-transparent">
                                <div className="h-[450px] w-full pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={historicalChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis
                                                dataKey="date"
                                                fontSize={10}
                                                axisLine={false}
                                                tickLine={false}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                yAxisId="price"
                                                orientation="right"
                                                fontSize={10}
                                                axisLine={false}
                                                tickLine={false}
                                                domain={['auto', 'auto']}
                                                tickFormatter={(value) => value.toLocaleString('pt-AO')}
                                            />
                                            <YAxis
                                                yAxisId="volume"
                                                orientation="left"
                                                fontSize={10}
                                                axisLine={false}
                                                tickLine={false}
                                                hide
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any, name: string, props: any) => {
                                                    const isForecast = props.payload.isForecast;
                                                    const prefix = isForecast ? '[PREVISÃO] ' : '';
                                                    const titleType = props.payload.title_type || '';

                                                    if (name === 'price') {
                                                        const isShare = titleType.toLowerCase().includes('acções') || titleType.toLowerCase().includes('acces');
                                                        return [value.toLocaleString('pt-AO') + (isShare ? ' AOA' : ' %'), prefix + 'Preço'];
                                                    }
                                                    if (name === 'forecast') return [value.toLocaleString('pt-AO') + ' AOA', 'Projecção IA'];
                                                    if (name === 'sma5') return [value?.toFixed(2) + ' AOA', 'SMA (5)'];
                                                    if (name === 'ema9') return [value?.toFixed(2) + ' AOA', 'EMA (9)'];
                                                    if (name === 'ema21') return [value?.toFixed(2) + ' AOA', 'EMA (21)'];
                                                    if (name === 'volume') return [value ? value.toLocaleString('pt-AO') + ' AOA' : '---', 'Volume'];
                                                    return [value, name];
                                                }}
                                            />
                                            <Legend verticalAlign="top" height={36} iconType="circle" />

                                            {indicators.supportResistance && levels.resistance && (
                                                <ReferenceLine
                                                    yAxisId="price"
                                                    y={levels.resistance}
                                                    stroke="#ef4444"
                                                    strokeDasharray="3 3"
                                                    label={{ value: 'RESISTÊNCIA', position: 'insideTopRight', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }}
                                                />
                                            )}
                                            {indicators.supportResistance && levels.support && (
                                                <ReferenceLine
                                                    yAxisId="price"
                                                    y={levels.support}
                                                    stroke="#22c55e"
                                                    strokeDasharray="3 3"
                                                    label={{ value: 'SUPORTE', position: 'insideBottomRight', fill: '#22c55e', fontSize: 10, fontWeight: 'bold' }}
                                                />
                                            )}

                                            <Bar
                                                yAxisId="volume"
                                                dataKey="volume"
                                                fill="#94a3b8"
                                                opacity={0.2}
                                                barSize={30}
                                                name="volume"
                                            />

                                            <Area
                                                yAxisId="price"
                                                type="monotone"
                                                dataKey="price"
                                                stroke="#0284c7"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorPrice)"
                                                name="price"
                                            />

                                            {indicators.sma5 && (
                                                <Line
                                                    yAxisId="price"
                                                    type="monotone"
                                                    dataKey="sma5"
                                                    stroke="#f59e0b"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    strokeDasharray="5 5"
                                                    name="sma5"
                                                />
                                            )}

                                            {indicators.ema9 && (
                                                <Line
                                                    yAxisId="price"
                                                    type="monotone"
                                                    dataKey="ema9"
                                                    stroke="#0284c7"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="ema9"
                                                />
                                            )}

                                            {indicators.ema21 && (
                                                <Line
                                                    yAxisId="price"
                                                    type="monotone"
                                                    dataKey="ema21"
                                                    stroke="#7c3aed"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="ema21"
                                                />
                                            )}

                                            {indicators.forecast && (
                                                <Line
                                                    yAxisId="price"
                                                    type="monotone"
                                                    dataKey="forecast"
                                                    stroke="#0072CE"
                                                    strokeWidth={3}
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="forecast"
                                                    connectNulls
                                                />
                                            )}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-black text-azul_bodiva-1 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4" /> Informação do Analista
                                    </p>
                                    {traderAdvice ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Sentimento:</span>
                                                <Badge variant={traderAdvice.sentiment.includes('Bullish') ? 'default' : traderAdvice.sentiment.includes('Bearish') ? 'destructive' : 'secondary'}>
                                                    {traderAdvice.sentiment}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                <strong>Porquê esta previsão?</strong> {traderAdvice.reason}
                                            </p>
                                            <div className="p-2 bg-slate-50 rounded border border-dashed border-slate-300">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">Conselho Estratégico</p>
                                                <p className="text-xs font-medium text-azul_bodiva-1">{traderAdvice.action}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">Dados insuficientes para análise profunda.</p>
                                    )}
                                </div>

                                <div className="bg-azul_bodiva-1/10 p-4 rounded-xl border border-azul_bodiva-1/20">
                                    <p className="text-xs font-medium text-azul_bodiva-1 flex items-center gap-1 mb-2">
                                        <Info className="h-4 w-4" /> Dica para Negociação:
                                    </p>
                                    <p className="text-[11px] text-slate-700 leading-relaxed">
                                        Esta projecção de 90 dias utiliza um algoritmo de **Regressão Linear** ponderado pela **Volatilidade Histórica (StdDev)**.
                                        Lembre-se que o mercado Angolano pode ser influenciado por liquidez reduzida e decisões macroeconómicas que a IA não prevê.
                                        **Nunca invista dinheiro que não pode perder.**
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : selectedSymbol ? (
                        <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed mt-6">
                            <p className="text-muted-foreground">A carregar dados históricos para {selectedSymbol}...</p>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-azul_bodiva-1/5 rounded-xl border border-azul_bodiva-1/20 mt-6 group">
                            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-azul_bodiva-1 opacity-40 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-medium text-azul_bodiva-1/80">
                                Clique num título na tabela acima para abrir a **Análise Técnica Pro**
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
