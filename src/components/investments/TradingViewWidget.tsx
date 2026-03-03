import { useEffect, useRef, useState } from 'react';

interface TradingViewWidgetProps {
    symbol?: string;
    theme?: 'light' | 'dark';
    height?: number;
    showTabs?: boolean;
}

export function TradingViewWidget({
    symbol = 'NASDAQ:AAPL',
    theme = 'dark',
    height = 400,
    showTabs = true
}: TradingViewWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !mounted) return;

        // Clear container
        containerRef.current.innerHTML = '';

        // Create widget container with proper styling
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';
        Object.assign(widgetContainer.style, {
            height: `${height}px`,
            width: '100%',
            minHeight: `${height}px`,
            maxHeight: `${height}px`,
            overflow: 'hidden',
        });

        // Create widget inner
        const widgetInner = document.createElement('div');
        widgetInner.className = 'tradingview-widget-container__widget';
        Object.assign(widgetInner.style, {
            height: `${height}px`,
            width: '100%',
        });

        // Create script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;

        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: symbol,
            interval: 'D',
            timezone: 'Africa/Luanda',
            theme: theme,
            style: '1',
            locale: 'pt',
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            hide_top_toolbar: false,
            hide_legend: false,
            allow_symbol_change: true,
            save_image: false,
            calendar: true,
            support_host: 'https://www.tradingview.com',
            hide_volume: false,
            show_popup_button: true,
            popup_width: '1000',
            popup_height: '650',
            toolbar_bg: theme === 'dark' ? '#0f172a' : '#ffffff',
            studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies', 'Volume@tv-basicstudies'],
            disabled_features: ['header_symbol_search', 'header_compare'],
        });

        widgetContainer.appendChild(widgetInner);
        widgetContainer.appendChild(script);
        containerRef.current.appendChild(widgetContainer);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, theme, height, mounted]);

    return (
        <div
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden"
            style={{
                height: `${height}px`,
                minHeight: `${height}px`,
                maxHeight: `${height}px`,
            }}
        />
    );
}

export function TradingViewMarketOverview() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !mounted) return;

        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        Object.assign(widgetContainer.style, {
            height: '400px',
            width: '100%',
        });

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: 'dark',
            dateRange: '12M',
            showChart: true,
            locale: 'pt',
            width: '100%',
            height: '400',
            isTransparent: true,
            symbols: [
                { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
                { proName: 'FOREXCOM:NSXUSD', title: 'US 100' },
                { proName: 'FX_IDC:EURUSD', title: 'EUR/USD' },
                { proName: 'BINANCE:BTCUSDT', title: 'Bitcoin' },
                { proName: 'BINANCE:ETHUSDT', title: 'Ethereum' },
                { proName: 'BMFBOVESPA:PETR4', title: 'Petrobras' },
                { proName: 'BMFBOVESPA:VALE3', title: 'Vale' },
            ],
            plotLineColorGrowing: 'rgba(60, 188, 99, 1)',
            plotLineColorFalling: 'rgba(255, 70, 70, 1)',
            gridLineColor: 'rgba(255, 255, 255, 0.06)',
            scaleFontColor: 'rgba(255, 255, 255, 0.5)',
        });

        widgetContainer.appendChild(script);
        containerRef.current.appendChild(widgetContainer);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [mounted]);

    return (
        <div
            ref={containerRef}
            className="w-full"
            style={{ height: '400px' }}
        />
    );
}

export function TradingViewFinancials({ symbol = 'NASDAQ:AAPL' }: { symbol?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !mounted) return;

        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        Object.assign(widgetContainer.style, {
            height: '350px',
            width: '100%',
        });

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: 'dark',
            isTransparent: true,
            displayMode: 'reporting',
            symbol: symbol,
            locale: 'pt',
        });

        widgetContainer.appendChild(script);
        containerRef.current.appendChild(widgetContainer);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, mounted]);

    return (
        <div
            ref={containerRef}
            className="w-full"
            style={{ height: '350px' }}
        />
    );
}

export function TradingViewTechnicalAnalysis({ symbol = 'NASDAQ:AAPL' }: { symbol?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !mounted) return;

        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        Object.assign(widgetContainer.style, {
            height: '300px',
            width: '100%',
        });

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            interval: '1m',
            width: '100%',
            isTransparent: true,
            height: '300',
            symbol: symbol,
            showIntervalTabs: true,
            locale: 'pt',
            colorTheme: 'dark',
        });

        widgetContainer.appendChild(script);
        containerRef.current.appendChild(widgetContainer);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, mounted]);

    return (
        <div
            ref={containerRef}
            className="w-full"
            style={{ height: '300px' }}
        />
    );
}

export function TradingViewCompanyProfile({ symbol = 'NASDAQ:AAPL' }: { symbol?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !mounted) return;

        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        Object.assign(widgetContainer.style, {
            height: '200px',
            width: '100%',
        });

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol: symbol,
            width: '100%',
            height: '200',
            isTransparent: true,
            locale: 'pt',
            colorTheme: 'dark',
        });

        widgetContainer.appendChild(script);
        containerRef.current.appendChild(widgetContainer);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, mounted]);

    return (
        <div
            ref={containerRef}
            className="w-full"
            style={{ height: '200px' }}
        />
    );
}

export function TradingViewCryptoHeatmap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!containerRef.current || !mounted) return;

        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        Object.assign(widgetContainer.style, {
            height: '350px',
            width: '100%',
        });

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-cryptoheatmap.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: 'dark',
            locale: 'pt',
            width: '100%',
            height: '350',
            isTransparent: true,
        });

        widgetContainer.appendChild(script);
        containerRef.current.appendChild(widgetContainer);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [mounted]);

    return (
        <div
            ref={containerRef}
            className="w-full"
            style={{ height: '350px' }}
        />
    );
}
