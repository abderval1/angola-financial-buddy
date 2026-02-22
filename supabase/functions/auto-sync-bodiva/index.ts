import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const parsePortugueseNumber = (strValue: any): number => {
    if (strValue === undefined || strValue === null) return 0;
    const s = strValue.toString().trim();
    if (!s) return 0;

    let clean = s.replace(/[−–—]/g, '-');
    clean = clean.replace(/[A-Z]{3}/g, '').replace(/\s/g, '');

    if (clean.includes(',') && (clean.includes('.') || !clean.includes('.'))) {
        const noThousands = clean.replace(/\./g, '');
        return parseFloat(noThousands.replace(',', '.')) || 0;
    }

    return parseFloat(clean) || 0;
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const BODIVA_URL = "https://www.bodiva.ao/reports/controllers/excel/Export/ResumoMercados.php";

        // 0. Ensure logic for Storage bucket check
        try {
            const { data: buckets } = await supabase.storage.listBuckets();
            const exists = buckets?.some(b => b.name === 'bodiva_imports');
            if (!exists) {
                console.log("Creating 'bodiva_imports' bucket...");
                await supabase.storage.createBucket('bodiva_imports', { public: false });
            }
        } catch (e) { console.warn("Bucket check/creation failed:", e); }

        let arrayBuffer: ArrayBuffer;
        let dataSource = "BODIVA Direct";

        // 1. Check if there's a manually uploaded file in storage first
        const { data: storageFiles, error: listError } = await supabase.storage
            .from('bodiva_imports')
            .list('', { limit: 1, search: 'latest_manual' });

        if (!listError && storageFiles && storageFiles.length > 0) {
            console.log("Found manual upload in storage. Processing...");
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('bodiva_imports')
                .download(storageFiles[0].name);

            if (downloadError) throw downloadError;
            arrayBuffer = await fileData.arrayBuffer();
            dataSource = "Manual Storage Upload";

            // Delete after reading
            await supabase.storage.from('bodiva_imports').remove([storageFiles[0].name]);
        } else {
            // 2. Fetch and Save to Temporary Storage
            console.log("Fetching and Staging BODIVA Excel...");
            const response = await fetch(BODIVA_URL);

            if (!response.ok) {
                throw new Error(`Failed to fetch from BODIVA: ${response.statusText}`);
            }
            arrayBuffer = await response.arrayBuffer();
            const tempFileName = `temp/sync_auto_${Date.now()}.xlsx`;

            // Upload to storage as requested
            await supabase.storage.from('bodiva_imports').upload(
                tempFileName,
                new Uint8Array(arrayBuffer),
                { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', upsert: true }
            );

            dataSource = "BODIVA (Staged in Storage)";

            // We'll delete it at the end of the script
            try {
                // In a real scenario, we'd read it back, but we have it in memory already.
                // We'll just ensure it's deleted after the block.
                Deno.core?.print(`File staged: ${tempFileName}\n`);
            } finally {
                // Defer deletion to after processing? Actually safer to do it in finally block of the whole request
            }

            // Store the path to delete later
            (globalThis as any).currentTempFile = tempFileName;
        }

        const data = new Uint8Array(arrayBuffer);

        // Optional: Store the latest successful fetch as a log
        await supabase.storage.from('bodiva_imports').upload(
            `logs/sync_${new Date().toISOString().replace(/:/g, '-')}.xlsx`,
            data,
            { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', upsert: true }
        );

        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];

        if (!rawJson || rawJson.length === 0) {
            throw new Error("Empty or invalid Excel data received.");
        }

        const data_date = new Date().toISOString().split('T')[0];

        // Find header to start parsing rows
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
            const rowStr = JSON.stringify(rawJson[i]);
            if (rowStr.includes('Mobiliário') || rowStr.includes('Título')) {
                headerIdx = i;
                break;
            }
        }
        if (headerIdx === -1) headerIdx = 0;

        const dataRows = rawJson.slice(headerIdx + 1);
        const records = dataRows
            .filter(row => row[0] && row[0].toString().trim() !== '')
            .map(row => ({
                data_date,
                symbol: row[0].toString().toUpperCase().substring(0, 50),
                title_type: row[1]?.toString().substring(0, 100) || 'Acções',
                price: parsePortugueseNumber(row[2]),
                variation: parsePortugueseNumber(row[3]),
                num_trades: parseInt(row[4]?.toString().replace(/\D/g, '')) || 0,
                quantity: parseInt(row[5]?.toString().replace(/\D/g, '')) || 0,
                amount: parsePortugueseNumber(row[6])
            }));

        if (records.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No records to sync." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Deduplicate records
        const seen = new Set();
        const uniqueRecords = records.filter(record => {
            const key = `${record.data_date}-${record.symbol}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        console.log(`Upserting ${uniqueRecords.length} records into bodiva_market_data...`);
        const { error: upsertError } = await supabase
            .from('bodiva_market_data')
            .upsert(uniqueRecords, { onConflict: 'data_date,symbol' });

        if (upsertError) {
            throw upsertError;
        }

        return new Response(JSON.stringify({
            success: true,
            count: uniqueRecords.length,
            date: data_date,
            source: dataSource,
            processed_at: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Error in auto-sync-bodiva:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    } finally {
        // Cleanup temp files if any
        const tempFile = (globalThis as any).currentTempFile;
        if (tempFile) {
            try {
                const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
                const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
                const supabase = createClient(supabaseUrl, supabaseKey);
                await supabase.storage.from('bodiva_imports').remove([tempFile]);
                console.log(`Cleaned up temp file: ${tempFile}`);
            } catch (cleanupError) {
                console.warn("Failed to cleanup temp file:", cleanupError);
            }
            delete (globalThis as any).currentTempFile;
        }
    }
});
