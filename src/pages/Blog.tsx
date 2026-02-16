import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
    Search,
    Clock,
    Eye,
    MessageCircle,
    ChevronRight,
    Calendar,
    User,
    Send,
    BookText,
    Star,
    Trash2,
    Reply,
    Edit2,
} from "lucide-react";

const categories = [
    { value: "all", label: "Todos" },
    { value: "financas", label: "Finanças" },
    { value: "investimentos", label: "Investimentos" },
    { value: "economia", label: "Economia" },
    { value: "renda_extra", label: "Renda Extra" },
    { value: "poupanca", label: "Poupança" },
];

export default function Blog() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [commentContent, setCommentContent] = useState("");
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);

    // Fetch published blog posts
    const { data: posts = [], isLoading, refetch } = useQuery({
        queryKey: ["blog-posts", selectedCategory, searchQuery],
        queryFn: async () => {
            let query = supabase
                .from("blog_posts")
                .select("*")
                .eq("is_published", true)
                .order("published_at", { ascending: false });

            if (selectedCategory !== "all") {
                query = query.eq("category", selectedCategory);
            }

            if (searchQuery) {
                query = query.ilike("title", `%${searchQuery}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
    });

    // Featured posts
    const { data: featuredPosts = [] } = useQuery({
        queryKey: ["blog-featured"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("is_published", true)
                .eq("is_featured", true)
                .order("published_at", { ascending: false })
                .limit(3);
            if (error) throw error;
            return data || [];
        },
    });

    // Fetch comments for selected post
    const { data: comments = [], refetch: refetchComments } = useQuery({
        queryKey: ["blog-comments", selectedPost?.id],
        queryFn: async () => {
            if (!selectedPost?.id) return [];
            const { data, error } = await supabase
                .from("blog_comments")
                .select("*")
                .eq("post_id", selectedPost.id)
                .eq("is_approved", true)
                .order("created_at", { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedPost?.id,
    });

    // Create comment mutation
    const createComment = async () => {
        if (!commentContent.trim()) {
            toast.error("Por favor, escreva um comentário");
            return;
        }

        const { error } = await supabase.from("blog_comments").insert({
            post_id: selectedPost.id,
            user_id: user?.id || null,
            user_name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Anónimo",
            user_email: user?.email || null,
            content: commentContent,
            parent_id: replyingTo?.id || null,
            is_approved: true,
        });

        if (error) {
            console.error("Error creating comment:", error);
            toast.error("Erro ao criar comentário");
            return;
        }

        toast.success("Comentário adicionado com sucesso!");
        setCommentContent("");
        setReplyingTo(null);
        setCommentDialogOpen(false);
        refetchComments();
        refetch();
    };

    // Delete comment mutation
    const deleteComment = async (commentId: string) => {
        const { error } = await supabase
            .from("blog_comments")
            .delete()
            .eq("id", commentId);

        if (error) {
            console.error("Error deleting comment:", error);
            toast.error("Erro ao eliminar comentário");
            return;
        }

        toast.success("Comentário eliminado com sucesso!");
        refetchComments();
    };

    // Update comment mutation
    const updateComment = async (commentId: string, newContent: string) => {
        const { error } = await supabase
            .from("blog_comments")
            .update({ content: newContent, updated_at: new Date().toISOString() })
            .eq("id", commentId);

        if (error) {
            console.error("Error updating comment:", error);
            toast.error("Erro ao atualizar comentário");
            return;
        }

        toast.success("Comentário atualizado com sucesso!");
        setEditingComment(null);
        refetchComments();
    };

    const openPost = async (post: any) => {
        setSelectedPost(post);
        setCommentDialogOpen(true);
        await (supabase as any).rpc('increment_blog_view_count', { p_post_id: post.id });
    };

    const formatDate = (date: string) => {
        if (!date) return "";
        return format(new Date(date), "dd MMM yyyy", { locale: pt });
    };

    const getCategoryLabel = (category: string) => {
        return categories.find((c) => c.value === category)?.label || category;
    };

    return (
        <AppLayout title="Blog Angola Finance" subtitle="Artigos, dicas e notícias sobre finanças pessoais em Angola">
            <div className="container py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <BookText className="h-8 w-8 text-primary" />
                        Blog Angola Finance
                    </h1>
                    <p className="text-muted-foreground">
                        Artigos, dicas e notícias sobre finanças pessoais em Angola
                    </p>
                </div>

                {/* Featured Posts */}
                {featuredPosts.length > 0 && selectedCategory === "all" && !searchQuery && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Star className="h-5 w-5 text-amber-500" />
                            Artigos em Destaque
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {featuredPosts.map((post: any) => (
                                <Card
                                    key={post.id}
                                    className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                                    onClick={() => openPost(post)}
                                >
                                    <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        {post.thumbnail_url ? (
                                            <img
                                                src={post.thumbnail_url}
                                                alt={post.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <BookText className="h-16 w-16 text-primary/30" />
                                        )}
                                    </div>
                                    <CardHeader className="pb-2">
                                        <Badge variant="secondary" className="w-fit mb-2">
                                            {getCategoryLabel(post.category)}
                                        </Badge>
                                        <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {post.summary}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="text-xs text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {post.read_time_minutes} min
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {post.view_count || 0}
                                            </span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search and Filter */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar artigos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((cat) => (
                            <Button
                                key={cat.value}
                                variant={selectedCategory === cat.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setSelectedCategory(cat.value);
                                    setSearchQuery("");
                                }}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Posts Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <div className="h-40 bg-muted" />
                                <CardHeader>
                                    <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                                    <div className="h-6 bg-muted rounded" />
                                </CardHeader>
                                <CardContent>
                                    <div className="h-4 bg-muted rounded" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12">
                        <BookText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum artigo encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post: any) => (
                            <Card
                                key={post.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                                onClick={() => openPost(post)}
                            >
                                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    {post.thumbnail_url ? (
                                        <img
                                            src={post.thumbnail_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <BookText className="h-16 w-16 text-primary/30" />
                                    )}
                                </div>
                                <CardHeader className="pb-2">
                                    <Badge variant="secondary" className="w-fit mb-2">
                                        {getCategoryLabel(post.category)}
                                    </Badge>
                                    <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-muted-foreground line-clamp-3">
                                        {post.summary}
                                    </p>
                                </CardContent>
                                <CardFooter className="text-xs text-muted-foreground">
                                    <div className="flex items-center justify-between w-full">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(post.published_at)}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {post.read_time_minutes} min
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {post.view_count || 0}
                                            </span>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Post Detail Dialog */}
                <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{getCategoryLabel(selectedPost?.category)}</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(selectedPost?.published_at)}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {selectedPost?.read_time_minutes} min de leitura
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {selectedPost?.view_count || 0} visualizações
                                </span>
                            </div>
                            <DialogTitle className="text-2xl">{selectedPost?.title}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div
                                className="prose prose-sm max-w-none dark:prose-invert"
                                style={{ lineHeight: '1.8' }}
                                dangerouslySetInnerHTML={{ __html: selectedPost?.content || "" }}
                            />

                            {/* Comments Section */}
                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    Comentários ({comments.length})
                                </h3>

                                {/* Add Comment Form */}
                                <div className="mb-6">
                                    <Textarea
                                        placeholder={replyingTo ? `Respondendo a ${replyingTo.name}...` : "Escreva um comentário..."}
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        className="mb-2"
                                        rows={3}
                                    />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {replyingTo && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setReplyingTo(null)}
                                                >
                                                    Cancelar resposta
                                                </Button>
                                            )}
                                        </div>
                                        <Button onClick={createComment}>
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar
                                        </Button>
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    {comments.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">
                                            Ainda não há comentários. Seja o primeiro a comentar!
                                        </p>
                                    ) : (
                                        comments.map((comment: any) => {
                                            const isOwnComment = user?.id === comment.user_id;
                                            const isEditing = editingComment?.id === comment.id;

                                            return (
                                                <div key={comment.id} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <User className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{comment.user_name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDate(comment.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {isOwnComment && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                                                                    >
                                                                        <Edit2 className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            if (confirm("Tem certeza que deseja eliminar este comentário?")) {
                                                                                deleteComment(comment.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setReplyingTo({ id: comment.id, name: comment.user_name })}
                                                            >
                                                                <Reply className="h-4 w-4 mr-1" />
                                                                Responder
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="pl-10 space-y-2">
                                                            <Textarea
                                                                value={editingComment.content}
                                                                onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                                                rows={3}
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => updateComment(editingComment.id, editingComment.content)}
                                                                >
                                                                    Guardar
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setEditingComment(null)}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm pl-10">{comment.content}</p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog></div></AppLayout>);
}

