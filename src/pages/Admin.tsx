import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminCourseManager as AdminCourses } from "@/components/admin/AdminCourseManager";
import { AdminNewsManager as AdminNews } from "@/components/admin/AdminNewsManager";
import { AdminPayouts } from "@/components/admin/AdminPayouts";
import { AdminSalesManager } from "@/components/admin/AdminSalesManager";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Shield,
  Users,
  GraduationCap,
  MessageSquare,
  Trophy,
  Settings,
  BarChart3,
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  UserCheck,
  UserX,
  BookOpen,
  Target,
  Medal,
  TrendingUp,
  DollarSign,
  LogOut,
  ShoppingBag,
  Upload,
  FileText,
  Book,
  Wrench,
  Package,
  MessageCircle,
  Image,
  Link as LinkIcon,
  AlertCircle,
  Wallet,
} from "lucide-react";

export default function Admin() {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const queryClient = useQueryClient();

  // Check if user is admin
  const { data: userRole, isLoading: isLoadingRole } = useQuery({
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

  // Overview stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: usersCount },
        { count: transactionsCount },
        { count: goalsCount },
        { count: postsCount },
        { count: contentCount },
        { count: challengesCount },
        { count: productsCount },
        { count: chatMessagesCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("*", { count: "exact", head: true }),
        supabase.from("financial_goals").select("*", { count: "exact", head: true }),
        supabase.from("community_posts").select("*", { count: "exact", head: true }),
        supabase.from("educational_content").select("*", { count: "exact", head: true }),
        supabase.from("challenges").select("*", { count: "exact", head: true }),
        supabase.from("marketplace_products").select("*", { count: "exact", head: true }),
        supabase.from("chat_messages").select("*", { count: "exact", head: true }),
      ]);

      return {
        users: usersCount || 0,
        transactions: transactionsCount || 0,
        goals: goalsCount || 0,
        posts: postsCount || 0,
        content: contentCount || 0,
        challenges: challengesCount || 0,
        products: productsCount || 0,
        chatMessages: chatMessagesCount || 0,
      };
    },
    enabled: userRole === "admin",
  });

  if (isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (userRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const navItems = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "users", label: "Usuários", icon: Users },
    { id: "subscriptions", label: "Assinaturas", icon: DollarSign },
    { id: "payouts", label: "Levantamentos", icon: Wallet },
    { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
    { id: "content", label: "Conteúdo Educativo", icon: GraduationCap },
    { id: "courses", label: "Gestão de Cursos", icon: BookOpen },
    { id: "news", label: "Notícias", icon: FileText },
    { id: "analytics", label: "Mercado & Notícias", icon: BarChart3 },
    { id: "community", label: "Comunidade", icon: MessageSquare },
    { id: "chat", label: "Chat Público", icon: MessageCircle },
    { id: "challenges", label: "Desafios", icon: Trophy },
    { id: "achievements", label: "Conquistas", icon: Medal },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar ao App
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-lg">Admin Kuanza</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Administrador
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-73px)] bg-card border-r border-border p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "overview" && <AdminOverview stats={stats} />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "subscriptions" && <AdminSubscriptions />}
          {activeTab === "payouts" && <AdminPayouts />}
          {activeTab === "marketplace" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Gestão do Marketplace</h1>
                <p className="text-muted-foreground">Gerencie produtos e visualize vendas realizadas</p>
              </div>

              <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                  <TabsTrigger value="products">Gestão de Produtos</TabsTrigger>
                  <TabsTrigger value="sales">Gestão de Vendas</TabsTrigger>
                </TabsList>
                <TabsContent value="products" className="mt-6">
                  <AdminMarketplace />
                </TabsContent>
                <TabsContent value="sales" className="mt-6">
                  <AdminSalesManager />
                </TabsContent>
              </Tabs>
            </div>
          )}
          {activeTab === "content" && <AdminContent />}
          {activeTab === "courses" && <AdminCourses />}
          {activeTab === "news" && <AdminNews />}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Gestão de Mercado</h1>
                <p className="text-muted-foreground">Gerencie indicadores econômicos e relatórios semanais para assinantes avançados.</p>
              </div>
              <AdminAnalytics />
            </div>
          )}
          {activeTab === "community" && <AdminCommunity />}
          {activeTab === "chat" && <AdminChat />}
          {activeTab === "challenges" && <AdminChallenges />}
          {activeTab === "achievements" && <AdminAchievements />}
          {activeTab === "settings" && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}

