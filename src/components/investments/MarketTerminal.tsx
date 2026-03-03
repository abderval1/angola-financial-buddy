import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Search,
    TrendingUp,
    TrendingDown,
    Activity,
    Globe,
    Building2,
    Coins,
    LineChart,
    RefreshCw,
    Bitcoin,
    DollarSign,
    ExternalLink,
    Wallet,
} from "lucide-react";
import {
    useRealMarketData,
    MarketQuote,
    HistoricalData,
    MarketNews,
    GLOBAL_STOCKS,
    CRYPTO_SYMBOLS,
    FOREX_SYMBOLS
} from "@/hooks/useRealMarketData";
import {
    TradingViewWidget,
    TradingViewMarketOverview,
    TradingViewFinancials,
    TradingViewTechnicalAnalysis,
    TradingViewCompanyProfile,
    TradingViewCryptoHeatmap
} from "./TradingViewWidget";

const EXCHANGES = [
    { id: "ALL", name: "Todas as Bolsas", flag: "🌍" },
    { id: "NASDAQ", name: "NASDAQ", flag: "🇺🇸" },
    { id: "NYSE", name: "NYSE", flag: "🇺🇸" },
    { id: "BVSP", name: "B3", flag: "🇧🇷" },
    { id: "LSE", name: "LSE", flag: "🇬🇧" },
    { id: "EURONEXT", name: "Euronext", flag: "🇪🇺" },
    { id: "BINANCE", name: "Binance", flag: "₿" },
    { id: "FOREX", name: "Forex", flag: "💱" },
];

interface MarketTerminalProps {
    savingsBalance?: number;
}

