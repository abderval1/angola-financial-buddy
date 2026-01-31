import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  CreditCard,
  Check,
  X,
  Eye,
  Clock,
  AlertCircle,
  Search,
  Download,
  ExternalLink,
  BookOpen,
  User,
} from "lucide-react";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  payment_proof_url: string | null;
  created_at: string;
  started_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  subscription_plans: {
    name: string;
    price: number;
    ebook_limit: number;
  } | null;
  profiles?: {
    name: string | null;
    email: string | null;
  } | null;
}

export function AdminSubscriptions() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription_plans(name, price, ebook_limit)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = data.map((s: any) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      
      return data.map((sub: any) => ({
        ...sub,
        profiles: profiles?.find((p: any) => p.user_id === sub.user_id) || null,
      }));
    },
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ["admin-ebook-downloads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebook_downloads")
        .select(`
          *,
          marketplace_products(title, product_type)
        `)
        .order("downloaded_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Fetch user profiles
      const userIds = [...new Set(data.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      
      return data.map((dl: any) => ({
        ...dl,
        profiles: profiles?.find((p: any) => p.user_id === dl.user_id) || null,
      }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          approved_at: new Date().toISOString(),
        })
        .eq("id", subId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assinatura aprovada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setDetailsOpen(false);
    },
    onError: () => {
      toast.error("Erro ao aprovar assinatura");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ subId, reason }: { subId: string; reason: string }) => {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          rejection_reason: reason,
        })
        .eq("id", subId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assinatura rejeitada");
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setDetailsOpen(false);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Erro ao rejeitar assinatura");
    },
  });

  const filteredSubs = subscriptions.filter((sub: Subscription) => {
    const matchesSearch = 
      sub.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.profiles?.email?.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === "all") return matchesSearch !== false;
    return sub.status === activeTab && matchesSearch !== false;
  });

  const pendingCount = subscriptions.filter((s: Subscription) => s.status === "pending").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Ativo</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">Pendente</Badge>;
      case "expired":
        return <Badge variant="secondary">Expirado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Assinaturas</h1>
          <p className="text-muted-foreground">
            {subscriptions.length} assinaturas totais
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-warning text-warning-foreground">
                {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pendentes
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="expired">Expirados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Comprovativo</TableHead>
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
                ) : filteredSubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma assinatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubs.map((sub: Subscription) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.profiles?.name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.subscription_plans?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-AO").format(sub.subscription_plans?.price || 0)} Kz
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        {format(new Date(sub.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </TableCell>
                      <TableCell>
                        {sub.payment_proof_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(sub.payment_proof_url!, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedSub(sub); setDetailsOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {sub.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-success"
                                onClick={() => approveMutation.mutate(sub.id)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => { setSelectedSub(sub); setDetailsOpen(true); }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Downloads Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Downloads Recentes de Ebooks
          </CardTitle>
          <CardDescription>Últimos 100 downloads registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Gratuito</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {downloads.slice(0, 10).map((dl: any) => (
                <TableRow key={dl.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{dl.profiles?.name || dl.profiles?.email || "Anônimo"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{dl.marketplace_products?.title || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dl.marketplace_products?.product_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {dl.is_free_download ? (
                      <Badge className="bg-success/10 text-success border-0">Sim</Badge>
                    ) : (
                      <Badge variant="secondary">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(dl.downloaded_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
          </DialogHeader>
          
          {selectedSub && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="font-medium">{selectedSub.profiles?.name || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{selectedSub.profiles?.email}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-medium">{selectedSub.subscription_plans?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(selectedSub.subscription_plans?.price || 0)}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSub.status)}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Limite de Ebooks</p>
                  <p className="font-medium">{selectedSub.subscription_plans?.ebook_limit} ebooks grátis</p>
                </div>
              </div>

              {selectedSub.payment_proof_url && (
                <div className="space-y-2">
                  <Label>Comprovativo de Pagamento</Label>
                  <div className="border rounded-lg overflow-hidden">
                    {selectedSub.payment_proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img 
                        src={selectedSub.payment_proof_url} 
                        alt="Comprovativo" 
                        className="w-full max-h-64 object-contain"
                      />
                    ) : (
                      <div className="p-4 flex items-center justify-between bg-muted">
                        <span>Arquivo PDF</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedSub.payment_proof_url!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedSub.status === "pending" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Motivo da Rejeição (opcional)</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ex: Comprovativo ilegível, valor incorreto..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => approveMutation.mutate(selectedSub.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar Assinatura
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => rejectMutation.mutate({ subId: selectedSub.id, reason: rejectionReason })}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              )}

              {selectedSub.rejection_reason && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">Motivo da Rejeição:</p>
                  <p className="text-sm">{selectedSub.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
