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
} from "lucide-react";

const categories = [
  { value: "bodiva", label: "BODIVA" },
  { value: "investimentos", label: "Investimentos" },
  { value: "renda_extra", label: "Renda Extra" },
  { value: "economia", label: "Economia" },
  { value: "poupanca", label: "Poupança" },
];

export function AdminNewsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    source: "Kuanza",
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

  // Fetch news
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

  // Create news mutation
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
    onError: () => toast.error("Erro ao criar notícia"),
  });

  // Update news mutation
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

  // Delete news mutation
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

  // Toggle approval mutation
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

  // Toggle featured mutation
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

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: typeof notificationForm) => {
      // Insert notifications for all users
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
      setNotificationForm({
        title: "",
        message: "",
        type: "news",
        priority: "normal",
        action_url: "",
      });
    },
    onError: () => toast.error("Erro ao enviar notificações"),
  });

  // Refresh news from API
  const refreshNewsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("fetch-news");
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast.success("Notícias atualizadas do feed!");
    },
    onError: () => toast.error("Erro ao atualizar notícias"),
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingNews(null);
    setFormData({
      title: "",
      summary: "",
      content: "",
      source: "Kuanza",
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
      source: item.source || "Kuanza",
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
    const matchesFilter = 
      filter === "all" || 
      (filter === "pending" && !item.is_approved) ||
      (filter === "approved" && item.is_approved);
    
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const pendingCount = news.filter((n: any) => !n.is_approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Notícias</h1>
          <p className="text-muted-foreground">
            {news.length} notícias • {pendingCount} pendentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNotificationDialogOpen(true)}>
            <Bell className="h-4 w-4 mr-2" />
            Enviar Notificação
          </Button>
          <Button
            variant="outline"
            onClick={() => refreshNewsMutation.mutate()}
            disabled={refreshNewsMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshNewsMutation.isPending ? "animate-spin" : ""}`} />
            Atualizar Feed
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Notícia
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notícias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              Pendentes
              {pendingCount > 0 && (
                <Badge className="h-5 w-5 p-0 justify-center bg-destructive text-destructive-foreground">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* News Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredNews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma notícia encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredNews.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-xs">
                      {item.is_featured && (
                        <Star className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <span className="font-medium truncate">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categories.find(c => c.value === item.category)?.label || item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_approved ? "default" : "secondary"}>
                      {item.is_approved ? "Aprovada" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.published_at 
                      ? format(new Date(item.published_at), "dd/MM/yyyy HH:mm", { locale: pt })
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeaturedMutation.mutate({ 
                          id: item.id, 
                          featured: !item.is_featured 
                        })}
                        title={item.is_featured ? "Remover destaque" : "Destacar"}
                      >
                        <Star className={`h-4 w-4 ${item.is_featured ? "fill-amber-500 text-amber-500" : ""}`} />
                      </Button>
                      {!item.is_approved ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success"
                          onClick={() => toggleApprovalMutation.mutate({ id: item.id, approved: true })}
                          title="Aprovar"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-500"
                          onClick={() => toggleApprovalMutation.mutate({ id: item.id, approved: false })}
                          title="Despublicar"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* News Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? "Editar Notícia" : "Nova Notícia"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título da notícia"
              />
            </div>

            <div className="space-y-2">
              <Label>Resumo *</Label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Breve resumo da notícia"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fonte</Label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="Ex: BNA, BODIVA"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL Externa (opcional)</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>URL da Imagem (opcional)</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo Completo (opcional)</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Conteúdo completo da notícia..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_approved}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_approved: checked })}
                />
                <Label>Aprovada</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label>Destaque</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.summary}>
              {editingNews ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Enviar Notificação para Todos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                placeholder="Título da notificação"
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem *</Label>
              <Textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                placeholder="Mensagem da notificação"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={notificationForm.type}
                  onValueChange={(value) => setNotificationForm({ ...notificationForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">Notícia</SelectItem>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={notificationForm.priority}
                  onValueChange={(value) => setNotificationForm({ ...notificationForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link (opcional)</Label>
              <Input
                value={notificationForm.action_url}
                onChange={(e) => setNotificationForm({ ...notificationForm, action_url: e.target.value })}
                placeholder="/news ou URL externa"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Esta notificação será enviada para <strong>{users.length} usuários</strong>.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => sendNotificationMutation.mutate(notificationForm)}
              disabled={!notificationForm.title || !notificationForm.message || sendNotificationMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar para Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