// Overview Component
function AdminOverview({ stats }: { stats: any }) {
  const statCards = [
    { label: "Usuários", value: stats?.users || 0, icon: Users, color: "text-primary" },
    { label: "Transações", value: stats?.transactions || 0, icon: DollarSign, color: "text-success" },
    { label: "Metas Criadas", value: stats?.goals || 0, icon: Target, color: "text-finance-savings" },
    { label: "Posts", value: stats?.posts || 0, icon: MessageSquare, color: "text-finance-investment" },
    { label: "Conteúdos", value: stats?.content || 0, icon: BookOpen, color: "text-accent" },
    { label: "Desafios", value: stats?.challenges || 0, icon: Trophy, color: "text-finance-fire" },
    { label: "Produtos", value: stats?.products || 0, icon: ShoppingBag, color: "text-amber-500" },
    { label: "Mensagens Chat", value: stats?.chatMessages || 0, icon: MessageCircle, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground">Estatísticas gerais da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-3xl font-bold font-display ${stat.color}`}>
                    {stat.value.toLocaleString("pt-AO")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Users Management
function AdminUsers() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc("promote_to_admin", { target_user_id: userId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Usuário promovido a administrador!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao promover usuário");
    },
  });

  const demoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc("demote_from_admin", { target_user_id: userId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Privilégios de admin removidos!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover privilégios");
    },
  });

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getUserRole = (user: any) => {
    return user.user_roles?.[0]?.role || "user";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">{users.length} usuários registrados</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Data de Criação</TableHead>
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
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "Sem nome"}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getUserRole(user) === "admin" ? "default" : "secondary"}>
                      {getUserRole(user)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: pt }) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setDetailsOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {getUserRole(user) === "admin" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => demoteMutation.mutate(user.user_id)}
                          disabled={demoteMutation.isPending}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success"
                          onClick={() => promoteMutation.mutate(user.user_id)}
                          disabled={promoteMutation.isPending}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedUser.name?.substring(0, 2).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name || "Sem nome"}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant={getUserRole(selectedUser) === "admin" ? "default" : "secondary"} className="mt-1">
                    {getUserRole(selectedUser)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedUser.phone || "Não informado"}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Idioma</p>
                  <p className="font-medium">{selectedUser.language || "pt"}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Moeda</p>
                  <p className="font-medium">{selectedUser.currency || "AOA"}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                  <p className="font-medium">
                    {selectedUser.created_at
                      ? format(new Date(selectedUser.created_at), "dd/MM/yyyy HH:mm", { locale: pt })
                      : "-"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Marketplace Management
function AdminMarketplace() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product_type: "ebook" as "ebook" | "course" | "template" | "tool",
    price: "0",
    file_url: "",
    cover_image_url: "",
    is_featured: false,
    is_published: true,
    is_subscription_included: false,
    requires_subscription: false,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-marketplace"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("marketplace")
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("marketplace")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const folder = type === "cover" ? "covers" : "files";
      const url = await uploadFile(file, folder);

      if (type === "cover") {
        setFormData({ ...formData, cover_image_url: url });
      } else {
        setFormData({ ...formData, file_url: url });
      }
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("marketplace_products").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace"] });
      resetForm();
    },
    onError: () => toast.error("Erro ao criar produto"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("marketplace_products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace"] });
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar produto"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketplace_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído!");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace"] });
    },
    onError: () => toast.error("Erro ao excluir produto"),
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      title: "",
      description: "",
      product_type: "ebook",
      price: "0",
      file_url: "",
      cover_image_url: "",
      is_featured: false,
      is_published: true,
      is_subscription_included: false,
      requires_subscription: false,
    });
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || "",
      description: product.description || "",
      product_type: product.product_type || "ebook",
      price: product.price?.toString() || "0",
      file_url: product.file_url || "",
      cover_image_url: product.cover_image_url || "",
      is_featured: product.is_featured || false,
      is_published: product.is_published ?? true,
      is_subscription_included: product.is_subscription_included || false,
      requires_subscription: product.requires_subscription || false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      price: parseFloat(formData.price) || 0,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "ebook": return Book;
      case "course": return GraduationCap;
      case "template": return FileText;
      case "tool": return Wrench;
      default: return Package;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value: any) => setFormData({ ...formData, product_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ebook">E-book</SelectItem>
                      <SelectItem value="course">Curso</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="tool">Ferramenta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preço (Kz)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0 para gratuito"
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label>Imagem de Capa</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "cover")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    {uploading ? "Enviando..." : "Upload Capa"}
                  </Button>
                  {formData.cover_image_url && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <img src={formData.cover_image_url} alt="Capa" className="h-10 w-10 rounded object-cover" />
                      <span className="truncate max-w-[150px]">Capa enviada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Arquivo do Produto</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "file")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Enviando..." : "Upload Arquivo"}
                  </Button>
                  {formData.file_url && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <LinkIcon className="h-4 w-4" />
                      <span>Arquivo enviado</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label>Publicado</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Destaque</Label>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_subscription_included}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_subscription_included: checked })}
                  />
                  <Label>Incluído na Assinatura</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.requires_subscription}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_subscription: checked })}
                  />
                  <Label>Requer Assinatura</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {editingProduct ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Downloads</TableHead>
              <TableHead>Status</TableHead>
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
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              products.map((product: any) => {
                const ProductIcon = getProductIcon(product.product_type);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ProductIcon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{product.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.product_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {product.price > 0
                        ? new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(product.price)
                        : <Badge className="bg-success/10 text-success">Gratuito</Badge>
                      }
                    </TableCell>
                    <TableCell>{product.download_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={product.is_published ? "default" : "secondary"}>
                          {product.is_published ? "Publicado" : "Rascunho"}
                        </Badge>
                        {product.is_featured && (
                          <Badge className="bg-amber-500/10 text-amber-500">Destaque</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Educational Content Management
function AdminContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    category: "",
    content_type: "article" as "article" | "video" | "course" | "quiz" | "calculator",
    difficulty_level: "beginner",
    duration_minutes: "",
    points_reward: "10",
    is_premium: false,
    is_published: true,
    video_url: "",
  });

  const { data: contents = [], isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("educational_content")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("educational_content").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conteúdo criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      resetForm();
    },
    onError: () => toast.error("Erro ao criar conteúdo"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("educational_content").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conteúdo atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar conteúdo"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("educational_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conteúdo excluído!");
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    },
    onError: () => toast.error("Erro ao excluir conteúdo"),
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingContent(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      content: "",
      category: "",
      content_type: "article",
      difficulty_level: "beginner",
      duration_minutes: "",
      points_reward: "10",
      is_premium: false,
      is_published: true,
      video_url: "",
    });
  };

  const openEdit = (content: any) => {
    setEditingContent(content);
    setFormData({
      title: content.title || "",
      slug: content.slug || "",
      description: content.description || "",
      content: content.content || "",
      category: content.category || "",
      content_type: content.content_type || "article",
      difficulty_level: content.difficulty_level || "beginner",
      duration_minutes: content.duration_minutes?.toString() || "",
      points_reward: content.points_reward?.toString() || "10",
      is_premium: content.is_premium || false,
      is_published: content.is_published ?? true,
      video_url: content.video_url || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, "-"),
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      points_reward: parseInt(formData.points_reward) || 10,
    };

    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Conteúdo Educativo</h1>
          <p className="text-muted-foreground">{contents.length} conteúdos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContent ? "Editar Conteúdo" : "Novo Conteúdo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título do conteúdo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="titulo-do-conteudo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Artigo</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="course">Curso</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="calculator">Calculadora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Poupança, Investimentos..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Dificuldade</Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pontos</Label>
                  <Input
                    type="number"
                    value={formData.points_reward}
                    onChange={(e) => setFormData({ ...formData, points_reward: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>

              {formData.content_type === "video" && (
                <div className="space-y-2">
                  <Label>URL do Vídeo</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Conteúdo completo (suporta Markdown)..."
                  rows={8}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label>Publicado</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                  />
                  <Label>Premium</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSubmit}>
                {editingContent ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Dificuldade</TableHead>
              <TableHead>Status</TableHead>
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
            ) : contents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum conteúdo encontrado
                </TableCell>
              </TableRow>
            ) : (
              contents.map((content: any) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">{content.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{content.content_type}</Badge>
                  </TableCell>
                  <TableCell>{content.category}</TableCell>
                  <TableCell>{content.difficulty_level}</TableCell>
                  <TableCell>
                    <Badge variant={content.is_published ? "default" : "secondary"}>
                      {content.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(content)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(content.id)}
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
    </div>
  );
}

// Community Management
function AdminCommunity() {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*, profiles(name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("community_posts")
        .update({ is_approved: approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Status atualizado!");
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post excluído!");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Gestão da Comunidade</h1>
        <p className="text-muted-foreground">{posts.length} posts</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum post encontrado
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post: any) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                  <TableCell>{post.profiles?.name || "Anônimo"}</TableCell>
                  <TableCell>{post.category || "-"}</TableCell>
                  <TableCell>{post.likes_count}</TableCell>
                  <TableCell>
                    <Badge variant={post.is_approved ? "default" : "destructive"}>
                      {post.is_approved ? "Aprovado" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(post.created_at), "dd/MM/yyyy", { locale: pt })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApproval.mutate({ id: post.id, approved: !post.is_approved })}
                      >
                        {post.is_approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deletePost.mutate(post.id)}
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
    </div>
  );
}

// Chat Management
function AdminChat() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-chat-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, profiles:user_id(name, email)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_messages")
        .update({ is_deleted: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-messages"] });
      toast.success("Mensagem removida!");
    },
  });

  const filteredMessages = messages.filter((msg: any) =>
    msg.content?.toLowerCase().includes(search.toLowerCase()) ||
    msg.profiles?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Moderação do Chat</h1>
        <p className="text-muted-foreground">Últimas 100 mensagens do chat público</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por conteúdo ou usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Status</TableHead>
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
            ) : filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma mensagem encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages.map((msg: any) => (
                <TableRow key={msg.id} className={msg.is_deleted ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{msg.profiles?.name || "Anônimo"}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{msg.content}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{msg.room_id || "geral"}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: pt })}
                  </TableCell>
                  <TableCell>
                    {msg.is_deleted ? (
                      <Badge variant="destructive">Removida</Badge>
                    ) : (
                      <Badge variant="secondary">Ativa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!msg.is_deleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteMessage.mutate(msg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Challenges Management
function AdminChallenges() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    challenge_type: "savings",
    target_value: "",
    target_metric: "",
    duration_days: "30",
    points_reward: "50",
    difficulty: "medium",
    is_active: true,
  });

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("challenges").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Desafio criado!");
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("challenges").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Desafio atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Desafio excluído!");
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingChallenge(null);
    setFormData({
      title: "",
      description: "",
      challenge_type: "savings",
      target_value: "",
      target_metric: "",
      duration_days: "30",
      points_reward: "50",
      difficulty: "medium",
      is_active: true,
    });
  };

  const openEdit = (challenge: any) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title || "",
      description: challenge.description || "",
      challenge_type: challenge.challenge_type || "savings",
      target_value: challenge.target_value?.toString() || "",
      target_metric: challenge.target_metric || "",
      duration_days: challenge.duration_days?.toString() || "30",
      points_reward: challenge.points_reward?.toString() || "50",
      difficulty: challenge.difficulty || "medium",
      is_active: challenge.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      target_value: formData.target_value ? parseFloat(formData.target_value) : null,
      duration_days: parseInt(formData.duration_days),
      points_reward: parseInt(formData.points_reward),
    };

    if (editingChallenge) {
      updateMutation.mutate({ id: editingChallenge.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Desafios</h1>
          <p className="text-muted-foreground">{challenges.length} desafios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Desafio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChallenge ? "Editar Desafio" : "Novo Desafio"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome do desafio"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do desafio..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.challenge_type}
                    onValueChange={(value) => setFormData({ ...formData, challenge_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="budget">Orçamento</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="education">Educação</SelectItem>
                      <SelectItem value="debt">Dívidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dificuldade</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Meta (Kz)</Label>
                  <Input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (dias)</Label>
                  <Input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pontos</Label>
                  <Input
                    type="number"
                    value={formData.points_reward}
                    onChange={(e) => setFormData({ ...formData, points_reward: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSubmit}>
                {editingChallenge ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Dificuldade</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Pontos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : challenges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum desafio encontrado
                </TableCell>
              </TableRow>
            ) : (
              challenges.map((challenge: any) => (
                <TableRow key={challenge.id}>
                  <TableCell className="font-medium">{challenge.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{challenge.challenge_type}</Badge>
                  </TableCell>
                  <TableCell>{challenge.difficulty}</TableCell>
                  <TableCell>{challenge.duration_days} dias</TableCell>
                  <TableCell>{challenge.points_reward} pts</TableCell>
                  <TableCell>
                    <Badge variant={challenge.is_active ? "default" : "secondary"}>
                      {challenge.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(challenge)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(challenge.id)}
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
    </div>
  );
}

// Achievements Management
function AdminAchievements() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🏆",
    points: "10",
    category: "general",
  });

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["admin-achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("achievements").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conquista criada!");
      queryClient.invalidateQueries({ queryKey: ["admin-achievements"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("achievements").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conquista atualizada!");
      queryClient.invalidateQueries({ queryKey: ["admin-achievements"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("achievements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conquista excluída!");
      queryClient.invalidateQueries({ queryKey: ["admin-achievements"] });
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingAchievement(null);
    setFormData({
      name: "",
      description: "",
      icon: "🏆",
      points: "10",
      category: "general",
    });
  };

  const openEdit = (achievement: any) => {
    setEditingAchievement(achievement);
    setFormData({
      name: achievement.name || "",
      description: achievement.description || "",
      icon: achievement.icon || "🏆",
      points: achievement.points?.toString() || "10",
      category: achievement.category || "general",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      points: parseInt(formData.points),
    };

    if (editingAchievement) {
      updateMutation.mutate({ id: editingAchievement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const icons = ["🏆", "⭐", "🎯", "💰", "🚀", "🔥", "💎", "🎓", "📈", "🏅", "🌟", "💪"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Conquistas</h1>
          <p className="text-muted-foreground">{achievements.length} conquistas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conquista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAchievement ? "Editar Conquista" : "Nova Conquista"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`text-2xl p-2 rounded-lg border-2 transition-all ${formData.icon === icon ? "border-primary bg-primary/10" : "border-border"
                        }`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da conquista"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Como desbloquear..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pontos</Label>
                  <Input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    placeholder="10"
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
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="budget">Orçamento</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="education">Educação</SelectItem>
                      <SelectItem value="community">Comunidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSubmit}>
                {editingAchievement ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : achievements.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma conquista encontrada
          </div>
        ) : (
          achievements.map((achievement: any) => (
            <Card key={achievement.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{achievement.icon || "🏆"}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{achievement.points} pts</Badge>
                      <Badge variant="secondary">{achievement.category}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(achievement)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(achievement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Settings
function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configurações gerais da plataforma</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>Configurações básicas da aplicação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo de Manutenção</p>
                <p className="text-sm text-muted-foreground">Desabilita o acesso de usuários</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novos Registros</p>
                <p className="text-sm text-muted-foreground">Permitir novos cadastros</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Verificação de Email</p>
                <p className="text-sm text-muted-foreground">Exigir confirmação de email</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
            <CardDescription>APIs e serviços externos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">BNA API</p>
                  <p className="text-sm text-muted-foreground">Taxa de câmbio</p>
                </div>
              </div>
              <Badge variant="outline" className="text-success">Conectado</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">BODIVA</p>
                  <p className="text-sm text-muted-foreground">Dados de mercado</p>
                </div>
              </div>
              <Badge variant="outline" className="text-success">Conectado</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
            <CardDescription>Armazenamento de arquivos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">Marketplace Bucket</p>
                  <p className="text-sm text-muted-foreground">E-books, cursos e produtos digitais</p>
                </div>
              </div>
              <Badge variant="outline" className="text-success">Público</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
