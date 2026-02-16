import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
    MessageCircle,
    Check,
    XCircle,
    Trash2,
    Bell,
    Search,
} from "lucide-react";

export function AdminBlogComments() {
    const queryClient = useQueryClient();
    const [commentFilter, setCommentFilter] = useState<"pending" | "approved" | "all">("pending");

    // Fetch all comments
    const { data: allComments = [], isLoading: isLoadingComments } = useQuery({
        queryKey: ["admin-blog-comments", commentFilter],
        queryFn: async () => {
            let query = supabase
                .from("blog_comments")
                .select("*, blog_posts(title)")
                .order("created_at", { ascending: false });

            if (commentFilter === "pending") {
                query = query.eq("is_approved", false);
            } else if (commentFilter === "approved") {
                query = query.eq("is_approved", true);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching comments:", error);
                toast.error("Erro ao carregar comentários");
                return [];
            }

            return data || [];
        },
    });

    // Count pending comments
    const { data: pendingCommentsCount = 0 } = useQuery({
        queryKey: ["admin-blog-pending-comments-count"],
        queryFn: async () => {
            const { count } = await supabase
                .from("blog_comments")
                .select("*", { count: "exact", head: true })
                .eq("is_approved", false);
            return count || 0;
        },
    });

    // Approve comment mutation
    const approveComment = useMutation({
        mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
            const { error } = await supabase
                .from("blog_comments")
                .update({ is_approved })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-comments"] });
            queryClient.invalidateQueries({ queryKey: ["admin-blog-pending-comments-count"] });
            toast.success("Comentário atualizado!");
        },
        onError: (error: any) => {
            toast.error(`Erro: ${error.message}`);
        },
    });

    // Delete comment mutation
    const deleteComment = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("blog_comments")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-comments"] });
            queryClient.invalidateQueries({ queryKey: ["admin-blog-pending-comments-count"] });
            toast.success("Comentário excluído!");
        },
        onError: (error: any) => {
            toast.error(`Erro: ${error.message}`);
        },
    });

    const formatDate = (date: string) => {
        if (!date) return "-";
        return format(new Date(date), "dd MMM yyyy HH:mm", { locale: pt });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Comentários do Blog
                        {pendingCommentsCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {pendingCommentsCount} pendentes
                            </Badge>
                        )}
                    </CardTitle>
                    <Select
                        value={commentFilter}
                        onValueChange={(v) => setCommentFilter(v as "pending" | "approved" | "all")}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="all">Todos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingComments ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Carregando...</p>
                    </div>
                ) : allComments.length === 0 ? (
                    <div className="p-8 text-center">
                        <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum comentário encontrado</h3>
                        <p className="text-muted-foreground">
                            {commentFilter === "pending"
                                ? "Não há comentários pendentes de aprovação."
                                : commentFilter === "approved"
                                    ? "Não há comentários aprovados."
                                    : "Ainda não há comentários no blog."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {allComments.map((comment: any) => (
                            <div key={comment.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-medium">{comment.user_name || "Anónimo"}</p>
                                        <p className="text-xs text-muted-foreground">{comment.user_email || "-"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {comment.is_approved ? (
                                            <Badge variant="default" className="bg-green-500">
                                                <Check className="h-3 w-3 mr-1" />
                                                Aprovado
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-orange-500">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Pendente
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm mb-2">{comment.content}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Artigo: {comment.blog_posts?.title || "Não encontrado"}</span>
                                    <span>{formatDate(comment.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                    {!comment.is_approved && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => approveComment.mutate({ id: comment.id, is_approved: true })}
                                            disabled={approveComment.isPending}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Aprovar
                                        </Button>
                                    )}
                                    {comment.is_approved && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => approveComment.mutate({ id: comment.id, is_approved: false })}
                                            disabled={approveComment.isPending}
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Desaprovar
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={() => {
                                            if (confirm("Tem certeza que deseja excluir este comentário?")) {
                                                deleteComment.mutate(comment.id);
                                            }
                                        }}
                                        disabled={deleteComment.isPending}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
