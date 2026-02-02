import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Newspaper,
  TrendingUp,
  Building2,
  Briefcase,
  Coins,
  Search,
  Heart,
  ExternalLink,
  Clock,
  RefreshCw,
  Star,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

const categories = [
  { value: "all", label: "Todas", icon: Newspaper },
  { value: "bodiva", label: "BODIVA", icon: Building2 },
  { value: "investimentos", label: "Investimentos", icon: TrendingUp },
  { value: "renda_extra", label: "Renda Extra", icon: Briefcase },
  { value: "economia", label: "Economia", icon: Coins },
  { value: "poupanca", label: "Poupança", icon: Star },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "bodiva": return "bg-primary/10 text-primary";
    case "investimentos": return "bg-success/10 text-success";
    case "renda_extra": return "bg-amber-500/10 text-amber-600";
    case "economia": return "bg-blue-500/10 text-blue-600";
    case "poupanca": return "bg-purple-500/10 text-purple-600";
    default: return "bg-muted text-muted-foreground";
  }
};

const getCategoryLabel = (category: string) => {
  const cat = categories.find(c => c.value === category);
  return cat?.label || category;
};

const getSourceColor = (source: string) => {
  switch (source.toLowerCase()) {
    case "bna": return "bg-blue-600 text-white";
    case "bodiva": return "bg-primary text-primary-foreground";
    case "kuanza": return "bg-gradient-to-r from-primary to-primary/80 text-white";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function News() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch news articles
  const { data: news = [], isLoading, refetch: refetchNews } = useQuery({
    queryKey: ["news", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("news")
        .select("*")
        .eq("is_approved", true)
        .order("published_at", { ascending: false })
        .limit(50);

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ["news-favorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_news_favorites")
        .select("news_id")
        .eq("user_id", user?.id);
      
      if (error) throw error;
      return data?.map(f => f.news_id) || [];
    },
    enabled: !!user?.id,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (newsId: string) => {
      const isFavorited = favorites.includes(newsId);
      
      if (isFavorited) {
        const { error } = await supabase
          .from("user_news_favorites")
          .delete()
          .eq("user_id", user?.id)
          .eq("news_id", newsId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_news_favorites")
          .insert({ user_id: user?.id, news_id: newsId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-favorites"] });
    },
  });

  // Refresh news mutation
  const refreshNewsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("fetch-news");
      if (error) throw error;
    },
    onSuccess: () => {
      refetchNews();
      toast.success("Notícias atualizadas!");
    },
    onError: () => {
      toast.error("Erro ao atualizar notícias");
    },
  });

  // Filter news based on search and favorites
  const filteredNews = news.filter((article: any) => {
    const matchesSearch = 
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = !showFavoritesOnly || favorites.includes(article.id);
    return matchesSearch && matchesFavorites;
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("news-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news" },
        () => {
          refetchNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchNews]);

  const isFavorited = (newsId: string) => favorites.includes(newsId);

  return (
    <AppLayout 
      title="Notícias & Mercado" 
      subtitle="Acompanhe as últimas notícias financeiras de Angola"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar notícias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
              Favoritos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshNewsMutation.mutate()}
              disabled={refreshNewsMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshNewsMutation.isPending ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
            {categories.map((category) => (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-20 mb-4" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma notícia encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? "Tente ajustar sua pesquisa" 
                      : showFavoritesOnly
                        ? "Você ainda não tem notícias favoritas"
                        : "Clique em 'Atualizar' para buscar novas notícias"
                    }
                  </p>
                  {!showFavoritesOnly && (
                    <Button 
                      onClick={() => refreshNewsMutation.mutate()}
                      disabled={refreshNewsMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshNewsMutation.isPending ? "animate-spin" : ""}`} />
                      Buscar Notícias
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNews.map((article: any) => (
                  <Card 
                    key={article.id} 
                    className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-6">
                      {/* Header with badges */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getSourceColor(article.source)}>
                            {article.source}
                          </Badge>
                          <Badge className={getCategoryColor(article.category)}>
                            {getCategoryLabel(article.category)}
                          </Badge>
                        </div>
                        {article.is_featured && (
                          <Star className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {article.summary}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {article.published_at
                              ? formatDistanceToNow(new Date(article.published_at), { 
                                  addSuffix: true, 
                                  locale: pt 
                                })
                              : "Recente"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleFavoriteMutation.mutate(article.id)}
                          >
                            <Heart 
                              className={`h-4 w-4 transition-colors ${
                                isFavorited(article.id) 
                                  ? "fill-destructive text-destructive" 
                                  : "text-muted-foreground hover:text-destructive"
                              }`} 
                            />
                          </Button>
                          {article.url && article.url !== "/education" && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="gap-1"
                            >
                              <a href={article.url} target="_blank" rel="noopener noreferrer">
                                Ler mais
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Newspaper className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Atualizações Automáticas</h3>
                <p className="text-sm text-muted-foreground">
                  As notícias são atualizadas automaticamente a cada 6 horas com dados do BNA, BODIVA e outras fontes confiáveis em Angola.
                  Marque suas notícias favoritas para acessá-las rapidamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
