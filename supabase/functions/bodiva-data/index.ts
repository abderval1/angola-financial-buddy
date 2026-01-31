import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mock data for BODIVA market (since real API requires authentication)
const MOCK_BODIVA_DATA = {
  indices: [
    { symbol: "BODIVA-ALL", name: "Índice Geral BODIVA", value: 1245.67, change: 1.23, changePercent: 0.10 },
  ],
  stocks: [
    { symbol: "BAI", name: "Banco BAI", price: 850.00, change: 12.50, changePercent: 1.49, volume: 15000 },
    { symbol: "UNITEL", name: "Unitel", price: 1250.00, change: -5.00, changePercent: -0.40, volume: 8500 },
    { symbol: "ENSA", name: "ENSA Seguros", price: 320.00, change: 8.00, changePercent: 2.56, volume: 3200 },
    { symbol: "BCI", name: "Banco BCI", price: 420.00, change: 0.00, changePercent: 0.00, volume: 1800 },
  ],
  bonds: [
    { symbol: "OT-2025", name: "Obrigações Tesouro 2025", yield: 18.5, maturity: "2025-12-15", price: 98.50 },
    { symbol: "OT-2027", name: "Obrigações Tesouro 2027", yield: 19.2, maturity: "2027-06-30", price: 97.80 },
    { symbol: "OT-2030", name: "Obrigações Tesouro 2030", yield: 20.1, maturity: "2030-03-20", price: 96.20 },
  ],
};

// Mock BNA exchange rates
const MOCK_BNA_DATA = {
  exchangeRates: [
    { currency: "USD", buy: 828.50, sell: 835.00, date: new Date().toISOString() },
    { currency: "EUR", buy: 895.20, sell: 902.50, date: new Date().toISOString() },
    { currency: "ZAR", buy: 44.80, sell: 45.50, date: new Date().toISOString() },
    { currency: "GBP", buy: 1045.00, sell: 1055.00, date: new Date().toISOString() },
  ],
  inflation: {
    current: 23.5,
    previous: 24.1,
    year: 2024,
    month: "Dezembro",
  },
  interestRate: {
    bna: 19.5,
    luibor1m: 18.2,
    luibor3m: 18.8,
    luibor6m: 19.1,
  },
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const dataType = url.searchParams.get("type") || "all";

    console.log(`Fetching BODIVA/BNA data for type: ${dataType}`);

    // Check cache first
    const { data: cachedData } = await supabase
      .from("market_data_cache")
      .select("*")
      .eq("data_type", dataType)
      .eq("source", "bodiva_bna")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cachedData) {
      console.log("Returning cached data");
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate fresh data (in production, this would call real APIs)
    let responseData: any = {};

    switch (dataType) {
      case "stocks":
        responseData = { stocks: MOCK_BODIVA_DATA.stocks };
        break;
      case "bonds":
        responseData = { bonds: MOCK_BODIVA_DATA.bonds };
        break;
      case "indices":
        responseData = { indices: MOCK_BODIVA_DATA.indices };
        break;
      case "exchange":
        responseData = { exchangeRates: MOCK_BNA_DATA.exchangeRates };
        break;
      case "rates":
        responseData = { 
          inflation: MOCK_BNA_DATA.inflation,
          interestRate: MOCK_BNA_DATA.interestRate,
        };
        break;
      case "all":
      default:
        responseData = {
          bodiva: MOCK_BODIVA_DATA,
          bna: MOCK_BNA_DATA,
          lastUpdated: new Date().toISOString(),
        };
    }

    // Cache the response
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Cache for 30 minutes

    await supabase.from("market_data_cache").upsert({
      source: "bodiva_bna",
      data_type: dataType,
      data: responseData,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: "source,data_type",
    });

    console.log("Data cached successfully");

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching market data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch market data", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
