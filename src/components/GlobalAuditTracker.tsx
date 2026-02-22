import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAudit } from '@/hooks/useAudit';
import { supabase } from '@/integrations/supabase/client';

export function GlobalAuditTracker() {
    const location = useLocation();
    const { user } = useAuth();
    const { logAction } = useAudit();

    // Track page views
    useEffect(() => {
        logAction('PAGE_VIEW', {
            path: location.pathname,
            search: location.search,
        }, 'navigation');
    }, [location.pathname]);

    // Track auth events
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                logAction('USER_LOGIN', {
                    email: session.user.email,
                    method: session.provider_token ? 'social' : 'password'
                }, 'auth');
            } else if (event === 'SIGNED_OUT') {
                logAction('USER_LOGOUT', {}, 'auth');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return null;
}

