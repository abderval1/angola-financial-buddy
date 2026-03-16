import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, HistogramData } from 'lightweight-charts';

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
        sma5: boolean;
        ema9: boolean;
        ema21: boolean;
        supportResistance: boolean;
        forecast: boolean;
    };
}

export function CandlestickChart({ data, symbol, indicators = {} }: CandlestickChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const [chartReady, setChartReady] = useState(false);

    // Calculate SMA
    const calculateSMA = (period: number, closePrices: number[]): (number | null)[] => {
        const sma: (number | null)[] = [];
        for (let i = 0; i < closePrices.length; i++) {
            if (i < period - 1) {
                sma.push(null);
            } else {
                const sum = closePrices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                sma.push(sum / period);
            }
        }
        return sma;
    };

    // Calculate EMA
    const calculateEMA = (period: number, closePrices: number[]): (number | null)[] => {
        const ema: (number | null)[] = [];
        const multiplier = 2 / (period + 1);

        // First EMA is SMA
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += closePrices[i];
        }
        const firstSMA = sum / period;

        for (let i = 0; i < closePrices.length; i++) {
            if (i < period - 1) {
                ema.push(null);
            } else if (i === period - 1) {
                ema.push(firstSMA);
            } else {
                const prevEMA = ema[i - 1] as number;
                ema.push((closePrices[i] - prevEMA) * multiplier + prevEMA);
            }
        }
        return ema;
    };

    // Calculate support and resistance levels
    const calculateSRLevels = (highs: number[], lows: number[]): { support: number; resistance: number } => {
        const avgHigh = highs.reduce((a, b) => a + b, 0) / highs.length;
        const avgLow = lows.reduce((a, b) => a + b, 0) / lows.length;
        return {
            support: avgLow,
            resistance: avgHigh
        };
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Create chart with TradingView-like appearance
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: '#ffffff' },
                textColor: '#333333',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            grid: {
                vertLines: { color: '#f0f3fa' },
                horzLines: { color: '#f0f3fa' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: '#9ca3af',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#9ca3af',
                },
                horzLine: {
                    color: '#9ca3af',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#9ca3af',
                },
            },
            rightPriceScale: {
                borderColor: '#e5e7eb',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            timeScale: {
                borderColor: '#e5e7eb',
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        });

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // Add volume series
        const volumeSeries = chart.addHistogramSeries({
            color: '#94a3b8',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: 'volume',
        });

        // Configure volume scale
        chart.priceScale('volume').applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;

        setChartReady(true);

        // Handle resize
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
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (!chartReady || !candlestickSeriesRef.current || !volumeSeriesRef.current || !data.length) return;

        // Format data for candlestick
        const candleData: CandlestickData<Time>[] = data.map(d => ({
            time: d.time as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        // Format volume data
        const volumeData: HistogramData<Time>[] = data.map(d => ({
            time: d.time as Time,
            value: d.volume || 0,
            color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        }));

        candlestickSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);

        // Calculate and add indicators
        const closePrices = data.map(d => d.close);
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);

        // SMA 5
        if (indicators.sma5) {
            const sma5Data = calculateSMA(5, closePrices);
            const sma5Series = chartRef.current?.addLineSeries({
                color: '#f59e0b',
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: false,
            });

            if (sma5Series) {
                sma5Series.setData(
                    sma5Data.map((value, index) => ({
                        time: data[index].time as Time,
                        value: value || 0,
                    })).filter(d => d.value > 0)
                );
            }
        }

        // EMA 9
        if (indicators.ema9) {
            const ema9Data = calculateEMA(9, closePrices);
            const ema9Series = chartRef.current?.addLineSeries({
                color: '#0284c7',
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: false,
            });

            if (ema9Series) {
                ema9Series.setData(
                    ema9Data.map((value, index) => ({
                        time: data[index].time as Time,
                        value: value || 0,
                    })).filter(d => d.value > 0)
                );
            }
        }

        // EMA 21
        if (indicators.ema21) {
            const ema21Data = calculateEMA(21, closePrices);
            const ema21Series = chartRef.current?.addLineSeries({
                color: '#a855f7',
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: false,
            });

            if (ema21Series) {
                ema21Series.setData(
                    ema21Data.map((value, index) => ({
                        time: data[index].time as Time,
                        value: value || 0,
                    })).filter(d => d.value > 0)
                );
            }
        }

        // Support and Resistance
        if (indicators.supportResistance) {
            const { support, resistance } = calculateSRLevels(highs, lows);

            // Support line
            const supportLine = chartRef.current?.addLineSeries({
                color: '#22c55e',
                lineWidth: 1,
                lineStyle: 2,
                priceLineVisible: false,
                lastValueVisible: false,
            });

            if (supportLine) {
                supportLine.setData([
                    { time: data[0].time as Time, value: support },
                    { time: data[data.length - 1].time as Time, value: support },
                ]);
            }

            // Resistance line
            const resistanceLine = chartRef.current?.addLineSeries({
                color: '#ef4444',
                lineWidth: 1,
                lineStyle: 2,
                priceLineVisible: false,
                lastValueVisible: false,
            });

            if (resistanceLine) {
                resistanceLine.setData([
                    { time: data[0].time as Time, value: resistance },
                    { time: data[data.length - 1].time as Time, value: resistance },
                ]);
            }
        }

        // Fit content
        chartRef.current?.timeScale().fitContent();

    }, [data, indicators, chartReady]);

    return (
        <div className="relative w-full h-full">
            <div ref={chartContainerRef} className="w-full h-full min-h-[450px]" />

            {/* Legend */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded shadow-sm">
                    <span className="w-3 h-3 bg-green-500 rounded-sm" />
                    <span className="font-medium">Alta</span>
                </div>
                <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded shadow-sm">
                    <span className="w-3 h-3 bg-red-500 rounded-sm" />
                    <span className="font-medium">Baixa</span>
                </div>
                {indicators.sma5 && (
                    <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded shadow-sm">
                        <span className="w-3 h-0.5 bg-amber-500" />
                        <span className="font-medium text-amber-600">SMA 5</span>
                    </div>
                )}
                {indicators.ema9 && (
                    <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded shadow-sm">
                        <span className="w-3 h-0.5 bg-sky-600" />
                        <span className="font-medium text-sky-600">EMA 9</span>
                    </div>
                )}
                {indicators.ema21 && (
                    <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded shadow-sm">
                        <span className="w-3 h-0.5 bg-purple-500" />
                        <span className="font-medium text-purple-600">EMA 21</span>
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="absolute top-2 right-2 flex gap-1">
                <button
                    className="p-1.5 bg-white/90 rounded hover:bg-white shadow-sm text-xs font-medium"
                    onClick={() => chartRef.current?.timeScale().fitContent()}
                    title="Ajustar"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
                <button
                    className="p-1.5 bg-white/90 rounded hover:bg-white shadow-sm text-xs font-medium"
                    onClick={() => chartRef.current?.timeScale().zoomIn()}
                    title="Zoom +"
                >
                    +
                </button>
                <button
                    className="p-1.5 bg-white/90 rounded hover:bg-white shadow-sm text-xs font-medium"
                    onClick={() => chartRef.current?.timeScale().zoomOut()}
                    title="Zoom -"
                >
                    -
                </button>
            </div>
        </div>
    );
}
