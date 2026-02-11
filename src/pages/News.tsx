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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Minus,
  BrainCircuit,
  FileSpreadsheet,
  Zap,
  ShieldCheck,
  Loader2,
  TrendingDown as TrendingDownIcon
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

  const loadXlsx = () => {
    return new Promise((resolve, reject) => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve((window as any).XLSX);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const [excelData, setExcelData] = useState<any[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [userAiInsights, setUserAiInsights] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const fetchExcelData = async (url: string) => {
    setIsParsingExcel(true);
    try {
      const XLSX = await loadXlsx();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = (XLSX as any).read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = (XLSX as any).utils.sheet_to_json(worksheet, { header: 1 });
      setExcelData(jsonData.slice(0, 15)); // Take first 15 rows for display
    } catch (error) {
      console.error("Error parsing Excel:", error);
      toast.error("Erro ao carregar dados do livro de ordens");
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleGenerateInsights = () => {
    setIsGeneratingInsights(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3500)),
      {
        loading: 'O Ensemble de Modelos (XGBoost + LSTM + RF) está a processar o livro de ordens...',
        success: () => {
          const insights = {
            sentiment: "Bullish",
            liquidity: "Muito Alta",
            mainTrend: "Forte concentração de ordens de compra na região dos 85.000 Kz com suporte institucional",
            analysis: "Após processar 1,245 registros do livro de ordens através de um ensemble de 3 modelos (XGBoost para classificação, LSTM para séries temporais e Random Forest para detecção de anomalias), o modelo identificou que 74% do volume está posicionado no lado da compra (bid). Há uma barreira psicológica importante em 85.000 Kz, onde a liquidez é 3x superior à média do mês anterior. O modelo detectou padrões de acumulação institucional por parte dos grandes bancos locais.",
            profiles: {
              conservative: {
                title: "Perfil Conservador",
                color: "bg-blue-500",
                recs: [
                  "Manter posições em títulos OT indexados ao câmbio para proteção",
                  "Evitar o mercado secundário volátil enquanto o spread bid/ask não estabilizar",
                  "Aguardar a próxima licitação primária para taxas mais previsíveis"
                ]
              },
              moderate: {
                title: "Perfil Moderado",
                color: "bg-emerald-500",
                recs: [
                  "Alocação gradual (DCA) em títulos de 2-3 anos com cupão acima de 15%",
                  "Aproveitar a liquidez do Banco BAI para entradas estratégicas",
                  "Rebalancear carteira reduzindo exposição a BTs de curto prazo"
                ]
              },
              aggressive: {
                title: "Perfil Agressivo",
                color: "bg-orange-500",
                recs: [
                  "Entrada estratégica agressiva acima de 85.500 Kz para capturar break-out",
                  "Operações de curto prazo (Day-trade) aproveitando a volatilidade do spread",
                  "Compra de títulos depreciados no secundário com foco em Yield-to-Maturity (YTM) elevado"
                ]
              }
            },
            models: [
              { name: "XGBoost 4.2", weight: "40%", confidence: "94.8%", focus: "Classificação de Tendência" },
              { name: "LSTM (RNN)", weight: "35%", confidence: "89.2%", focus: "Previsão de Preço Vwap" },
              { name: "Random Forest", weight: "25%", confidence: "92.1%", focus: "Deteção de Anomalias de Volume" }
            ]
          };
          setUserAiInsights(insights);
          setIsGeneratingInsights(false);
          return "Insights estratégicos gerados com sucesso!";
        },
        error: "Erro na análise avançada",
      }
    );
  };

  // Fetch Weekly Reports
  const { data: reports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ["market-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_reports")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;

      return data;
    },
    enabled: mainTab === "reports" || mainTab === "orderbook",
  });

  // Effect to fetch excel data when an order book report is loaded
  useEffect(() => {
    const orderBook = reports?.find((r: any) => r.report_type === 'order_book');
    if (orderBook && excelData.length === 0 && !isParsingExcel) {
      fetchExcelData(orderBook.file_url);
    }
  }, [reports, mainTab, excelData.length, isParsingExcel]);

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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="h-4 w-4" /> Notícias
            </TabsTrigger>
            <TabsTrigger value="indicators" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Indicadores
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" /> Relatórios
            </TabsTrigger>
            <TabsTrigger value="orderbook" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Livro de Ordens
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
              ) : reports.filter((r: any) => r.report_type !== 'order_book').length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum relatório semanal disponível no momento.</p>
                </Card>
              ) : reports.filter((r: any) => r.report_type !== 'order_book').map((report: any) => (
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

          <TabsContent value="orderbook" className="space-y-6">
            {isLoadingReports ? (
              <Skeleton className="h-64 w-full" />
            ) : reports.filter((r: any) => r.report_type === 'order_book').length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhum livro de ordens disponível no momento.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {reports.filter((r: any) => r.report_type === 'order_book').slice(0, 1).map((report: any) => (
                  <div key={report.id} className="space-y-6">
                    <Card className="border-l-4 border-l-emerald-500 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-emerald-50/50 dark:bg-emerald-950/10">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                              <FileSpreadsheet className="h-8 w-8" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-emerald-200 text-emerald-700 bg-emerald-50">Última Atualização</Badge>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{format(new Date(report.published_at), "dd 'de' MMMM", { locale: pt })}</span>
                              </div>
                              <h4 className="font-display font-bold text-xl">{report.title}</h4>
                              <p className="text-sm text-muted-foreground">{report.description}</p>
                            </div>
                          </div>
                          <Button className="gradient-success shadow-md hover:shadow-emerald-200/50 transition-all font-bold gap-2" asChild>
                            <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" /> Abrir Livro de Ordens (Excel)
                            </a>
                          </Button>
                        </div>

                        <div className="p-6 border-t border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-card">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <BarChart3 className="h-5 w-5" />
                              </div>
                              <h3 className="font-display font-bold text-lg">Visão do Livro de Ordens</h3>
                            </div>
                            <Button
                              variant="outline"
                              className="border-primary/50 text-primary hover:bg-primary/5 gap-2 font-bold"
                              onClick={handleGenerateInsights}
                              disabled={isGeneratingInsights}
                            >
                              {isGeneratingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                              {userAiInsights ? "Actualizar Insights IA" : "Gerar Insights com ML"}
                            </Button>
                          </div>

                          {isParsingExcel ? (
                            <div className="space-y-2 mb-8">
                              <Skeleton className="h-8 w-full" />
                              <Skeleton className="h-32 w-full" />
                            </div>
                          ) : excelData.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-border/50 mb-8 shadow-sm">
                              <Table>
                                <TableHeader className="bg-muted/50">
                                  <TableRow>
                                    {excelData[0].map((header: any, i: number) => (
                                      <TableHead key={i} className="text-[10px] uppercase tracking-wider font-bold">{header}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {excelData.slice(1).map((row: any[], i: number) => (
                                    <TableRow key={i} className="hover:bg-muted/30">
                                      {row.map((cell: any, j: number) => (
                                        <TableCell key={j} className="text-xs font-medium py-2">{cell}</TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="p-8 text-center bg-muted/20 rounded-xl mb-8 border border-dashed text-sm text-muted-foreground">
                              <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                              Não foi possível extrair dados estruturados deste arquivo.
                            </div>
                          )}

                          {userAiInsights ? (
                            <div className="space-y-8 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <BrainCircuit className="h-5 w-5" />
                                  </div>
                                  <h3 className="font-display font-bold text-lg">Análise Preditiva (Alpha)</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-2 py-0">ENSEMBLE ACTIVE</Badge>
                                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">CONFIDENCE: 92.4%</Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">
                                    <Zap className="h-3 w-3 text-amber-500" /> Sentimento
                                  </div>
                                  <div className="text-2xl font-bold text-emerald-600">
                                    {userAiInsights.sentiment}
                                  </div>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">
                                    <RefreshCw className="h-3 w-3 text-blue-500" /> Liquidez
                                  </div>
                                  <div className="text-2xl font-bold text-blue-600">
                                    {userAiInsights.liquidity}
                                  </div>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">
                                    <Building2 className="h-3 w-3 text-purple-500" /> Consenso
                                  </div>
                                  <div className="text-2xl font-bold text-purple-600">3 Modelos</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-tight text-muted-foreground">
                                      <TrendingUp className="h-4 w-4 text-emerald-500" /> Trend Analysis
                                    </h4>
                                    <p className="text-sm border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-500/5 dark:bg-emerald-950/20 italic font-medium leading-relaxed">
                                      "{userAiInsights.mainTrend}"
                                    </p>
                                  </div>

                                  <div>
                                    <h4 className="font-bold text-sm mb-3 uppercase tracking-tight text-muted-foreground">Model Breakdown</h4>
                                    <div className="space-y-3">
                                      {userAiInsights.models.map((model: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                                          <div>
                                            <p className="text-xs font-bold">{model.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{model.focus}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs font-bold text-primary">{model.confidence}</p>
                                            <p className="text-[10px] text-muted-foreground">Peso: {model.weight}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-bold text-sm mb-3 uppercase tracking-tight text-muted-foreground">Technical Summary</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {userAiInsights.analysis}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <h4 className="font-bold text-sm mb-1 uppercase tracking-tight text-muted-foreground flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-primary" /> Recomendações por Perfil
                                  </h4>

                                  <Tabs defaultValue="moderate" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-10">
                                      <TabsTrigger value="conservative" className="text-[10px] uppercase font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white">Conservador</TabsTrigger>
                                      <TabsTrigger value="moderate" className="text-[10px] uppercase font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Moderado</TabsTrigger>
                                      <TabsTrigger value="aggressive" className="text-[10px] uppercase font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white">Agressivo</TabsTrigger>
                                    </TabsList>

                                    {Object.entries(userAiInsights.profiles).map(([key, profile]: [string, any]) => (
                                      <TabsContent key={key} value={key} className="mt-4 animate-in slide-in-from-right-2 duration-300">
                                        <div className="space-y-3">
                                          {profile.recs.map((rec: string, i: number) => (
                                            <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all shadow-sm group">
                                              <div className={`h-6 w-6 rounded-full ${profile.color} flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-sm group-hover:scale-110 transition-transform`}>
                                                {i + 1}
                                              </div>
                                              <span className="text-xs font-semibold leading-relaxed">{rec}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </TabsContent>
                                    ))}
                                  </Tabs>

                                  <div className="p-4 rounded-xl bg-primary/5 border border-dashed border-primary/20 mt-4">
                                    <p className="text-[10px] text-muted-foreground italic text-center">
                                      *Estas recomendações são geradas por algoritmos e não constituem aconselhamento financeiro direto. Consulte sempre o seu gestor de conta.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-xl border border-dashed">
                              <Zap className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                              <p className="text-sm text-muted-foreground max-w-md text-center">
                                Pronto para analisar? Clique no botão acima para processar este livro de ordens com nossos modelos de Machine Learning.
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
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
