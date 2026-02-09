
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Reply as ReplyIcon, Pencil, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

interface DiscussionDialogProps {
    post: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DiscussionDialog({ post, isOpen, onOpenChange }: DiscussionDialogProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { awardXP } = useAchievements();
    const [commentText, setCommentText] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");

    // Fetch comments for this post
    const { data: comments = [], isLoading } = useQuery({
        queryKey: ["post-comments", post?.id],
        queryFn: async () => {
            const { data: commentsData, error } = await supabase
                .from("post_comments")
                .select("*")
                .eq("post_id", post.id)
                .order("created_at", { ascending: true });

            if (error) throw error;

            // Fetch profiles
            const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
            const { data: profiles } = await supabase
                .from("profiles")
                .select("user_id, name, email")
                .in("user_id", userIds);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

            return (commentsData || []).map(comment => {
                const profile = profileMap.get(comment.user_id);
                return {
                    ...comment,
                    author_name: profile?.name || profile?.email?.split("@")[0] || "Usuário",
                };
            });
        },
        enabled: !!post?.id && isOpen,
    });

    // Real-time updates for comments
    useEffect(() => {
        if (!post?.id || !isOpen) return;

        const channel = supabase
            .channel(`post-comments-${post.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "post_comments",
                    filter: `post_id=eq.${post.id}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
                    queryClient.invalidateQueries({ queryKey: ["community-posts"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [post?.id, isOpen, queryClient]);

    // Create comment mutation
    const createCommentMutation = useMutation({
        mutationFn: async (content: string) => {
            // Insert comment
            const { error: commentError } = await supabase.from("post_comments").insert({
                post_id: post.id,
                user_id: user?.id,
                content: content,
            });

            if (commentError) throw commentError;

            // Increment comment count on the post using atomic function
            const { error: rpcError } = await (supabase.rpc as any)('increment_post_comments', {
                post_id_param: post.id
            });

            if (rpcError) throw rpcError;

            // Award 1 XP for commenting
            await awardXP(1, "Comentou numa discussão");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
            queryClient.invalidateQueries({ queryKey: ["community-posts"] });
            setCommentText("");
            toast.success("Comentário enviado!");
        },
        onError: (error: any) => {
            toast.error("Erro ao enviar comentário: " + error.message);
        },
    });

    // Delete comment mutation
    const deleteCommentMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const { error } = await supabase
                .from("post_comments")
                .delete()
                .eq("id", commentId)
                .eq("user_id", user?.id);

            if (error) throw error;

            // Decrement comment count on the post using atomic function
            const { error: rpcError } = await (supabase.rpc as any)('decrement_post_comments', {
                post_id_param: post.id
            });

            if (rpcError) throw rpcError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
            queryClient.invalidateQueries({ queryKey: ["community-posts"] });
            toast.success("Comentário removido!");
        },
        onError: (error: any) => {
            toast.error("Erro ao remover comentário");
            console.error(error);
        },
    });

    // Edit comment mutation
    const editCommentMutation = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            const { error } = await supabase
                .from("post_comments")
                .update({ content: content.trim() })
                .eq("id", id)
                .eq("user_id", user?.id);

            if (error) throw error;
        },
        onSuccess: () => {
            setEditingCommentId(null);
            setEditingContent("");
            queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
            toast.success("Comentário editado!");
        },
        onError: (error: any) => {
            toast.error("Erro ao editar comentário");
            console.error(error);
        },
    });

    const handleSendComment = () => {
        if (!commentText.trim() || createCommentMutation.isPending) return;
        createCommentMutation.mutate(commentText);
    };

    if (!post) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs uppercase">
                            {post.category === "tips" ? "Dicas" :
                                post.category === "question" ? "Pergunta" :
                                    post.category === "success" ? "Sucesso" : "Discussão"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: pt })}
                        </span>
                    </div>
                    <DialogTitle className="text-2xl font-bold leading-tight">{post.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary uppercase font-bold">
                                {post.author_name?.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{post.author_name}</span>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 mt-4">
                    <div className="space-y-6 pb-6">
                        <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {post.content}
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                <MessageCircle className="h-5 w-5 text-primary" />
                                Diz o que achas ({comments.length})
                            </h3>

                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed">
                                    <p className="text-muted-foreground text-sm">Nenhum comentário ainda. Começa a conversa!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map((comment: any) => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback className="text-xs bg-primary/5 text-primary uppercase font-medium">
                                                    {comment.author_name?.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-none">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-foreground">
                                                                {comment.user_id === user?.id ? "Tu" : comment.author_name}
                                                            </span>
                                                            {comment.user_id === user?.id && (
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        className="text-muted-foreground hover:text-primary"
                                                                        onClick={() => {
                                                                            setEditingCommentId(comment.id);
                                                                            setEditingContent(comment.content);
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                    </button>
                                                                    <button
                                                                        className="text-muted-foreground hover:text-destructive"
                                                                        onClick={() => {
                                                                            if (window.confirm("Remover este comentário?")) {
                                                                                deleteCommentMutation.mutate(comment.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: pt })}
                                                        </span>
                                                    </div>
                                                    {editingCommentId === comment.id ? (
                                                        <div className="flex flex-col gap-2 py-1">
                                                            <Input
                                                                value={editingContent}
                                                                onChange={(e) => setEditingContent(e.target.value)}
                                                                className="h-8 text-sm bg-background"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') editCommentMutation.mutate({ id: comment.id, content: editingContent });
                                                                    if (e.key === 'Escape') setEditingCommentId(null);
                                                                }}
                                                            />
                                                            <div className="flex justify-end gap-1">
                                                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setEditingCommentId(null)}>
                                                                    <X className="h-3 w-3 mr-1" /> Cancelar
                                                                </Button>
                                                                <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => editCommentMutation.mutate({ id: comment.id, content: editingContent })}>
                                                                    Salvar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm leading-normal">{comment.content}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 bg-background border-t">
                    <div className="flex gap-2 relative">
                        <Textarea
                            placeholder="Escreve um comentário..."
                            className="min-h-[60px] max-h-[120px] resize-none pr-12 rounded-2xl bg-muted/50 border-transparent focus-visible:ring-primary/20"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendComment();
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            className="absolute right-2 bottom-2 rounded-full h-8 w-8 shrink-0 gradient-primary"
                            disabled={!commentText.trim() || createCommentMutation.isPending}
                            onClick={handleSendComment}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 px-2">
                        Respeita os outros membros da comunidade.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
