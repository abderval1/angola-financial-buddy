import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, FileText, ShoppingBag, Download, Search, ExternalLink, GraduationCap } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

export function AdminSalesManager() {
    const { formatPrice } = useCurrency();
    const queryClient = useQueryClient();
    const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "rejected">("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewType, setViewType] = useState<"marketplace" | "courses">("marketplace");

    // Fetch all purchases (filtered by status on frontend)
    const { data: allPurchases = [], isLoading } = useQuery({
        queryKey: ["admin-all-purchases", viewType],
        queryFn: async () => {
            if (viewType === "marketplace") {
                const { data, error } = await supabase
                    .from("marketplace_purchases")
                    .select(`
                        *,
                        profiles(name, email),
                        marketplace_products(title, price, file_url)
                    `)
                    .order("purchased_at", { ascending: false });

                if (error) {
                    console.error("Marketplace Purchases Error:", error);
                    throw error;
                }
                console.log("Marketplace Purchases Data:", data);

                // Normalize marketplace data - include all fields including payment_proof_url and status
                return (data as any[])?.map(d => ({
                    ...d,
                    purchase_price: d.marketplace_products?.price || d.purchase_price || 0,
                    receipt_url: d.payment_proof_url || d.receipt_url,
                    status: d.status
                })) || [];
            } else {
                const { data, error } = await supabase
                    .from("course_purchases")
                    .select(`
                        *,
                        educational_content:course_id(title, price)
                    `)
                    .order("created_at", { ascending: false }) as any;

                if (error) {
                    console.error("Course Purchases Query Error:", error);
                    throw error;
                }

                if (!data || data.length === 0) {
                    console.log("No course purchases found in DB");
                    return [];
                }

                console.log("Found course purchases, fetching profiles...", data.length);

                // Fetch user profiles manually to ensure we get the names
                const userIds = [...new Set(data.map((s: any) => s.user_id))];
                const { data: profiles, error: profilesError } = await supabase
                    .from("profiles")
                    .select("user_id, name, email")
                    .in("user_id", userIds);

                if (profilesError) {
                    console.error("Profiles Fetch Error:", profilesError);
                }

                console.log("Profiles fetched:", profiles?.length);

                // Normalize for easier mapping
                return (data as any[])?.map(d => {
                    const profile = profiles?.find((p: any) => p.user_id === d.user_id);
                    return {
                        ...d,
                        profiles: profile || { name: 'Usuário Desconhecido', email: 'Sem email' },
                        status: d.status === 'approved' ? 'completed' : d.status,
                        purchased_at: d.created_at,
                        purchase_price: d.amount,
                        marketplace_products: d.educational_content || { title: 'Curso Premium', price: d.amount }, // Map to same field for consistency
                        receipt_url: d.payment_proof_url
                    };
                }) || [];
            }
        },
    });

    // Filter purchases based on selected status
    const statusFilteredPurchases = statusFilter === "all"
        ? allPurchases
        : allPurchases.filter((p: any) => p.status === statusFilter);

    // Apply search filter
    const purchases = statusFilteredPurchases.filter((p: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            p.profiles?.name?.toLowerCase().includes(query) ||
            p.profiles?.email?.toLowerCase().includes(query) ||
            p.marketplace_products?.title?.toLowerCase().includes(query)
        );
    });

    // Approve Mutation
    const approveMutation = useMutation({
        mutationFn: async (purchase: any) => {
            const table = viewType === "marketplace" ? "marketplace_purchases" : "course_purchases";
            const statusValue = viewType === "marketplace" ? "completed" : "approved";

            const { error: updateError } = await supabase
                .from(table as any)
                .update({
                    status: statusValue,
                    approved_at: new Date().toISOString()
                } as any)
                .eq("id", purchase.id);

            if (updateError) throw updateError;

            // Send notification
            const productTitle = purchase.marketplace_products?.title || "Produto";
            const { error: notificationError } = await supabase.from("notifications").insert({
                user_id: purchase.user_id,
                title: "Compra Aprovada",
                message: `Sua compra de "${productTitle}" foi aprovada! ${viewType === 'marketplace' ? 'Você já pode baixá-lo.' : 'O curso já está desbloqueado.'}`,
                type: viewType === 'marketplace' ? "marketplace_status" : "course_status",
                read: false,
            });

            if (notificationError) console.error("Error sending notification:", notificationError);
        },
        onSuccess: () => {
            toast.success("Compra aprovada com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["admin-all-purchases"] });
            if (viewType === "courses") {
                queryClient.invalidateQueries({ queryKey: ["user-course-purchases"] });
            }
        },
        onError: (error: any) => {
            console.error("Error approving purchase:", error);
            toast.error(`Erro ao aprovar compra: ${error.message || "Erro desconhecido"}`);
        },
    });

    // Reject Mutation
    const rejectMutation = useMutation({
        mutationFn: async (purchase: any) => {
            const table = viewType === "marketplace" ? "marketplace_purchases" : "course_purchases";

            const { error: updateError } = await supabase
                .from(table as any)
                .update({ status: "rejected" } as any)
                .eq("id", purchase.id);

            if (updateError) throw updateError;

            // Send notification
            const productTitle = purchase.marketplace_products?.title || "Produto";
            const { error: notificationError } = await supabase.from("notifications").insert({
                user_id: purchase.user_id,
                title: "Compra Rejeitada",
                message: `Sua compra de "${productTitle}" foi rejeitada. Verifique o comprovativo enviado.`,
                type: viewType === 'marketplace' ? "marketplace_status" : "course_status",
                read: false,
            });

            if (notificationError) console.error("Error sending notification:", notificationError);
        },
        onSuccess: () => {
            toast.success("Compra rejeitada.");
            queryClient.invalidateQueries({ queryKey: ["admin-all-purchases"] });
        },
        onError: (error: any) => {
            console.error("Error rejecting purchase:", error);
            toast.error(`Erro ao rejeitar compra: ${error.message || "Erro desconhecido"}`);
        },
    });


    const getPublicUrl = (path: string) => {
        // If already a full URL, return it directly
        if (path?.startsWith('http')) return path;
        // Otherwise, get the public URL from the path - use payment-proofs bucket
        return supabase.storage.from("payment-proofs").getPublicUrl(path).data.publicUrl;
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
            case 'completed':
            case 'approved': return <Badge className="bg-green-600">Aprovada</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejeitada</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex gap-4">
                <Button
                    variant={viewType === "marketplace" ? "default" : "outline"}
                    onClick={() => setViewType("marketplace")}
                    className="flex-1 relative"
                >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Produtos Marketplace
                    {viewType !== "marketplace" && (
                        <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">Ver</Badge>
                    )}
                </Button>
                <Button
                    variant={viewType === "courses" ? "default" : "outline"}
                    onClick={() => setViewType("courses")}
                    className="flex-1 relative"
                >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Cursos Premium
                    {viewType !== "courses" && (
                        <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">Ver</Badge>
                    )}
                </Button>
            </div>

            {/* Search Box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar por utilizador, email ou produto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${statusFilter === "pending"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Pendentes ({allPurchases.filter((p: any) => p.status === "pending").length})
                </button>
                <button
                    onClick={() => setStatusFilter("completed")}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${statusFilter === "completed"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Aprovadas ({allPurchases.filter((p: any) => p.status === "completed").length})
                </button>
                <button
                    onClick={() => setStatusFilter("rejected")}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${statusFilter === "rejected"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Rejeitadas ({allPurchases.filter((p: any) => p.status === "rejected").length})
                </button>
                <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${statusFilter === "all"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Todas ({allPurchases.length})
                </button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Utilizador</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Comprovativo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    Carregando vendas...
                                </TableCell>
                            </TableRow>
                        ) : purchases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    {statusFilter === "all"
                                        ? "Nenhuma venda registrada."
                                        : `Nenhuma venda ${statusFilter === "pending" ? "pendente" : statusFilter === "completed" ? "aprovada" : "rejeitada"}.`}
                                </TableCell>
                            </TableRow>
                        ) : (
                            purchases.map((purchase: any) => (
                                <TableRow key={purchase.id}>
                                    <TableCell>
                                        {new Date(purchase.purchased_at).toLocaleDateString("pt-BR")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{purchase.profiles?.name || "N/A"}</span>
                                            <span className="text-xs text-muted-foreground">{purchase.profiles?.email || ""}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium">{purchase.marketplace_products?.title || "N/A"}</span>
                                    </TableCell>
                                    <TableCell>
                                        {formatPrice(purchase.purchase_price)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(purchase.status)}
                                    </TableCell>
                                    <TableCell>
                                        {purchase.receipt_url ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 gap-2"
                                                onClick={() => setViewingReceipt(getPublicUrl(purchase.receipt_url))}
                                            >
                                                <FileText className="h-4 w-4" />
                                                Ver Recibo
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">Sem anexo</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Always show Reject button */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => {
                                                    if (confirm(`Tem certeza que deseja rejeitar esta compra?`)) {
                                                        rejectMutation.mutate(purchase);
                                                    }
                                                }}
                                                disabled={purchase.status === "rejected"}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Rejeitar
                                            </Button>
                                            {/* Show Approve only if not completed */}
                                            {purchase.status !== "completed" && (
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => approveMutation.mutate(purchase)}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Aprovar
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Receipt Viewer Dialog */}
            <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-8">
                            <DialogTitle>Comprovativo de Pagamento</DialogTitle>
                            {viewingReceipt && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(viewingReceipt, '_blank')}
                                    className="gap-2"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir em nova aba
                                </Button>
                            )}
                        </div>
                    </DialogHeader>
                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden min-h-[50vh]">
                        {viewingReceipt && (
                            viewingReceipt.split('?')[0].toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={viewingReceipt}
                                    className="w-full h-full min-h-[60vh] border-0 rounded-md"
                                    title="Recibo PDF"
                                />
                            ) : (
                                <img
                                    src={viewingReceipt}
                                    alt="Comprovativo"
                                    className="max-w-full max-h-[70vh] object-contain"
                                />
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
