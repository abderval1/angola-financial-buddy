import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useBodivaLastUpdate() {
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLastUpdate = async () => {
        try {
            // Get the most recent sync log entry
            const { data, error } = await supabase
                .from('bodiva_sync_log')
                .select('created_at, sync_date, records_count, status')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching last update:', error);
                // Fallback: get from the most recent market data
                const { data: marketData } = await supabase
                    .from('bodiva_market_data')
                    .select('created_at')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (marketData) {
                    setLastUpdate(new Date(marketData.created_at));
                }
                return;
            }

            if (data) {
                setLastUpdate(new Date(data.created_at));
            }
        } catch (error) {
            console.error('Error fetching last update:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLastUpdate();

        // Refresh every minute
        const interval = setInterval(fetchLastUpdate, 60000);
        return () => clearInterval(interval);
    }, []);

    // Calculate time ago string
    const getTimeAgo = () => {
        if (!lastUpdate) return null;

        const now = new Date();
        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'agora mesmo';
        if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    };

    return {
        lastUpdate,
        loading,
        timeAgo: getTimeAgo(),
        refresh: fetchLastUpdate
    };
}
