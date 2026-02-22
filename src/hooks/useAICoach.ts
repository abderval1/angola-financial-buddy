import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QuotaInfo {
    remaining: number;
    limit: number;
    reset_at?: string;
}

interface UseAICoachReturn {
    advice: string | null;
    loading: boolean;
    error: string | null;
    quota: QuotaInfo | null;
    isQuotaExceeded: boolean;
    getAdvice: (tip: string, context?: string) => Promise<void>;
    clear: () => void;
}

export function useAICoach(): UseAICoachReturn {
    const [advice, setAdvice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quota, setQuota] = useState<QuotaInfo | null>(null);
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

    const getAdvice = async (tip: string, context?: string) => {
        setLoading(true);
        setError(null);
        setAdvice(null);
        setIsQuotaExceeded(false);

        try {
            // Get the current session to include auth token
            const { data: { session } } = await supabase.auth.getSession();

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add authorization header if session exists
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            // Call the function with explicit headers
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
                        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                    },
                    body: JSON.stringify({ tip, context }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    setIsQuotaExceeded(true);
                    setQuota(data.quota || null);
                    throw new Error("Limite diário excedido. Volte amanhã!");
                }
                throw new Error(data.error || `Erro ${response.status}`);
            }

            if (data?.error) throw new Error(data.error);

            setAdvice(data?.advice || "Sem resposta disponível.");
            setQuota(data?.quota || null);
        } catch (err: any) {
            if (!isQuotaExceeded) {
                setError(err.message || "Erro ao obter conselho.");
            }
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setAdvice(null);
        setError(null);
        setIsQuotaExceeded(false);
    };

    return { advice, loading, error, quota, isQuotaExceeded, getAdvice, clear };
}
