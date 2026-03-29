import { useEffect, useRef, useState, useCallback } from 'react';

interface CandlestickChartProps {
    data: {
        time: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume?: number;
    }[];
    symbol: string;
    indicators?: {
        sma5?: boolean;
        ema9?: boolean;
        ema21?: boolean;
        supportResistance?: boolean;
        forecast?: boolean;
    };
    forecastData?: {
        time: string;
        forecast: number;
    }[];
    chartType?: 'candlestick' | 'line';
}

declare global {
    interface Window {
        LightweightCharts: any;
        createChart: any;
    }
}

export function CandlestickChart({ data, symbol, indicators = {}, forecastData, chartType = 'candlestick' }: CandlestickChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const [chartReady, setChartReady] = useState(false);
    const [libError, setLibError] = useState<string | null>(null);
    const [tooltipInfo, setTooltipInfo] = useState<{
        time: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    } | null>(null);

    // Load lightweight-charts from CDN
    useEffect(() => {
        if (window.LightweightCharts) {
            setChartReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lightweight-charts@4.0.0/dist/lightweight-charts.standalone.production.js';
        script.async = true;
        script.onload = () => {
            setChartReady(true);
        };
        script.onerror = () => {
            setLibError('Failed to load chart library');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup
        };
    }, []);

    // Calculate SMA
    const calculateSMA = useCallback((period: number, data: number[]) => {
        const result: (number | null)[] = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                result.push(sum / period);
            }
        }
        return result;
    }, []);

    // Calculate EMA
    const calculateEMA = useCallback((period: number, data: number[]) => {
        const result: (number | null)[] = [];
        const multiplier = 2 / (period + 1);
        let ema = data[0];

        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else if (i === period - 1) {
                ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
                result.push(ema);
            } else {
                ema = (data[i] - ema) * multiplier + ema;
                result.push(ema);
            }
        }
        return result;
    }, []);

    // Calculate Support/Resistance levels
    const calculateSRLevels = useCallback((highs: number[], lows: number[]) => {
        const sortedHighs = [...highs].sort((a, b) => b - a);
        const sortedLows = [...lows].sort((a, b) => a - b);

        const resistance = sortedHighs.slice(0, Math.ceil(highs.length * 0.2)).reduce((a, b) => a + b, 0) / Math.ceil(highs.length * 0.2);
        const support = sortedLows.slice(0, Math.ceil(lows.length * 0.2)).reduce((a, b) => a + b, 0) / Math.ceil(lows.length * 0.2);

        return { support, resistance };
    }, []);

    // Initialize chart
    useEffect(() => {
        if (!chartReady || !chartContainerRef.current) return;

        try {
            const chart = window.LightweightCharts.createChart(chartContainerRef.current, {
                layout: {
                    background: { color: '#ffffff' },
                    textColor: '#333333',
                },
                grid: {
                    vertLines: { color: '#f0f3fa' },
                    horzLines: { color: '#f0f3fa' },
                },
                crosshair: {
                    mode: 1,
                },
                rightPriceScale: {
                    borderColor: '#e5e7eb',
                },
                timeScale: {
                    borderColor: '#e5e7eb',
                    timeVisible: true,
                },
            });

            const candlestickSeries = chart.addCandlestickSeries({
                upColor: '#22c55e',
                downColor: '#ef4444',
                borderUpColor: '#22c55e',
                borderDownColor: '#ef4444',
                wickUpColor: '#22c55e',
                wickDownColor: '#ef4444',
            });

            const volumeSeries = chart.addHistogramSeries({
                color: '#94a3b8',
                priceFormat: { type: 'volume' },
                priceScaleId: 'volume',
            });

            chart.priceScale('volume').applyOptions({
                scaleMargins: { top: 0.8, bottom: 0 },
            });

            // Subscribe to crosshair move for tooltip
            chart.subscribeCrosshairMove((param: any) => {
                if (param.time && param.seriesData) {
                    const candleData = param.seriesData.get(candlestickSeries);
                    if (candleData) {
                        setTooltipInfo({
                            time: param.time as string,
                            open: candleData.open,
                            high: candleData.high,
                            low: candleData.low,
                            close: candleData.close,
                            volume: candleData.volume || 0,
                        });
                    }
                } else {
                    setTooltipInfo(null);
                }
            });

            chartRef.current = { chart, mainSeries: candlestickSeries, volumeSeries, indicatorSeries: [] };

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight,
                    });
                }
            };

            window.addEventListener('resize', handleResize);
            handleResize();

            return () => {
                window.removeEventListener('resize', handleResize);
                if (chartRef.current) {
                    // Remove main series
                    if (chartRef.current.mainSeries) {
                        try {
                            if (chartRef.current.mainSeries.remove) {
                                chartRef.current.mainSeries.remove();
                            }
                        } catch (e) {
                            // Series might already be removed
                        }
                    }
                    // Remove indicator series first
                    if (chartRef.current.indicatorSeries) {
                        chartRef.current.indicatorSeries.forEach((s: any) => {
                            try {
                                if (s && s.remove) s.remove();
                            } catch (e) {
                                // Series might already be removed
                            }
                        });
                    }
                    // Remove main chart
                    try {
                        if (chartRef.current.chart && chartRef.current.chart.remove) {
                            chartRef.current.chart.remove();
                        }
                    } catch (e) {
                        // Chart might already be disposed
                    }
                    chartRef.current = null;
                }
            };
        } catch (error) {
            console.error('Chart initialization error:', error);
            setLibError('Failed to initialize chart');
        }
    }, [chartReady]);

    // Update chart data and indicators
    useEffect(() => {
        if (!chartRef.current || !data.length) return;

        const { chart } = chartRef.current;

        try {
            // Remove existing main series
            if (chartRef.current.mainSeries) {
                try {
                    chartRef.current.mainSeries.remove();
                } catch (e) {
                    // Series might already be removed
                }
            }

            // Remove old indicator series
            const indicatorSeries = chartRef.current.indicatorSeries || [];
            indicatorSeries.forEach((s: any) => {
                try {
                    if (s && s.remove) {
                        s.remove();
                    }
                } catch (e) {
                    // Series might already be removed
                }
            });
            chartRef.current.indicatorSeries = [];

            // Create series based on chart type
            let mainSeries: any;

            switch (chartType) {
                case 'line':
                    mainSeries = chart.addLineSeries({
                        color: '#0072CE',
                        lineWidth: 2,
                    });
                    mainSeries.setData(data.map(item => ({
                        time: item.time as any,
                        value: item.close,
                    })));
                    break;
                default: // candlestick
                    mainSeries = chart.addCandlestickSeries({
                        upColor: '#22c55e',
                        downColor: '#ef4444',
                        borderUpColor: '#22c55e',
                        borderDownColor: '#ef4444',
                        wickUpColor: '#22c55e',
                        wickDownColor: '#ef4444',
                    });
                    mainSeries.setData(data.map(item => ({
                        time: item.time as any,
                        open: item.open,
                        high: item.high,
                        low: item.low,
                        close: item.close,
                    })));
            }

            chartRef.current.mainSeries = mainSeries;

            // Format volume data
            const volumeData = data.map(d => ({
                time: d.time as any,
                value: d.volume || 0,
                color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
            }));

            if (chartRef.current.volumeSeries) {
                chartRef.current.volumeSeries.setData(volumeData);
            }

            // Add SMA 5
            if (indicators.sma5) {
                const closePrices = data.map(d => d.close);
                const sma5Data = calculateSMA(5, closePrices);
                const sma5Series = chart.addLineSeries({
                    color: '#f59e0b',
                    lineWidth: 2,
                    priceLineVisible: false,
                });
                sma5Series.setData(
                    sma5Data.map((value, index) => ({
                        time: data[index].time as any,
                        value: value || 0,
                    })).filter((d: any) => d.value > 0)
                );
                chartRef.current.indicatorSeries.push(sma5Series);
            }

            // Add EMA 9
            if (indicators.ema9) {
                const closePrices = data.map(d => d.close);
                const ema9Data = calculateEMA(9, closePrices);
                const ema9Series = chart.addLineSeries({
                    color: '#0284c7',
                    lineWidth: 2,
                    priceLineVisible: false,
                });
                ema9Series.setData(
                    ema9Data.map((value, index) => ({
                        time: data[index].time as any,
                        value: value || 0,
                    })).filter((d: any) => d.value > 0)
                );
                chartRef.current.indicatorSeries.push(ema9Series);
            }

            // Add EMA 21
            if (indicators.ema21) {
                const closePrices = data.map(d => d.close);
                const ema21Data = calculateEMA(21, closePrices);
                const ema21Series = chart.addLineSeries({
                    color: '#a855f7',
                    lineWidth: 2,
                    priceLineVisible: false,
                });
                ema21Series.setData(
                    ema21Data.map((value, index) => ({
                        time: data[index].time as any,
                        value: value || 0,
                    })).filter((d: any) => d.value > 0)
                );
                chartRef.current.indicatorSeries.push(ema21Series);
            }

            // Add Support and Resistance
            if (indicators.supportResistance) {
                const highs = data.map(d => d.high);
                const lows = data.map(d => d.low);
                const { support, resistance } = calculateSRLevels(highs, lows);

                const supportLine = chart.addLineSeries({
                    color: '#22c55e',
                    lineWidth: 1,
                    lineStyle: 2,
                    priceLineVisible: false,
                });
                supportLine.setData([
                    { time: data[0].time as any, value: support },
                    { time: data[data.length - 1].time as any, value: support },
                ]);
                chartRef.current.indicatorSeries.push(supportLine);

                const resistanceLine = chart.addLineSeries({
                    color: '#ef4444',
                    lineWidth: 1,
                    lineStyle: 2,
                    priceLineVisible: false,
                });
                resistanceLine.setData([
                    { time: data[0].time as any, value: resistance },
                    { time: data[data.length - 1].time as any, value: resistance },
                ]);
                chartRef.current.indicatorSeries.push(resistanceLine);
            }

            // Add forecast line
            if (indicators.forecast && forecastData && forecastData.length > 0) {
                const forecastSeries = chart.addLineSeries({
                    color: '#8b5cf6',
                    lineWidth: 2,
                    lineStyle: 3,
                    priceLineVisible: false,
                });

                // Connect last candle to forecast
                const lastCandle = data[data.length - 1];
                const combinedData = [
                    { time: lastCandle.time as any, value: lastCandle.close },
                    ...forecastData.map(d => ({
                        time: d.time as any,
                        value: d.forecast,
                    }))
                ];

                forecastSeries.setData(combinedData);
                chartRef.current.indicatorSeries.push(forecastSeries);
            }

            chart.timeScale().fitContent();
        } catch (error) {
            console.error('Chart data update error:', error);
        }
    }, [data, indicators, forecastData, calculateSMA, calculateEMA, calculateSRLevels, chartReady, chartType]);

    if (libError) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <p className="text-red-500">{libError}</p>
            </div>
        );
    }

    if (!chartReady) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <p className="text-gray-500">A carregar gráfico...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={chartContainerRef} className="w-full h-full min-h-[450px]" />

            {/* Tooltip com informações OHLCV */}
            {tooltipInfo && (
                <div className="absolute top-12 left-2 bg-white/95 border border-gray-200 rounded-lg shadow-lg p-3 text-xs z-10 min-w-[180px]">
                    <div className="font-semibold text-gray-700 mb-2 border-b pb-1">
                        {new Date(tooltipInfo.time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <span className="text-gray-500">Abertura:</span>
                        <span className="font-medium">{tooltipInfo.open.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Kz</span>
                        <span className="text-gray-500">Máximo:</span>
                        <span className="font-medium text-green-600">{tooltipInfo.high.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Kz</span>
                        <span className="text-gray-500">Mínimo:</span>
                        <span className="font-medium text-red-600">{tooltipInfo.low.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Kz</span>
                        <span className="text-gray-500">Fecho:</span>
                        <span className="font-medium">{tooltipInfo.close.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Kz</span>
                        <span className="text-gray-500">Volume:</span>
                        <span className="font-medium">{tooltipInfo.volume.toLocaleString('pt-BR')}</span>
                    </div>
                </div>
            )}

            {/* Symbol overlay */}
            <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-xs font-medium text-gray-600">
                {symbol}
            </div>

            {/* Chart type toggle */}
            <div className="absolute top-2 left-2 flex gap-1">
                <button className="px-2 py-1 text-xs bg-white/80 rounded hover:bg-white transition-colors">
                    {chartType === 'candlestick' ? 'Velas' : 'Linha'}
                </button>
            </div>
        </div>
    );
}
