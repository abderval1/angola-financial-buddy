
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';


export interface PresenceState {
    userId: string | null;
    email: string | null;
    name: string | null;
    role: string | null;
    onlineAt: string;
    userAgent: string;
    isGuest: boolean;
    guestId?: string;
    view?: string;
    location?: {
        country: string;
        city: string;
        region: string;
        country_code: string;
    };
}

export const useOnlinePresence = () => {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
    const [location, setLocation] = useState<PresenceState['location']>();

    useEffect(() => {
        // Fetch location once
        const fetchLocation = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                if (res.ok) {
                    const data = await res.json();
                    setLocation({
                        country: data.country_name,
                        city: data.city,
                        region: data.region,
                        country_code: data.country_code
                    });
                }
            } catch (e) {
                console.error("Failed to fetch location", e);
            }
        };
        fetchLocation();
    }, []);

    useEffect(() => {
        // Generate or retrieve a guest ID if not logged in
        let guestId = localStorage.getItem('guest_id');
        if (!guestId) {
            guestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('guest_id', guestId);
        }

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: user?.id || `guest-${guestId}`,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users: PresenceState[] = [];

                for (const key in newState) {
                    if (newState[key] && newState[key].length > 0) {
                        users.push(newState[key][0] as PresenceState);
                    }
                }

                setOnlineUsers(users);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Fetch user role if authenticated
                    let userRole = 'user';
                    let userName = 'Visitante';

                    if (user) {
                        try {
                            const { data } = await supabase
                                .from('user_roles')
                                .select('role')
                                .eq('user_id', user.id)
                                .maybeSingle();

                            if (data) userRole = data.role;

                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('name')
                                .eq('user_id', user.id)
                                .maybeSingle();

                            if (profile) userName = profile.name || user.email?.split('@')[0] || 'Usuário';

                        } catch (e) {
                            console.error('Error fetching user details for presence:', e);
                        }
                    }

                    const presenceState: PresenceState = {
                        userId: user?.id || null,
                        email: user?.email || null,
                        name: userName,
                        role: userRole,
                        onlineAt: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        isGuest: !user,
                        guestId: !user ? guestId : undefined,
                        view: window.location.pathname,
                        location: location // Include location in presence
                    };

                    await channel.track(presenceState);
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [user, location]); // Re-subscribe when location is available

    return { onlineUsers };
};
