import { useState, useRef, useCallback } from 'react';

interface UseOllamaChatOptions {
    systemPrompt?: string;
    onChunk?: (chunk: string) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

// API gratuita do Ollama (usa servidores públicos)
const OLLAMA_API_URL = 'https://api.ollama.com/api/chat';
const OLLAMA_MODEL = 'phi3:3.8b-q3_K_M'; // Phi-3 mini com quantização Q3

export function useOllamaChat(options: UseOllamaChatOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(true);
    const [progress, setProgress] = useState(100);
    const [error, setError] = useState<Error | null>(null);
    const messagesRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);

    const initialize = useCallback(async () => {
        setIsInitialized(true);

        if (options.systemPrompt) {
            messagesRef.current = [
                {
                    role: 'system',
                    content: options.systemPrompt,
                },
            ];
        }
    }, [options.systemPrompt]);

    const chat = useCallback(async (userMessage: string): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            messagesRef.current.push({
                role: 'user',
                content: userMessage,
            });

            const response = await fetch(OLLAMA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    messages: messagesRef.current,
                    stream: false,
                }),
            });

            if (!response.ok) {
                // Se a API principal falhar, tentar modelo alternativo
                if (response.status === 404) {
                    // Tentar com llama3 ou outro modelo disponível
                    const altResponse = await fetch(OLLAMA_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: 'llama3',
                            messages: messagesRef.current,
                            stream: false,
                        }),
                    });

                    if (!altResponse.ok) {
                        throw new Error('Modelos não disponíveis. Tente novamente mais tarde.');
                    }

                    const altData = await altResponse.json();
                    const altResponseText = altData.message?.content || 'Desculpe, não consegui gerar uma resposta.';
                    messagesRef.current.push({ role: 'assistant', content: altResponseText });
                    options.onComplete?.();
                    return altResponseText;
                }

                throw new Error(`Erro da API: ${response.status}`);
            }

            const data = await response.json();
            const fullResponse = data.message?.content || 'Desculpe, não consegui gerar uma resposta.';

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
    }, [options]);

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
