import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Plus,
  Edit2,
  Trash2,
  Newspaper,
  CheckCircle,
  XCircle,
  Star,
  RefreshCw,
  Search,
  Eye,
  Bell,
  Send,
  Globe,
  Save,
} from "lucide-react";

const API_KEY = 'api_live_3tK47lmZGyCDONJAH80pzlgXOLPOQWLJ9CJ02UXi21imAHabPuwbq1hu';

const categories = [
  { value: "bodiva", label: "BODIVA" },
  { value: "investimentos", label: "Investimentos" },
  { value: "renda_extra", label: "Renda Extra" },
  { value: "economia", label: "Economia" },
  { value: "poupanca", label: "Poupança" },
];

interface ApiNewsItem {
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  image_url?: string;
  published_at: string;
}

export function AdminNewsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "live_api">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiResults, setApiResults] = useState<ApiNewsItem[]>([]);
  const [isFetchingApi, setIsFetchingApi] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    source: "Kudila Finance",
    category: "economia",
    url: "",
    image_url: "",
    is_approved: true,
    is_featured: false,
  });

  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "news",
    priority: "normal",
    action_url: "",
  });

  // Fetch news from DB
  const { data: news = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch users for notifications
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-for-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email");

      if (error) throw error;
      return data;
    },
  });

  // Fetch from live API
  const fetchLiveApi = async () => {
    setIsFetchingApi(true);
    setFilter("live_api");
    try {
      const response = await fetch(`https://api.apitube.io/v1/news/everything?per_page=30&api_key=${API_KEY}&source.country.code=ao&source.domain=expansao.co.ao&is_duplicate=0`);
      const data = await response.json();

      if (data.results) {
        setApiResults(data.results.map((item: any) => ({
          title: item.title,
          summary: item.description || 'Sem descrição.',
          source: typeof item.source === 'string' ? item.source : (item.source?.name || 'Expansão'),
          category: 'economia',
          url: item.url,
          image_url: item.image,
          published_at: item.published_at || new Date().toISOString()
        })));
        toast.success("Resultados da API carregados!");
      } else {
        throw new Error(data.message || "Erro na API");
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar API: ${error.message}`);
    } finally {
      setIsFetchingApi(false);
    }
  };

  const saveToDb = async (item: ApiNewsItem) => {
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
      toast.error(`Erro ao salvar: ${error.message}`);
    } else {
      toast.success("Notícia importada para a base de dados!");
      setApiResults(prev => prev.filter(n => n.title !== item.title));
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
    }
  };

  const discardApiItem = (title: string) => {
    setApiResults(prev => prev.filter(n => n.title !== title));
    toast.info("Item descartado da lista temporária");
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("news").insert({
        ...data,
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("Notícia criada!");
      resetForm();
    },
    onError: (error: any) => toast.error(`Erro ao criar notícia: ${error.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("news").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("Notícia atualizada!");
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar notícia"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("Notícia excluída!");
    },
    onError: () => toast.error("Erro ao excluir notícia"),
  });

  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("news")
        .update({ is_approved: approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success(approved ? "Notícia aprovada!" : "Notícia rejeitada!");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase
        .from("news")
        .update({ is_featured: featured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("Destaque atualizado!");
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: typeof notificationForm) => {
      const notifications = users.map((user: any) => ({
        user_id: user.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        action_url: data.action_url,
        read: false,
      }));
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Notificação enviada para ${users.length} usuários!`);
      setNotificationDialogOpen(false);
      setNotificationForm({ title: "", message: "", type: "news", priority: "normal", action_url: "" });
    },
    onError: () => toast.error("Erro ao enviar notificações"),
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingNews(null);
    setFormData({
      title: "",
      summary: "",
      content: "",
      source: "Kudila Finance",
      category: "economia",
      url: "",
      image_url: "",
      is_approved: true,
      is_featured: false,
    });
  };

  const openEdit = (item: any) => {
    setEditingNews(item);
    setFormData({
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      source: item.source || "Kudila Finance",
      category: item.category || "economia",
      url: item.url || "",
      image_url: item.image_url || "",
      is_approved: item.is_approved ?? true,
      is_featured: item.is_featured ?? false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredNews = news.filter((item: any) => {
    const matchesFilter = filter === "all" || (filter === "pending" && !item.is_approved) || (filter === "approved" && item.is_approved);
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.source?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = news.filter((n: any) => !n.is_approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Notícias</h1>
          <p className="text-muted-foreground">{news.length} notícias • {pendingCount} pendentes • {apiResults.length} do API</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNotificationDialogOpen(true)}><Bell className="h-4 w-4 mr-2" /> Notificar Todos</Button>
          <Button variant="outline" onClick={fetchLiveApi} disabled={isFetchingApi}>
            <Globe className={`h-4 w-4 mr-2 ${isFetchingApi ? "animate-spin" : ""}`} /> API Ao Vivo
          </Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Notícia</Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar notícias..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              Pendentes {pendingCount > 0 && <Badge className="bg-destructive text-white h-5 w-5 p-0">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
            <TabsTrigger value="live_api" className="gap-2"><Globe className="h-3 w-3" /> API Feed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        {filter === "live_api" ? (
          <Table>
            <TableHeader><TableRow><TableHead>Título (API)</TableHead><TableHead>Fonte</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {apiResults.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Clica em "API Ao Vivo" para buscar notícias externas</TableCell></TableRow>
              ) : (
                apiResults.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="max-w-md font-medium truncate">{item.title}</TableCell>
                    <TableCell><Badge variant="outline">{item.source}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(item.published_at), "dd/MM HH:mm")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => discardApiItem(item.title)}><Trash2 className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-success" onClick={() => saveToDb(item)}><Save className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Título</TableHead><TableHead>Fonte</TableHead><TableHead>Categoria</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : filteredNews.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma notícia encontrada</TableCell></TableRow>
              ) : (
                filteredNews.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell><div className="flex items-center gap-2 max-w-xs">{item.is_featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />} <span className="font-medium truncate">{item.title}</span></div></TableCell>
                    <TableCell><Badge variant="outline">{item.source}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{categories.find(c => c.value === item.category)?.label || item.category}</Badge></TableCell>
                    <TableCell><Badge variant={item.is_approved ? "default" : "secondary"}>{item.is_approved ? "Aprovada" : "Pendente"}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{item.published_at ? format(new Date(item.published_at), "dd/MM/yy HH:mm", { locale: pt }) : "-"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFeaturedMutation.mutate({ id: item.id, featured: !item.is_featured })}>
                        <Star className={`h-4 w-4 ${item.is_featured ? "fill-amber-500 text-amber-500" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleApprovalMutation.mutate({ id: item.id, approved: !item.is_approved })}>
                        {item.is_approved ? <XCircle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-success" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingNews ? "Editar Notícia" : "Nova Notícia"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Título *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título da notícia" /></div>
            <div className="space-y-2"><Label>Resumo *</Label><Textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Resumo..." rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fonte</Label><Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} /></div>
              <div className="space-y-2"><Label>Categoria</Label><Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>URL Externa</Label><Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} /></div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><Switch checked={formData.is_approved} onCheckedChange={(v) => setFormData({ ...formData, is_approved: v })} /><Label>Aprovada</Label></div>
              <div className="flex items-center gap-2"><Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })} /><Label>Destaque</Label></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={resetForm}>Cancelar</Button><Button onClick={handleSubmit}>{editingNews ? "Atualizar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Notificação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Título</Label><Input value={notificationForm.title} onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Mensagem</Label><Textarea value={notificationForm.message} onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>Cancelar</Button><Button onClick={() => sendNotificationMutation.mutate(notificationForm)}>Enviar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
