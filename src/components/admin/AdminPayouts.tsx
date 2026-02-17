import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Wallet,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Smartphone,
  Zap,
  Eye,
  TrendingUp,
  Users,
  ArrowUpRight,
} from "lucide-react";

export function AdminPayouts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch all payout requests
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select(`
          *,
          profiles:user_id (name, email, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-payout-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("status, amount");

      if (error) throw error;

      const pending = data?.filter(p => p.status === "pending") || [];
      const completed = data?.filter(p => p.status === "completed") || [];
      const totalPending = pending.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalPaid = completed.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        pendingCount: pending.length,
        completedCount: completed.length,
        totalPending,
        totalPaid,
      };
    },
  });

  // Update payout status mutation
  const updatePayoutMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("payout_requests")
        .update({
          status,
          admin_notes: notes,
          processed_at: status === "completed" || status === "rejected" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      // If completed, mark earnings as paid
      if (status === "completed" && selectedPayout) {
        const { error: earningsError } = await supabase
          .from("user_earnings")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("user_id", selectedPayout.user_id)
          .eq("status", "approved");

        if (earningsError) console.error("Error updating earnings:", earningsError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-stats"] });
      toast.success("Pedido atualizado com sucesso!");
      setDetailsOpen(false);
      setSelectedPayout(null);
      setAdminNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredPayouts = payouts.filter((payout: any) => {
    const matchesSearch =
      payout.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
      payout.profiles?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
      pending: { variant: "secondary", label: "Pendente", icon: Clock },
      processing: { variant: "outline", label: "Processando", icon: Clock },
      completed: { variant: "default", label: "Concluído", icon: CheckCircle2 },
      rejected: { variant: "destructive", label: "Rejeitado", icon: XCircle },
    };
    const config = variants[status] || { variant: "secondary", label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, any> = {
      bank_transfer: Banknote,
      mobile_money: Smartphone,
      express: Zap,
    };
    return icons[method] || Wallet;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Transferência Bancária",
      mobile_money: "Mobile Money",
      express: "Unitel Money",
    };
    return labels[method] || method;
  };

  const openDetails = (payout: any) => {
    setSelectedPayout(payout);
    setAdminNotes(payout.admin_notes || "");
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Gestão de Levantamentos</h1>
        <p className="text-muted-foreground">Gerir pedidos de pagamento dos utilizadores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-500 break-all">{stats?.pendingCount || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Pendente</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground break-all">{(stats?.totalPending || 0).toLocaleString()} Kz</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-xl sm:text-2xl font-bold text-success break-all">{stats?.completedCount || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground break-all">{(stats?.totalPaid || 0).toLocaleString()} Kz</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilizador</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Método</TableHead>
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
            ) : filteredPayouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredPayouts.map((payout: any) => {
                const PaymentIcon = getPaymentMethodIcon(payout.payment_method);
                return (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payout.profiles?.name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{payout.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{payout.amount.toLocaleString()} Kz</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getPaymentMethodLabel(payout.payment_method)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell>
                      {format(new Date(payout.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(payout)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Revise e processe o pedido de levantamento
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedPayout.profiles?.name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{selectedPayout.profiles?.email}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary break-all">{selectedPayout.amount.toLocaleString()} Kz</p>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <h4 className="font-medium">Dados de Pagamento</h4>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-medium">{getPaymentMethodLabel(selectedPayout.payment_method)}</span>
                  </div>
                  {selectedPayout.payment_method === "bank_transfer" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Banco:</span>
                        <span className="font-medium">{selectedPayout.payment_details?.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conta:</span>
                        <span className="font-medium font-mono">{selectedPayout.payment_details?.account_number}</span>
                      </div>
                      {selectedPayout.payment_details?.iban && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IBAN:</span>
                          <span className="font-medium font-mono text-sm">{selectedPayout.payment_details?.iban}</span>
                        </div>
                      )}
                    </>
                  )}
                  {(selectedPayout.payment_method === "mobile_money" || selectedPayout.payment_method === "express") && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-medium font-mono">{selectedPayout.payment_details?.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label>Notas do Admin</Label>
                <Textarea
                  placeholder="Adicionar notas sobre o processamento..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status Atual:</span>
                {getStatusBadge(selectedPayout.status)}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedPayout?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => updatePayoutMutation.mutate({
                    id: selectedPayout.id,
                    status: "rejected",
                    notes: adminNotes
                  })}
                  disabled={updatePayoutMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updatePayoutMutation.mutate({
                    id: selectedPayout.id,
                    status: "processing",
                    notes: adminNotes
                  })}
                  disabled={updatePayoutMutation.isPending}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Marcar Processando
                </Button>
                <Button
                  onClick={() => updatePayoutMutation.mutate({
                    id: selectedPayout.id,
                    status: "completed",
                    notes: adminNotes
                  })}
                  disabled={updatePayoutMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </Button>
              </>
            )}
            {selectedPayout?.status === "processing" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => updatePayoutMutation.mutate({
                    id: selectedPayout.id,
                    status: "rejected",
                    notes: adminNotes
                  })}
                  disabled={updatePayoutMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => updatePayoutMutation.mutate({
                    id: selectedPayout.id,
                    status: "completed",
                    notes: adminNotes
                  })}
                  disabled={updatePayoutMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </Button>
              </>
            )}
            {(selectedPayout?.status === "completed" || selectedPayout?.status === "rejected") && (
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
