import { useState } from 'react';
import { Sparkles, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSmallAI } from '@/hooks/useSmallAI';

interface StockData {
    previousPrice: number;
    currentPrice: number;
    change: number;
    changePercent: number;
    volume: string;
    symbol?: string;
}

interface AIInsightsProps {
    stockData: StockData;
}

export function AIInsights({ stockData }: AIInsightsProps) {
    const [insight, setInsight] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const { isReady, isLoading, progress, error, loadModel, generateInsight } = useSmallAI({
        onProgress: (progressPercent, message) => {
            console.log(`[IA] ${progressPercent}% - ${message}`);
        },
        onReady: () => {
            console.log('[IA] Modelo pronto para uso!');
        },
        onError: (err) => {
            console.error('[IA] Erro:', err.message);
        },
    });

    const handleGenerateInsight = async () => {
        setIsGenerating(true);
        setInsight(null);

        try {
            // Carregar modelo se ainda não estiver pronto
            if (!isReady) {
                console.log('A carregar modelo...');
                await loadModel();
            }

            // Criar prompt com os dados da ação
            const prompt = `Analise uma ação com os seguintes dados:
- Símbolo: ${stockData.symbol || 'N/A'}
- Preço anterior: ${stockData.previousPrice.toLocaleString()} Kz
- Preço atual: ${stockData.currentPrice.toLocaleString()} Kz
- Variação: ${stockData.changePercent.toFixed(2)}%
- Volume: ${stockData.volume}

Explique o que isso significa para investidores em Angola. Seja breve e prático.`;

            const result = await generateInsight(prompt);
            setInsight(result);
        } catch (err) {
            console.error('Erro ao gerar insight:', err);
            setInsight('Desculpe, não foi possível gerar o insight neste momento. Tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Analyst
                </CardTitle>
                <CardDescription>
                    Análise inteligente de ações usando IA local
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status do modelo */}
                <div className="text-sm text-muted-foreground">
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Carregando IA... {progress}%</span>
                        </div>
                    ) : isReady ? (
                        <span className="text-green-500 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            IA pronta
                        </span>
                    ) : (
                        <span>IA não carregada</span>
                    )}
                </div>

                {/* Botão para gerar insight */}
                <Button
                    onClick={handleGenerateInsight}
                    disabled={isGenerating || isLoading}
                    className="w-full"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            A analisar...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Gerar Insight
                        </>
                    )}
                </Button>

                {/* Resultado do insight */}
                {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error.message}</span>
                    </div>
                )}

                {insight && !error && (
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{insight}</p>
                    </div>
                )}

                {/* Dados da ação */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p><strong>Dados analisados:</strong></p>
                    <p>Preço: {stockData.previousPrice.toLocaleString()} → {stockData.currentPrice.toLocaleString()} Kz</p>
                    <p>Variação: {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%</p>
                    <p>Volume: {stockData.volume}</p>
                </div>
            </CardContent>
        </Card>
    );
}
