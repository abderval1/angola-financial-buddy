import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketData {
  source: string;
  data_type: string;
  symbol?: string;
  data: Record<string, unknown>;
  fetched_at: string;
  expires_at: string;
}

// BNA Exchange Rates (simulated - in production would scrape from bna.ao)
async function fetchBNAExchangeRates(): Promise<MarketData> {
  // In production, this would fetch from BNA's website
  // For now, we'll return realistic sample data
  const rates = {
    USD: { buy: 825.50, sell: 832.00, date: new Date().toISOString() },
    EUR: { buy: 895.20, sell: 902.50, date: new Date().toISOString() },
    GBP: { buy: 1045.30, sell: 1052.80, date: new Date().toISOString() },
    ZAR: { buy: 45.20, sell: 46.50, date: new Date().toISOString() },
    CNY: { buy: 113.40, sell: 115.20, date: new Date().toISOString() },
  };

  return {
    source: "bna",
    data_type: "exchange_rate",
    data: rates,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
  };
}

// BODIVA Stock Data (simulated - in production would fetch from BODIVA API)
async function fetchBODIVAData(): Promise<MarketData[]> {
  // Sample stock data from BODIVA
  const stocks = [
    { symbol: "BAI", name: "BAI - Banco Angolano de Investimentos", price: 125.50, change: 2.3, volume: 15000 },
    { symbol: "BFA", name: "BFA - Banco de Fomento Angola", price: 98.20, change: -1.2, volume: 8500 },
    { symbol: "UNITEL", name: "Unitel S.A.", price: 450.00, change: 0.8, volume: 25000 },
    { symbol: "SONANGOL", name: "Sonangol E.P.", price: 320.75, change: 3.1, volume: 12000 },
    { symbol: "ENSA", name: "ENSA Seguros", price: 85.30, change: -0.5, volume: 5000 },
  ];

  const treasuryBonds = [
    { symbol: "OT2025", name: "Obrigações do Tesouro 2025", yield: 18.5, maturity: "2025-12-31" },
    { symbol: "OT2027", name: "Obrigações do Tesouro 2027", yield: 19.2, maturity: "2027-06-30" },
    { symbol: "OT2030", name: "Obrigações do Tesouro 2030", yield: 20.1, maturity: "2030-12-31" },
    { symbol: "BT3M", name: "Bilhetes do Tesouro 3 Meses", yield: 15.8, maturity: "3 months" },
    { symbol: "BT6M", name: "Bilhetes do Tesouro 6 Meses", yield: 16.5, maturity: "6 months" },
  ];

  return [
    {
      source: "bodiva",
      data_type: "stock_price",
      data: { stocks, last_update: new Date().toISOString() },
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour
    },
    {
      source: "bodiva",
      data_type: "bond_yield",
      data: { bonds: treasuryBonds, last_update: new Date().toISOString() },
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    },
  ];
}

// Economic Indicators
async function fetchEconomicIndicators(): Promise<MarketData> {
  const indicators = {
    inflation: { value: 22.5, period: "Dec 2024", source: "INE" },
    gdp_growth: { value: 2.8, period: "Q3 2024", source: "INE" },
    interest_rate_bna: { value: 19.5, period: "Jan 2025", source: "BNA" },
    unemployment: { value: 31.2, period: "2024", source: "INE" },
    oil_price_brent: { value: 78.50, currency: "USD", source: "International" },
  };

  return {
    source: "economic",
    data_type: "indicators",
    data: indicators,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
}

// Bank Interest Rates (savings accounts, loans)
async function fetchBankRates(): Promise<MarketData> {
  const rates = {
    savings_accounts: [
      { bank: "BAI", rate: 8.5, min_balance: 50000 },
      { bank: "BFA", rate: 9.0, min_balance: 100000 },
      { bank: "BIC", rate: 8.0, min_balance: 25000 },
      { bank: "ATLANTICO", rate: 8.75, min_balance: 50000 },
      { bank: "BPC", rate: 7.5, min_balance: 10000 },
    ],
    term_deposits: [
      { bank: "BAI", term: "6 months", rate: 12.5 },
      { bank: "BAI", term: "12 months", rate: 14.0 },
      { bank: "BFA", term: "6 months", rate: 13.0 },
      { bank: "BFA", term: "12 months", rate: 15.0 },
    ],
    loan_rates: [
      { type: "personal", range: "24-32%", average: 28 },
      { type: "housing", range: "18-24%", average: 21 },
      { type: "auto", range: "20-28%", average: 24 },
      { type: "business", range: "22-30%", average: 26 },
    ],
  };

  return {
    source: "banks",
    data_type: "interest_rate",
    data: rates,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dataType = url.searchParams.get('type') || 'all';
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let results: MarketData[] = [];

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedData } = await supabase
        .from('market_data_cache')
        .select('*')
        .gt('expires_at', new Date().toISOString());

      if (cachedData && cachedData.length > 0) {
        // Filter by type if specified
        const filteredCache = dataType === 'all' 
          ? cachedData 
          : cachedData.filter(d => d.data_type === dataType || d.source === dataType);

        if (filteredCache.length > 0) {
          console.log(`Returning ${filteredCache.length} cached results`);
          return new Response(
            JSON.stringify({ data: filteredCache, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Fetch fresh data based on type
    console.log(`Fetching fresh data for type: ${dataType}`);

    if (dataType === 'all' || dataType === 'exchange_rate' || dataType === 'bna') {
      const bnaData = await fetchBNAExchangeRates();
      results.push(bnaData);
    }

    if (dataType === 'all' || dataType === 'bodiva' || dataType === 'stocks' || dataType === 'bonds') {
      const bodivaData = await fetchBODIVAData();
      results = [...results, ...bodivaData];
    }

    if (dataType === 'all' || dataType === 'indicators' || dataType === 'economic') {
      const indicators = await fetchEconomicIndicators();
      results.push(indicators);
    }

    if (dataType === 'all' || dataType === 'banks' || dataType === 'interest_rate') {
      const bankRates = await fetchBankRates();
      results.push(bankRates);
    }

    // Store in cache (upsert based on source + data_type)
    for (const result of results) {
      await supabase
        .from('market_data_cache')
        .upsert(
          {
            source: result.source,
            data_type: result.data_type,
            symbol: result.symbol || null,
            data: result.data,
            fetched_at: result.fetched_at,
            expires_at: result.expires_at,
          },
          { onConflict: 'source,data_type' }
        );
    }

    return new Response(
      JSON.stringify({ data: results, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in market-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
