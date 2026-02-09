import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, FileText, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export function AdminAnalytics() {
    const queryClient = useQueryClient();
    const [indicatorDialogOpen, setIndicatorDialogOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [editingIndicator, setEditingIndicator] = useState<any>(null);
    const [editingReport, setEditingReport] = useState<any>(null);

    const [indicatorForm, setIndicatorForm] = useState({
        name: "",
        value: "",
        unit: "%",
        change: "0",
        trend: "stable" as "up" | "down" | "stable"
    });

    const [reportForm, setReportForm] = useState({
        title: "",
        description: "",
        file_url: "",
        category: "Weekly"
    });

    const [trendAnalysis, setTrendAnalysis] = useState("");

    // Queries
    const { data: indicators = [], isLoading: isLoadingIndicators } = useQuery({
        queryKey: ["admin-indicators"],
        queryFn: async () => {
            const { data, error } = await supabase.from("market_indicators").select("*").order("name");
            if (error) throw error;
            return data;
        }
    });

    const { data: reports = [], isLoading: isLoadingReports } = useQuery({
        queryKey: ["admin-reports"],
        queryFn: async () => {
            const { data, error } = await supabase.from("market_reports").select("*").order("published_at", { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    // Trend Query
    useQuery({
        queryKey: ["admin-trend"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("market_trends")
                .select("content")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            if (data) setTrendAnalysis(data.content);
            return data;
        }
    });

    // Indicator Mutations
    const upsertIndicatorMutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                ...data,
                value: parseFloat(data.value),
                change: parseFloat(data.change),
                updated_at: new Date().toISOString()
            };
            const { error } = await supabase.from("market_indicators").upsert(payload, { onConflict: 'name' });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Indicador guardado!");
            queryClient.invalidateQueries({ queryKey: ["admin-indicators"] });
            setIndicatorDialogOpen(false);
            setEditingIndicator(null);
        }
    });

    const deleteIndicatorMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("market_indicators").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Indicador removido!");
            queryClient.invalidateQueries({ queryKey: ["admin-indicators"] });
        }
    });

    // Report Mutations
    const upsertReportMutation = useMutation({
        mutationFn: async (data: any) => {
            const { error } = await supabase.from("market_reports").upsert(data);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Relatório guardado!");
            queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
            setReportDialogOpen(false);
            setEditingReport(null);
        }
    });

    const deleteReportMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("market_reports").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Relatório removido!");
            queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
        }
    });

    const saveTrendMutation = useMutation({
        mutationFn: async (content: string) => {
            const { error } = await supabase.from("market_trends").insert({ content });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Análise de tendência atualizada!");
            queryClient.invalidateQueries({ queryKey: ["admin-trend"] });
        }
    });

    return (
        <div className="space-y-8">
            {/* Market Indicators Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" /> Indicadores de Mercado
                        </h2>
                        <p className="text-sm text-muted-foreground">Gerencie as taxas e índices exibidos no módulo de notícias.</p>
                    </div>
                    <Button onClick={() => {
                        setEditingIndicator(null);
                        setIndicatorForm({ name: "", value: "", unit: "%", change: "0", trend: "stable" });
                        setIndicatorDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Novo Indicador
                    </Button>
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Variação</TableHead>
                                <TableHead>Tendência</TableHead>
                                <TableHead>Atualizado</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {indicators.map((indicator: any) => (
                                <TableRow key={indicator.id}>
                                    <TableCell className="font-medium">{indicator.name}</TableCell>
                                    <TableCell>{indicator.value}{indicator.unit}</TableCell>
                                    <TableCell className={indicator.change > 0 ? "text-emerald-600" : indicator.change < 0 ? "text-red-600" : ""}>
                                        {indicator.change > 0 ? "+" : ""}{indicator.change}%
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {indicator.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" />}
                                            {indicator.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-600" />}
                                            {indicator.trend === 'stable' && <Minus className="h-3 w-3 mr-1 text-neutral-500" />}
                                            {indicator.trend}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(indicator.updated_at), "dd/MM/yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setEditingIndicator(indicator);
                                            setIndicatorForm({
                                                name: indicator.name,
                                                value: indicator.value.toString(),
                                                unit: indicator.unit,
                                                change: indicator.change.toString(),
                                                trend: indicator.trend
                                            });
                                            setIndicatorDialogOpen(true);
                                        }}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteIndicatorMutation.mutate(indicator.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </section>

            {/* Market Trend Analysis Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" /> Análise de Tendência de Mercado
                        </h2>
                        <p className="text-sm text-muted-foreground">Atualize o texto de análise exibido na aba de indicadores.</p>
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Análise Atual</Label>
                            <Textarea
                                value={trendAnalysis}
                                onChange={(e) => setTrendAnalysis(e.target.value)}
                                placeholder="Escreva a análise de mercado aqui..."
                                className="min-h-[150px]"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => saveTrendMutation.mutate(trendAnalysis)} disabled={saveTrendMutation.isPending}>
                                {saveTrendMutation.isPending ? "Salvando..." : "Atualizar Análise"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Weekly Reports Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" /> Relatórios Semanais
                        </h2>
                        <p className="text-sm text-muted-foreground">Faça upload ou adicione links para os relatórios semanais em PDF.</p>
                    </div>
                    <Button onClick={() => {
                        setEditingReport(null);
                        setReportForm({ title: "", description: "", file_url: "", category: "Weekly" });
                        setReportDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Novo Relatório
                    </Button>
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Data de Publicação</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((report: any) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.title}</TableCell>
                                    <TableCell><Badge variant="secondary">{report.category}</Badge></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(report.published_at), "dd 'de' MMMM, yyyy", { locale: pt })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setEditingReport(report);
                                            setReportForm({
                                                title: report.title,
                                                description: report.description,
                                                file_url: report.file_url,
                                                category: report.category
                                            });
                                            setReportDialogOpen(true);
                                        }}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteReportMutation.mutate(report.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </section>

            {/* Indicator Dialog */}
            <Dialog open={indicatorDialogOpen} onOpenChange={setIndicatorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingIndicator ? "Editar Indicador" : "Novo Indicador"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Indicador</Label>
                            <Input value={indicatorForm.name} onChange={e => setIndicatorForm({ ...indicatorForm, name: e.target.value })} placeholder="Ex: Taxa BNA" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valor Atual</Label>
                                <Input type="number" step="0.01" value={indicatorForm.value} onChange={e => setIndicatorForm({ ...indicatorForm, value: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Unidade</Label>
                                <Input value={indicatorForm.unit} onChange={e => setIndicatorForm({ ...indicatorForm, unit: e.target.value })} placeholder="Ex: % ou Kz" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Variação (%)</Label>
                                <Input type="number" step="0.1" value={indicatorForm.change} onChange={e => setIndicatorForm({ ...indicatorForm, change: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tendência</Label>
                                <Select value={indicatorForm.trend} onValueChange={(val: any) => setIndicatorForm({ ...indicatorForm, trend: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="up">Alta (Up)</SelectItem>
                                        <SelectItem value="down">Baixa (Down)</SelectItem>
                                        <SelectItem value="stable">Estável (Stable)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIndicatorDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={() => upsertIndicatorMutation.mutate(editingIndicator ? { ...indicatorForm, id: editingIndicator.id } : indicatorForm)}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Report Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingReport ? "Editar Relatório" : "Novo Relatório"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título do Relatório</Label>
                            <Input value={reportForm.title} onChange={e => setReportForm({ ...reportForm, title: e.target.value })} placeholder="Ex: Análise Semanal #42" />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea value={reportForm.description} onChange={e => setReportForm({ ...reportForm, description: e.target.value })} placeholder="Breve resumo do conteúdo..." />
                        </div>
                        <div className="space-y-2">
                            <Label>URL do Arquivo (PDF)</Label>
                            <Input value={reportForm.file_url} onChange={e => setReportForm({ ...reportForm, file_url: e.target.value })} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Input value={reportForm.category} onChange={e => setReportForm({ ...reportForm, category: e.target.value })} placeholder="Ex: Weekly, Monthly, Special" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={() => upsertReportMutation.mutate(editingReport ? { ...reportForm, id: editingReport.id } : reportForm)}>Publicar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
