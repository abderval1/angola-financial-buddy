import { useState, useRef, useCallback } from 'react';

interface UseDeepSeekChatOptions {
    systemPrompt?: string;
    onChunk?: (chunk: string) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

// DeepSeek API gratuita (pode requerer API key gratuita em https://platform.deepseek.com)
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

export function useDeepSeekChat(options: UseDeepSeekChatOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(true); // Não requer inicialização como WebLLM
    const [progress, setProgress] = useState(100);
    const [error, setError] = useState<Error | null>(null);
    const messagesRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);

    const initialize = useCallback(async () => {
        // Não precisa de inicialização
        setIsInitialized(true);

        // Adicionar mensagem de sistema se fornecida
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
            // Adicionar mensagem do usuário
            messagesRef.current.push({
                role: 'user',
                content: userMessage,
            });

            // Fazer requisição para API do DeepSeek
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Nota: Substitua pela sua API key gratuita do DeepSeek
                    // 'Authorization': 'Bearer SUA_API_KEY_AQUI'
                },
                body: JSON.stringify({
                    model: DEEPSEEK_MODEL,
                    messages: messagesRef.current,
                    temperature: 0.7,
                    max_tokens: 1024,
                    stream: false, // Não usar stream para evitar problemas
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro da API: ${response.status}`);
            }

            const data = await response.json();
            const fullResponse = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

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
