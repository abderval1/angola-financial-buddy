import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, TrendingUp, TrendingDown, FileText, Download, RefreshCw, Link2, Calendar, Database, Search, Filter, BarChart3, TrendingUpIcon, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudit } from '@/hooks/useAudit';
import * as XLSX from 'xlsx';

interface BodivaMarketData {
    id: string;
    data_date: string;
    symbol: string;
    title_type: string;
    price: number;
    variation: number;
    num_trades: number;
    quantity: number;
    amount: number;
    created_at: string;
}

interface NewMarketData {
    data_date: string;
    symbol: string;
    title_type: string;
    price: string;
    variation: string;
    num_trades: string;
    quantity: string;
    amount: string;
}

const parsePortugueseNumber = (str: any): number => {
    if (str === undefined || str === null) return 0;
    const s = str.toString().trim();
    if (!s) return 0;

    // Remove any non-standard negative signs, keep regular one
    let clean = s.replace(/[−–—]/g, '-');

    // Remove currency suffix/prefix and spaces
    clean = clean.replace(/[A-Z]{3}/g, '').replace(/\s/g, '');

    // Handle the case where comma is decimal and dot/space is thousand separator
    // Format: 1.050.050,00 or 1 050 050,00
    if (clean.includes(',') && (clean.includes('.') || !clean.includes('.'))) {
        // Remove dots (thousand separators)
        const noThousands = clean.replace(/\./g, '');
        // Replace comma with dot
        return parseFloat(noThousands.replace(',', '.')) || 0;
    }

    // Default to standard parseFloat if no comma
    // If it's a very small decimal (e.g. 0.0156 from Excel percentage), 
    // it will be parsed as 0.0156. The display logic expects 1.56.
    let val = parseFloat(clean);

    // If the original string had a percentage sign but the parsed value is small,
    // it might have been divided by 100 twice or something.
    // Actually, if clean has '%', parseFloat handles it (stops at %).
    return val || 0;
};

const deduplicateData = (data: any[]) => {
    const seen = new Map<string, any>();
    data.forEach(item => {
        const key = `${item.data_date}_${item.symbol}`;
        // Keep the latest one if duplicates exist in the same batch
        seen.set(key, item);
    });
    return Array.from(seen.values());
};

