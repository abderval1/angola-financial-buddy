import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ModuleKey = 'basic' | 'metas_fire' | 'education' | 'news' | 'premium_content' | 'reports' | 'advanced_analytics';

const MODULE_TO_TIER: Record<ModuleKey, number> = {
    'basic': 1,
    'metas_fire': 2, // Essencial (Tier 2)
    'education': 3, // Pro (Tier 3)
    'premium_content': 3, // Pro (Tier 3)
    'news': 4, // Avançado (Tier 4)
    'reports': 4, // Avançado (Tier 4)
    'advanced_analytics': 4 // Avançado (Tier 4)
};

export function useModuleAccess(moduleKey: ModuleKey) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ["module-access", user?.id, moduleKey],
        queryFn: async () => {
            if (!user?.id) return { hasAccess: false };

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

            // Consider active and trailing subscriptions
            const now = new Date();
            let hasAccess = false;
            let expiredTrial = false;
            let trialExpiresAt = null;

            for (const sub of data) {
                // Handle subscription_plans as object or array
                const plan: any = Array.isArray(sub.subscription_plans)
                    ? sub.subscription_plans[0]
                    : sub.subscription_plans;

                const userTier = plan?.tier_level ?? 0;
                const isActive = sub.status === 'active' || sub.status === 'trialing';

                if (isActive && userTier >= requiredTier) {
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

            // Special case: Admin always has access to everything
            try {
                const { data: roleData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (roleData?.role === 'admin') {
                    return { hasAccess: true, isExpired: false };
                }
            } catch (e) {
                console.error("Role check in useModuleAccess failed", e);
            }

            return { hasAccess, isExpired: expiredTrial, trialExpiresAt };
        },
        enabled: !!user?.id,
    });
}
