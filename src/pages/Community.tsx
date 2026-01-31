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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

// Sample challenges
const sampleChallenges = [
  {
    id: "1",
    title: "30 Dias sem Gastos Desnecessários",
    description: "Evite compras por impulso durante 30 dias",
    challenge_type: "spending",
    target_value: 30,
    duration_days: 30,
    points_reward: 100,
    difficulty: "medium",
    participants: 234,
    icon: "🎯",
  },
  {
    id: "2",
    title: "Poupar 500.000 Kz em 3 Meses",
    description: "Meta de poupança colaborativa",
    challenge_type: "savings",
    target_value: 500000,
    duration_days: 90,
    points_reward: 200,
    difficulty: "hard",
    participants: 89,
    icon: "💰",
  },
  {
    id: "3",
    title: "Completar 10 Lições de Educação",
    description: "Aprenda sobre finanças pessoais",
    challenge_type: "learning",
    target_value: 10,
    duration_days: 14,
    points_reward: 50,
    difficulty: "easy",
    participants: 567,
    icon: "📚",
  },
];

// Sample ranking
const sampleRanking = [
  { position: 1, name: "João Silva", points: 2450, level: "Mestre", avatar: "JS" },
  { position: 2, name: "Maria Santos", points: 2180, level: "Avançado", avatar: "MS" },
  { position: 3, name: "Pedro Costa", points: 1920, level: "Avançado", avatar: "PC" },
  { position: 4, name: "Ana Fernandes", points: 1750, level: "Intermediário", avatar: "AF" },
  { position: 5, name: "Carlos Oliveira", points: 1580, level: "Intermediário", avatar: "CO" },
];

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

  // Fetch community posts
  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);
      
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Mestre": return "text-amber-500";
      case "Avançado": return "text-purple-500";
      case "Intermediário": return "text-blue-500";
      default: return "text-muted-foreground";
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleChallenges.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{challenge.icon}</div>
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {getDifficultyLabel(challenge.difficulty)}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{challenge.participants} participantes</span>
                      </div>
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
                      <Button size="sm" className="gradient-primary">
                        Participar
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Ranking Mensal
                </CardTitle>
                <CardDescription>Os melhores poupadores de Angola</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sampleRanking.map((user, index) => (
                    <div
                      key={user.position}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        index < 3 ? "bg-amber-500/5 border border-amber-500/20" : "bg-muted/50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? "bg-amber-500 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        index === 2 ? "bg-amber-700 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index < 3 ? <Medal className="h-4 w-4" /> : user.position}
                      </div>

                      <Avatar>
                        <AvatarFallback>{user.avatar}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className={`text-sm ${getLevelColor(user.level)}`}>{user.level}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-amber-500">{user.points.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">pontos</p>
                      </div>
                    </div>
                  ))}
                </div>
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

              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
                    <p className="text-muted-foreground">Seja o primeiro a partilhar uma dica!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">Usuário</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at || ""), { addSuffix: true, locale: pt })}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-2">{post.title}</h3>
                          <p className="text-muted-foreground">{post.content}</p>
                          
                          <div className="flex items-center gap-4 mt-4">
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
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