export default function AdminBodivaData() {
    const [marketData, setMarketData] = useState<BodivaMarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [newData, setNewData] = useState<NewMarketData>({
        data_date: new Date().toISOString().split('T')[0],
        symbol: '',
        title_type: 'Acções',
        price: '',
        variation: '0',
        num_trades: '0',
        quantity: '0',
        amount: '0'
    });
    const [bulkData, setBulkData] = useState('');
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const { toast } = useToast();
    const { logAction } = useAudit();

    useEffect(() => {
        fetchMarketData();
    }, []);

    const fetchMarketData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bodiva_market_data')
                .select('*')
                .order('data_date', { ascending: false })
                .order('symbol', { ascending: true })
                .limit(100);

            if (error) throw error;
            setMarketData((data as any) || []);
        } catch (error) {
            console.error('Error fetching market data:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar dados do mercado',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const { error } = await supabase
                .from('bodiva_market_data')
                .insert({
                    data_date: newData.data_date,
                    symbol: newData.symbol.toUpperCase().substring(0, 255),
                    title_type: newData.title_type.substring(0, 255),
                    price: parsePortugueseNumber(newData.price),
                    variation: parsePortugueseNumber(newData.variation),
                    num_trades: parseInt(newData.num_trades.toString().replace(/\D/g, '')) || 0,
                    quantity: parseInt(newData.quantity.toString().replace(/\D/g, '')) || 0,
                    amount: parsePortugueseNumber(newData.amount)
                });

            if (error) throw error;

            // Log the action for audit trail
            await logAction('BODIVA_DATA_CREATE', {
                symbol: newData.symbol,
                title_type: newData.title_type,
                price: newData.price,
                variation: newData.variation,
                data_date: newData.data_date,
                num_trades: newData.num_trades,
                quantity: newData.quantity,
                amount: newData.amount
            }, 'bodiva_market_data');

            toast({
                title: 'Sucesso',
                description: 'Dados inseridos com sucesso'
            });

            setDialogOpen(false);
            setNewData({
                data_date: new Date().toISOString().split('T')[0],
                symbol: '',
                title_type: 'Acções',
                price: '',
                variation: '0',
                num_trades: '0',
                quantity: '0',
                amount: '0'
            });
            fetchMarketData();
        } catch (error: any) {
            console.error('Error inserting data:', error);
            toast({
                title: 'Erro',
                description: error.message || 'Falha ao inserir dados',
                variant: 'destructive'
            });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];

                if (!rawJson || rawJson.length === 0) {
                    throw new Error('Ficheiro Excel vazio ou inválido.');
                }

                // Convert Excel rows to structured data
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
                const dataToInsert = dataRows
                    .filter(row => row[0] && row[0].toString().trim() !== '')
                    .map(row => {
                        // BODIVA Excel format: 0:Symbol, 1:Type, 2:Price, 3:Variation, 4:Deals, 5:Qty, 6:Amount
                        return {
                            data_date: newData.data_date,
                            symbol: row[0].toString().toUpperCase().substring(0, 255),
                            title_type: row[1]?.toString().substring(0, 255) || 'Acções',
                            price: parsePortugueseNumber(row[2]),
                            variation: parsePortugueseNumber(row[3]),
                            num_trades: parseInt(row[4]?.toString().replace(/\D/g, '')) || 0,
                            quantity: parseInt(row[5]?.toString().replace(/\D/g, '')) || 0,
                            amount: parsePortugueseNumber(row[6])
                        };
                    });

                if (dataToInsert.length > 0) {
                    const uniqueData = deduplicateData(dataToInsert);
                    const duplicateCount = dataToInsert.length - uniqueData.length;

                    const { error } = await supabase
                        .from('bodiva_market_data')
                        .upsert(uniqueData, { onConflict: 'data_date,symbol' });

                    if (error) throw error;

                    toast({
                        title: 'Sucesso',
                        description: `${uniqueData.length} registos importados do Excel.${duplicateCount > 0 ? ` (${duplicateCount} duplicados removidos)` : ''}`
                    });
                    fetchMarketData();
                    setBulkDialogOpen(false);
                }
            } catch (error: any) {
                console.error('Excel Import Error:', error);
                toast({
                    title: 'Erro de Importação',
                    description: `${error.message || 'Falha ao processar ficheiro Excel.'} ${error.hint || ''}`,
                    variant: 'destructive'
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSeedData = async () => {
        if (!confirm('Deseja gerar 30 dias de dados fictícios para os principais títulos (BFA, BAI, etc.)? Isto permitirá visualizar melhor os gráficos históricos.')) return;

        setIsSyncing(true);
        try {
            const symbols = [
                { s: 'BFA', t: 'Acções', p: 25000 },
                { s: 'BAI', t: 'Acções', p: 42000 },
                { s: 'UNITEL', t: 'Acções', p: 15000 },
                { s: 'ENDE', t: 'Obrigações', p: 1000 },
                { s: 'TAAG', t: 'Obrigações', p: 1050 }
            ];

            const today = new Date();
            const dataToInsert = [];

            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                for (const item of symbols) {
                    // Random price variance -1.5% to +2%
                    const variance = 0.985 + (Math.random() * 0.035);
                    const price = Number((item.p * variance).toFixed(2));
                    const quantity = Math.floor(Math.random() * 2000) + 100;

                    dataToInsert.push({
                        data_date: dateStr,
                        symbol: item.s,
                        title_type: item.t,
                        price: price,
                        variation: (variance - 1) * 100,
                        num_trades: Math.floor(Math.random() * 10) + 1,
                        quantity: quantity,
                        amount: price * quantity
                    });

                    // Update base price for next day (random walk)
                    item.p = price;
                }
            }

            const { error } = await supabase
                .from('bodiva_market_data')
                .upsert(dataToInsert, { onConflict: 'data_date,symbol' });

            if (error) throw error;

            toast({
                title: 'Sucesso',
                description: 'Gerados 30 dias de histórico para 5 títulos.'
            });
            fetchMarketData();
        } catch (error: any) {
            console.error('Error seeding data:', error);
            toast({
                title: 'Erro ao gerar dados',
                description: error.message || 'Falha na base de dados.',
                variant: 'destructive'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleBodivaSync = async () => {
        setIsSyncing(true);
        try {
            // 1. Try server-side Edge Function first
            console.log('Attempting server-side sync...');
            const { data: response, error: funcError } = await supabase.functions.invoke('auto-sync-bodiva');

            if (!funcError && response && response.success) {
                toast({
                    title: 'Sincronização Concluída (Server)',
                    description: `Foram actualizados ${response.count} títulos para a data ${new Date(response.date).toLocaleDateString('pt-AO')}.`
                });
                fetchMarketData();
                return;
            }

            // 2. Fallback to client-side fetch if Edge Function fails
            console.warn('Server-side sync failed or function not deployed. Using client-side fallback...', funcError);
            const BODIVA_URL = "https://www.bodiva.ao/reports/controllers/excel/Export/ResumoMercados.php";

            let excelData: Uint8Array | null = null;
            let strategy = '';

            // Strategy A: corsproxy.io (Direct raw)
            try {
                const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(BODIVA_URL)}`);
                if (res.ok) {
                    excelData = new Uint8Array(await res.arrayBuffer());
                    strategy = 'corsproxy.io';
                }
            } catch (e) { console.warn('Strategy A failed'); }

            // Strategy B: allorigins (Base64 JSON)
            if (!excelData) {
                try {
                    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(BODIVA_URL)}`);
                    if (res.ok) {
                        const json = await res.json();
                        const base64 = json.contents.split('base64,')[1] || json.contents;
                        const binaryString = window.atob(base64);
                        excelData = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            excelData[i] = binaryString.charCodeAt(i);
                        }
                        strategy = 'allorigins (json)';
                    }
                } catch (e) { console.warn('Strategy B failed'); }
            }

            // Strategy C: codetabs
            if (!excelData) {
                try {
                    console.log('Sync Strategy C: codetabs...');
                    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(BODIVA_URL)}`);
                    if (res.ok) {
                        excelData = new Uint8Array(await res.arrayBuffer());
                        strategy = 'codetabs';
                    }
                } catch (e) { console.warn('Strategy C failed'); }
            }

            if (!excelData) {
                // Total failure of all automated approaches. 
                // Suggest the Storage-based manual flow as requested by the user.
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx, .xls';
                input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                        setIsSyncing(true);
                        toast({ title: 'A processar...', description: 'A carregar ficheiro para o storage...' });

                        // 1. Upload to Storage
                        const fileName = `latest_manual_${Date.now()}.xlsx`;
                        const { error: uploadError } = await supabase.storage
                            .from('bodiva_imports')
                            .upload(fileName, file);

                        if (uploadError) throw uploadError;

                        // 2. Trigger Edge Function (it will find the manual file)
                        const { data: response, error: funcError } = await supabase.functions.invoke('auto-sync-bodiva');

                        if (funcError || !response?.success) {
                            throw new Error(response?.error || 'O servidor não conseguiu processar o ficheiro guardado.');
                        }

                        toast({
                            title: 'Sincronização Concluída',
                            description: `${response.count} registos importados via Storage para ${new Date(response.date).toLocaleDateString('pt-AO')}.`
                        });
                        fetchMarketData();

                    } catch (err: any) {
                        console.error('Storage sync error:', err);
                        toast({
                            title: 'Erro de Processamento',
                            description: err.message || 'Falha ao processar ficheiro via Storage.',
                            variant: 'destructive'
                        });
                    } finally {
                        setIsSyncing(false);
                    }
                };

                toast({
                    title: 'Sincronização Automática Bloqueada',
                    description: 'A BODIVA está a bloquear o acesso. Por favor, descarregue o ficheiro e escolha-o aqui para processamento seguro via Storage.',
                    variant: 'destructive',
                });

                // Open the download link
                window.open(BODIVA_URL, '_blank');

                // Trigger the file picker after a short delay
                setTimeout(() => input.click(), 1000);
                return;
            }

            console.log(`Sync successful using strategy: ${strategy}`);
            const workbook = XLSX.read(excelData, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];

            if (!rawJson || rawJson.length === 0) throw new Error('Dados inválidos recebidos da BODIVA.');

            let headerIdx = -1;
            for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
                const rowStr = JSON.stringify(rawJson[i]);
                if (rowStr.includes('Mobiliário') || rowStr.includes('Título')) {
                    headerIdx = i;
                    break;
                }
            }
            if (headerIdx === -1) headerIdx = 0;

            const dataToInsert = rawJson.slice(headerIdx + 1)
                .filter(row => row[0] && row[0].toString().trim() !== '')
                .map(row => ({
                    data_date: new Date().toISOString().split('T')[0], // Use today for client sync
                    symbol: row[0].toString().toUpperCase().substring(0, 255),
                    title_type: row[1]?.toString().substring(0, 255) || 'Acções',
                    price: parsePortugueseNumber(row[2]),
                    variation: parsePortugueseNumber(row[3]),
                    num_trades: parseInt(row[4]?.toString().replace(/\D/g, '')) || 0,
                    quantity: parseInt(row[5]?.toString().replace(/\D/g, '')) || 0,
                    amount: parsePortugueseNumber(row[6])
                }));

            if (dataToInsert.length > 0) {
                const uniqueData = deduplicateData(dataToInsert);
                const duplicateCount = dataToInsert.length - uniqueData.length;

                const { error: dbError } = await supabase
                    .from('bodiva_market_data')
                    .upsert(uniqueData, { onConflict: 'data_date,symbol' });

                if (dbError) throw dbError;

                toast({
                    title: 'Sincronização Concluída (Browser)',
                    description: `${uniqueData.length} registos actualizados via fallback local.${duplicateCount > 0 ? ` (${duplicateCount} duplicados removidos)` : ''}`
                });
                fetchMarketData();
            }
        } catch (err: any) {
            console.error('Sync error:', err);
            toast({
                title: 'Erro de Sincronização',
                description: err.message || 'Não foi possível sincronizar os dados. Tente importar manualmente.',
                variant: 'destructive'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleBulkInsert = async () => {
        try {
            // Parse the tab-separated data
            const lines = bulkData.trim().split('\n');
            const dataToInsert = [];

            for (const line of lines) {
                // Skip empty lines
                if (!line.trim()) continue;

                // Skip header-like lines
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes('valor mobiliário') || lowerLine.includes('tipologia') ||
                    lowerLine.includes('resumo') || lowerLine.includes('copyright')) {
                    continue;
                }

                const parts = line.split('\t');
                if (parts.length >= 7) {
                    const symbol = parts[0]?.trim() || '';

                    // Skip invalid rows
                    if (!symbol || symbol.length < 2) continue;

                    dataToInsert.push({
                        data_date: newData.data_date,
                        symbol: symbol.toUpperCase().substring(0, 255),
                        title_type: parts[1]?.trim().substring(0, 255) || 'Acções',
                        price: parsePortugueseNumber(parts[2]),
                        variation: parsePortugueseNumber(parts[3]),
                        num_trades: parseInt(parts[4]?.replace(/\D/g, '')) || 0,
                        quantity: parseInt(parts[5]?.replace(/\D/g, '')) || 0,
                        amount: parsePortugueseNumber(parts[6])
                    });
                }
            }

            if (dataToInsert.length === 0) {
                throw new Error('Nenhum dado válido encontrado. Use formato: Symbol | Tipo | Preço | Variação | Negocios | Quantidade | Montante');
            }

            const uniqueData = deduplicateData(dataToInsert);
            const duplicateCount = dataToInsert.length - uniqueData.length;

            const { error } = await supabase
                .from('bodiva_market_data')
                .upsert(uniqueData, { onConflict: 'data_date,symbol' });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Log the bulk import action
            await logAction('BODIVA_DATA_BULK_IMPORT', {
                count: uniqueData.length,
                duplicatesRemoved: duplicateCount,
                data_date: newData.data_date,
                source: 'manual_paste'
            }, 'bodiva_market_data');

            toast({
                title: 'Sucesso',
                description: `${uniqueData.length} registos inseridos com sucesso.${duplicateCount > 0 ? ` (${duplicateCount} duplicados removidos)` : ''}`
            });

            setBulkDialogOpen(false);
            setBulkData('');
            fetchMarketData();
        } catch (error: any) {
            console.error('Error bulk inserting data:', error);
            toast({
                title: 'Erro de Importação em Massa',
                description: `${error.message || 'Falha ao inserir dados.'} ${error.hint || ''}`,
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('bodiva_market_data')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Log the delete action
            await logAction('BODIVA_DATA_DELETE', {
                deleted_id: id,
                symbol: marketData.find(m => m.id === id)?.symbol,
                data_date: marketData.find(m => m.id === id)?.data_date
            }, 'bodiva_market_data');

            toast({
                title: 'Sucesso',
                description: 'Registo eliminado'
            });

            fetchMarketData();
        } catch (error) {
            console.error('Error deleting data:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao eliminar registo',
                variant: 'destructive'
            });
        }
    };

    const handleDeleteDay = async (date: string) => {
        if (!confirm(`Tem a certeza que deseja eliminar TODOS os ${groupedByDate[date].length} registos do dia ${new Date(date).toLocaleDateString('pt-AO')}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('bodiva_market_data')
                .delete()
                .eq('data_date', date);

            if (error) throw error;

            // Log the delete day action
            await logAction('BODIVA_DATA_DELETE_DAY', {
                deleted_date: date,
                count: groupedByDate[date]?.length || 0
            }, 'bodiva_market_data');

            toast({
                title: 'Sucesso',
                description: `Dados de ${new Date(date).toLocaleDateString('pt-AO')} eliminados`
            });

            fetchMarketData();
        } catch (error) {
            console.error('Error deleting day data:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao eliminar dados do dia',
                variant: 'destructive'
            });
        }
    };

    // Group data by date
    const groupedByDate = marketData.reduce((acc, item) => {
        if (!acc[item.data_date]) {
            acc[item.data_date] = [];
        }
        acc[item.data_date].push(item);
        return acc;
    }, {} as Record<string, BodivaMarketData[]>);

    const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    // Get unique types for filter
    const uniqueTypes = useMemo(() => {
        const types = new Set(marketData.map(item => item.title_type));
        return Array.from(types).sort();
    }, [marketData]);

    // Filter data based on search and filters
    const filteredAndGroupedData = useMemo(() => {
        let filtered = marketData;

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.symbol.toLowerCase().includes(term) ||
                item.title_type.toLowerCase().includes(term)
            );
        }

        // Apply date filter
        if (filterDate !== 'all') {
            filtered = filtered.filter(item => item.data_date === filterDate);
        }

        // Apply type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(item => item.title_type === filterType);
        }

        // Group filtered data by date
        const grouped = filtered.reduce((acc, item) => {
            if (!acc[item.data_date]) {
                acc[item.data_date] = [];
            }
            acc[item.data_date].push(item);
            return acc;
        }, {} as Record<string, BodivaMarketData[]>);

        return grouped;
    }, [marketData, searchTerm, filterDate, filterType]);

    const filteredDates = Object.keys(filteredAndGroupedData).sort((a, b) => b.localeCompare(a));

    // Calculate summary stats
    const stats = useMemo(() => {
        const allData = Object.values(filteredAndGroupedData).flat();
        return {
            totalRecords: allData.length,
            totalVolume: allData.reduce((sum, item) => sum + item.amount, 0),
            totalTrades: allData.reduce((sum, item) => sum + item.num_trades, 0),
            gainers: allData.filter(item => item.variation > 0).length,
            losers: allData.filter(item => item.variation < 0).length
        };
    }, [filteredAndGroupedData]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle>Dados do Mercado BODIVA</CardTitle>
                    <Badge variant="secondary">{stats.totalRecords} registos</Badge>
                </div>
                <div className="flex gap-2">
                    <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Upload className="h-4 w-4 mr-2" />
                                Importar Dados
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Importar Dados do Mercado BODIVA</DialogTitle>
                            </DialogHeader>

                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                                <label className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4" /> SELECIONE A DATA DOS DADOS
                                </label>
                                <Input
                                    type="date"
                                    value={newData.data_date}
                                    onChange={(e) => setNewData({ ...newData, data_date: e.target.value })}
                                    className="bg-white border-primary/20 focus-visible:ring-primary font-bold"
                                />
                                <p className="text-[10px] text-muted-foreground mt-2 italic">
                                    * Esta data será atribuída a todos os registos carregados neste lote.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">1. Ficheiro (.xlsx)</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleFileUpload}
                                            className="cursor-pointer h-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">2. Sync Direto</label>
                                    <Button
                                        className="w-full h-10 bg-azul_bodiva-1 hover:bg-azul_bodiva-1/90 text-white font-bold"
                                        onClick={handleBodivaSync}
                                        disabled={isSyncing}
                                    >
                                        {isSyncing ? (
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                        )}
                                        Sincronizar Agora (Auto)
                                    </Button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-muted" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">Ou Fallback Seguro</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full border-azul_bodiva-1 text-azul_bodiva-1 hover:bg-azul_bodiva-1/5 font-semibold"
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = '.xlsx, .xls';
                                            input.onchange = async (e: any) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                try {
                                                    setIsSyncing(true);
                                                    toast({ title: 'A processar...', description: 'A carregar ficheiro para o storage...' });

                                                    const fileName = `latest_manual_${Date.now()}.xlsx`;
                                                    const { error: uploadError } = await supabase.storage
                                                        .from('bodiva_imports')
                                                        .upload(fileName, file);

                                                    if (uploadError) throw uploadError;

                                                    const { data: response, error: funcError } = await supabase.functions.invoke('auto-sync-bodiva');

                                                    if (funcError || !response?.success) {
                                                        throw new Error(response?.error || 'O servidor não conseguiu processar o ficheiro.');
                                                    }

                                                    toast({
                                                        title: 'Sincronização Concluída',
                                                        description: `${response.count} registos importados via Storage para ${new Date(response.date).toLocaleDateString('pt-AO')}.`
                                                    });
                                                    fetchMarketData();

                                                } catch (err: any) {
                                                    console.error('Storage sync error:', err);
                                                    toast({
                                                        title: 'Erro de Processamento',
                                                        description: err.message || 'Falha ao processar ficheiro.',
                                                        variant: 'destructive'
                                                    });
                                                } finally {
                                                    setIsSyncing(false);
                                                }
                                            };
                                            input.click();
                                        }}
                                        disabled={isSyncing}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Importar via Storage (Manual)
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">3. Popular Mock</label>
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 text-orange-600 border-orange-200 hover:bg-orange-50 bg-orange-50/30"
                                        onClick={handleSeedData}
                                        disabled={isSyncing}
                                    >
                                        <Database className="h-4 w-4 mr-2" />
                                        Gerar 30 Dias
                                    </Button>
                                </div>
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Ou 4. Manual (Texto)</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">3. Cole os dados do Excel (Tab separador)</label>
                                    {bulkData && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setBulkData('');
                                                setPreviewData([]);
                                            }}
                                            className="h-7 text-xs"
                                        >
                                            Limpar
                                        </Button>
                                    )}
                                </div>
                                <textarea
                                    className="w-full h-32 p-3 border rounded-md font-mono text-xs"
                                    placeholder="BFAAAAAA	Acções	105050,00	0,00%	31	355	36792900,00..."
                                    value={bulkData}
                                    onChange={(e) => {
                                        setBulkData(e.target.value);
                                        // Optional: simple preview logic could go here
                                    }}
                                />
                            </div>
                            <Button
                                className="w-full mt-4 bg-verde_bodiva-1 hover:bg-verde_bodiva-1/90 text-white font-bold py-6 text-lg"
                                onClick={handleBulkInsert}
                                disabled={!bulkData.trim()}
                            >
                                Guardar na Base de Dados
                            </Button>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="accent" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Registo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Inserir Dados do Mercado</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Data</label>
                                        <Input
                                            type="date"
                                            value={newData.data_date}
                                            onChange={(e) => setNewData({ ...newData, data_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Symbol</label>
                                        <Input
                                            placeholder="BFAAAAAA"
                                            value={newData.symbol}
                                            onChange={(e) => setNewData({ ...newData, symbol: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipologia</label>
                                    <select
                                        className="w-full p-2 border rounded-md"
                                        value={newData.title_type}
                                        onChange={(e) => setNewData({ ...newData, title_type: e.target.value })}
                                    >
                                        <option value="Acções">Acções</option>
                                        <option value="OT-NR">OT-NR</option>
                                        <option value="OT-ME">OT-ME</option>
                                        <option value="BT-364">BT-364</option>
                                        <option value="BT-182">BT-182</option>
                                        <option value="BT-91">BT-91</option>
                                        <option value="Obrigações Ordinárias">Obrigações Ordinárias</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Preço</label>
                                        <Input
                                            type="number"
                                            placeholder="105050.00"
                                            value={newData.price}
                                            onChange={(e) => setNewData({ ...newData, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Variação (%)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newData.variation}
                                            onChange={(e) => setNewData({ ...newData, variation: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nº Negocios</label>
                                        <Input
                                            type="number"
                                            placeholder="31"
                                            value={newData.num_trades}
                                            onChange={(e) => setNewData({ ...newData, num_trades: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Quantidade</label>
                                        <Input
                                            type="number"
                                            placeholder="355"
                                            value={newData.quantity}
                                            onChange={(e) => setNewData({ ...newData, quantity: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Montante</label>
                                        <Input
                                            type="number"
                                            placeholder="36792900"
                                            value={newData.amount}
                                            onChange={(e) => setNewData({ ...newData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleSubmit} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Inserir Dados
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Stats */}
                {stats.totalRecords > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <BarChart3 className="h-3 w-3" /> Registos
                            </div>
                            <p className="text-xl font-bold">{stats.totalRecords}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <TrendingUp className="h-3 w-3 text-green-500" /> Altas
                            </div>
                            <p className="text-xl font-bold text-green-600">{stats.gainers}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <TrendingDown className="h-3 w-3 text-red-500" /> Baixas
                            </div>
                            <p className="text-xl font-bold text-red-600">{stats.losers}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-3 border col-span-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <DollarSign className="h-3 w-3 text-blue-500" /> Volume Total
                            </div>
                            <p className="text-xl font-bold text-blue-600">{stats.totalVolume.toLocaleString('pt-AO', { maximumFractionDigits: 0 })} AOA</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar por símbolo ou tipologia..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <select
                        className="px-3 py-2 border rounded-md bg-background"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    >
                        <option value="all">Todas as datas</option>
                        {dates.map(date => (
                            <option key={date} value={date}>
                                {new Date(date).toLocaleDateString('pt-AO')}
                            </option>
                        ))}
                    </select>
                    <select
                        className="px-3 py-2 border rounded-md bg-background"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Todas as tipologias</option>
                        {uniqueTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    {(searchTerm || filterDate !== 'all' || filterType !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterDate('all');
                                setFilterType('all');
                            }}
                            className="text-xs"
                        >
                            Limpar filtros
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : filteredDates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Sem dados do mercado</p>
                        <p className="text-sm">Importe dados da BODIVA para começar</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredDates.map((date) => (
                            <div key={date}>
                                <h3 className="font-medium mb-2 flex items-center gap-2">
                                    <Badge variant="outline">
                                        {new Date(date).toLocaleDateString('pt-AO')}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {filteredAndGroupedData[date].length} títulos
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteDay(date)}
                                        className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Eliminar Dia
                                    </Button>
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Symbol</TableHead>
                                            <TableHead>Tipologia</TableHead>
                                            <TableHead className="text-right">Preço</TableHead>
                                            <TableHead className="text-right">Variação</TableHead>
                                            <TableHead className="text-right">Nº Neg.</TableHead>
                                            <TableHead className="text-right">Quantidade</TableHead>
                                            <TableHead className="text-right">Montante</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAndGroupedData[date].map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.symbol}</TableCell>
                                                <TableCell>{item.title_type}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.price.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`flex items-center justify-end gap-1 ${item.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {item.variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {item.variation >= 0 ? '+' : ''}{item.variation.toFixed(2)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">{item.num_trades}</TableCell>
                                                <TableCell className="text-right">{item.quantity.toLocaleString('pt-AO')}</TableCell>
                                                <TableCell className="text-right">{item.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
