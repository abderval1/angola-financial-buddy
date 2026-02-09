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
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CourseViewer } from "@/components/education/CourseViewer";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import { useModuleAccess } from "@/hooks/useModuleAccess";
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
  Upload,
  FileText,
  X,
} from "lucide-react";

const CATEGORY_MAP: Record<string, { label: string; icon: any }> = {
  all: { label: "Todos", icon: BookOpen },
  budgeting: { label: "Orçamento", icon: Wallet },
  savings: { label: "Poupança", icon: TrendingUp },
  investing: { label: "Investimentos", icon: Building },
  debt: { label: "Dívidas", icon: CreditCard },
  fire: { label: "FIRE", icon: Flame },
  financas: { label: "Finanças", icon: Wallet },
  stocks: { label: "Ações", icon: TrendingUp },
  bodiva: { label: "BODIVA", icon: Building },
  business: { label: "Negócios", icon: Building },
};

const getCategoryInfo = (category: string) => {
  return CATEGORY_MAP[category] || { label: category.charAt(0).toUpperCase() + category.slice(1), icon: BookOpen };
};

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
  const [purchaseCourse, setPurchaseCourse] = useState<any | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

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

  // Fetch course purchases
  const { data: purchases = [] } = useQuery({
    queryKey: ["user-course-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_purchases")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: hasPremiumPlanAccess } = useModuleAccess("premium_content");

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

  const submitPurchaseMutation = useMutation({
    mutationFn: async ({ course, file }: { course: any, file: File }) => {
      setIsSubmittingPurchase(true);
      try {
        // 1. Upload proof to 'receipts' bucket
        const fileExt = file.name.split('.').pop();
        const filePath = `${user?.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Insert record into course_purchases
        const { error: insertError } = await supabase
          .from("course_purchases")
          .insert({
            user_id: user?.id,
            course_id: course.id,
            amount: course.price,
            payment_proof_url: filePath,
            status: 'pending'
          });

        if (insertError) throw insertError;

        return { success: true };
      } finally {
        setIsSubmittingPurchase(false);
      }
    },
    onSuccess: () => {
      toast.success("Comprovativo enviado com sucesso! Aguarde a aprovação.");
      setPurchaseCourse(null);
      setPaymentProof(null);
      queryClient.invalidateQueries({ queryKey: ["user-course-purchases"] });
    },
    onError: (error: any) => {
      console.error("Purchase error:", error);
      toast.error(`Erro ao enviar comprovativo: ${error.message}`);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  // Dynamic categories derived from content
  const dynamicCategories = [
    { value: "all", ...getCategoryInfo("all") },
    ...[...new Set(contents.map((c: any) => c.category))].map(cat => ({
      value: cat,
      ...getCategoryInfo(cat)
    }))
  ];

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

  const isCoursePurchased = (courseId: string) => {
    return hasPremiumPlanAccess || purchases.some((p: any) => p.course_id === courseId && p.status === 'approved');
  };

  const getCoursePurchaseStatus = (courseId: string) => {
    return purchases.find(p => p.course_id === courseId)?.status;
  };

  const getContentProgress = (contentId: string) => {
    const p = progress.find(p => p.content_id === contentId);
    return p?.progress_percentage || 0;
  };

  const handleContentAction = (content: any) => {
    const progressPercent = getContentProgress(content.id);

    if (content.content_type === "course") {
      // Check if course is premium and not purchased
      if (content.is_premium && !isCoursePurchased(content.id)) {
        setPurchaseCourse(content);
        return;
      }

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
      <ModuleGuard
        moduleKey="education"
        title="Módulo de Educação"
        description="Aceda a cursos exclusivos, guias práticos e calculadoras avançadas para dominar as suas finanças em Angola."
      >
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
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden h-64 md:h-auto">
                  {contents.find((c: any) => c.content_type === "course")?.thumbnail_url ? (
                    <img
                      src={contents.find((c: any) => c.content_type === "course")?.thumbnail_url}
                      alt="Curso em Destaque"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <GraduationCap className="h-24 w-24 text-primary mx-auto mb-4" />
                      <p className="text-lg font-semibold text-primary">Curso Completo</p>
                    </div>
                  )}
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
              {dynamicCategories.map((category) => (
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
                        className="hover:shadow-lg transition-all group cursor-pointer overflow-hidden border-border/50 hover:border-primary/30 flex flex-col"
                        onClick={() => isCourse && handleContentAction(content)}
                      >
                        {/* Course Thumbnail */}
                        <div className="h-40 bg-muted relative overflow-hidden shrink-0">
                          {content.thumbnail_url ? (
                            <img
                              src={content.thumbnail_url}
                              alt={content.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                              <ContentIcon className="h-10 w-10 text-primary/40" />
                            </div>
                          )}

                          {/* Floating Badges */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            {content.is_premium && (
                              <Badge className="badge-premium text-[10px] py-0 px-2 shadow-sm">
                                <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                                Premium
                              </Badge>
                            )}
                            {isCourse && (
                              <Badge className="bg-primary/90 text-primary-foreground text-[10px] py-0 px-2 shadow-sm border-none">
                                Curso
                              </Badge>
                            )}
                          </div>

                          {isCompleted && (
                            <div className="absolute inset-0 bg-success/10 flex items-center justify-center backdrop-blur-[1px]">
                              <div className="bg-white rounded-full p-1 shadow-md">
                                <CheckCircle className="h-6 w-6 text-success" />
                              </div>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className={`text-[10px] h-5 ${getDifficultyColor(content.difficulty_level)} border-none shadow-none`}>
                              {getDifficultyLabel(content.difficulty_level)}
                            </Badge>
                            {content.is_premium && content.price && (
                              <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/10 text-amber-600 border-none font-bold">
                                Kz {content.price.toLocaleString()}
                              </Badge>
                            )}
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
                            ) : (isCourse && content.is_premium && !isCoursePurchased(content.id)) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${getCoursePurchaseStatus(content.id) === 'pending' ? 'border-yellow-500 text-yellow-600' : 'border-amber-500 text-amber-600'} hover:bg-amber-500/10`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (getCoursePurchaseStatus(content.id) !== 'pending') {
                                    setPurchaseCourse(content);
                                  }
                                }}
                                disabled={getCoursePurchaseStatus(content.id) === 'pending'}
                              >
                                {getCoursePurchaseStatus(content.id) === 'pending' ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-1" />
                                    Pendente
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    Comprar
                                  </>
                                )}
                              </Button>
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

        {/* Purchase Info Modal */}
        <Dialog open={!!purchaseCourse} onOpenChange={() => setPurchaseCourse(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adquirir Curso Premium</DialogTitle>
              <DialogDescription>
                Este curso é um conteúdo premium exclusivo e pode ser adquirido separadamente.
              </DialogDescription>
            </DialogHeader>
            {purchaseCourse && (
              <div className="flex-1 overflow-y-auto max-h-[70vh] px-1 py-4 space-y-6">
                <div className="flex aspect-video rounded-lg overflow-hidden border bg-muted">
                  {purchaseCourse.thumbnail_url ? (
                    <img src={purchaseCourse.thumbnail_url} alt={purchaseCourse.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg">{purchaseCourse.title}</h3>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    Kz {purchaseCourse.price?.toLocaleString()}
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <p className="text-sm font-semibold">Como adquirir:</p>
                  <ol className="text-sm space-y-2 text-muted-foreground list-decimal pl-4">
                    <li>Faz o pagamento por IBAN (AO06.0040.0000.5481.7076.1016.6 - BAI).</li>
                    <li>O titular da conta é Agostinho Francisco Paixão do Rosário.</li>
                    <li>Faz o upload do comprovativo (Imagem ou PDF) abaixo.</li>
                    <li>O curso será libertado na tua conta após aprovação administrativa!</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Carregar Comprovativo</Label>
                  {!paymentProof ? (
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center">Clique para selecionar ou arraste o comprovativo (JPG, PNG ou PDF)</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm truncate font-medium">{paymentProof.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPaymentProof(null)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setPurchaseCourse(null);
                  setPaymentProof(null);
                }}
                className="w-full sm:w-auto"
                disabled={isSubmittingPurchase}
              >
                Cancelar
              </Button>
              <Button
                className="w-full sm:w-auto gradient-primary"
                disabled={!paymentProof || isSubmittingPurchase}
                onClick={() => submitPurchaseMutation.mutate({ course: purchaseCourse, file: paymentProof! })}
              >
                {isSubmittingPurchase ? "Enviando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Course Viewer Modal */}
        {selectedCourseId && (
          <CourseViewer
            courseId={selectedCourseId}
            isOpen={!!selectedCourseId}
            onClose={() => setSelectedCourseId(null)}
          />
        )}
      </ModuleGuard>
    </AppLayout>
  );
}
