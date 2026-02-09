import { useState } from "react";
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
  Trash2,
  Save,
  CheckCircle2,
  BarChart3,
  FileText,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";

const API_KEY = 'api_live_3tK47lmZGyCDONJAH80pzlgXOLPOQWLJ9CJ02UXi21imAHabPuwbq1hu';

const categories = [
  { value: "all", label: "Todas", icon: Newspaper },
  { value: "bodiva", label: "BODIVA", icon: Building2 },
  { value: "investimentos", label: "Investimentos", icon: TrendingUp },
  { value: "renda_extra", label: "Renda Extra", icon: Briefcase },
  { value: "economia", label: "Economia", icon: Coins },
  { value: "poupanca", label: "Poupança", icon: Star },
];

const getSourceColor = (source: string) => {
  switch (source.toLowerCase()) {
    case "bna": return "bg-blue-600 text-white";
    case "bodiva": return "bg-primary text-primary-foreground";
    case "angola finance": return "bg-gradient-to-r from-primary to-primary/80 text-white";
    default: return "bg-muted text-muted-foreground";
  }
};

interface NewsItem {
  id?: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  image_url?: string;
  published_at: string;
  is_approved?: boolean;
  is_featured?: boolean;
  is_api_result?: boolean;
}

export default function News() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [mainTab, setMainTab] = useState("news");
  const [apiNews, setApiNews] = useState<NewsItem[]>([]);
  const [isFetchingApi, setIsFetchingApi] = useState(false);

  // Fetch Market Indicators
  const { data: indicators = [], isLoading: isLoadingIndicators } = useQuery({
    queryKey: ["market-indicators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_indicators")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: mainTab === "indicators",
  });

  // Fetch Weekly Reports
  const { data: reports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ["market-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_reports")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: mainTab === "reports",
  });

  // Fetch Market Trend Analysis
  const { data: trendData, isLoading: isLoadingTrend } = useQuery({
    queryKey: ["market-trend"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_trends")
        .select("content, updated_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: mainTab === "indicators",
  });

  // Fetch news from Supabase
  const { data: dbNews = [], isLoading: isLoadingDb, refetch: refetchDb } = useQuery({
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

  // Check if user is admin
  const { data: userRole } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      return data?.role;
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRole === "admin";

  // Fetch from APITube.io directly
  const fetchExternalNews = async () => {
    setIsFetchingApi(true);
    try {
      const response = await fetch(`https://api.apitube.io/v1/news/everything?per_page=30&api_key=${API_KEY}&source.country.code=ao&source.domain=expansao.co.ao&is_duplicate=0`);
      const data = await response.json();

      if (data.results) {
        const mappedResults: NewsItem[] = data.results.map((item: any) => ({
          title: item.title,
          summary: item.description || 'Sem descrição disponível.',
          source: typeof item.source === 'string' ? item.source : (item.source?.name || 'Expansão'),
          category: 'economia',
          url: item.url,
          image_url: item.image,
          published_at: item.published_at || new Date().toISOString(),
          is_api_result: true
        }));

        const newItems = mappedResults.filter(apiItem =>
          !dbNews.some(dbItem => dbItem.title === apiItem.title)
        );

        setApiNews(newItems);
        if (newItems.length > 0) {
          toast.success(`${newItems.length} novas notícias encontradas!`);
        } else {
          toast.info("Não foram encontradas novas notícias no momento.");
        }
      } else {
        throw new Error(data.message || "Erro na API de notícias");
      }
    } catch (error: any) {
      console.error("API error:", error);
      toast.error(`Erro ao buscar notícias externas: ${error.message}`);
    } finally {
      setIsFetchingApi(false);
    }
  };

  // Persist news to DB
  const saveNewsToDb = async (item: NewsItem) => {
    const { error } = await supabase.from('news').insert({
      title: item.title,
      summary: item.summary,
      source: item.source,
      category: item.category,
      url: item.url,
      image_url: item.image_url,
      published_at: item.published_at,
      is_approved: true
    });

    if (error) {
      toast.error(`Erro ao salvar notícia: ${error.message}`);
    } else {
      toast.success("Notícia guardada na base de dados!");
      setApiNews(prev => prev.filter(n => n.title !== item.title));
      refetchDb();
    }
  };

  const removeFromApiList = (title: string) => {
    setApiNews(prev => prev.filter(n => n.title !== title));
    toast.info("Item removido da lista temporária");
  };

  // Toggle favorite
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (newsId: string) => {
      const isFavorited = favorites.includes(newsId);
      if (isFavorited) {
        await supabase.from("user_news_favorites").delete().eq("user_id", user?.id).eq("news_id", newsId);
      } else {
        await supabase.from("user_news_favorites").insert({ user_id: user?.id, news_id: newsId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news-favorites"] }),
  });

  const newsBase = (isAdmin ? [...dbNews, ...apiNews] : dbNews) as NewsItem[];
  const allNews = [...newsBase].sort((a, b) =>
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const filteredNews = allNews.filter((article) => {
    const matchesSearch =
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = !showFavoritesOnly || (article.id && favorites.includes(article.id));
    return matchesSearch && matchesFavorites;
  });

  const isFavorited = (newsId?: string) => newsId ? favorites.includes(newsId) : false;

  return (
    <AppLayout title="Notícias & Mercado" subtitle="Últimas actualizações do mercado financeiro angolano">
      <ModuleGuard
        moduleKey="news"
        title="Módulo de Notícias"
        description="Fique por dentro do mercado angolano com notícias exclusivas, análises de bancos e atualizações de impostos em tempo real."
      >
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="h-4 w-4" /> Notícias
            </TabsTrigger>
            <TabsTrigger value="indicators" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Indicadores
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" /> Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-6">
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
                  onClick={isAdmin ? fetchExternalNews : () => refetchDb()}
                  disabled={isFetchingApi || isLoadingDb}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${(isFetchingApi || isLoadingDb) ? "animate-spin" : ""}`} />
                  {isFetchingApi ? "Buscando..." : "Actualizar"}
                </Button>
              </div>
            </div>

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
                {isLoadingDb && allNews.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i}><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
                    ))}
                  </div>
                ) : filteredNews.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma notícia encontrada</h3>
                      {isAdmin && (
                        <Button onClick={fetchExternalNews} disabled={isFetchingApi}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingApi ? "animate-spin" : ""}`} />
                          Buscar na Web
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNews.map((article, idx) => (
                      <Card key={article.id || `api-${idx}`} className="group hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-primary">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex gap-2 flex-wrap">
                              <Badge className={getSourceColor(article.source)}>{article.source}</Badge>
                              {article.is_api_result && <Badge variant="outline" className="text-primary border-primary">Live API</Badge>}
                            </div>
                            {article.is_featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          </div>

                          <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.summary}</p>

                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: pt })}</span>
                            </div>

                            <div className="flex gap-1">
                              {article.is_api_result && isAdmin ? (
                                <>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFromApiList(article.title)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => saveNewsToDb(article)}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : article.id ? (
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleFavoriteMutation.mutate(article.id!)}>
                                  <Heart className={`h-4 w-4 ${isFavorited(article.id) ? "fill-destructive text-destructive" : ""}`} />
                                </Button>
                              ) : null}

                              <Button size="sm" variant="outline" asChild className="h-8">
                                <a href={article.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="indicators" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoadingIndicators ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
              ) : indicators.map((indicator: any) => (
                <Card key={indicator.id} className="overflow-hidden shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{indicator.name}</span>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${indicator.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : indicator.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {indicator.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : indicator.trend === 'down' ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {indicator.change}%
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight">{indicator.value}</span>
                      <span className="text-lg font-medium text-muted-foreground">{indicator.unit}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Atualizado em: {format(new Date(indicator.updated_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Análise de Tendência
                </h3>
                {isLoadingTrend ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                      {trendData?.content || "Nenhuma análise de tendência disponível no momento."}
                    </p>
                    {trendData?.updated_at && (
                      <p className="text-xs text-muted-foreground pt-2">
                        Atualizado em: {format(new Date(trendData.updated_at), "dd/MM/yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {isLoadingReports ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : reports.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum relatório semanal disponível no momento.</p>
                </Card>
              ) : reports.map((report: any) => (
                <Card key={report.id} className="hover:shadow-md transition-all border-l-4 border-l-primary">
                  <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{report.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{report.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-xs font-semibold px-2 py-1 bg-secondary rounded text-secondary-foreground inline-block mb-1">{report.category}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{format(new Date(report.published_at), "dd 'de' MMMM", { locale: pt })}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" /> PDF
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {isAdmin && (
          <Card className="bg-primary/5 border-primary/20 mt-8">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-bold">Modo Administrador Activo</p>
                  <p className="text-xs text-muted-foreground">Podes curar a lista de notícias da API e guardar os itens aprovados na base de dados.</p>
                </div>
              </div>
              {apiNews.length > 0 && (
                <Button size="sm" onClick={() => {
                  apiNews.forEach(n => saveNewsToDb(n));
                }}>Guardar Toda a Lista</Button>
              )}
            </CardContent>
          </Card>
        )}
      </ModuleGuard>
    </AppLayout >
  );
}
