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
import { toast } from "sonner";
import {
  Users,
  Trophy,
  Flame,
  MessageCircle,
  Heart,
  Share2,
  Plus,
  Star,
  Target,
  Award,
  Clock,
  ChevronRight,
  TrendingUp,
  Medal,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

export default function Community() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("challenges");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postContent, setPostContent] = useState({ title: "", content: "", category: "tips" });

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
      const { data, error } = await supabase
        .from("user_gamification")
        .select("*, profiles(name, email)")
        .order("total_points", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch community posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*, profiles(name)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
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

      // Update user challenge status
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

      // Update gamification
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Post publicado!");
      setIsPostDialogOpen(false);
      setPostContent({ title: "", content: "", category: "tips" });
    },
    onError: () => {
      toast.error("Erro ao publicar post");
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const post = posts.find((p: any) => p.id === postId);
      const { error } = await supabase
        .from("community_posts")
        .update({ likes_count: (post?.likes_count || 0) + 1 })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success/10 text-success";
      case "medium": return "bg-amber-500/10 text-amber-500";
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

  const getLevelName = (level: number) => {
    if (level >= 10) return "Mestre";
    if (level >= 7) return "Avançado";
    if (level >= 4) return "Intermediário";
    return "Iniciante";
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return "text-amber-500";
    if (level >= 7) return "text-purple-500";
    if (level >= 4) return "text-blue-500";
    return "text-muted-foreground";
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
    <AppLayout title="Comunidade & Desafios" subtitle="Conecte-se com outros angolanos na jornada financeira">
      <div className="space-y-6">
        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{gamification?.total_points || 0}</p>
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
                  <p className="text-2xl font-bold">Nível {gamification?.current_level || 1}</p>
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
                  <p className="text-2xl font-bold">{gamification?.challenges_completed || 0}</p>
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
                  <p className="text-2xl font-bold">{gamification?.current_streak || 0} dias</p>
                  <p className="text-sm text-muted-foreground">Sequência Atual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Desafios
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Feed
            </TabsTrigger>
          </TabsList>

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
                  <h3 className="text-lg font-semibold mb-2">Nenhum desafio disponível</h3>
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

                        <h3 className="font-semibold text-lg mb-2">{challenge.title}</h3>
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
                          <Badge className="bg-amber-500/10 text-amber-500">
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
                  Ranking Geral
                </CardTitle>
                <CardDescription>Os melhores poupadores de Angola</CardDescription>
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
                  <div className="space-y-4">
                    {ranking.map((userRank: any, index: number) => (
                      <div
                        key={userRank.id}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          index < 3 ? "bg-amber-500/5 border border-amber-500/20" : "bg-muted/50"
                        } ${userRank.user_id === user?.id ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? "bg-amber-500 text-white" :
                          index === 1 ? "bg-gray-400 text-white" :
                          index === 2 ? "bg-amber-700 text-white" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index < 3 ? <Medal className="h-4 w-4" /> : index + 1}
                        </div>

                        <Avatar>
                          <AvatarFallback>
                            {userRank.profiles?.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <p className="font-medium">
                            {userRank.profiles?.name || "Usuário"}
                            {userRank.user_id === user?.id && (
                              <Badge variant="outline" className="ml-2">Você</Badge>
                            )}
                          </p>
                          <p className={`text-sm ${getLevelColor(userRank.current_level || 1)}`}>
                            {userRank.level_name || getLevelName(userRank.current_level || 1)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-amber-500">{(userRank.total_points || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Post</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        createPostMutation.mutate(postContent);
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={postContent.title}
                          onChange={(e) => setPostContent(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ex: Dica de poupança"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select 
                          value={postContent.category} 
                          onValueChange={(value) => setPostContent(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tips">Dicas</SelectItem>
                            <SelectItem value="success">Histórias de Sucesso</SelectItem>
                            <SelectItem value="question">Perguntas</SelectItem>
                            <SelectItem value="discussion">Discussão</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Conteúdo</Label>
                        <Textarea
                          value={postContent.content}
                          onChange={(e) => setPostContent(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Partilhe sua experiência..."
                          rows={4}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full gradient-primary" disabled={createPostMutation.isPending}>
                        {createPostMutation.isPending ? "Publicando..." : "Publicar"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
                    <p className="text-muted-foreground">Seja o primeiro a partilhar uma dica!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post: any) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {post.profiles?.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{post.profiles?.name || "Usuário"}</span>
                            <Badge variant="outline">{post.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at || ""), { addSuffix: true, locale: pt })}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-2">{post.title}</h3>
                          <p className="text-muted-foreground">{post.content}</p>
                          
                          <div className="flex items-center gap-4 mt-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => likePostMutation.mutate(post.id)}
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              {post.likes_count || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {post.comments_count || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                              <Share2 className="h-4 w-4 mr-1" />
                              Partilhar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
