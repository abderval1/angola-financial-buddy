import { useState, useMemo } from 'react';
import { useBodivaData, BodivaSecurity } from '@/hooks/useBodivaData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    Search,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    Info
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const BodivaMarketTable = () => {
    const { t } = useTranslation();
    const { data, loading, error, refresh } = useBodivaData();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const filteredSecurities = useMemo(() => {
        if (!data?.securities) return [];
        return data.securities.filter(s =>
            s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const totalPages = Math.ceil(filteredSecurities.length / itemsPerPage);

    const currentSecurities = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSecurities.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSecurities, currentPage]);

    const handleRefresh = () => {
        refresh();
        toast.info("A atualizar dados da BODIVA...");
    };

    if (error) {
        return (
            <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Info className="h-10 w-10 text-destructive" />
                        <div>
                            <h3 className="font-bold text-lg text-destructive">Erro ao Carregar Dados Reais</h3>
                            <p className="text-muted-foreground mt-1 max-w-md">
                                Não foi possível conectar ao site da BODIVA. Por favor, tente novamente clicando no botão abaixo ou use o link de exportação direta.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleRefresh}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Tentar Novamente
                            </Button>
                            <Button asChild variant="link">
                                <a href="https://www.bodiva.ao/reports/controllers/excel/Export/ResumoMercados.php" target="_blank" rel="noopener noreferrer">
                                    Abrir Excel Original <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-6 bg-verde_bodiva-1 rounded-full" />
                            <CardTitle className="text-xl font-bold text-azul_bodiva-1">
                                Resumo dos Mercados - BODIVA
                            </CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {data?.timestamp ? `Atualizado em: ${new Date(data.timestamp).toLocaleString()}` : "Conectando ao site da BODIVA..."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar título..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={loading}
                            className={loading ? "animate-spin" : ""}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" asChild title="Exportar Excel">
                            <a href="https://www.bodiva.ao/reports/controllers/excel/Export/ResumoMercados.php">
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-muted-foreground text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-4 py-3 text-left">Valor Mobiliário</th>
                                <th className="px-4 py-3 text-left">Tipologia</th>
                                <th className="px-4 py-3 text-right">Preço</th>
                                <th className="px-4 py-3 text-center">Variação</th>
                                <th className="px-4 py-3 text-center">N° de Negócios</th>
                                <th className="px-4 py-3 text-right">Quantidade</th>
                                <th className="px-4 py-3 text-right">Montante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading && !data ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : currentSecurities.length > 0 ? (
                                currentSecurities.map((security, index) => (
                                    <tr key={security.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <span className="font-bold text-verde_bodiva-1">{security.symbol}</span>
                                        </td>
                                        <td className="px-4 py-4 text-muted-foreground italic">
                                            {security.type}
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium">
                                            {security.price}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                {security.changePercent > 0 ? (
                                                    <TrendingUp className="h-3 w-3 text-success" />
                                                ) : security.changePercent < 0 ? (
                                                    <TrendingDown className="h-3 w-3 text-destructive" />
                                                ) : null}
                                                <span className={`font-semibold ${security.changePercent > 0 ? 'text-success' :
                                                        security.changePercent < 0 ? 'text-destructive' :
                                                            'text-amber-500'
                                                    }`}>
                                                    {security.change}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Badge variant="outline" className="font-mono">
                                                {security.deals}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {security.quantity.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-right font-semibold">
                                            {security.amount}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        Nenhum título encontrado para "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t px-4 py-3 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSecurities.length)} de {filteredSecurities.length} resultados
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                            </Button>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-medium px-2 py-1 bg-white border rounded">
                                    {currentPage} / {totalPages}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Próximo <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
            <div className="bg-azul_bodiva-1 text-white text-[10px] px-4 py-1 flex justify-between items-center">
                <span>Dados extraídos diretamente da BODIVA</span>
                <span className="flex items-center gap-1 italic"><Info className="h-3 w-3" /> Valores podem ter delay de 15 minutos</span>
            </div>
        </Card>
    );
};
