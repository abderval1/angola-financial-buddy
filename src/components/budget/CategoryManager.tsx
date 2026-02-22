
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Trash2, Plus, Edit2,
    Briefcase, Car, Home, Heart, GraduationCap, Gamepad2, Shirt, FileText, UtensilsCrossed, Laptop, TrendingUp, Plus as PlusIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

// Duplicated maps for self-containment (consider moving to constants file)
const ICON_MAP: Record<string, React.ElementType> = {
    Briefcase, Car, Home, Heart, GraduationCap, Gamepad2, Shirt, FileText, UtensilsCrossed, Laptop, TrendingUp, Plus: PlusIcon
};

const COLOR_MAP: Record<string, string> = {
    emerald: "hsl(160 84% 39%)",
    blue: "hsl(200 90% 45%)",
    purple: "hsl(270 60% 55%)",
    orange: "hsl(25 95% 53%)",
    red: "hsl(0 72% 51%)",
    pink: "hsl(340 75% 55%)",
    yellow: "hsl(45 93% 47%)",
    gray: "hsl(220 10% 45%)",
};

interface Category {
    id: string;
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
    is_default: boolean | null;
}

interface CategoryManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    onUpdate: () => void;
}

export function CategoryManager({ open, onOpenChange, categories, onUpdate }: CategoryManagerProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("expense");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryColor, setNewCategoryColor] = useState("gray");
    const [loading, setLoading] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("gray");

    const filteredCategories = categories.filter(c => c.type === activeTab);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error(t("Nome da categoria é obrigatório"));
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('transaction_categories')
                .insert({
                    user_id: user?.id,
                    name: newCategoryName,
                    type: activeTab,
                    icon: 'FileText', // Default icon for now
                    color: newCategoryColor,
                    is_default: false
                });

            if (error) throw error;

            toast.success(t("Categoria adicionada!"));
            setNewCategoryName("");
            setNewCategoryColor("gray");
            onUpdate();
        } catch (error: any) {
            toast.error(t("Erro ao criar categoria") + ": " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategoryId || !editName.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('transaction_categories')
                .update({
                    name: editName,
                    color: editColor
                })
                .eq('id', editingCategoryId);

            if (error) throw error;

            toast.success(t("Categoria atualizada!"));
            setEditingCategoryId(null);
            onUpdate();
        } catch (error: any) {
            toast.error(t("Erro ao atualizar categoria") + ": " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm(t("Tem certeza? Esta ação não pode ser desfeita."))) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('transaction_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success(t("Categoria removida!", { defaultValue: "Categoria removida!" }));
            onUpdate();
        } catch (error: any) {
            toast.error(t("Erro ao excluir categoria") + ": " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t("Gerir Categorias")}</DialogTitle>
                    <DialogDescription>
                        {t("Adicione ou remova categorias para suas transações.")}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="income">{t("Receitas")}</TabsTrigger>
                        <TabsTrigger value="expense">{t("Despesas")}</TabsTrigger>
                    </TabsList>

                    <div className="py-4 space-y-4">
                        {/* Add New Form */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>{t("Nova Categoria")}</Label>
                                <Input
                                    placeholder={t("Nome da categoria")}
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                            </div>
                            <div className="w-[120px] space-y-2">
                                <Label>{t("Cor")}</Label>
                                <Select value={newCategoryColor} onValueChange={setNewCategoryColor}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(COLOR_MAP).map(color => (
                                            <SelectItem key={color} value={color}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_MAP[color] }} />
                                                    <span className="capitalize">{color}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAddCategory} disabled={loading} size="icon" className="mb-0.5">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            <Label>{t("Categorias Existentes", { defaultValue: "Categorias Existentes" })}</Label>
                            <ScrollArea className="h-[200px] rounded-md border p-2">
                                {filteredCategories.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8 text-sm">
                                        {t("Nenhuma categoria encontrada.")}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredCategories.map((category) => {
                                            const Icon = ICON_MAP[category.icon || 'FileText'] || FileText;
                                            const isEditing = editingCategoryId === category.id;

                                            if (isEditing) {
                                                return (
                                                    <div key={category.id} className="p-3 rounded-lg border bg-accent/20 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 space-y-1">
                                                                <Label className="text-xs">{t("Nome")}</Label>
                                                                <Input
                                                                    size={32}
                                                                    value={editName}
                                                                    onChange={(e) => setEditName(e.target.value)}
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>
                                                            <div className="w-[100px] space-y-1">
                                                                <Label className="text-xs">{t("Cor")}</Label>
                                                                <Select value={editColor} onValueChange={setEditColor}>
                                                                    <SelectTrigger className="h-8 text-sm">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.keys(COLOR_MAP).map(color => (
                                                                            <SelectItem key={color} value={color}>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_MAP[color] }} />
                                                                                    <span className="capitalize text-xs">{color}</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => setEditingCategoryId(null)} className="h-7 text-xs">
                                                                {t("Cancelar")}
                                                            </Button>
                                                            <Button size="sm" onClick={handleUpdateCategory} disabled={loading} className="h-7 text-xs">
                                                                {t("Salvar")}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={category.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                                            style={{ backgroundColor: COLOR_MAP[category.color || 'gray'] || COLOR_MAP.gray }}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-medium text-sm">{category.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                setEditingCategoryId(category.id);
                                                                setEditName(category.name);
                                                                setEditColor(category.color || "gray");
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                            disabled={loading}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