export function MarketTerminal({ savingsBalance = 0 }: MarketTerminalProps) {
    const [selectedSymbol, setSelectedSymbol] = useState("NASDAQ:AAPL");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("chart");

    const {
        quotes,
        cryptoQuotes,
        forexQuotes,
        loading,
        lastUpdate,
        fetchStockQuotes,
        fetchHistoricalData: fetchGlobalHistorical,
        fetchNews: fetchGlobalNews,
        refreshAll,
    } = useRealMarketData();

    const [news, setNews] = useState<MarketNews[]>([]);

    // All available symbols for search
    const allSymbols = useMemo(() => {
        const symbols: { symbol: string; name: string; type: string }[] = [];

        // Add stocks
        GLOBAL_STOCKS.forEach(s => {
            let tvSymbol = s.symbol;
            if (s.market === 'BVSP') tvSymbol = `BMFBOVESPA:${s.symbol.replace('.SA', '')}`;
            else if (s.market === 'LSE') tvSymbol = `LSE:${s.symbol}`;
            else if (s.market === 'HKEX') tvSymbol = `HKEX:${s.symbol}`;
            else if (s.market === 'TSE') tvSymbol = `TSE:${s.symbol}`;
            else if (s.market === 'ASX') tvSymbol = `ASX:${s.symbol}`;
            else if (s.market === 'TSX') tvSymbol = `TSX:${s.symbol}`;
            else tvSymbol = `${s.market || 'NASDAQ'}:${s.symbol}`;

            symbols.push({ symbol: tvSymbol, name: s.name, type: 'stock' });
        });

        // Add crypto
        CRYPTO_SYMBOLS.forEach(c => {
            symbols.push({ symbol: `BINANCE:${c.symbol}`, name: c.name, type: 'crypto' });
        });

        // Add forex
        FOREX_SYMBOLS.forEach(f => {
            symbols.push({ symbol: `FX_IDC:${f.symbol.replace('/', '')}`, name: f.name, type: 'forex' });
        });

        return symbols;
    }, []);

    const filteredSymbols = useMemo(() => {
        if (!searchQuery) return allSymbols.slice(0, 20);
        const query = searchQuery.toLowerCase();
        return allSymbols
            .filter(s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query))
            .slice(0, 20);
    }, [allSymbols, searchQuery]);

    // Get current quote info
    const currentQuote = useMemo(() => {
        const tvSymbol = selectedSymbol.replace('BMFBOVESPA:', '').replace('BINANCE:', '').replace('FX_IDC:', '').replace('LSE:', '').replace('HKEX:', '').replace('TSE:', '').replace('ASX:', '').replace('TSX:', '');

        // Check stocks
        const stock = GLOBAL_STOCKS.find(s => {
            const symbol = selectedSymbol.includes(':') ? selectedSymbol.split(':')[1] : selectedSymbol;
            return s.symbol === symbol || s.symbol.replace('.SA', '') === symbol;
        });
        if (stock) {
            const quote = quotes.get(stock.symbol);
            return quote ? {
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
                volume: quote.volume,
                currency: quote.currency,
            } : null;
        }

        // Check crypto
        const cryptoSymbol = selectedSymbol.replace('BINANCE:', '');
        const crypto = CRYPTO_SYMBOLS.find(c => c.symbol === cryptoSymbol);
        if (crypto) {
            const quote = cryptoQuotes.get(cryptoSymbol);
            return quote ? {
                price: quote.price,
                change: quote.change24h,
                changePercent: quote.changePercent24h,
                volume: quote.volume24h,
                currency: 'USDT',
            } : null;
        }

        return null;
    }, [selectedSymbol, quotes, cryptoQuotes]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshAll();
        setIsRefreshing(false);
    };

    const handleSymbolSelect = async (symbol: string) => {
        setSelectedSymbol(symbol);
        setActiveTab("chart");

        // Fetch news for the symbol
        const cleanSymbol = symbol.replace('BMFBOVESPA:', '').replace('BINANCE:', '').replace('FX_IDC:', '').replace('LSE:', '').replace('HKEX:', '').replace('TSE:', '').replace('ASX:', '').replace('TSX:', '');
        const newsData = await fetchGlobalNews(cleanSymbol);
        setNews(newsData);
    };

    const formatPrice = (price: number, currency: string) => {
        const symbols: Record<string, string> = {
            USD: "$", EUR: "€", GBP: "£", BRL: "R$", AOA: "Kz", ZAR: "R", USDT: "₿",
        };
        return `${symbols[currency] || "$"}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatVolume = (volume: number) => {
        if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(2)}B`;
        if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
        if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
        return volume.toString();
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return "text-green-500";
        if (change < 0) return "text-red-500";
        return "text-gray-500";
    };

    // Map ranges to TradingView format
    const getRangeParam = (range: string) => {
        const map: Record<string, string> = {
            '1D': '1d', '1W': '1w', '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y', '5Y': '5y', 'ALL': 'all'
        };
        return map[range] || '1y';
    };

    return (
        <div className="space-y-4">
            {/* Symbol Search & Header */}
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 w-full md:w-auto relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                                <Input
                                    placeholder="Buscar símbolo (ex: AAPL, BTCUSDT, EURUSD)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary"
                                />
                                {searchQuery && filteredSymbols.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto">
                                        {filteredSymbols.map((s) => (
                                            <div
                                                key={s.symbol}
                                                onClick={() => {
                                                    handleSymbolSelect(s.symbol);
                                                    setSearchQuery("");
                                                }}
                                                className="p-2 hover:bg-slate-700 cursor-pointer flex items-center justify-between border-b border-slate-700 last:border-0"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white">{s.symbol.split(':')[1] || s.symbol}</span>
                                                    <span className="text-slate-400 text-xs">{s.name}</span>
                                                </div>
                                                <Badge variant="outline" className="text-xs border-slate-600">
                                                    {s.type === 'crypto' ? '₿' : s.type === 'forex' ? '💱' : '📈'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                {currentQuote && (
                                    <>
                                        <p className="text-2xl font-bold">{formatPrice(currentQuote.price, currentQuote.currency)}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={getChangeColor(currentQuote.change)}>
                                                {currentQuote.change >= 0 ? "+" : ""}{currentQuote.change.toFixed(2)}
                                            </span>
                                            <Badge variant={currentQuote.change >= 0 ? "default" : "destructive"} className={currentQuote.change >= 0 ? "bg-green-500" : ""}>
                                                {currentQuote.changePercent >= 0 ? "+" : ""}{currentQuote.changePercent.toFixed(2)}%
                                            </Badge>
                                        </div>
                                    </>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="text-white hover:bg-white/10"
                            >
                                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Access Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("NASDAQ:AAPL")}>
                    Apple
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("NASDAQ:MSFT")}>
                    Microsoft
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("NASDAQ:GOOGL")}>
                    Google
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("NASDAQ:TSLA")}>
                    Tesla
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("NASDAQ:NVDA")}>
                    Nvidia
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("BMFBOVESPA:PETR4")}>
                    Petrobras
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("BMFBOVESPA:VALE3")}>
                    Vale
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("BINANCE:BTCUSDT")}>
                    Bitcoin
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("BINANCE:ETHUSDT")}>
                    Ethereum
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSymbolSelect("FX_IDC:EURUSD")}>
                    EUR/USD
                </Button>
            </div>

            {/* Main Chart Area */}
            <Card>
                <CardContent className="p-0">
                    <TradingViewWidget
                        symbol={selectedSymbol}
                        theme="dark"
                        height={600}
                    />
                </CardContent>
            </Card>

            {/* Tabs for additional info */}
            <Card>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent">
                        <TabsTrigger value="chart" className="data-[state=active]:bg-background">
                            <LineChart className="h-4 w-4 mr-2" />
                            Gráfico
                        </TabsTrigger>
                        <TabsTrigger value="technicals" className="data-[state=active]:bg-background">
                            <Activity className="h-4 w-4 mr-2" />
                            Análise Técnica
                        </TabsTrigger>
                        <TabsTrigger value="financials" className="data-[state=active]:bg-background">
                            <Coins className="h-4 w-4 mr-2" />
                            Financeiro
                        </TabsTrigger>
                        <TabsTrigger value="company" className="data-[state=active]:bg-background">
                            <Building2 className="h-4 w-4 mr-2" />
                            Empresa
                        </TabsTrigger>
                        <TabsTrigger value="news" className="data-[state=active]:bg-background">
                            <Globe className="h-4 w-4 mr-2" />
                            Notícias
                        </TabsTrigger>
                    </TabsList>

                    <CardContent className="p-4">
                        <TabsContent value="chart" className="mt-0">
                            {currentQuote && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-muted-foreground">Preço</p>
                                        <p className="font-semibold">{formatPrice(currentQuote.price, currentQuote.currency)}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-muted-foreground">Variação</p>
                                        <p className={`font-semibold ${getChangeColor(currentQuote.change)}`}>
                                            {currentQuote.change >= 0 ? "+" : ""}{currentQuote.change.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-muted-foreground">Volume</p>
                                        <p className="font-semibold">{formatVolume(currentQuote.volume)}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-muted-foreground">Atualizado</p>
                                        <p className="font-semibold text-xs">{lastUpdate?.toLocaleTimeString() || '--'}</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="technicals" className="mt-0">
                            <TradingViewTechnicalAnalysis symbol={selectedSymbol} />
                        </TabsContent>

                        <TabsContent value="financials" className="mt-0">
                            <TradingViewFinancials symbol={selectedSymbol} />
                        </TabsContent>

                        <TabsContent value="company" className="mt-0">
                            <TradingViewCompanyProfile symbol={selectedSymbol} />
                        </TabsContent>

                        <TabsContent value="news" className="mt-0">
                            <div className="space-y-3">
                                {news.length > 0 ? (
                                    news.map((item) => (
                                        <div key={item.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                                            <Globe className="h-5 w-5 text-blue-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    <p className="text-sm font-medium">{item.title}</p>
                                                </a>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-muted-foreground">{item.source}</span>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(item.publishedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Globe className="h-10 w-10 mx-auto mb-2" />
                                        <p>Selecione um símbolo para ver notícias</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}
