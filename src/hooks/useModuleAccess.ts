import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ModuleKey = 'basic' | 'metas_fire' | 'education' | 'news' | 'premium_content';

const MODULE_TO_TIER: Record<ModuleKey, number> = {
    'basic': 0,
    'metas_fire': 1,
    'education': 2,
    'premium_content': 2,
    'news': 3
};

export function useModuleAccess(moduleKey: ModuleKey) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ["module-access", user?.id, moduleKey],
        queryFn: async () => {
            if (!user?.id) return { hasAccess: false };

            // The provided snippet seems to be from a mutation's onSuccess callback,
            // not suitable for direct insertion into a queryFn.
            // Inserting it directly would cause syntax errors and logical issues.
            // Assuming the intent was to ensure the module-access query is invalidated
            // elsewhere when subscription data changes, the current setup is correct
            // for fetching. If there was an external action that changed subscription
            // status, that action's success callback should invalidate "module-access".

            const { data, error } = await supabase
                .from("user_subscriptions")
                .select("*, subscription_plans(name, tier_level)")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error checking module access:", error);
                return { hasAccess: false };
            }

            if (!data || data.length === 0) return { hasAccess: false };

            // Get the required tier for this module
            const requiredTier = MODULE_TO_TIER[moduleKey];

            // Filter for only active subscriptions
            const activeSubs = data.filter(s => s.status === 'active');
            const now = new Date();

            let hasAccess = false;
            let expiredTrial = false;
            let trialExpiresAt = null;

            for (const sub of activeSubs) {
                const userTier = sub.subscription_plans?.tier_level ?? 0;

                if (userTier >= requiredTier) {
                    // Check expiration
                    if (sub.expires_at) {
                        const expires = new Date(sub.expires_at);
                        if (expires < now) {
                            if ((sub as any).is_trial) {
                                expiredTrial = true;
                                trialExpiresAt = sub.expires_at;
                            }
                            continue;
                        }
                    }
                    hasAccess = true;
                    break;
                }
            }

            return { hasAccess, isExpired: expiredTrial, trialExpiresAt };
        },
        enabled: !!user?.id,
    });
}
