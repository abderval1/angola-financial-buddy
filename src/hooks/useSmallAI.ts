import { useState, useRef, useCallback, useEffect } from 'react';
import * as webllm from '@mlc-ai/web-llm';

// Modelo muito pequeno - SmolLM 135M (~100-150MB com quantização)
const MODEL_NAME = 'SmolLM2-135M-Instruct-q4f16_1-MLC';

interface UseSmallAIOptions {
    onProgress?: (progress: number, message: string) => void;
    onReady?: () => void;
    onError?: (error: Error) => void;
}

export function useSmallAI(options: UseSmallAIOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const engineRef = useRef<webllm.MLCEngineInterface | null>(null);
    const isInitializedRef = useRef(false);

    // Função para carregar o modelo apenas uma vez
    const loadModel = useCallback(async () => {
        if (isInitializedRef.current && engineRef.current) {
            console.log('Modelo já carregado!');
            setIsReady(true);
            options.onReady?.();
            return;
        }

        setIsLoading(true);
        setError(null);
        setProgress(0);

        try {
            console.log('A carregar modelo SmolLM-135M-Instruct...');

            const initProgressCallback = (report: webllm.InitProgressReport) => {
                const progressPercent = Math.round(report.progress * 100);
                setProgress(progressPercent);
                console.log(`Progresso: ${progressPercent}% - ${report.text}`);
                options.onProgress?.(progressPercent, report.text);
            };

            const engine = await webllm.CreateMLCEngine(
                MODEL_NAME,
                { initProgressCallback }
            );

            engineRef.current = engine;
            isInitializedRef.current = true;
            setIsReady(true);

            console.log('Modelo carregado com sucesso!');
            options.onReady?.();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erro desconhecido');
            console.error('Erro ao carregar modelo:', error);
            setError(error);
            options.onError?.(error);
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    // Gerar insight usando a IA
    const generateInsight = useCallback(async (prompt: string): Promise<string> => {
        if (!engineRef.current) {
            // Carregar modelo se ainda não foi carregado
            await loadModel();
        }

        if (!engineRef.current) {
            throw new Error('Modelo não está pronto');
        }

        try {
            console.log('A gerar insight...');

            const messages = [
                {
                    role: 'system' as const,
                    content: 'Você é um analista financeiro que explica movimentos de ações de forma simples e clara em português de Angola.'
                },
                {
                    role: 'user' as const,
                    content: prompt
                }
            ];

            const chunks: string[] = [];

            const chunks1 = await engineRef.current.chat.completions.create({
                messages,
                temperature: 0.7,
                max_tokens: 256,
                stream: true,
            });

            for await (const chunk of chunks1) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    chunks.push(content);
                }
            }

            const fullResponse = chunks.join('');
            console.log('Insight gerado!');
            return fullResponse;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erro ao gerar insight');
            console.error('Erro ao gerar insight:', error);
            throw error;
        }
    }, [loadModel]);

    // Limpar/reiniciar
    const reset = useCallback(() => {
        engineRef.current = null;
        isInitializedRef.current = false;
        setIsReady(false);
        setProgress(0);
        setError(null);
    }, []);

    return {
        isLoading,
        isReady,
        progress,
        error,
        loadModel,
        generateInsight,
        reset,
    };
}
