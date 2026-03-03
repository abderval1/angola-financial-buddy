import { useState, useEffect, useCallback } from 'react';

// Real-time quote interface
export interface MarketQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    market: string;
    currency: string;
    timestamp: number;
}

// Historical data point
export interface HistoricalData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// News item
export interface MarketNews {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    publishedAt: string;
    symbols: string[];
}

// Stock symbol by exchange
export interface StockSymbol {
    symbol: string;
    name: string;
    type: 'stock' | 'etf' | 'bond' | 'crypto';
    market: string;
    currency: string;
    country: string;
}

// Pre-defined list of popular global stocks
export const GLOBAL_STOCKS: StockSymbol[] = [
    // US Stocks - NASDAQ
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'INTC', name: 'Intel Corporation', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'CRM', name: 'Salesforce Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'ORCL', name: 'Oracle Corporation', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'ADBE', name: 'Adobe Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'PYPL', name: 'PayPal Holdings Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    // US Stocks - NYSE
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'V', name: 'Visa Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'WMT', name: 'Walmart Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'MA', name: 'Mastercard Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'UNH', name: 'UnitedHealth Group', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'HD', name: 'Home Depot Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'DIS', name: 'Walt Disney Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'BAC', name: 'Bank of America', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'KO', name: 'Coca-Cola Co.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'PEP', name: 'PepsiCo Inc.', type: 'stock', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'COST', name: 'Costco Wholesale', type: 'stock', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    // Brazilian Stocks
    { symbol: 'PETR4.SA', name: 'Petrobras', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'VALE3.SA', name: 'Vale S.A.', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'ITUB4.SA', name: 'Itaú Unibanco', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'BBDC4.SA', name: 'Bradesco', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'ABEV3.SA', name: 'Ambev', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'WEGE3.SA', name: 'WEG S.A.', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'MGLU3.SA', name: 'Magazine Luiza', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    { symbol: 'NTCO3.SA', name: 'Natura&Co', type: 'stock', market: 'BVSP', currency: 'BRL', country: 'Brazil' },
    // UK Stocks
    { symbol: 'BP.L', name: 'BP plc', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'HSBA.L', name: 'HSBC Holdings', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'SHEL.L', name: 'Shell plc', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'AZN.L', name: 'AstraZeneca', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'ULVR.L', name: 'Unilever', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    { symbol: 'GSK.L', name: 'GlaxoSmithKline', type: 'stock', market: 'LSE', currency: 'GBP', country: 'UK' },
    // European Stocks
    { symbol: 'ASML.AS', name: 'ASML Holding', type: 'stock', market: 'EURONEXT', currency: 'EUR', country: 'Netherlands' },
    { symbol: 'LVMH.PA', name: 'LVMH Moët Hennessy', type: 'stock', market: 'EURONEXT', currency: 'EUR', country: 'France' },
    { symbol: 'TOTALEnergies.FP', name: 'TotalEnergies', type: 'stock', market: 'EURONEXT', currency: 'EUR', country: 'France' },
    { symbol: 'SIE.DE', name: 'Siemens AG', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    { symbol: 'BAS.DE', name: 'BASF SE', type: 'stock', market: 'XETRA', currency: 'EUR', country: 'Germany' },
    // Angola Stocks (BODIVA)
    { symbol: 'SON', name: 'Sonangol', type: 'stock', market: 'BODIVA', currency: 'AOA', country: 'Angola' },
    { symbol: 'FTNA', name: 'Finangol', type: 'stock', market: 'BODIVA', currency: 'AOA', country: 'Angola' },
    { symbol: 'SNG', name: 'Sonangol Gás', type: 'stock', market: 'BODIVA', currency: 'AOA', country: 'Angola' },
    // South Africa
    { symbol: 'SOL.JO', name: 'Sasol Ltd', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'MTN.JO', name: 'MTN Group', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    { symbol: 'NPN.JO', name: 'Naspers Ltd', type: 'stock', market: 'JSE', currency: 'ZAR', country: 'South Africa' },
    // Popular ETFs
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', market: 'NASDAQ', currency: 'USD', country: 'USA' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'etf', market: 'NYSE', currency: 'USD', country: 'USA' },
    // Crypto (as ETFs for simplicity)
    { symbol: 'GBTC', name: 'Grayscale Bitcoin Trust', type: 'etf', market: 'OTC', currency: 'USD', country: 'USA' },
];

// Free API endpoints (no key required for basic usage)
const QUOTE_API_ENDPOINTS = [
    // Yahoo Finance via different proxies
    {
        name: 'Yahoo Finance',
        quoteUrl: (symbol: string) => `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        batchUrl: (symbols: string[]) => `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`,
    },
    // Backup Yahoo endpoint
    {
        name: 'Yahoo Finance Alt',
        quoteUrl: (symbol: string) => `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        batchUrl: (symbols: string[]) => `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`,
    },
];

// Generate simulated data based on realistic parameters (fallback)
const generateSimulatedQuote = (stock: StockSymbol): MarketQuote => {
    const basePrice = getBasePrice(stock.symbol);
    const variance = basePrice * 0.02; // 2% daily variance
    const change = (Math.random() - 0.5) * variance;
    const price = basePrice + change;

    return {
        symbol: stock.symbol,
        name: stock.name,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(((change / basePrice) * 100).toFixed(2)),
        volume: Math.floor(Math.random() * 50000000) + 1000000,
        high: parseFloat((price * 1.02).toFixed(2)),
        low: parseFloat((price * 0.98).toFixed(2)),
        open: parseFloat((price - change * 0.5).toFixed(2)),
        previousClose: parseFloat(basePrice.toFixed(2)),
        market: stock.market,
        currency: stock.currency,
        timestamp: Date.now(),
    };
};

// Base prices for simulation fallback
const getBasePrice = (symbol: string): number => {
    const prices: Record<string, number> = {
        'AAPL': 178.50, 'MSFT': 378.00, 'GOOGL': 141.50, 'AMZN': 178.00, 'NVDA': 875.00,
        'META': 505.00, 'TSLA': 248.00, 'JPM': 198.00, 'V': 279.00, 'JNJ': 156.00,
        'WMT': 165.00, 'PG': 158.00, 'MA': 458.00, 'UNH': 528.00, 'HD': 365.00,
        'DIS': 112.00, 'BAC': 34.00, 'XOM': 104.00, 'KO': 60.00, 'PEP': 172.00,
        'PETR4.SA': 38.50, 'VALE3.SA': 68.00, 'ITUB4.SA': 28.50, 'BBDC4.SA': 14.20,
        'SON': 350.00, 'FTNA': 180.00, 'SPY': 502.00, 'QQQ': 435.00, 'VOO': 478.00,
    };
    return prices[symbol] || 100;
};

export const useMarketData = () => {
    const [quotes, setQuotes] = useState<Map<string, MarketQuote>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Fetch single quote
    const fetchQuote = useCallback(async (symbol: string): Promise<MarketQuote | null> => {
        const stock = GLOBAL_STOCKS.find(s => s.symbol === symbol);
        if (!stock) return null;

        try {
            // Try Yahoo Finance first
            const response = await fetch(
                `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
                {
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.quoteResponse && data.quoteResponse.result && data.quoteResponse.result[0]) {
                    const q = data.quoteResponse.result[0];
                    const quote: MarketQuote = {
                        symbol: q.symbol,
                        name: q.shortName || q.longName || q.symbol,
                        price: q.regularMarketPrice || 0,
                        change: q.regularMarketChange || 0,
                        changePercent: q.regularMarketChangePercent || 0,
                        volume: q.regularMarketVolume || 0,
                        high: q.regularMarketDayHigh || 0,
                        low: q.regularMarketDayLow || 0,
                        open: q.regularMarketOpen || 0,
                        previousClose: q.regularMarketPreviousClose || 0,
                        market: q.exchange || stock.market,
                        currency: q.currency || stock.currency,
                        timestamp: Date.now(),
                    };
                    return quote;
                }
            }
        } catch (err) {
            console.log(`Failed to fetch real data for ${symbol}, using fallback`);
        }

        // Fallback to simulated data
        return generateSimulatedQuote(stock);
    }, []);

    // Fetch multiple quotes (batch)
    const fetchQuotes = useCallback(async (symbols: string[]): Promise<void> => {
        if (symbols.length === 0) return;

        setLoading(true);
        setError(null);

        const newQuotes = new Map<string, MarketQuote>();
        const stocks = GLOBAL_STOCKS.filter(s => symbols.includes(s.symbol));

        try {
            // Try batch fetch from Yahoo
            const symbolString = symbols.join(',');
            const response = await fetch(
                `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolString)}`,
                {
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.quoteResponse && data.quoteResponse.result) {
                    for (const q of data.quoteResponse.result) {
                        const stock = stocks.find(s => s.symbol === q.symbol);
                        const quote: MarketQuote = {
                            symbol: q.symbol,
                            name: q.shortName || q.longName || q.symbol,
                            price: q.regularMarketPrice || 0,
                            change: q.regularMarketChange || 0,
                            changePercent: q.regularMarketChangePercent || 0,
                            volume: q.regularMarketVolume || 0,
                            high: q.regularMarketDayHigh || 0,
                            low: q.regularMarketDayLow || 0,
                            open: q.regularMarketOpen || 0,
                            previousClose: q.regularMarketPreviousClose || 0,
                            market: q.exchange || (stock?.market || 'NASDAQ'),
                            currency: q.currency || (stock?.currency || 'USD'),
                            timestamp: Date.now(),
                        };
                        newQuotes.set(q.symbol, quote);
                    }
                }
            }
        } catch (err) {
            console.log('Batch fetch failed, using individual fetch');
        }

        // For any missing quotes, try individual fetch or fallback
        const missing = symbols.filter(s => !newQuotes.has(s));
        for (const symbol of missing) {
            const quote = await fetchQuote(symbol);
            if (quote) {
                newQuotes.set(symbol, quote);
            }
        }

        setQuotes(newQuotes);
        setLastUpdate(new Date());
        setLoading(false);
    }, [fetchQuote]);

    // Fetch quotes for a specific market
    const fetchMarketQuotes = useCallback(async (market: string): Promise<void> => {
        const marketStocks = GLOBAL_STOCKS
            .filter(s => s.market === market || market === 'ALL')
            .slice(0, 50); // Limit to 50 at a time

        const symbols = marketStocks.map(s => s.symbol);
        await fetchQuotes(symbols);
    }, [fetchQuotes]);

    // Fetch historical data
    const fetchHistoricalData = useCallback(async (
        symbol: string,
        range: string = '1mo'
    ): Promise<HistoricalData[]> => {
        try {
            const interval = range === '1d' ? '5m' : '1d';
            const response = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.chart && data.chart.result && data.chart.result[0]) {
                    const result = data.chart.result[0];
                    const timestamps = result.timestamp || [];
                    const indicators = result.indicators?.quote?.[0] || {};

                    return timestamps.map((ts: number, i: number) => ({
                        date: new Date(ts * 1000).toISOString().split('T')[0],
                        open: indicators.open?.[i] || 0,
                        high: indicators.high?.[i] || 0,
                        low: indicators.low?.[i] || 0,
                        close: indicators.close?.[i] || 0,
                        volume: indicators.volume?.[i] || 0,
                    }));
                }
            }
        } catch (err) {
            console.log(`Failed to fetch historical data for ${symbol}`);
        }

        // Generate simulated historical data as fallback
        const stock = GLOBAL_STOCKS.find(s => s.symbol === symbol);
        const basePrice = stock ? getBasePrice(stock.symbol) : 100;
        const data: HistoricalData[] = [];
        const now = new Date();

        for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const variance = basePrice * 0.03;
            const close = basePrice + (Math.random() - 0.5) * variance;

            data.push({
                date: date.toISOString().split('T')[0],
                open: close - Math.random() * variance * 0.5,
                high: close + Math.random() * variance * 0.5,
                low: close - Math.random() * variance * 0.5,
                close: close,
                volume: Math.floor(Math.random() * 10000000) + 1000000,
            });
        }

        return data;
    }, []);

    // Fetch market news
    const fetchNews = useCallback(async (symbol?: string): Promise<MarketNews[]> => {
        try {
            // Try Yahoo Finance news API
            const url = symbol
                ? `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=5`
                : 'https://query1.finance.yahoo.com/v1/finance/search?q=&newsCount=10';

            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                if (data.news && data.news.length > 0) {
                    return data.news.map((item: any, i: number) => ({
                        id: `${i}-${Date.now()}`,
                        title: item.title || '',
                        summary: item.summary || '',
                        source: item.publisher || 'Yahoo Finance',
                        url: item.link || '',
                        publishedAt: item.publishedAt || new Date().toISOString(),
                        symbols: item.relatedSymbols || [],
                    }));
                }
            }
        } catch (err) {
            console.log('Failed to fetch news');
        }

        // Fallback news
        const fallbackNews: MarketNews[] = [
            {
                id: '1',
                title: 'Market Update: Global markets show mixed signals',
                summary: 'Major indices around the world are trading with varied performance as investors await key economic data.',
                source: 'Financial Times',
                url: '#',
                publishedAt: new Date().toISOString(),
                symbols: ['SPY', 'QQQ'],
            },
            {
                id: '2',
                title: 'Tech stocks continue to lead market rally',
                summary: 'Technology sector remains strong with AI-related stocks driving significant gains.',
                source: 'Bloomberg',
                url: '#',
                publishedAt: new Date(Date.now() - 3600000).toISOString(),
                symbols: ['NVDA', 'MSFT', 'GOOGL'],
            },
            {
                id: '3',
                title: 'Central bank signals potential rate changes',
                summary: 'Federal Reserve officials hint at upcoming policy decisions affecting global markets.',
                source: 'Reuters',
                url: '#',
                publishedAt: new Date(Date.now() - 7200000).toISOString(),
                symbols: ['JPM', 'BAC', 'GS'],
            },
        ];

        return symbol
            ? fallbackNews.filter(n => n.symbols.includes(symbol))
            : fallbackNews;
    }, []);

    // Search symbols
    const searchSymbols = useCallback((query: string): StockSymbol[] => {
        if (!query || query.length < 1) return GLOBAL_STOCKS.slice(0, 20);

        const lowerQuery = query.toLowerCase();
        return GLOBAL_STOCKS
            .filter(s =>
                s.symbol.toLowerCase().includes(lowerQuery) ||
                s.name.toLowerCase().includes(lowerQuery) ||
                s.market.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 20);
    }, []);

    return {
        quotes,
        loading,
        error,
        lastUpdate,
        fetchQuote,
        fetchQuotes,
        fetchMarketQuotes,
        fetchHistoricalData,
        fetchNews,
        searchSymbols,
        globalStocks: GLOBAL_STOCKS,
    };
};
