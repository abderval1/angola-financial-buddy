import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Zap, Trophy, Target, PiggyBank } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    category: string;
    requirement: any;
}

const CATEGORIES = [
    { id: 'general', name: 'Geral', icon: Star, color: 'text-blue-500' },
    { id: 'savings', name: 'Poupança', icon: PiggyBank, color: 'text-savings' },
    { id: 'budget', name: 'Orçamento', icon: Zap, color: 'text-amber-500' },
    { id: 'investment', name: 'Investimento', icon: Target, color: 'text-investment' },
    { id: 'education', name: 'Educação', icon: Trophy, color: 'text-success' },
    { id: 'community', name: 'Comunidade', icon: Award, color: 'text-purple-500' },
];

const ACHIEVEMENTS_LIST = [
    // Geral
    { id: 'profile_complete', name: 'Perfil Completo', description: 'Preencheu seu nome, telefone e foto de perfil.', icon: '👤', points: 2, category: 'general' },
    // Poupança
    { id: 'first_goal', name: 'Primeiro Passo', description: 'Criou sua primeira meta de poupança.', icon: '🎯', points: 2, category: 'savings' },
    { id: 'beginner_saver', name: 'Poupador Iniciante', description: 'Poupou seus primeiros 10.000 Kz.', icon: '💰', points: 2, category: 'savings' },
    { id: 'goal_reached', name: 'Meta Batida!', description: 'Concluiu sua primeira meta financeira.', icon: '🏆', points: 2, category: 'savings' },
    { id: 'savings_master', name: 'Mestre da Poupança', description: 'Concluiu 5 metas diferentes.', icon: '🥇', points: 2, category: 'savings' },
    // Orçamento
    { id: 'organized', name: 'Organizado', description: 'Criou seu primeiro orçamento mensal.', icon: '📅', points: 2, category: 'budget' },
    { id: 'within_limit', name: 'Dentro do Limite', description: 'Passou um mês sem estourar o orçamento.', icon: '✅', points: 2, category: 'budget' },
    // Investimento
    { id: 'newbie_investor', name: 'Investidor Novato', description: 'Realizou seu primeiro investimento.', icon: '📈', points: 2, category: 'investment' },
    // Educação
    { id: 'apprentice', name: 'Aprendiz', description: 'Concluiu sua primeira lição financeira.', icon: '📚', points: 2, category: 'education' },
    { id: 'financial_sage', name: 'Sábio Financeiro', description: 'Acertou todas as questões de um quiz.', icon: '🎓', points: 2, category: 'education' },
    // Comunidade
    { id: 'active_member', name: 'Membro Ativo', description: 'Fez sua primeira postagem na comunidade.', icon: '💬', points: 2, category: 'community' },
    { id: 'helper', name: 'Ajudante', description: 'Recebeu 5 curtidas em suas postagens.', icon: '👍', points: 2, category: 'community' },
];

export default function Achievements() {
    const { user } = useAuth();
    const [userAchievements, setUserAchievements] = useState<string[]>([]);
    const [pointsData, setPointsData] = useState({ total_points: 0, current_level: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    const fetchUserData = async () => {
        setLoading(true);

        // Fetch XP and Level
        const { data: gamification } = await supabase
            .from('user_gamification')
            .select('total_points, current_level')
            .eq('user_id', user?.id)
            .maybeSingle();

        if (gamification) {
            setPointsData({
                total_points: gamification.total_points || 0,
                current_level: gamification.current_level || 1
            });
        }

        // Fetch Unlocked Achievements
        const { data: userAch } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', user?.id);

        setUserAchievements((userAch || []).map(a => a.achievement_id));
        setLoading(false);
    };

    const xpToNextLevel = 1000 - (pointsData.total_points % 1000);
    const progressToNextLevel = (pointsData.total_points % 1000) / 10;

    if (loading) {
        return (
            <AppLayout title="Conquistas" subtitle="Celebre suas vitórias financeiras">
                <div className="flex items-center justify-center h-64">
                    <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Minhas Conquistas" subtitle="Acompanhe seu progresso e ganhe recompensas">
            <ModuleGuard
                moduleKey="basic"
                title="Sistema de Conquistas"
                description="Seja recompensado pelo seu compromisso financeiro. Ganhe selos, suba de nível e celebre cada marco da sua jornada."
            >
                <div className="space-y-8 animate-fade-in">
                    {/* Points Summary */}
                    <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-display font-bold">Total de Pontos</CardTitle>
                                    <CardDescription>Você já acumulou {pointsData.total_points} pontos XP</CardDescription>
                                </div>
                                <div className="h-16 w-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                    <Trophy className="h-10 w-10" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-1000"
                                        style={{ width: `${progressToNextLevel}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {pointsData.total_points % 1000}/1000 XP para Nível {pointsData.current_level + 1}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Achievement Groups by Category */}
                    {CATEGORIES.map(category => {
                        const categoryAchievements = ACHIEVEMENTS_LIST.filter(a => a.category === category.id);
                        const categoryUnlocked = categoryAchievements.filter(a => userAchievements.includes(a.id)).length;

                        return (
                            <div key={category.id} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <category.icon className={`h-6 w-6 ${category.color}`} />
                                        <h3 className="text-xl font-display font-bold text-foreground">{category.name}</h3>
                                    </div>
                                    <Badge variant="secondary">
                                        {categoryUnlocked}/{categoryAchievements.length} Desbloqueadas
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categoryAchievements.map(ach => {
                                        const isUnlocked = userAchievements.includes(ach.id);
                                        return (
                                            <Card
                                                key={ach.id}
                                                className={`relative transition-all duration-300 ${isUnlocked
                                                    ? 'border-accent/30 bg-accent/5 ring-1 ring-accent/20'
                                                    : 'opacity-60 grayscale'}`}
                                            >
                                                <CardContent className="p-6">
                                                    {isUnlocked && (
                                                        <div className="absolute top-3 right-3">
                                                            <Star className="h-5 w-5 text-accent fill-accent" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-4xl ${isUnlocked ? 'bg-accent/20 shadow-lg shadow-accent/10' : 'bg-muted'
                                                            }`}>
                                                            {ach.icon || "🏆"}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-foreground">{ach.name}</h4>
                                                            <p className="text-sm text-muted-foreground leading-snug">{ach.description}</p>
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <Zap className="h-3 w-3 text-accent" />
                                                                <span className="text-xs font-bold text-accent">{ach.points} XP PARA GANHAR</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ModuleGuard>
        </AppLayout>
    );
}
