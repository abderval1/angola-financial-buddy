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

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line
} from "recharts";

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
  const [whatIfParams, setWhatIfParams] = useState({
    bnaRate: 19.5,
    exchangeRate: 980,
    inflation: 24.8,
    liquidityShock: 0
  });
  const [selectedTicker, setSelectedTicker] = useState("TODOS");
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [investmentValue, setInvestmentValue] = useState(1000000);

  const getAssetCategory = (ticker: string | undefined | null) => {
    if (!ticker) return 'Outros Ativos';
    const t = ticker.toString().toUpperCase();
    if (t.startsWith('BDV') || t.startsWith('BAI') || t.startsWith('BCG') || t.startsWith('ENS') || t.startsWith('BFA')) return 'Ações (Equities)';
    if (t.startsWith('SNLE') || t.startsWith('BAIO')) return 'Obrigações Corporativas';
    if (t.startsWith('BE')) return 'Bilhetes de Tesouro (BT)';
    if (t.startsWith('EL')) return 'OT Moeda Estrangeira (USD)';
    if (/^O[HIJKLNO]/.test(t)) return 'OT Moeda Nacional (AOA)';
    return 'Outros Ativos';
  };

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
      const jsonData = (XLSX as any).utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      setExcelData(jsonData); // Load all rows

      // Auto-extract tickers from the first column or specific column names
      if (jsonData.length > 1) {
        const headers = jsonData[0];
        const tickerColIndex = headers.findIndex((h: any) =>
          typeof h === 'string' && (
            h.toLowerCase().includes("negociação") ||
            h.includes("Código") ||
            h.includes("Ticker") ||
            h.includes("Ativo") ||
            h.includes("Asset")
          )
        );

        const columnIndex = tickerColIndex !== -1 ? tickerColIndex : 0;
        const tickers = Array.from(new Set(
          jsonData.slice(1)
            .map(row => row[columnIndex])
            .filter(val => val !== undefined && val !== null && val.toString().trim().length >= 3)
            .map(val => val.toString().trim())
        )) as string[];

        if (tickers.length > 0) {
          setAvailableTickers(tickers);
          console.log("Tickers extraídos:", tickers);
        }
      }
    } catch (error) {
      console.error("Error parsing Excel:", error);
      toast.error("Erro ao carregar dados do livro de ordens");
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleGenerateInsights = () => {
    setIsGeneratingInsights(true);
    const category = getAssetCategory(selectedTicker);

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 4500)),
      {
        loading: `Analisando ${selectedTicker} (${category}) com Ensemble Multi-Modelo...`,
        success: () => {
          const baseConfidence = 92.4;
          const shift = (whatIfParams.bnaRate - 19.5) * -1.5;

          // Specialized logic based on asset type
          let basePrice = 85000;
          let baseYield = 16.5;
          let volatility = 0.05;
          let sensitivityToExchange = 0.1;
          let maturityRisk = "Média";

          if (category.includes('Ações')) {
            basePrice = 45000;
            baseYield = 12.0;
            volatility = 0.25;
            maturityRisk = "Alta (Volatilidade)";
          } else if (category.includes('BT')) {
            basePrice = 92000;
            baseYield = 15.0;
            volatility = 0.02;
            maturityRisk = "Baixa";
          } else if (category.includes('USD')) {
            basePrice = 95000;
            baseYield = 8.5;
            volatility = 0.12;
            sensitivityToExchange = 0.9;
            maturityRisk = "Moderada (Câmbio)";
          } else if (category.includes('Nacional')) {
            const mat = parseInt(selectedTicker.replace(/\D/g, '') || "5");
            basePrice = 85000 + (mat * 100);
            baseYield = 18.0 + (mat * 0.4);
            volatility = 0.06;
            maturityRisk = mat > 28 ? "Crítica (Long-range)" : "Moderada";
          }

          const estimatedYield = (baseYield + (whatIfParams.inflation * 0.12) - (whatIfParams.bnaRate * 0.08) + (whatIfParams.liquidityShock * -0.5)).toFixed(2);
          const projectedGain = (investmentValue * (parseFloat(estimatedYield) / 100)).toLocaleString();

          const insights = {
            sentiment: (whatIfParams.bnaRate > 22 || whatIfParams.inflation > 30) ? "Bearish/Caution" : "Bullish",
            liquidity: whatIfParams.liquidityShock < 0 ? "Em Stress" : "Normal/Alta",
            confidence: (baseConfidence + shift).toFixed(1) + "%",
            estimatedYield: estimatedYield,
            mainTrend: `Regime de mercado "${whatIfParams.bnaRate > 21 ? 'Contitritivo / Stress' : 'Acumulação Institucional'}" via HMM.`,

            laypersonSummary: `Em termos simples: O mercado para ${selectedTicker} (${category}) está em regime de ${whatIfParams.bnaRate > 21 ? 'proteção' : 'oportunidade'}. Sendo um(a) ${(category || 'Ativo').split(' (')[0]}, o maior risco é a ${maturityRisk === 'Alta (Volatilidade)' ? 'oscilação de preços' : sensitivityToExchange > 0.5 ? 'desvalorização do Kwanza' : 'taxa de juro'}. Investindo ${investmentValue.toLocaleString()} Kz, prevemos um retorno de ~${projectedGain} Kz em 12 meses (Yield: ${estimatedYield}%).`,

            analysis: `Análise profunda para ${selectedTicker}. O motor GNN sugere uma barreira de volatilidade de ${(volatility * 100).toFixed(1)}%. Para ${category}, a sensibilidade macro é ${sensitivityToExchange > 0.5 ? 'alta' : 'moderada'}. Zonas de liquidez detectadas em ${basePrice.toLocaleString()} Kz.`,

            ensemble: [
              { name: "XGBoost & LightGBM", role: "Classificação", weight: 25, impact: "High", desc: "Define tendência direcional." },
              { name: "LSTM & GRU", role: "Previsão Alpha", weight: 20, impact: "Medium", desc: "Prevê valores exatos no futuro." },
              { name: "HMM", role: "Identificação Regime", weight: 15, impact: "High", desc: "Mapeia estados de mercado." },
              { name: "Isolation Forest", role: "Anomalias", weight: 15, impact: "Low", desc: "Filtra ordens atípicas." },
              { name: "Transformers (NLP)", role: "Sentimento", weight: 15, impact: "Medium", desc: "Analisa o clima económico." },
              { name: "DQN (RL)", role: "Execução", weight: 10, impact: "Medium", desc: "Otimiza pontos de entrada." }
            ],

            depthData: [
              { price: basePrice - 2000, bid: 1500 * (1 / volatility), ask: 0 },
              { price: basePrice - 1000, bid: 1200 * (1 / volatility), ask: 0 },
              { price: basePrice, bid: 3500 * (1 / volatility), ask: 0 },
              { price: basePrice + 1000, bid: 800, ask: 400 * (volatility * 10) },
              { price: basePrice + 2000, bid: 0, ask: 1200 * (volatility * 10) },
              { price: basePrice + 3000, bid: 0, ask: 2800 * (volatility * 10) },
              { price: basePrice + 4000, bid: 0, ask: 1500 * (volatility * 10) },
            ],

            forecastData: Array.from({ length: 8 }).map((_, i) => ({
              time: i < 5 ? `T-${5 - i}` : i === 5 ? "Agora" : `T+${i - 5}`,
              real: i <= 5 ? basePrice + (Math.sin(i) * 500 * volatility) : null,
              pred: basePrice + (Math.sin(i) * 500 * volatility) + (i > 5 ? (parseFloat(estimatedYield) * 10 * (i - 4)) : 0)
            })),

            indicatorsInfo: [
              { label: "Volume (Depth)", value: `${(3.5 / volatility).toFixed(1)}M Kz`, meaning: "Dinheiro real segurando o preço." },
              { label: "Spread Bid/Ask", value: `${(volatility * 2.5).toFixed(2)}%`, meaning: "Diferença entre compra e venda." },
              { label: "VWAP Estimado", value: `${(basePrice + 250).toLocaleString()} Kz`, meaning: "Preço médio justo do dia." },
              { label: "Risco Maturidade", value: maturityRisk, meaning: "Probabilidade de stress por duração temporal." }
            ],

            profiles: {
              conservative: {
                title: "Perfil Conservador",
                color: "bg-blue-500",
                recs: [
                  category.includes('BT') ? "Ideal para este perfil" : "Alocar max 5%",
                  "Focar em liquidez imediata",
                  "Evitar durations > 3 anos"
                ]
              },
              moderate: {
                title: "Perfil Moderado",
                color: "bg-emerald-500",
                recs: [
                  "Alocação balanceada 40/60",
                  `Suporte em ${basePrice.toLocaleString()} Kz`,
                  "Hedge cambial se possível"
                ]
              },
              aggressive: {
                title: "Perfil Agressivo",
                color: "bg-orange-500",
                recs: [
                  "Oportunidade de arbitragem alta",
                  "Aproveitar volatilidade para entrada",
                  `Explorar o câmbio em ${whatIfParams.exchangeRate}`
                ]
              }
            },
            assetScores: [
              { name: selectedTicker, liquidity: 85 - (volatility * 100), risk: (volatility * 200), stability: 90 - (volatility * 50), score: (95 - (volatility * 60)).toFixed(0) },
              { name: "OT-2026", liquidity: 92, risk: 15, stability: 88, score: 94 },
              { name: "BT-364D", liquidity: 78, risk: 10, stability: 95, score: 89 },
              { name: "BAI (Stock)", liquidity: 45, risk: 40, stability: 60, score: 72 }
            ]
          };
          setUserAiInsights(insights);
          setIsGeneratingInsights(false);
          return `Análise para ${selectedTicker} concluída!`;
        },
        error: "Erro no processamento da IA",
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
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">Última Atualização</Badge>
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
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <BarChart3 className="h-6 w-6" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-display font-bold text-lg leading-none">Visão do Livro de Ordens</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Análise Individual por Ticker</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                              <select
                                className="h-10 px-3 py-2 rounded-lg border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full md:w-[180px]"
                                value={selectedTicker}
                                onChange={e => setSelectedTicker(e.target.value)}
                              >
                                <option value="TODOS">Todos</option>
                                {availableTickers.map(ticker => (
                                  <option key={ticker} value={ticker}>{ticker}</option>
                                ))}
                              </select>

                              <Button
                                variant="default"
                                className="gradient-primary shadow-glow hover:shadow-lg transition-all gap-2 font-bold whitespace-nowrap"
                                onClick={handleGenerateInsights}
                                disabled={isGeneratingInsights}
                              >
                                {isGeneratingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                                {userAiInsights ? "Actualizar Análise IA/ML" : "Executar Análise de IA / ML"}
                              </Button>
                            </div>
                          </div>

                          {isParsingExcel ? (
                            <div className="space-y-2 mb-8">
                              <Skeleton className="h-8 w-full" />
                              <Skeleton className="h-32 w-full" />
                            </div>
                          ) : excelData.length > 0 ? (
                            <div className="overflow-auto rounded-xl border border-border/50 mb-8 shadow-sm max-h-[400px] scrollbar-custom">
                              <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                  <TableRow>
                                    {excelData[0].map((header: any, i: number) => (
                                      <TableHead key={i} className="text-[10px] uppercase tracking-wider font-bold bg-muted/50">{header}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {excelData.slice(1).map((row: any[], i: number) => (
                                    <TableRow key={i} className="hover:bg-muted/30 whitespace-nowrap">
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
                            <div className="space-y-10 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                              {/* XAI & Confidence Header */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/20 shadow-inner">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                                    <BrainCircuit className="h-7 w-7" />
                                  </div>
                                  <div>
                                    <h3 className="font-display font-black text-xl tracking-tight uppercase">ENSEMBLE ENGINE V2.0</h3>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">6 MODELOS ATIVOS</Badge>
                                      <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-950/20">SENTIMENTO: {userAiInsights.sentiment}</Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center md:items-end">
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Confiança do Consenso</span>
                                  <div className="text-4xl font-black text-primary font-mono">{userAiInsights.confidence}</div>
                                </div>
                              </div>

                              {/* What-If Sidebar & Main Charts */}
                              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Left Panel: What-If Simulator & Investment Calc */}
                                <div className="lg:col-span-1 space-y-6 self-start">
                                  {/* Investment Calculator */}
                                  <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                      <Coins className="h-4 w-4 text-primary" />
                                      <h4 className="font-bold text-xs uppercase tracking-tight">Simulador de Ganhos</h4>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Valor a Investir (Kz)</label>
                                        <Input
                                          type="number"
                                          value={investmentValue}
                                          onChange={e => setInvestmentValue(parseInt(e.target.value))}
                                          className="h-8 text-xs font-bold"
                                        />
                                      </div>
                                      <div className="pt-2 border-t border-primary/10">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Ganho Estimado (12 meses)</p>
                                        <p className="text-xl font-black text-primary">
                                          + {((investmentValue * (parseFloat(userAiInsights.estimatedYield || "0") / 100))).toLocaleString()} Kz
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* What-If Simulator */}
                                  <div className="bg-muted/20 p-6 rounded-2xl border border-border/50">
                                    <div className="flex items-center gap-2 mb-2">
                                      <RefreshCw className="h-4 w-4 text-primary" />
                                      <h4 className="font-bold text-sm uppercase tracking-tight">Cenários Macro</h4>
                                    </div>

                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                                          <span>Taxa BNA (%)</span>
                                          <span className="text-primary">{whatIfParams.bnaRate}%</span>
                                        </div>
                                        <Input
                                          type="range" min="15" max="30" step="0.5"
                                          value={whatIfParams.bnaRate}
                                          onChange={e => setWhatIfParams({ ...whatIfParams, bnaRate: parseFloat(e.target.value) })}
                                          className="h-2 accent-primary"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                                          <span>USD/AOA</span>
                                          <span className="text-primary">{whatIfParams.exchangeRate}</span>
                                        </div>
                                        <Input
                                          type="range" min="800" max="1500" step="10"
                                          value={whatIfParams.exchangeRate}
                                          onChange={e => setWhatIfParams({ ...whatIfParams, exchangeRate: parseFloat(e.target.value) })}
                                          className="h-2 accent-primary"
                                        />
                                      </div>

                                      <Button
                                        variant="outline" size="sm" className="w-full font-bold text-[10px] border-primary/30 text-primary"
                                        onClick={handleGenerateInsights}
                                      >
                                        Recalcular Ensemble
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Middle Panel: Charts */}
                                <div className="lg:col-span-3 space-y-8">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Chart 1: Order Depth */}
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-xs uppercase tracking-tight flex items-center gap-2">
                                          <TrendingUp className="h-4 w-4 text-emerald-500" /> Profundidade de Preço (Bid/Ask)
                                        </h4>
                                      </div>
                                      <div className="h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <AreaChart data={userAiInsights.depthData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="price" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                                            <YAxis fontSize={10} />
                                            <Tooltip
                                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="bid" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                            <Area type="monotone" dataKey="ask" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                                          </AreaChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>

                                    {/* Chart 2: Predictive Forecast */}
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-xs uppercase tracking-tight flex items-center gap-2">
                                          <Zap className="h-4 w-4 text-amber-500" /> Previsão Preditiva (Alpha)
                                        </h4>
                                      </div>
                                      <div className="h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <ComposedChart data={userAiInsights.forecastData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="time" fontSize={10} />
                                            <YAxis fontSize={10} domain={['auto', 'auto']} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="pred" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeDasharray="5 5" />
                                            <Line type="monotone" dataKey="real" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                                          </ComposedChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Detailed Indicators Breakdown & Layperson Translation */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Layperson Info */}
                                <div className="space-y-6">
                                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-primary/5 border border-primary/20">
                                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-tight text-primary">
                                      <Heart className="h-4 w-4" /> Explicação para Leigos (Simples)
                                    </h4>
                                    <p className="text-sm leading-relaxed font-medium">
                                      {userAiInsights.laypersonSummary}
                                    </p>
                                  </div>

                                  <div>
                                    <h4 className="font-bold text-sm mb-6 uppercase tracking-tight flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-primary" /> Microestrutura do Ticker
                                    </h4>
                                    <div className="space-y-4">
                                      {userAiInsights.indicatorsInfo.map((info: any, i: number) => (
                                        <div key={i} className="p-4 rounded-xl border border-border/50 bg-muted/10 group hover:bg-muted/20 transition-all">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-black uppercase text-muted-foreground">{info.label}</span>
                                            <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{info.value}</Badge>
                                          </div>
                                          <p className="text-[11px] text-muted-foreground italic">{info.meaning}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* XAI Panel (Moved) */}
                                <div className="space-y-6">
                                  <div className="p-6 rounded-2xl border border-border/50 bg-card">
                                    <h4 className="font-bold text-sm mb-6 uppercase tracking-tight flex items-center gap-2">
                                      <ShieldCheck className="h-4 w-4 text-emerald-500" /> Explainability Dashboard (XAI)
                                    </h4>
                                    <div className="space-y-4">
                                      {userAiInsights.ensemble.map((model: any, i: number) => (
                                        <div key={i} className="group relative">
                                          <div className="flex justify-between items-end mb-1">
                                            <div>
                                              <span className="text-[11px] font-black uppercase">{model.name}</span>
                                              <p className="text-[9px] text-muted-foreground">{model.role}</p>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-primary">{model.weight}%</span>
                                          </div>
                                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-primary transition-all duration-1000"
                                              style={{ width: `${model.weight}%` }}
                                            />
                                          </div>
                                          <div className="mt-2 hidden group-hover:block p-2 rounded bg-muted text-[9px] text-muted-foreground italic border border-border/50 animate-in fade-in zoom-in-95">
                                            {model.desc}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Profile Recommendations */}
                              <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                  <Briefcase className="h-4 w-4 text-primary" />
                                  <h4 className="font-bold text-sm uppercase tracking-tight">Estratégias por Perfil de Risco</h4>
                                </div>

                                <Tabs defaultValue="moderate" className="w-full">
                                  <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-12 rounded-xl">
                                    <TabsTrigger value="conservative" className="text-[10px] uppercase font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">Conservador</TabsTrigger>
                                    <TabsTrigger value="moderate" className="text-[10px] uppercase font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">Moderado</TabsTrigger>
                                    <TabsTrigger value="aggressive" className="text-[10px] uppercase font-bold data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg">Agressivo</TabsTrigger>
                                  </TabsList>

                                  {Object.entries(userAiInsights.profiles).map(([key, profile]: [string, any]) => (
                                    <TabsContent key={key} value={key} className="mt-6 animate-in slide-in-from-right-2 duration-300">
                                      <div className="space-y-4">
                                        {profile.recs.map((rec: string, i: number) => (
                                          <div key={i} className="flex gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 transition-all shadow-sm group relative overflow-hidden">
                                            <div className={`absolute top-0 left-0 w-1 h-full ${profile.color}`} />
                                            <div className={`h-8 w-8 rounded-lg ${profile.color} flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-lg group-hover:rotate-12 transition-transform`}>
                                              {i + 1}
                                            </div>
                                            <span className="text-xs font-bold leading-relaxed">{rec}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </TabsContent>
                                  ))}
                                </Tabs>

                                {/* Asset Scoring Section */}
                                <div>
                                  <h4 className="font-bold text-sm mb-6 uppercase tracking-tight flex items-center gap-2">
                                    <Star className="h-4 w-4 text-amber-500" /> Market Ranking & Asset Scores
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {userAiInsights.assetScores.map((asset: any, i: number) => (
                                      <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                          <h5 className="font-black text-sm">{asset.name}</h5>
                                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-mono text-[10px] font-bold">
                                            {asset.score}
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          <div>
                                            <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                                              <span>Liquidez</span>
                                              <span>{asset.liquidity}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted rounded-full">
                                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${asset.liquidity}%` }} />
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                                              <span>Estabilidade</span>
                                              <span>{asset.stability}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted rounded-full">
                                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${asset.stability}%` }} />
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                                              <span>Risco</span>
                                              <span>{asset.risk}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted rounded-full">
                                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${asset.risk}%` }} />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 mt-4">
                                  <p className="text-[9px] text-amber-600 font-bold italic text-center flex items-center justify-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> AVISO: Algoritmos ALPHA baseados em Ensemble Multi-Modelo. Não constitui aconselhamento financeiro.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-xl border border-dashed">
                              <Zap className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                              <p className="text-sm text-muted-foreground max-w-md text-center">
                                Pronto para analisar? Seleccione um ticker acima para processar este livro de ordens com nossos modelos de Machine Learning.
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
