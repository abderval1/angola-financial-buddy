
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAudit = () => {
    const { user } = useAuth();

    const logAction = async (action: string, details: any = {}) => {
        try {
            // Log even if user is not logged in (anonymous actions)
            const { error } = await supabase.from('activity_logs' as any).insert({
                user_id: user?.id || null,
                action,
                details,
                user_agent: navigator.userAgent,
            });

            if (error) {
                console.error('Error logging action:', error);
            }
        } catch (err) {
            console.error('Exception in audit log:', err);
        }
    };

    return { logAction };
};
