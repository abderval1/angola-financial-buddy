import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const BODIVA_URL = "https://www.bodiva.ao/reports/controllers/excel/Export/ResumoMercados.php";

        console.log("Fetching BODIVA Excel from:", BODIVA_URL);

        const response = await fetch(BODIVA_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch from BODIVA: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];

        // Basic validation
        if (!rawJson || rawJson.length === 0) {
            throw new Error("Empty or invalid Excel data received from BODIVA.");
        }

        return new Response(JSON.stringify({
            success: true,
            data: rawJson,
            scraped_at: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Error in fetch-bodiva-excel:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
