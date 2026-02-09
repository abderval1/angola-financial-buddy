import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAchievements = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const awardXP = async (points: number, reason: string) => {
        if (!user) return;

        try {
            const { data: currentGamification, error: fetchError } = await supabase
                .from("user_gamification")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (fetchError) throw fetchError;

            const total_points = (currentGamification?.total_points || 0) + points;

            // Calculate level (1000 XP per level)
            const current_level = Math.floor(total_points / 1000) + 1;

            // Basic level names
            const level_name = current_level >= 10 ? "Mestre Financeiro" :
                current_level >= 5 ? "Investidor Ativo" :
                    current_level >= 2 ? "Aprendiz Avançado" : "Iniciante";

            const { error: updateError } = await supabase
                .from("user_gamification")
                .upsert({
                    user_id: user.id,
                    total_points,
                    current_level,
                    level_name,
                    last_activity_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (updateError) throw updateError;

            toast.success(`+${points} XP: ${reason}! 🎖️`);
            queryClient.invalidateQueries({ queryKey: ["dashboard-gamification"] });
            queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
            queryClient.invalidateQueries({ queryKey: ["gamification-ranking"] });
        } catch (error) {
            console.error("Error awarding XP:", error);
        }
    };

    const unlockAchievement = async (achievementId: string, achievementName: string, points: number) => {
        if (!user) return;

        try {
            // Check if already unlocked
            const { data: existing, error: checkError } = await supabase
                .from("user_achievements")
                .select("*")
                .eq("user_id", user.id)
                .eq("achievement_id", achievementId)
                .maybeSingle();

            if (checkError) throw checkError;
            if (existing) return; // Already unlocked

            const { error: unlockError } = await supabase
                .from("user_achievements")
                .insert({
                    user_id: user.id,
                    achievement_id: achievementId,
                    unlocked_at: new Date().toISOString(),
                });

            if (unlockError) throw unlockError;

            toast.success(`Conquista Desbloqueada: ${achievementName}! 🏆`);
            await awardXP(points, `Conquista: ${achievementName}`);

            queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
        } catch (error) {
            console.error("Error unlocking achievement:", error);
        }
    };

    return { awardXP, unlockAchievement };
};
