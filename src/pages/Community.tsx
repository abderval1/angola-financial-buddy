import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicChat } from "@/components/community/PublicChat";
import { DiscussionDialog } from "@/components/community/DiscussionDialog";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import {
  Users,
  Trophy,
  Flame,
  MessageCircle,
  Heart,
  Plus,
  Star,
  Target,
  Award,
  Clock,
  ChevronRight,
  Medal,
  CheckCircle,
  BookOpen,
  Edit,
  Trash2,
  X,
  Pencil,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useEffect } from "react";

export default function Community() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { awardXP, unlockAchievement } = useAchievements();
  const [selectedTab, setSelectedTab] = useState("chat");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postContent, setPostContent] = useState({ title: "", content: "", category: "tips" });
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isDiscussionDialogOpen, setIsDiscussionDialogOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostForm, setEditingPostForm] = useState({ title: "", content: "", category: "tips" });

  // Fetch user gamification
  const { data: gamification } = useQuery({
    queryKey: ["user-gamification"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_gamification")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch challenges from Supabase
  const { data: challenges = [], isLoading: isLoadingChallenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user challenges
  const { data: userChallenges = [] } = useQuery({
    queryKey: ["user-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_challenges")
        .select("*, challenges(*)")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch ranking from user_gamification
  const { data: ranking = [], isLoading: isLoadingRanking } = useQuery({
    queryKey: ["gamification-ranking"],
    queryFn: async () => {
      const { data: gamData, error } = await supabase
        .from("user_gamification")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = gamData?.map(g => g.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (gamData || []).map(g => {
        const profile = profileMap.get(g.user_id);
        return {
          ...g,
          profile_name: profile?.name || profile?.email?.split("@")[0] || "Usuário",
        };
      });
    },
  });

  // Real-time updates for community posts
  useEffect(() => {
    const channel = supabase
      .channel("community-posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_posts",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["community-posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch post reactions for the current user
  const { data: userReactions = [] } = useQuery({
    queryKey: ["user-post-reactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_reactions")
        .select("post_id")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data.map(r => r.post_id);
    },
    enabled: !!user?.id,
  });

  // Fetch community posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (postsData || []).map(p => {
        const profile = profileMap.get(p.user_id);
        return {
          ...p,
          author_name: profile?.name || profile?.email?.split("@")[0] || "Usuário",
        };
      });
    },
  });

  // Join challenge mutation
  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from("user_challenges")
        .insert({
          user_id: user?.id,
          challenge_id: challengeId,
          status: "active",
          current_progress: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
      toast.success("Você entrou no desafio!");
    },
    onError: () => {
      toast.error("Erro ao entrar no desafio");
    },
  });

  // Complete challenge mutation
  const completeChallengeMutation = useMutation({
    mutationFn: async (userChallengeId: string) => {
      const userChallenge = userChallenges.find(uc => uc.id === userChallengeId);
      const challenge = userChallenge?.challenges;
      const pointsToAdd = challenge?.points_reward || 50;

      const { error: ucError } = await supabase
        .from("user_challenges")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          current_progress: 100,
          points_earned: pointsToAdd,
        })
        .eq("id", userChallengeId);

      if (ucError) throw ucError;

      if (gamification) {
        const { error: gamError } = await supabase
          .from("user_gamification")
          .update({
            total_points: (gamification.total_points || 0) + pointsToAdd,
            challenges_completed: (gamification.challenges_completed || 0) + 1,
            last_activity_at: new Date().toISOString(),
          })
          .eq("user_id", user?.id);

        if (gamError) throw gamError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
      toast.success("Parabéns! Desafio concluído!");
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (post: typeof postContent) => {
      const { error } = await supabase.from("community_posts").insert({
        user_id: user?.id,
        title: post.title,
        content: post.content,
        category: post.category,
        is_discussion: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Post publicado!");
      unlockAchievement('active_member', 'Membro Ativo', 2);
      setIsPostDialogOpen(false);
      setPostContent({ title: "", content: "", category: "tips" });
    },
    onError: () => {
      toast.error("Erro ao publicar post");
    },
  });

  // Like/Reaction post mutation (Toggle logic)
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error("Não autenticado");

      const post = posts.find((p: any) => p.id === postId);
      if (!post) return;

      const hasLiked = userReactions.includes(postId);

      if (hasLiked) {
        // UNLIKE: Remove reaction and decrement
        const { error: rxError } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (rxError) throw rxError;

        const { error: postError } = await supabase
          .from("community_posts")
          .update({ likes_count: Math.max(0, (post.likes_count || 1) - 1) })
          .eq("id", postId);

        if (postError) throw postError;
      } else {
        // LIKE: Add reaction and increment
        const { error: rxError } = await supabase
          .from("post_reactions")
          .insert({
            post_id: postId,
            user_id: user.id,
            emoji: "❤️"
          });

        if (rxError) throw rxError;

        const { error: postError } = await supabase
          .from("community_posts")
          .update({ likes_count: (post.likes_count || 0) + 1 })
          .eq("id", postId);

        if (postError) throw postError;

        // Award XP only on new likes
        await awardXP(1, "Curtiu um post");

        // Award XP to the author
        if (post.user_id !== user.id) {
          const { data: authorGam } = await supabase
            .from("user_gamification")
            .select("total_points")
            .eq("user_id", post.user_id)
            .maybeSingle();

          await supabase
            .from("user_gamification")
            .upsert({
              user_id: post.user_id,
              total_points: (authorGam?.total_points || 0) + 1,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          // Check for Helper achievement (5 likes)
          const postLikes = (post.likes_count || 0) + 1;
          if (postLikes >= 5) {
            await unlockAchievement('helper', 'Ajudante', 2);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-post-reactions"] });
    },
    onError: (error: any) => {
      console.error("Like error:", error);
      toast.error("Erro ao atualizar reação");
    }
  });

  // Edit post mutation
  const editPostMutation = useMutation({
    mutationFn: async (post: { id: string; title: string; content: string; category: string }) => {
      const { error } = await supabase
        .from("community_posts")
        .update({
          title: post.title,
          content: post.content,
          category: post.category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Discussão atualizada!");
      setEditingPostId(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao editar discussão");
      console.error(error);
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Discussão removida!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover discussão");
      console.error(error);
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success/10 text-success";
      case "medium": return "bg-amber-500/10 text-amber-600";
      case "hard": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "Fácil";
      case "medium": return "Médio";
      case "hard": return "Difícil";
      default: return difficulty;
    }
  };

  const isUserInChallenge = (challengeId: string) => {
    return userChallenges.some(uc => uc.challenge_id === challengeId);
  };

  const getUserChallengeForChallenge = (challengeId: string) => {
    return userChallenges.find(uc => uc.challenge_id === challengeId);
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "savings": return "💰";
      case "budget": return "📊";
      case "investment": return "📈";
      case "learning": return "📚";
      case "debt": return "💳";
      default: return "🎯";
    }
  };

  return (
    <AppLayout title="Comunidade" subtitle="Conecte-se com outros angolanos na jornada financeira">
      <ModuleGuard
        moduleKey="basic"
        title="Comunidade Angola Finance"
        description="Participe em discussões, entre em desafios exclusivos e aprenda com a experiência de outros investidores."
      >
        <div className="space-y-6">
          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {Number(gamification?.total_points || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </p>
                    <p className="text-sm text-muted-foreground">Pontos Totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Award className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">Nível {gamification?.current_level || 1}</p>
                    <p className="text-sm text-muted-foreground">{gamification?.level_name || "Iniciante"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{gamification?.challenges_completed || 0}</p>
                    <p className="text-sm text-muted-foreground">Desafios Completos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{gamification?.current_streak || 0} dias</p>
                    <p className="text-sm text-muted-foreground">Sequência Atual</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="discussions" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Discussões
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Desafios
              </TabsTrigger>
              <TabsTrigger value="ranking" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Ranking
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PublicChat />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Regras do Chat
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>• Seja respeitoso com todos os membros</p>
                      <p>• Não partilhe informações pessoais sensíveis</p>
                      <p>• Foque em temas de finanças e investimentos</p>
                      <p>• Ajude outros membros sempre que possível</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Melhores comentadores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {ranking.slice(0, 5).map((r: any, index: number) => (
                          <div key={r.id} className="flex items-center gap-3">
                            <span className="font-bold text-lg w-6">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                            </span>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {r.profile_name?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">{r.profile_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {Number(r.total_points || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} pts
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Discussions Tab */}
            <TabsContent value="discussions" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Discussões da Comunidade</h3>
                <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Discussão
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Discussão</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          placeholder="Título da discussão..."
                          value={postContent.title}
                          onChange={(e) => setPostContent({ ...postContent, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select
                          value={postContent.category}
                          onValueChange={(value) => setPostContent({ ...postContent, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tips">Dicas</SelectItem>
                            <SelectItem value="question">Pergunta</SelectItem>
                            <SelectItem value="success">Caso de Sucesso</SelectItem>
                            <SelectItem value="discussion">Discussão</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Conteúdo</Label>
                        <Textarea
                          placeholder="Escreva sua discussão..."
                          rows={5}
                          value={postContent.content}
                          onChange={(e) => setPostContent({ ...postContent, content: e.target.value })}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => createPostMutation.mutate(postContent)}
                        disabled={!postContent.title || !postContent.content || createPostMutation.isPending}
                      >
                        {createPostMutation.isPending ? "Publicando..." : "Publicar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoadingPosts ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhuma discussão ainda</h3>
                    <p className="text-muted-foreground">Seja o primeiro a iniciar uma discussão!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post: any) => (
                    <Card
                      key={post.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedPost(post);
                        setIsDiscussionDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {editingPostId === post.id ? (
                              <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-2">
                                  <Label>Título</Label>
                                  <Input
                                    value={editingPostForm.title}
                                    onChange={(e) => setEditingPostForm({ ...editingPostForm, title: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Categoria</Label>
                                  <Select
                                    value={editingPostForm.category}
                                    onValueChange={(v) => setEditingPostForm({ ...editingPostForm, category: v })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="tips">Dicas</SelectItem>
                                      <SelectItem value="question">Pergunta</SelectItem>
                                      <SelectItem value="success">Sucesso</SelectItem>
                                      <SelectItem value="discussion">Discussão</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Conteúdo</Label>
                                  <Textarea
                                    value={editingPostForm.content}
                                    onChange={(e) => setEditingPostForm({ ...editingPostForm, content: e.target.value })}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" onClick={() => setEditingPostId(null)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={() => editPostMutation.mutate({ id: post.id, ...editingPostForm })}>
                                    Salvar Alterações
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {post.category === "tips" ? "Dicas" :
                                        post.category === "question" ? "Pergunta" :
                                          post.category === "success" ? "Sucesso" : "Discussão"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: pt })}
                                    </span>
                                  </div>

                                  {post.user_id === user?.id && (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingPostId(post.id);
                                          setEditingPostForm({
                                            title: post.title,
                                            content: post.content,
                                            category: post.category
                                          });
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm("Apagar esta discussão permanentemente?")) {
                                            deletePostMutation.mutate(post.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <h4 className="font-semibold text-lg mb-2 text-foreground">{post.title}</h4>
                                <p className="text-muted-foreground line-clamp-2">{post.content}</p>
                                <div className="flex items-center gap-4 mt-3">
                                  <span className="text-sm text-muted-foreground">por {post.author_name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      likePostMutation.mutate(post.id);
                                    }}
                                    className={userReactions.includes(post.id) ? "text-destructive" : "text-muted-foreground hover:text-destructive"}
                                  >
                                    <Heart className={`h-4 w-4 mr-1 ${userReactions.includes(post.id) ? "fill-current" : ""}`} />
                                    {post.likes_count || 0}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    {post.comments_count || 0}
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges" className="mt-6">
              {isLoadingChallenges ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : challenges.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhum desafio disponível</h3>
                    <p className="text-muted-foreground">Novos desafios serão adicionados em breve!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenges.map((challenge: any) => {
                    const userChallenge = getUserChallengeForChallenge(challenge.id);
                    const isJoined = !!userChallenge;
                    const isCompleted = userChallenge?.status === "completed";

                    return (
                      <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="text-4xl">{getChallengeIcon(challenge.challenge_type)}</div>
                            <Badge className={getDifficultyColor(challenge.difficulty)}>
                              {getDifficultyLabel(challenge.difficulty)}
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-lg mb-2 text-foreground">{challenge.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>

                          {isJoined && !isCompleted && (
                            <div className="mb-4">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progresso</span>
                                <span>{userChallenge.current_progress || 0}%</span>
                              </div>
                              <Progress value={userChallenge.current_progress || 0} className="h-2" />
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{challenge.duration_days} dias</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge className="bg-amber-500/10 text-amber-600">
                              <Star className="h-3 w-3 mr-1" />
                              +{challenge.points_reward} pts
                            </Badge>

                            {isCompleted ? (
                              <Badge className="bg-success/10 text-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Concluído
                              </Badge>
                            ) : isJoined ? (
                              <Button
                                size="sm"
                                onClick={() => completeChallengeMutation.mutate(userChallenge.id)}
                              >
                                Concluir
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="gradient-primary"
                                onClick={() => joinChallengeMutation.mutate(challenge.id)}
                              >
                                Participar
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Ranking Tab */}
            <TabsContent value="ranking" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Ranking Geral: Melhores comentadores
                  </CardTitle>
                  <CardDescription>Os membros mais ativos da nossa comunidade</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingRanking ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : ranking.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário no ranking ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ranking.map((r: any, index: number) => (
                        <div
                          key={r.id}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${r.user_id === user?.id
                            ? "bg-primary/10 border-2 border-primary/20"
                            : "bg-muted/50"
                            }`}
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            {index === 0 ? (
                              <span className="text-2xl">🥇</span>
                            ) : index === 1 ? (
                              <span className="text-2xl">🥈</span>
                            ) : index === 2 ? (
                              <span className="text-2xl">🥉</span>
                            ) : (
                              <span className="text-lg font-bold text-muted-foreground">
                                {index + 1}
                              </span>
                            )}
                          </div>

                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                              {r.profile_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{r.profile_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Nível {r.current_level || 1} • {r.level_name || "Iniciante"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">
                              {Number(r.total_points || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </p>
                            <p className="text-xs text-muted-foreground">pontos</p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-foreground">{r.current_streak || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ModuleGuard>

      <DiscussionDialog
        post={selectedPost}
        isOpen={isDiscussionDialogOpen}
        onOpenChange={setIsDiscussionDialogOpen}
      />
    </AppLayout>
  );
}
