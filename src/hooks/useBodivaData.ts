import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';

export interface BodivaSecurity {
    symbol: string;
    type: string;
    price: string;
    change: string;
    changePercent: number;
    deals: number;
    quantity: number;
    amount: string;
}

export interface BodivaMarketData {
    securities: BodivaSecurity[];
    timestamp: string;
    source: string;
}

const BODIVA_EXCEL_URL = 'https://www.bodiva.ao/reports/controllers/excel/Export/ResumoMercados.php';

const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/', // Might require a key but sometimes works as fallback
];

export const useBodivaData = () => {
    const [data, setData] = useState<BodivaMarketData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAndParseData = useCallback(async () => {
        setLoading(true);
        setError(null);

        let success = false;
        let lastError = '';

        for (const proxy of CORS_PROXIES) {
            try {
                const url = `${proxy}${encodeURIComponent(BODIVA_EXCEL_URL)}`;
                console.log(`Attempting to fetch BODIVA data via ${proxy}...`);

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Assuming data is in the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                // The BODIVA Excel usually has headers on a specific row
                // Based on the HTML provided earlier, the columns are:
                // Valor Mobiliário | Tipologia | Preço | Variação | N° de Negócios | Quantidade | Montante
                const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (rawJson && rawJson.length > 0) {
                    // Find the header row (usually contains "Valor Mobiliário" or similar)
                    let headerIdx = -1;
                    for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
                        const rowStr = JSON.stringify(rawJson[i]);
                        if (rowStr.includes('Mobiliário') || rowStr.includes('Título')) {
                            headerIdx = i;
                            break;
                        }
                    }

                    if (headerIdx === -1) headerIdx = 0; // Fallback to first row

                    const dataRows = rawJson.slice(headerIdx + 1);
                    const parsedSecurities: BodivaSecurity[] = dataRows
                        .filter(row => row[0] && row[0].toString().trim() !== '') // Skip empty rows
                        .map(row => {
                            // Extraction logic based on common BODIVA Excel structure
                            // Column 0: Symbol (e.g., BFAAAAAA)
                            // Column 1: Type (e.g., Acções)
                            // Column 2: Price (e.g., 105 050,00 AOA)
                            // Column 3: Change (e.g., 0,00 %)
                            // Column 4: Number of deals
                            // Column 5: Quantity
                            // Column 6: Amount

                            const changeStr = row[3]?.toString() || '0%';
                            const changePercent = parseFloat(changeStr.replace('%', '').replace(',', '.').trim()) || 0;

                            return {
                                symbol: row[0]?.toString() || '',
                                type: row[1]?.toString() || '',
                                price: row[2]?.toString() || '0,00 AOA',
                                change: changeStr,
                                changePercent: changePercent,
                                deals: parseInt(row[4]?.toString() || '0'),
                                quantity: parseInt(row[5]?.toString().replace(/\s/g, '') || '0'),
                                amount: row[6]?.toString() || '0,00 AOA'
                            };
                        });

                    setData({
                        securities: parsedSecurities,
                        timestamp: new Date().toISOString(),
                        source: 'BODIVA (Real-time Excel)'
                    });

                    success = true;
                    break;
                }
            } catch (err: any) {
                console.error(`Failed to fetch from ${proxy}:`, err.message);
                lastError = err.message;
            }
        }

        if (!success) {
            setError(lastError || 'Não foi possível carregar os dados reais da BODIVA.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAndParseData();
    }, [fetchAndParseData]);

    return {
        data,
        loading,
        error,
        refresh: fetchAndParseData
    };
};
