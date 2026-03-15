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

interface InvestmentHistoricalPrice {
    symbol: string;
    price: number;
    data_date: string;
}

export function useInvestmentPrices(investments: { name: string; type: string }[]) {
    const [prices, setPrices] = useState<Record<string, InvestmentPrice>>({});
    const [historicalPrices, setHistoricalPrices] = useState<Record<string, InvestmentHistoricalPrice[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            if (!investments || investments.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // PRIMEIRO: Buscar todos os símbolos distintos da tabela bodiva_market_data
                const { data: allSymbolsData } = await supabase
                    .from('bodiva_market_data')
                    .select('symbol')
                    .order('symbol');

                // Extrair símbolos únicos da base de dados
                const dbSymbols = allSymbolsData ? [...new Set(allSymbolsData.map(d => d.symbol))] : [];
                console.log('Símbolos disponíveis na BD:', dbSymbols);

                // Extrair símbolos dos investimentos
                const investmentSymbols = investments.map(inv => inv.name.toUpperCase());

                // Tentar encontrar correspondência direta ou parcial com símbolos da BD
                const matchedSymbols: string[] = [];

                investmentSymbols.forEach(invName => {
                    // Primeiro: ver se há correspondência exata
                    const exactMatch = dbSymbols.find(s => s === invName);
                    if (exactMatch) {
                        matchedSymbols.push(exactMatch);
                        return;
                    }

                    // Segundo: ver se o símbolo da BD está contido no nome do investimento
                    const partialMatch = dbSymbols.find(s => invName.includes(s));
                    if (partialMatch) {
                        matchedSymbols.push(partialMatch);
                        return;
                    }

                    // Terceiro: ver se o nome do investimento está contido no símbolo da BD
                    const reverseMatch = dbSymbols.find(s => s.includes(invName.replace(/\s/g, '')));
                    if (reverseMatch) {
                        matchedSymbols.push(reverseMatch);
                        return;
                    }

                    // Se não encontrar correspondência, adicionar o nome original
                    matchedSymbols.push(invName);
                });

                const uniqueSymbols = [...new Set(matchedSymbols)];
                console.log('Símbolos correspondidos:', uniqueSymbols);

                if (uniqueSymbols.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch latest prices from bodiva_market_data
                const { data: marketData, error } = await supabase
                    .from('bodiva_market_data')
                    .select('symbol, price, variation, data_date')
                    .in('symbol', uniqueSymbols)
                    .order('data_date', { ascending: false });

                if (error) {
                    console.error('Error fetching market prices:', error);
                    setLoading(false);
                    return;
                }

                // Get the latest price for each symbol
                const priceMap: Record<string, InvestmentPrice> = {};
                const historicalMap: Record<string, InvestmentHistoricalPrice[]> = {};
                const dataToUse = marketData;

                if (dataToUse) {
                    // Group all data by symbol for historical lookup
                    const bySymbol = new Map<string, typeof dataToUse>();
                    dataToUse.forEach(item => {
                        if (!bySymbol.has(item.symbol)) {
                            bySymbol.set(item.symbol, []);
                        }
                        bySymbol.get(item.symbol)?.push(item);
                    });

                    bySymbol.forEach((items, symbol) => {
                        // Latest price
                        const latest = items[0];
                        const currentPrice = latest.price || 0;
                        const change = latest.variation || 0;
                        const changePercent = currentPrice > 0 ? (change / (currentPrice - change)) * 100 : 0;

                        priceMap[symbol] = {
                            symbol: latest.symbol,
                            name: latest.symbol,
                            currentPrice: currentPrice,
                            previousPrice: currentPrice - change,
                            change: change,
                            changePercent: changePercent,
                            lastUpdate: latest.data_date
                        };

                        // Historical prices for all dates
                        historicalMap[symbol] = items.map(item => ({
                            symbol: item.symbol,
                            price: item.price,
                            data_date: item.data_date
                        })).sort((a, b) => new Date(a.data_date).getTime() - new Date(b.data_date).getTime());
                    });
                }

                setPrices(priceMap);
                setHistoricalPrices(historicalMap);
            } catch (error) {
                console.error('Error in fetchPrices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, [investments]);

    return { prices, historicalPrices, loading };
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
