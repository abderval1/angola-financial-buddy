import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ModuleKey = 'basic' | 'metas_fire' | 'education' | 'news' | 'premium_content';

// Map module keys to plan names and their hierarchy
const MODULE_TO_PLAN: Record<ModuleKey, string> = {
    'basic': 'Básico',
    'metas_fire': 'Essencial',
    'education': 'Pro',
    'premium_content': 'Pro',
    'news': 'Avançado'
};

// Plan hierarchy (higher plans include lower tier features)
const PLAN_HIERARCHY: Record<string, string[]> = {
    'Básico': ['Básico'],
    'Essencial': ['Básico', 'Essencial'],
    'Pro': ['Básico', 'Essencial', 'Pro'],
    'Avançado': ['Básico', 'Essencial', 'Pro', 'Avançado'],
    'Iniciante': ['Básico'] // Fallback for old data
};

export function useModuleAccess(moduleKey: ModuleKey) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["module-access", user?.id, moduleKey],
        queryFn: async () => {
            if (!user?.id) return { hasAccess: false };

            const { data, error } = await supabase
                .from("user_subscriptions")
                .select("*, subscription_plans(name)")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error checking module access:", error);
                return { hasAccess: false };
            }

            if (!data || data.length === 0) return { hasAccess: false };

            // Get the required plan for this module
            const requiredPlan = MODULE_TO_PLAN[moduleKey];

            // Filter for only active/pending subscriptions
            const activeSubs = data.filter(s => s.status === 'active');
            const now = new Date();

            // Check if user has any active subscription that grants access to this module
            let hasAccess = false;
            let expiredTrial = false;
            let trialExpiresAt = null;

            for (const sub of activeSubs) {
                const userPlanName = sub.subscription_plans?.name;
                if (!userPlanName) continue;

                // Check hierarchy
                const grantedPlans = PLAN_HIERARCHY[userPlanName] || [];
                const isPlanValid = grantedPlans.includes(requiredPlan);

                if (isPlanValid) {
                    // Check expiration
                    if (sub.expires_at) {
                        const expires = new Date(sub.expires_at);
                        if (expires < now) {
                            if (sub.is_trial) {
                                expiredTrial = true;
                                trialExpiresAt = sub.expires_at;
                            }
                            continue; // This sub is expired, check others
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
