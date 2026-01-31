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
} from "lucide-react";

const categories = [
  { value: "all", label: "Todos", icon: BookOpen },
  { value: "budgeting", label: "Orçamento", icon: Wallet },
  { value: "savings", label: "Poupança", icon: TrendingUp },
  { value: "investing", label: "Investimentos", icon: Building },
  { value: "debt", label: "Dívidas", icon: CreditCard },
  { value: "fire", label: "FIRE", icon: Flame },
];

// Sample educational content (will be fetched from DB)
const sampleContent = [
  {
    id: "1",
    title: "Introdução à Gestão Financeira Pessoal",
    description: "Aprenda os fundamentos da gestão do seu dinheiro de forma simples e prática.",
    category: "budgeting",
    content_type: "article",
    difficulty_level: "beginner",
    duration_minutes: 15,
    points_reward: 10,
    is_premium: false,
    thumbnail_url: null,
  },
  {
    id: "2",
    title: "BODIVA: Como Investir na Bolsa de Angola",
    description: "Guia completo para começar a investir em ações e títulos na BODIVA.",
    category: "investing",
    content_type: "course",
    difficulty_level: "intermediate",
    duration_minutes: 45,
    points_reward: 50,
    is_premium: true,
    thumbnail_url: null,
  },
  {
    id: "3",
    title: "Calculadora: Quanto Poupar para a Aposentadoria",
    description: "Ferramenta interativa para calcular suas necessidades de poupança.",
    category: "fire",
    content_type: "calculator",
    difficulty_level: "beginner",
    duration_minutes: 10,
    points_reward: 20,
    is_premium: false,
    thumbnail_url: null,
  },
  {
    id: "4",
    title: "Títulos do Tesouro Angolano",
    description: "Entenda como funcionam os títulos públicos e como investir neles.",
    category: "investing",
    content_type: "video",
    difficulty_level: "intermediate",
    duration_minutes: 25,
    points_reward: 30,
    is_premium: false,
    thumbnail_url: null,
  },
  {
    id: "5",
    title: "O Método FIRE para Angolanos",
    description: "Adapte a estratégia de independência financeira à realidade de Angola.",
    category: "fire",
    content_type: "course",
    difficulty_level: "advanced",
    duration_minutes: 60,
    points_reward: 100,
    is_premium: true,
    thumbnail_url: null,
  },
  {
    id: "6",
    title: "Como Sair das Dívidas em 12 Meses",
    description: "Estratégias práticas para eliminar suas dívidas de forma inteligente.",
    category: "debt",
    content_type: "article",
    difficulty_level: "beginner",
    duration_minutes: 20,
    points_reward: 15,
    is_premium: false,
    thumbnail_url: null,
  },
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredContent = sampleContent.filter(content => {
    const matchesCategory = selectedCategory === "all" || content.category === selectedCategory;
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          content.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedCount = progress.filter(p => p.is_completed).length;
  const totalPoints = gamification?.total_points || 0;
  const currentLevel = gamification?.current_level || 1;

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
        <Card className="overflow-hidden border-2 border-primary/20">
          <div className="grid md:grid-cols-2">
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <Badge className="w-fit mb-4 badge-premium">
                <Star className="h-3 w-3 mr-1" />
                Curso em Destaque
              </Badge>
              <h2 className="text-2xl font-bold mb-2">BODIVA: Guia Completo para Investidores</h2>
              <p className="text-muted-foreground mb-4">
                Aprenda a investir na Bolsa de Dívida e Valores de Angola. Desde os conceitos básicos 
                até estratégias avançadas de investimento em ações e títulos públicos.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>2 horas</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>12 lições</span>
                </div>
                <Badge className="bg-amber-500/10 text-amber-500">+200 pontos</Badge>
              </div>
              <Button className="w-fit gradient-primary">
                <Play className="h-4 w-4 mr-2" />
                Começar Curso
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center p-8">
              <div className="text-center">
                <Building className="h-24 w-24 text-primary mx-auto mb-4" />
                <p className="text-lg font-semibold text-primary">Investimentos em Angola</p>
              </div>
            </div>
          </div>
        </Card>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map((content) => {
                const ContentIcon = getContentIcon(content.content_type);
                const isCompleted = progress.some(p => p.content_id === content.id && p.is_completed);
                
                return (
                  <Card key={content.id} className="hover:shadow-lg transition-shadow group cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          content.is_premium 
                            ? "bg-gradient-to-br from-amber-500 to-orange-500" 
                            : "bg-primary/10"
                        }`}>
                          {content.is_premium ? (
                            <Lock className="h-6 w-6 text-white" />
                          ) : (
                            <ContentIcon className={`h-6 w-6 ${isCompleted ? "text-success" : "text-primary"}`} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {content.is_premium && (
                            <Badge className="badge-premium text-xs">Premium</Badge>
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

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{content.duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span>+{content.points_reward}</span>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
                          {isCompleted ? "Rever" : "Iniciar"}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      {isCompleted && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-success">
                          <Award className="h-4 w-4" />
                          <span>Concluído</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
