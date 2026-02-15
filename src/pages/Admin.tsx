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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  FileText,
  Book,
  Wrench,
  Package,
  MessageCircle,
  Link as LinkIcon,
  AlertCircle,
  Wallet,
  Globe,
  MoreVertical,
  CheckCircle,
  ShieldAlert,
  Ban,
  Image,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { AdminLiveMonitor } from "@/components/admin/AdminLiveMonitor";
import { AdminAuditLogs } from "@/components/admin/AdminAuditLogs";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";

export default function Admin() {
  const { user, signOut } = useAuth();
  const { onlineUsers } = useOnlinePresence();
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
    { id: "monitor", label: "Monitoramento em Tempo Real", icon: Globe },
    { id: "audit", label: "Auditoria", icon: ShieldAlert },
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
              <span className="font-display font-bold text-lg">Admin Kudila Finance</span>
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
          {activeTab === "overview" && <AdminOverview stats={stats} onlineUsers={onlineUsers} />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "monitor" && <AdminLiveMonitor />}
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
          {activeTab === "audit" && <AdminAuditLogs />}
          {activeTab === "settings" && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}

// Overview Component
function AdminOverview({ stats, onlineUsers }: { stats: any, onlineUsers: any[] }) {
  const statCards = [
    { label: "Online Agora", value: onlineUsers?.length || 0, icon: Globe, color: "text-blue-500 animate-pulse" },
    { label: "Usuários", value: stats?.users || 0, icon: Users, color: "text-primary" },
    { label: "Transações", value: stats?.transactions || 0, icon: DollarSign, color: "text-success" },
    { label: "Metas Criadas", value: stats?.goals || 0, icon: Target, color: "text-finance-savings" },
    { label: "Posts", value: stats?.posts || 0, icon: MessageSquare, color: "text-finance-investment" },
    { label: "Conteúdos", value: stats?.content || 0, icon: BookOpen, color: "text-accent" },
    { label: "Desafios", value: stats?.challenges || 0, icon: Trophy, color: "text-finance-fire" },
    { label: "Produtos", value: stats?.products || 0, icon: ShoppingBag, color: "text-amber-500" },
  ];

  // Group users by location
  const locationStats = onlineUsers?.reduce((acc: any, user: any) => {
    const loc = user.location;
    if (loc) {
      const key = `${loc.city || 'Desconhecido'}, ${loc.country || 'Desconhecido'}`;
      acc[key] = (acc[key] || 0) + 1;
    } else {
      acc["Localização Desconhecida"] = (acc["Localização Desconhecida"] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground">Estatísticas gerais e monitoramento em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-3xl font-bold font-display ${stat.color}`}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString("pt-AO") : stat.value}
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

      {/* Real-time Location Stats */}
      {onlineUsers?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Distribuição Geográfica (Online Agora)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(locationStats || {}).map(([location, count]: [string, any]) => (
                <div key={location} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{location}</span>
                  <Badge variant="secondary">{count} usuário{count > 1 ? 's' : ''}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Users Management
function AdminUsers() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user"
  });

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles to manual join since foreign key might be missing in PostgREST detection
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        // Don't fail completely if just roles fail
      }

      // Merge data
      return profiles.map(profile => ({
        ...profile,
        user_roles: [
          {
            role: roles?.find(r => r.user_id === profile.user_id || r.user_id === profile.id)?.role || 'user'
          }
        ]
      }));
    },
  });

  // Mutations
  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.rpc("set_user_role", { target_user_id: userId, new_role: role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Função do usuário atualizada!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao atualizar função"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc("toggle_user_status", { target_user_id: userId });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data ? "Usuário desbloqueado!" : "Usuário bloqueado!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao alterar status"),
  });

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getUserRole = (user: any) => {
    return user.user_roles?.[0]?.role || "user";
  };

  const getUserStatus = (user: any) => {
    return user.is_active !== false; // Default to true
  };

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.name }
        }
      });
      if (authError) throw authError;

      if (data.role !== 'user' && authData.user) {
        await supabase.rpc("set_user_role", {
          target_user_id: authData.user.id,
          new_role: data.role
        });
      }

      if (data.phone && authData.user) {
        await supabase
          .from("profiles")
          .update({ phone: data.phone })
          .eq("user_id", authData.user.id);
      }
    },
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setUserFormOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message || "Erro ao criar usuário"),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string, data: any }) => {
      const { error } = await supabase.rpc("admin_update_user", {
        target_user_id: userId,
        new_name: data.name,
        new_phone: data.phone
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setUserFormOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message || "Erro ao atualizar perfil"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_delete_user", { target_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuário excluído do sistema!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.message || "Erro ao excluir usuário"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "user"
    });
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      role: getUserRole(user)
    });
    setIsEditing(true);
    setUserFormOpen(true);
  };

  const handleSubmit = () => {
    if (isEditing && selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.user_id || selectedUser.id,
        data: formData
      });
    } else {
      if (!formData.email || !formData.password) {
        toast.error("Email e senha são obrigatórios");
        return;
      }
      createUserMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">{users.length} usuários registrados</p>
        </div>
        <Button onClick={() => { resetForm(); setUserFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
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
              <TableHead>Status</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name || "Sem nome"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getUserStatus(user) ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                        Bloqueado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getUserRole(user) === "admin" ? "default" : getUserRole(user) === "moderator" ? "secondary" : "outline"}>
                      {getUserRole(user)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: pt }) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setDetailsOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit2 className="h-4 w-4 mr-2" /> Editar Usuário
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Shield className="h-4 w-4 mr-2" /> Alterar Função
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={getUserRole(user)} onValueChange={(role) => setRoleMutation.mutate({ userId: user.user_id || user.id, role })}>
                              <DropdownMenuRadioItem value="user">Usuário</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="moderator">Moderador</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="admin">Administrador</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={getUserStatus(user) ? "text-destructive" : "text-green-500"}
                          onClick={() => toggleStatusMutation.mutate(user.user_id || user.id)}
                        >
                          {getUserStatus(user) ? (
                            <>
                              <Ban className="h-4 w-4 mr-2" /> Bloquear Usuário
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" /> Desbloquear
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir Usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Create/Edit User Dialog */}
      <Dialog open={userFormOpen} onOpenChange={(open) => { if (!open) resetForm(); setUserFormOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={isEditing}
              />
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+244 ..."
              />
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full mt-4"
              onClick={handleSubmit}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {createUserMutation.isPending || updateUserMutation.isPending ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                isEditing ? "Salvar Alterações" : "Criar Usuário"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o perfil de <strong>{selectedUser?.name || selectedUser?.email}</strong> e removerá seus dados de nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.user_id || selectedUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Sim, excluir usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capa do Produto</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={coverInputRef}
                    onChange={(e) => handleFileUpload(e, "cover")}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    {formData.cover_image_url ? "Alterar Capa" : "Enviar Capa"}
                  </Button>
                  {formData.cover_image_url && (
                    <img src={formData.cover_image_url} alt="Capa" className="h-10 w-10 object-cover rounded" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Arquivo Principal</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e, "file")}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.file_url ? "Alterar Arquivo" : "Enviar Arquivo"}
                  </Button>
                  {formData.file_url && <CheckCircle className="h-5 w-5 text-green-500" />}
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Produto em Destaque</Label>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Incluído na Assinatura</Label>
                  <Switch
                    checked={formData.is_subscription_included}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_subscription_included: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Exige Assinatura</Label>
                  <Switch
                    checked={formData.requires_subscription}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_subscription: checked })}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={uploading}>
                {uploading ? "Enviando..." : editingProduct ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </div>
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
              <TableHead>Vendas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Anexo</TableHead>
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
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              products.map((product: any) => {
                const Icon = getProductIcon(product.product_type);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {product.cover_image_url ? (
                            <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {product.product_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.price > 0
                        ? new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(product.price)
                        : <span className="text-green-500 font-medium">Grátis</span>
                      }
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      {product.is_published ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Rascunho</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.file_url ? (
                        <a
                          href={product.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline text-xs"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Ver Arquivo
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem anexo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

// Other Empty Components (Placeholders if needed, but imported ones should work)
function AdminContent() { return <div className="p-4">Conteúdo Educativo (Mock)</div>; }
function AdminCommunity() { return <div className="p-4">Comunidade (Mock)</div>; }
function AdminChat() { return <div className="p-4">Chat (Mock)</div>; }
function AdminChallenges() { return <div className="p-4">Desafios (Mock)</div>; }
function AdminAchievements() { return <div className="p-4">Conquistas (Mock)</div>; }
function AdminSettings() { return <div className="p-4">Configurações (Mock)</div>; }
