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
        if (user) {
            logAction('PAGE_VIEW', {
                path: location.pathname,
                search: location.search,
            });
        }
    }, [location.pathname, user]);

    // Track auth events
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                logAction('USER_LOGIN', {
                    email: session.user.email,
                    method: 'password'
                });
            } else if (event === 'SIGNED_OUT') {
                logAction('USER_LOGOUT', {});
            } else if (event === 'SIGNED_UP' && session?.user) {
                logAction('USER_SIGNUP', {
                    email: session.user.email
                });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return null;
}

