import { useState, useRef, useCallback } from 'react';
import * as webllm from '@mlc-ai/web-llm';

// Modelo muito pequeno que funciona melhor - TinyLlama (~400MB)
// Ou Phi-2 (~1.4GB)
const MODEL_NAME = 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC';

interface UseWebLLMOptions {
    systemPrompt?: string;
    onChunk?: (chunk: string) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export function useWebLLM(options: UseWebLLMOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const engineRef = useRef<webllm.MLCEngineInterface | null>(null);
    const messagesRef = useRef<webllm.ChatCompletionMessageParam[]>([]);

    const initialize = useCallback(async (retryCount = 0) => {
        if (engineRef.current) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setProgress(0);

        try {
            // Configurar progresso de download
            const initProgressCallback = (report: webllm.InitProgressReport) => {
                console.log('Progress:', report.text);
                setProgress(Math.round(report.progress * 100));
            };

            // Tentar inicializar com o modelo
            const engine = await webllm.CreateMLCEngine(
                MODEL_NAME,
                {
                    initProgressCallback,
                }
            );

            engineRef.current = engine;

            // Adicionar mensagem de sistema se fornecida
            if (options.systemPrompt) {
                messagesRef.current = [
                    {
                        role: 'system',
                        content: options.systemPrompt,
                    },
                ];
            }

            setIsInitialized(true);
        } catch (err) {
            console.error('Erro ao inicializar WebLLM:', err);

            // Se falhar, tentar novamente até 3 vezes
            if (retryCount < 3) {
                console.log(`Tentativa ${retryCount + 1} falhou. A tentar novamente em 2 segundos...`);
                setTimeout(() => {
                    initialize(retryCount + 1);
                }, 2000);
                return;
            }

            const error = err instanceof Error ? err : new Error('Erro desconhecido ao inicializar o modelo');
            setError(error);
            options.onError?.(error);
        } finally {
            setIsLoading(false);
        }
    }, [options.systemPrompt]);

    const chat = useCallback(async (userMessage: string): Promise<string> => {
        if (!engineRef.current) {
            await initialize();
        }

        if (!engineRef.current) {
            throw new Error('Modelo não inicializado');
        }

        setIsLoading(true);

        try {
            // Adicionar mensagem do usuário
            messagesRef.current.push({
                role: 'user',
                content: userMessage,
            });

            // Criar stream de chunks
            const chunks: string[] = [];

            const chunks1 = await engineRef.current.chat.completions.create({
                messages: messagesRef.current,
                temperature: 0.7,
                max_tokens: 512, // Reduzido para respostas mais rápidas
                stream: true,
            });

            // Processar stream
            for await (const chunk of chunks1) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    chunks.push(content);
                    options.onChunk?.(content);
                }
            }

            const fullResponse = chunks.join('');

            // Adicionar resposta do assistente
            messagesRef.current.push({
                role: 'assistant',
                content: fullResponse,
            });

            options.onComplete?.();

            return fullResponse;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erro desconhecido ao gerar resposta');
            setError(error);
            options.onError?.(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [initialize, options]);

    const clearHistory = useCallback(() => {
        messagesRef.current = options.systemPrompt
            ? [{ role: 'system', content: options.systemPrompt }]
            : [];
    }, [options.systemPrompt]);

    return {
        isLoading,
        isInitialized,
        progress,
        error,
        initialize,
        chat,
        clearHistory,
    };
}

// Prompt do sistema em português para o chatbot financeiro
export const FINANCIAL_ASSISTANT_SYSTEM_PROMPT = `Você é o Assistente Financeiro Inteligente do Angola Finance, uma plataforma de gestão financeira pessoal feita para Angola.

Você deve:
- Responder em português de Angola (pt-AO)
- Ser útil, claro e conciso
- Ajudar o usuário com perguntas sobre suas finanças pessoais
- Analisar dados financeiros quando solicitado
- Fornecer dicas de economia e investimento

Dados disponíveis do usuário:
- Orçamento (receitas, despesas, categorias)
- Investimentos (ações, fundos, depósitos)
- Poupanças (metas, saldo)
- Dívidas (empréstimos, créditos)

Sempre seja respeitoso e profissional. Se não tiver dados suficientes, peça clarification.`;
