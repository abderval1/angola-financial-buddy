import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseViewer } from "@/components/education/CourseViewer";
import { toast } from "sonner";
import {
  GraduationCap,
  Play,
  BookOpen,
  Video,
  Calculator,
  Award,
  Clock,
  ChevronRight,
  Search,
  Star,
  Lock,
  TrendingUp,
  Flame,
  Wallet,
  CreditCard,
  Building,
  CheckCircle,
} from "lucide-react";

const categories = [
  { value: "all", label: "Todos", icon: BookOpen },
  { value: "budgeting", label: "Orçamento", icon: Wallet },
  { value: "savings", label: "Poupança", icon: TrendingUp },
  { value: "investing", label: "Investimentos", icon: Building },
  { value: "debt", label: "Dívidas", icon: CreditCard },
  { value: "fire", label: "FIRE", icon: Flame },
];

const getContentIcon = (type: string) => {
  switch (type) {
    case "video": return Video;
    case "calculator": return Calculator;
    case "course": return GraduationCap;
    default: return BookOpen;
  }
};

const getDifficultyColor = (level: string) => {
  switch (level) {
    case "beginner": return "bg-success/10 text-success";
    case "intermediate": return "bg-amber-500/10 text-amber-500";
    case "advanced": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

const getDifficultyLabel = (level: string) => {
  switch (level) {
    case "beginner": return "Iniciante";
    case "intermediate": return "Intermediário";
    case "advanced": return "Avançado";
    default: return level;
  }
};

export default function Education() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Fetch educational content from Supabase
  const { data: contents = [], isLoading: isLoadingContent } = useQuery({
    queryKey: ["educational-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("educational_content")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user progress
  const { data: progress = [] } = useQuery({
    queryKey: ["user-content-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_content_progress")
        .select("*")
        .eq("user_id", user?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch gamification stats
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

  // Start content mutation
  const startContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const existing = progress.find(p => p.content_id === contentId);
      if (existing) return existing;

      const { data, error } = await supabase
        .from("user_content_progress")
        .insert({
          user_id: user?.id,
          content_id: contentId,
          progress_percentage: 0,
          is_completed: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, contentId) => {
      queryClient.invalidateQueries({ queryKey: ["user-content-progress"] });
      // Open course viewer for courses
      const content = contents.find((c: any) => c.id === contentId);
      if (content?.content_type === "course") {
        setSelectedCourseId(contentId);
      } else {
        toast.success("Conteúdo iniciado!");
      }
    },
  });

  // Complete content mutation (for non-course content)
  const completeContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const content = contents.find((c: any) => c.id === contentId);
      const pointsToAdd = content?.points_reward || 10;

      // Update progress
      const { error: progressError } = await supabase
        .from("user_content_progress")
        .upsert({
          user_id: user?.id,
          content_id: contentId,
          progress_percentage: 100,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
      
      if (progressError) throw progressError;

      // Update gamification points
      if (gamification) {
        const { error: gamError } = await supabase
          .from("user_gamification")
          .update({
            total_points: (gamification.total_points || 0) + pointsToAdd,
            lessons_completed: (gamification.lessons_completed || 0) + 1,
            last_activity_at: new Date().toISOString(),
          })
          .eq("user_id", user?.id);
        
        if (gamError) throw gamError;
      }

      // Increment view count
      await supabase
        .from("educational_content")
        .update({ view_count: (content?.view_count || 0) + 1 })
        .eq("id", contentId);
    },
    onSuccess: (_, contentId) => {
      const content = contents.find((c: any) => c.id === contentId);
      queryClient.invalidateQueries({ queryKey: ["user-content-progress"] });
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
      toast.success(`Parabéns! Você ganhou ${content?.points_reward || 10} pontos!`);
    },
    onError: () => {
      toast.error("Erro ao completar conteúdo");
    },
  });

  const filteredContent = contents.filter((content: any) => {
    const matchesCategory = selectedCategory === "all" || content.category === selectedCategory;
    const matchesSearch = content.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          content.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedCount = progress.filter(p => p.is_completed).length;
  const totalPoints = gamification?.total_points || 0;
  const currentLevel = gamification?.current_level || 1;

  const isContentCompleted = (contentId: string) => {
    return progress.some(p => p.content_id === contentId && p.is_completed);
  };

  const getContentProgress = (contentId: string) => {
    const p = progress.find(p => p.content_id === contentId);
    return p?.progress_percentage || 0;
  };

  const handleContentAction = (content: any) => {
    const progressPercent = getContentProgress(content.id);
    
    if (content.content_type === "course") {
      // For courses, always open the viewer
      if (progressPercent === 0) {
        startContentMutation.mutate(content.id);
      } else {
        setSelectedCourseId(content.id);
      }
    } else {
      // For other content types
      if (progressPercent === 0) {
        startContentMutation.mutate(content.id);
      } else {
        completeContentMutation.mutate(content.id);
      }
    }
  };

  return (
    <AppLayout title="Educação Financeira" subtitle="Aprenda a gerir o seu dinheiro de forma inteligente">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Lições Concluídas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Pontos Ganhos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Award className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Nível {currentLevel}</p>
                  <p className="text-sm text-muted-foreground">{gamification?.level_name || "Iniciante"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{gamification?.current_streak || 0}</p>
                  <p className="text-sm text-muted-foreground">Dias de Sequência</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Course */}
        {contents.length > 0 && contents.some((c: any) => c.content_type === "course") && (
          <Card className="overflow-hidden border-2 border-primary/20">
            <div className="grid md:grid-cols-2">
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-4 badge-premium">
                  <Star className="h-3 w-3 mr-1" />
                  Curso em Destaque
                </Badge>
                <h2 className="text-2xl font-bold mb-2">
                  {contents.find((c: any) => c.content_type === "course")?.title || "Curso Premium"}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {contents.find((c: any) => c.content_type === "course")?.description || "Conteúdo exclusivo para assinantes premium."}
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{contents.find((c: any) => c.content_type === "course")?.duration_minutes || 60} min</span>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-500">
                    +{contents.find((c: any) => c.content_type === "course")?.points_reward || 100} pontos
                  </Badge>
                </div>
                <Button 
                  className="w-fit gradient-primary"
                  onClick={() => {
                    const course = contents.find((c: any) => c.content_type === "course");
                    if (course) handleContentAction(course);
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Começar Curso
                </Button>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center p-8">
                <div className="text-center">
                  <GraduationCap className="h-24 w-24 text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-primary">Curso Completo</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
            {categories.map((category) => (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {isLoadingContent ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredContent.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Tente ajustar sua pesquisa" 
                      : "Novos conteúdos serão adicionados em breve!"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.map((content: any) => {
                  const ContentIcon = getContentIcon(content.content_type);
                  const isCompleted = isContentCompleted(content.id);
                  const progressPercent = getContentProgress(content.id);
                  const isCourse = content.content_type === "course";
                  
                  return (
                    <Card 
                      key={content.id} 
                      className="hover:shadow-lg transition-shadow group cursor-pointer"
                      onClick={() => isCourse && handleContentAction(content)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                            content.is_premium 
                              ? "bg-gradient-to-br from-amber-500 to-orange-500" 
                              : isCompleted
                                ? "bg-success/20"
                                : "bg-primary/10"
                          }`}>
                            {content.is_premium ? (
                              <Lock className="h-6 w-6 text-white" />
                            ) : isCompleted ? (
                              <CheckCircle className="h-6 w-6 text-success" />
                            ) : (
                              <ContentIcon className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {content.is_premium && (
                              <Badge className="badge-premium text-xs">Premium</Badge>
                            )}
                            {isCourse && (
                              <Badge className="bg-primary/10 text-primary text-xs">Curso</Badge>
                            )}
                            <Badge className={getDifficultyColor(content.difficulty_level)}>
                              {getDifficultyLabel(content.difficulty_level)}
                            </Badge>
                          </div>
                        </div>

                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {content.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {content.description}
                        </p>

                        {progressPercent > 0 && progressPercent < 100 && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progresso</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{content.duration_minutes || 10} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500" />
                              <span>+{content.points_reward || 10}</span>
                            </div>
                          </div>

                          {isCompleted ? (
                            <Badge className="bg-success/10 text-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Concluído
                            </Badge>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="group-hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContentAction(content);
                              }}
                            >
                              {isCourse 
                                ? (progressPercent > 0 ? "Continuar" : "Iniciar Curso")
                                : (progressPercent > 0 ? "Concluir" : "Iniciar")
                              }
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
        </Tabs>
      </div>

      {/* Course Viewer Modal */}
      {selectedCourseId && (
        <CourseViewer
          courseId={selectedCourseId}
          isOpen={!!selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
    </AppLayout>
  );
}
