// BODIVA Web Scraper using Firecrawl
// Deploy with: npx supabase functions deploy bodiva-scraper

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Firecrawl API configuration - uses API key provided by user
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") || "fc-f998ea88a8714bb08ded24d406147472";
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";

interface FirecrawlResponse {
    success?: boolean;
    data?: {
        markdown?: string;
        html?: string;
    };
    error?: string;
}

// Parse the scraped content to extract BODIVA data
function parseBodivaData(markdown: string): any {
    const result: any = {
        success: true,
        dataSource: "firecrawl",
        timestamp: new Date().toISOString(),
        data: {}
    };

    try {
        // Extract Taxas
        const taxaBasicaMatch = markdown.match(/Taxa Básica do BNA[\s:]*(\d+[.,]?\d*)/i);
        const luiborMatch = markdown.match(/Taxa LUIBOR Overnight[\s:]*(\d+[.,]?\d*)/i);
        const inflacaoMatch = markdown.match(/Inflação Homóloga[\s:]*(\d+[.,]?\d*)/i);
        const bt91Match = markdown.match(/BT-91[\sD]*(\d+[.,]?\d*)/i) || markdown.match(/BTs[\s-]*91[\sD]*(\d+[.,]?\d*)/i);
        const bt182Match = markdown.match(/BT-182[\sD]*(\d+[.,]?\d*)/i) || markdown.match(/BTs[\s-]*182[\sD]*(\d+[.,]?\d*)/i);
        const bt364Match = markdown.match(/BT-364[\sD]*(\d+[.,]?\d*)/i) || markdown.match(/BTs[\s-]*364[\sD]*(\d+[.,]?\d*)/i);

        result.data.taxas = {
            taxaBasicaBNA: taxaBasicaMatch ? parseFloat(taxaBasicaMatch[1].replace(',', '.')) : null,
            taxaLUIBOROvernight: luiborMatch ? parseFloat(luiborMatch[1].replace(',', '.')) : null,
            inflacaoHomologa: inflacaoMatch ? parseFloat(inflacaoMatch[1].replace(',', '.')) : null,
            bt91Dias: bt91Match ? parseFloat(bt91Match[1].replace(',', '.')) : null,
            bt182Dias: bt182Match ? parseFloat(bt182Match[1].replace(',', '.')) : null,
            bt364Dias: bt364Match ? parseFloat(bt364Match[1].replace(',', '.')) : null,
        };

        // Extract Indices
        const allShare = markdown.match(/All Share[^\d]*(\d+[.,]\d+)/i);
        const bodiva20 = markdown.match(/BODIVA\s*20[^\d]*(\d+[.,]\d+)/i);
        const bodivaPME = markdown.match(/BODIVA\s*PME[^\d]*(\d+[.,]\d+)/i);

        result.data.indices = {};
        if (allShare) {
            result.data.indices["All Share Index"] = {
                value: parseFloat(allShare[1].replace(',', '.')),
                change: 0,
                changePercent: 0
            };
        }
        if (bodiva20) {
            result.data.indices["BODIVA 20"] = {
                value: parseFloat(bodiva20[1].replace(',', '.')),
                change: 0,
                changePercent: 0
            };
        }
        if (bodivaPME) {
            result.data.indices["BODIVA PME"] = {
                value: parseFloat(bodivaPME[1].replace(',', '.')),
                change: 0,
                changePercent: 0
            };
        }

        // Only include volumes if we actually extracted real data
        // Don't provide fake fallback data

        // Only include topSecurities if we actually extracted real data  
        // Don't provide fake fallback data

        // Only include livroOrdens if we actually extracted real data
        // Don't provide fake fallback data

        // Check if we got any real data
        const hasRealData = Object.keys(result.data.indices || {}).length > 0 ||
            result.data.taxas && Object.values(result.data.taxas).some(v => v !== null);

        if (!hasRealData) {
            // No real data extracted - return failure
            return {
                success: false,
                error: "REAL_BODIVA_DATA_UNAVAILABLE",
                source: "BODIVA",
                scraped_at: new Date().toISOString(),
                note: "Não foi possível extrair dados reais do site da BODIVA"
            };
        }

        return result;
    } catch (error) {
        console.error("Error parsing BODIVA data:", error);
        return result;
    }
}

// Get real BODIVA data using Firecrawl
async function scrapeWithFirecrawl(): Promise<any> {
    const apiKey = FIRECRAWL_API_KEY;
    console.log("Firecrawl API Key prefix:", apiKey?.substring(0, 10));

    if (!apiKey) {
        throw new Error("Firecrawl API key not configured. Please add FIRECRAWL_API_KEY in Supabase Edge Functions secrets.");
    }

    console.log("Calling Firecrawl API to scrape BODIVA...");

    const response = await fetch(FIRECRAWL_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            url: "https://www.bodiva.ao/estatistica",
            formats: ["markdown"],
            onlyMainContent: true
        })
    });

    const status = response.status;
    console.log("Firecrawl response status:", status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Firecrawl error response:", errorText);
        throw new Error(`Firecrawl API error: ${status} - ${errorText}`);
    }

    const data: FirecrawlResponse = await response.json();
    console.log("Firecrawl response success:", data.success);

    if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to scrape BODIVA - no data returned");
    }

    return parseBodivaData(data.data.markdown || "");
}

// Fallback data when scraping fails - RETURNS ERROR ONLY
function getErrorResponse(errorMessage: string): any {
    return {
        success: false,
        error: "REAL_BODIVA_DATA_UNAVAILABLE",
        errorDetails: errorMessage,
        source: "BODIVA",
        scraped_at: new Date().toISOString(),
        note: "Não foi possível obter dados reais da BODIVA. Por favor, tente novamente mais tarde."
    };
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            status: 200,
            headers: corsHeaders,
        });
    }

    try {
        console.log("BODIVA scraper called, method:", req.method);

        let result;

        // Try to scrape with Firecrawl if API key is available
        if (FIRECRAWL_API_KEY) {
            try {
                result = await scrapeWithFirecrawl();
                console.log("Successfully scraped with Firecrawl");
            } catch (scrapeError) {
                const errorMsg = scrapeError instanceof Error ? scrapeError.message : "Unknown error";
                console.error("Firecrawl error:", errorMsg);
                result = getErrorResponse(errorMsg);
            }
        } else {
            console.log("No Firecrawl API key available, using fallback data");
            result = getErrorResponse("API key não disponível");
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "no-cache"
            },
        });
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});;
