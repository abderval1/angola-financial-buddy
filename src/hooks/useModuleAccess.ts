import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ModuleKey = 'metas_fire' | 'education' | 'news' | 'premium_content';

// Map module keys to plan names and their hierarchy
const MODULE_TO_PLAN: Record<ModuleKey, string> = {
    'education': 'Iniciante',
    'metas_fire': 'Essencial',
    'premium_content': 'Pro',
    'news': 'Avançado'
};

// Plan hierarchy (higher plans include lower tier features)
const PLAN_HIERARCHY: Record<string, string[]> = {
    'Iniciante': ['Iniciante'],
    'Essencial': ['Iniciante', 'Essencial'],
    'Pro': ['Iniciante', 'Essencial', 'Pro'],
    'Avançado': ['Iniciante', 'Essencial', 'Pro', 'Avançado']
};

export function useModuleAccess(moduleKey: ModuleKey) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["module-access", user?.id, moduleKey],
        queryFn: async () => {
            if (!user?.id) return false;

            const { data, error } = await supabase
                .from("user_subscriptions")
                .select("*, subscription_plans(name)")
                .eq("user_id", user?.id)
                .eq("status", "active");

            if (error) {
                console.error("Error checking module access:", error);
                return false;
            }

            if (!data || data.length === 0) return false;

            // Get the required plan for this module
            const requiredPlan = MODULE_TO_PLAN[moduleKey];

            // Check if user has any active subscription that grants access to this module
            return data.some((sub: any) => {
                const userPlanName = sub.subscription_plans?.name;
                if (!userPlanName) return false;

                // Get the plans that this user's plan grants access to
                const grantedPlans = PLAN_HIERARCHY[userPlanName] || [];

                // Check if the required plan is in the granted plans
                return grantedPlans.includes(requiredPlan);
            });
        },
        enabled: !!user?.id,
    });
}
