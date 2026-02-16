import { useState, useRef } from "react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
    Plus,
    Edit2,
    Trash2,
    BookText,
    Eye,
    EyeOff,
    Search,
    Star,
    Calendar,
    Clock,
    MessageCircle,
    Upload,
    Save,
    X,
} from "lucide-react";

const categories = [
    { value: "financas", label: "Finanças" },
    { value: "investimentos", label: "Investimentos" },
    { value: "economia", label: "Economia" },
    { value: "renda_extra", label: "Renda Extra" },
    { value: "poupanca", label: "Poupança" },
    { value: "dividas", label: "Dívidas" },
    { value: "aposentadoria", label: "Aposentadoria" },
];

export function AdminBlogManager() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingPost, setEditingPost] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        summary: "",
        content: "",
        thumbnail_url: "",
        category: "financas",
        tags: "",
        is_published: false,
        is_featured: false,
        read_time_minutes: 5,
        author_name: "Angola Finance",
    });

    // Fetch blog posts
    const { data: posts = [], isLoading, refetch } = useQuery({
        queryKey: ["admin-blog-posts"],
        queryFn: async () => {
            let query = supabase
                .from("blog_posts")
                .select("*")
                .order("created_at", { ascending: false });

            if (searchQuery) {
                query = query.ilike("title", `%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching posts:", error);
                toast.error("Erro ao carregar posts");
                return [];
            }

            // Fetch comment counts for each post
            const postsWithComments = await Promise.all(
                (data || []).map(async (post) => {
                    const { count } = await supabase
                        .from("blog_comments")
                        .select("*", { count: "exact", head: true })
                        .eq("post_id", post.id);

                    return { ...post, comment_count: count || 0 };
                })
            );

            return postsWithComments;
        },
    });

    // Create post mutation
    const createPost = useMutation({
        mutationFn: async (data: any) => {
            const postData = {
                ...data,
                tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
                published_at: data.is_published ? new Date().toISOString() : null,
            };

            const { error } = await supabase.from("blog_posts").insert(postData);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
            toast.success("Post criado com sucesso!");
            setDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            console.error("Error creating post:", error);
            toast.error(`Erro ao criar post: ${error.message}`);
        },
    });

    // Update post mutation
    const updatePost = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const postData = {
                ...data,
                tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
                published_at: data.is_published ? new Date().toISOString() : null,
            };

            const { error } = await supabase
                .from("blog_posts")
                .update(postData)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
            toast.success("Post atualizado com sucesso!");
            setDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            console.error("Error updating post:", error);
            toast.error(`Erro ao atualizar post: ${error.message}`);
        },
    });

    // Delete post mutation
    const deletePost = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("blog_posts").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
            toast.success("Post excluído com sucesso!");
        },
        onError: (error: any) => {
            console.error("Error deleting post:", error);
            toast.error(`Erro ao excluir post: ${error.message}`);
        },
    });

    // Toggle publish status
    const togglePublish = useMutation({
        mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
            const { error } = await supabase
                .from("blog_posts")
                .update({
                    is_published,
                    published_at: is_published ? new Date().toISOString() : null
                })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
            toast.success("Status atualizado!");
        },
        onError: (error: any) => {
            toast.error(`Erro: ${error.message}`);
        },
    });

    // Toggle featured
    const toggleFeatured = useMutation({
        mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
            const { error } = await supabase
                .from("blog_posts")
                .update({ is_featured })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
            toast.success("Destaque atualizado!");
        },
        onError: (error: any) => {
            toast.error(`Erro: ${error.message}`);
        },
    });

    const resetForm = () => {
        setFormData({
            title: "",
            slug: "",
            summary: "",
            content: "",
            thumbnail_url: "",
            category: "financas",
            tags: "",
            is_published: false,
            is_featured: false,
            read_time_minutes: 5,
            author_name: "Angola Finance",
        });
        setEditingPost(null);
    };

    const openEditDialog = (post: any) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            slug: post.slug,
            summary: post.summary || "",
            content: post.content || "",
            thumbnail_url: post.thumbnail_url || "",
            category: post.category || "financas",
            tags: post.tags?.join(", ") || "",
            is_published: post.is_published || false,
            is_featured: post.is_featured || false,
            read_time_minutes: post.read_time_minutes || 5,
            author_name: post.author_name || "Angola Finance",
        });
        setDialogOpen(true);
    };

    const openNewDialog = () => {
        resetForm();
        setDialogOpen(true);
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleTitleChange = (title: string) => {
        setFormData((prev) => ({
            ...prev,
            title,
            slug: prev.slug || generateSlug(title),
        }));
    };

    const handleSubmit = () => {
        if (!formData.title || !formData.content) {
            toast.error("Preencha o título e o conteúdo");
            return;
        }

        if (editingPost) {
            updatePost.mutate({ id: editingPost.id, data: formData });
        } else {
            createPost.mutate(formData);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `blog/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("media")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from("media").getPublicUrl(filePath);

            setFormData((prev) => ({
                ...prev,
                thumbnail_url: data.publicUrl,
            }));

            toast.success("Imagem carregada com sucesso!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(`Erro ao carregar imagem: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (date: string) => {
        if (!date) return "-";
        return format(new Date(date), "dd MMM yyyy", { locale: pt });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BookText className="h-6 w-6" />
                        Gestão do Blog
                    </h2>
                    <p className="text-muted-foreground">
                        Crie e gerencie artigos do blog
                    </p>
                </div>
                <Button onClick={openNewDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Artigo
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar artigos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Badge variant="outline" className="text-sm">
                    {posts.length} artigos
                </Badge>
            </div>

            {/* Posts Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Carregando...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-8 text-center">
                            <BookText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Nenhum artigo encontrado</h3>
                            <p className="text-muted-foreground mb-4">
                                Comece criando seu primeiro artigo
                            </p>
                            <Button onClick={openNewDialog}>
                                <Plus className="h-4 w-4 mr-2" />
                                Criar Artigo
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Visualizações</TableHead>
                                    <TableHead>Comentários</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((post: any) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {post.is_featured && (
                                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                                )}
                                                <span className="line-clamp-1">{post.title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {categories.find((c) => c.value === post.category)?.label || post.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => togglePublish.mutate({ id: post.id, is_published: !post.is_published })}
                                                    disabled={togglePublish.isPending}
                                                >
                                                    {post.is_published ? (
                                                        <Eye className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                                <span className={post.is_published ? "text-green-500" : "text-muted-foreground"}>
                                                    {post.is_published ? "Publicado" : "Rascunho"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{post.view_count || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="h-4 w-4" />
                                                {post.comment_count || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(post.published_at || post.created_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleFeatured.mutate({ id: post.id, is_featured: !post.is_featured })}
                                                    disabled={toggleFeatured.isPending}
                                                >
                                                    <Star className={`h-4 w-4 ${post.is_featured ? "text-amber-500 fill-amber-500" : ""}`} />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(post)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (confirm("Tem certeza que deseja excluir este post?")) {
                                                            deletePost.mutate(post.id);
                                                        }
                                                    }}
                                                    disabled={deletePost.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPost ? "Editar Artigo" : "Novo Artigo"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <Label htmlFor="title">Título *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Título do artigo"
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="url-do-artigo"
                            />
                        </div>

                        {/* Summary */}
                        <div>
                            <Label htmlFor="summary">Resumo</Label>
                            <Textarea
                                id="summary"
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                placeholder="Resumo do artigo (opcional)"
                                rows={2}
                            />
                        </div>

                        {/* Category */}
                        <div>
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

                        {/* Tags */}
                        <div>
                            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="finanças, investimentos, Angola"
                            />
                        </div>

                        {/* Read Time */}
                        <div>
                            <Label htmlFor="read_time">Tempo de leitura (minutos)</Label>
                            <Input
                                id="read_time"
                                type="number"
                                value={formData.read_time_minutes}
                                onChange={(e) => setFormData({ ...formData, read_time_minutes: parseInt(e.target.value) || 5 })}
                            />
                        </div>

                        {/* Author */}
                        <div>
                            <Label htmlFor="author">Autor</Label>
                            <Input
                                id="author"
                                value={formData.author_name}
                                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                            />
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <Label>Imagem de Capa</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Input
                                        value={formData.thumbnail_url}
                                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        placeholder="URL da imagem"
                                    />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploading ? "Carregando..." : "Upload"}
                                </Button>
                            </div>
                            {formData.thumbnail_url && (
                                <div className="mt-2 relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                                    <img
                                        src={formData.thumbnail_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => setFormData({ ...formData, thumbnail_url: "" })}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div>
                            <Label>Conteúdo *</Label>
                            <RichTextEditor
                                content={formData.content}
                                onChange={(value) => setFormData({ ...formData, content: value })}
                                placeholder="Escreva o conteúdo do artigo aqui..."
                            />
                        </div>

                        {/* Options */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="published"
                                    checked={formData.is_published}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                                />
                                <Label htmlFor="published">Publicar</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="featured"
                                    checked={formData.is_featured}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                                />
                                <Label htmlFor="featured">Em destaque</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={createPost.isPending || updatePost.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {editingPost ? "Atualizar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
