import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InvestmentPrice {
    symbol: string;
    name: string;
    currentPrice: number;
    previousPrice: number;
    change: number;
    changePercent: number;
    lastUpdate: string;
}

export function useInvestmentPrices(investments: { name: string; type: string }[]) {
    const [prices, setPrices] = useState<Record<string, InvestmentPrice>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            if (!investments || investments.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Extract unique symbols from investments
                const symbols = investments.map(inv => {
                    // Extract symbol from investment name (e.g., "BAY" from "Ações BAY" or just "BAY")
                    const name = inv.name.toUpperCase();
                    // Common BODIVA symbols
                    if (name.includes('BAY')) return 'BAY';
                    if (name.includes('SGC')) return 'SGC';
                    if (name.includes('ENL')) return 'ENL';
                    if (name.includes('AFA')) return 'AFA';
                    if (name.includes('FIP')) return 'FIP';
                    if (name.includes('BIOC')) return 'BIOC';
                    if (name.includes('SOMA')) return 'SOMA';
                    if (name.includes('FINI')) return 'FINI';
                    if (name.includes('BCDA')) return 'BCDA';
                    // For other stock names, try to extract first 3 letters
                    return name.substring(0, 3);
                });

                const uniqueSymbols = [...new Set(symbols)];

                if (uniqueSymbols.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch latest prices from bodiva_market_data
                const { data: marketData, error } = await supabase
                    .from('bodiva_market_data')
                    .select('symbol, name, close, variation, data_date')
                    .in('symbol', uniqueSymbols)
                    .order('data_date', { ascending: false });

                if (error) {
                    console.error('Error fetching market prices:', error);
                    setLoading(false);
                    return;
                }

                // Get the latest price for each symbol
                const priceMap: Record<string, InvestmentPrice> = {};

                if (marketData) {
                    // Group by symbol and get latest
                    const latestBySymbol = new Map<string, typeof marketData[0]>();

                    marketData.forEach(item => {
                        if (!latestBySymbol.has(item.symbol)) {
                            latestBySymbol.set(item.symbol, item);
                        }
                    });

                    latestBySymbol.forEach((item, symbol) => {
                        const currentPrice = item.close || 0;
                        const change = item.variation || 0;
                        const changePercent = currentPrice > 0 ? (change / (currentPrice - change)) * 100 : 0;

                        priceMap[symbol] = {
                            symbol: item.symbol,
                            name: item.name || symbol,
                            currentPrice: currentPrice,
                            previousPrice: currentPrice - change,
                            change: change,
                            changePercent: changePercent,
                            lastUpdate: item.data_date
                        };
                    });
                }

                setPrices(priceMap);
            } catch (error) {
                console.error('Error in fetchPrices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, [investments]);

    return { prices, loading };
}

// Helper to calculate investment value based on market prices
export function calculateMarketValue(
    investment: { name: string; amount: number; type: string },
    prices: Record<string, InvestmentPrice>
): number {
    const name = investment.name.toUpperCase();

    // Try to find matching symbol
    let symbol = '';
    if (name.includes('BAY')) symbol = 'BAY';
    else if (name.includes('SGC')) symbol = 'SGC';
    else if (name.includes('ENL')) symbol = 'ENL';
    else if (name.includes('AFA')) symbol = 'AFA';
    else if (name.includes('FIP')) symbol = 'FIP';
    else if (name.includes('BIOC')) symbol = 'BIOC';
    else if (name.includes('SOMA')) symbol = 'SOMA';
    else if (name.includes('FINI')) symbol = 'FINI';
    else if (name.includes('BCDA')) symbol = 'BCDA';
    else symbol = name.substring(0, 3);

    const price = prices[symbol];

    if (price && price.currentPrice > 0) {
        // For stocks, calculate number of shares and current value
        // We'll use a simple approximation: assume the investment amount represents shares at purchase price
        // In reality, we'd need to store the purchase price per share
        // For now, we'll just return the current market value if we have it

        // Check if we have a stored current_value - if so, apply the market change percentage
        // This is a simplified approach
        return investment.amount; // This will be updated by the parent component
    }

    return investment.amount;
}
