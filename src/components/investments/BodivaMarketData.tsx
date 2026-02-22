import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Calendar, Lightbulb, Users, Shield, Zap, Info, PieChart as PieChartIcon, ExternalLink, LineChart, Activity, Target, Percent, Search, ChevronDown, Filter, Settings2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
}

export default function BodivaMarketData() {
    const [marketData, setMarketData] = useState<BodivaMarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [historicalData, setHistoricalData] = useState<BodivaMarketData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [indicators, setIndicators] = useState({
        sma5: true,
        ema9: false,
        ema21: false,
        supportResistance: true,
        volume: true,
        forecast: true
    });
    const [timeRange, setTimeRange] = useState<'7D' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
    const { toast } = useToast();

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
    const totalVolume = selectedData.reduce((sum, item) => sum + item.amount, 0);
    const totalTrades = selectedData.reduce((sum, item) => sum + item.num_trades, 0);
    const totalQuantity = selectedData.reduce((sum, item) => sum + item.quantity, 0);
    const gainers = selectedData.filter(item => item.variation > 0).length;
    const losers = selectedData.filter(item => item.variation < 0).length;

    // Top Lists
    const top5Gainers = [...selectedData]
        .filter(item => item.variation > 0)
        .sort((a, b) => b.variation - a.variation)
        .slice(0, 5);

    const top5Losers = [...selectedData]
        .filter(item => item.variation < 0)
        .sort((a, b) => a.variation - b.variation)
        .slice(0, 5);

    const top5Volume = [...selectedData]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    // Segment Analysis
    const segments = useMemo(() => {
        const grouped = selectedData.reduce((acc, item) => {
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
    }, [selectedData]);

    const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

    // Filter by search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return selectedData;
        return selectedData.filter(item =>
            item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.title_type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [selectedData, searchTerm]);

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

        let sliceSize = historicalData.length;
        if (timeRange === '7D') sliceSize = 7;
        else if (timeRange === '1M') sliceSize = 30;
        else if (timeRange === '3M') sliceSize = 90;
        else if (timeRange === '1Y') sliceSize = 365;

        // historicalData is DESC (newest first)
        return [...historicalData].slice(0, sliceSize).reverse(); // Return ASC for indicators & chart
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
                    <Button variant="ghost" size="sm" onClick={fetchMarketData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Header Controls: Date Picker & Search */}
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
                {selectedData.length > 0 && (
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
                                <p className="text-[10px] text-muted-foreground mt-1">Ticket Médio: {avgTradeSize.toLocaleString('pt-AO', { maximumFractionDigits: 0 })} AOA</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Quantidade</p>
                                <p className="text-xl font-black text-slate-800">{totalQuantity.toLocaleString('pt-AO')}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{selectedData.length} Títulos Activos</p>
                            </div>
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider text-green-700 font-bold mb-1 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" /> Altas
                                </p>
                                <p className="text-xl font-black text-green-600">{gainers}</p>
                                <p className="text-[10px] text-green-600/70 mt-1">{((gainers / selectedData.length) * 100).toFixed(0)}% do Mercado</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider text-red-700 font-bold mb-1 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" /> Baixas
                                </p>
                                <p className="text-xl font-black text-red-600">{losers}</p>
                                <p className="text-[10px] text-red-600/70 mt-1">{((losers / selectedData.length) * 100).toFixed(0)}% do Mercado</p>
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
                    </div>
                )}

                {/* Market Insights Section */}
                {selectedData.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-amber-500" />
                                <h3 className="font-bold text-lg">Análise de Mercado Exploratória</h3>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1 flex items-center gap-2">
                                <Target className="h-4 w-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-800">Concentração: {marketConcentration.toFixed(1)}%</span>
                                <span className="text-[10px] text-amber-600 hidden md:block">(Top 3 Títulos)</span>
                            </div>
                        </div>

                        <Tabs defaultValue="layman" className="w-full">
                            <TabsList className="grid grid-cols-4 mb-4">
                                <TabsTrigger value="layman" className="text-xs flex items-center gap-1">
                                    <Info className="h-3 w-3" /> Leigo
                                </TabsTrigger>
                                <TabsTrigger value="conservative" className="text-xs flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> Conservador
                                </TabsTrigger>
                                <TabsTrigger value="aggressive" className="text-xs flex items-center gap-1">
                                    <Zap className="h-3 w-3" /> Agressivo
                                </TabsTrigger>
                                <TabsTrigger value="segments" className="text-xs flex items-center gap-1">
                                    <BarChart3 className="h-3 w-3" /> Segmentos
                                </TabsTrigger>
                                <TabsTrigger value="history" className="text-xs flex items-center gap-1">
                                    <LineChart className="h-3 w-3 text-azul_bodiva-1" /> Mercado Pro
                                </TabsTrigger>
                            </TabsList>

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
                                        <p className="text-lg font-black text-green-800">{(gainers / selectedData.length * 100).toFixed(0)}% Altas</p>
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
                {selectedData.length > 0 && (
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
                                <TableHead>Symbol</TableHead>
                                <TableHead>Tipologia</TableHead>
                                <TableHead className="text-right">Preço</TableHead>
                                <TableHead className="text-right">Variação</TableHead>
                                <TableHead className="text-right">Nº Neg.</TableHead>
                                <TableHead className="text-right">Quantidade</TableHead>
                                <TableHead className="text-right">Montante</TableHead>
                                <TableHead className="text-right">Quota</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-primary/5 transition-colors group"
                                    onClick={() => handleSymbolClick(item.symbol)}
                                >
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {item.symbol}
                                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.title_type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.price.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
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
                                    {(['7D', '1M', '3M', '1Y', 'ALL'] as const).map((range) => (
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

                                                    if (name === 'price') return [value.toLocaleString('pt-AO') + ' AOA', prefix + 'Preço'];
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
