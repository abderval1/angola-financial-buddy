import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Search, Filter, RefreshCw, Loader2 } from "lucide-react";

export function AdminAuditLogs() {
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const PAGE_SIZE = 20;

    // Check if user is admin
    useEffect(() => {
        const checkAdminRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .eq("role", "admin")
                .maybeSingle();

            setIsAdmin(!!roleData);
        };

        checkAdminRole();
    }, []);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["audit-logs", actionFilter, currentPage, isAdmin],
        queryFn: async () => {
            const from = (currentPage - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // Use RPC function for admin users to bypass RLS issues
            let logs: any[] = [];
            let count = 0;

            if (isAdmin) {
                // Get total count first
                const { count: totalCount } = await supabase
                    .from("activity_logs" as any)
                    .select("*", { count: 'exact', head: true });
                count = totalCount || 0;

                // Use the function for admin to get paginated logs
                const { data: logsData, error: logsError } = await supabase
                    .rpc('get_activity_logs' as any, { p_is_admin: true })
                    .range(from, to);

                if (logsError) {
                    console.error('Error fetching all logs via RPC:', logsError);
                    // Fallback to direct query
                    const { data: fallbackLogs, error: fallbackError } = await supabase
                        .from("activity_logs" as any)
                        .select("*", { count: 'exact' })
                        .order("created_at", { ascending: false })
                        .range(from, to);

                    if (fallbackError) throw fallbackError;
                    logs = fallbackLogs || [];
                } else {
                    logs = logsData as any || [];
                }
            } else {
                // For non-admin users, only get their own logs
                const { data: { user } } = await supabase.auth.getUser();

                // Get total count
                const { count: ownCount } = await supabase
                    .from("activity_logs" as any)
                    .select("*", { count: 'exact', head: true })
                    .eq("user_id", user?.id);
                count = ownCount || 0;

                const { data: ownLogs, error: ownError } = await supabase
                    .from("activity_logs" as any)
                    .select("*", { count: 'exact' })
                    .eq("user_id", user?.id)
                    .order("created_at", { ascending: false })
                    .range(from, to);

                if (ownError) throw ownError;
                logs = ownLogs || [];
            }

            // Apply action filter if needed
            if (actionFilter !== "all") {
                logs = logs.filter((log: any) => log.action === actionFilter);
            }

            // Get user info for each log
            const userIds = [...new Set(logs.map((log: any) => log.user_id).filter(Boolean))] as string[];
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("user_id, email, name")
                    .in("user_id", userIds);

                const mergedLogs = logs.map((log: any) => ({
                    ...log,
                    profiles: profiles?.find((p: any) => p.user_id === log.user_id)
                }));

                return { logs: mergedLogs, total: count };
            }

            return { logs, total: count };
        },
        enabled: isAdmin === true,
    });

    const logs = data?.logs || [];
    const totalCount = data?.total || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const filteredLogs = logs.filter((log: any) => {
        const searchLower = searchTerm.toLowerCase();
        const userEmail = log.profiles?.email?.toLowerCase() || "";
        const action = log.action?.toLowerCase() || "";
        const details = JSON.stringify(log.details).toLowerCase();

        return (
            userEmail.includes(searchLower) ||
            action.includes(searchLower) ||
            details.includes(searchLower)
        );
    });

    const uniqueActions = Array.from(new Set(logs.map((log: any) => log.action)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Logs de Auditoria</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Actividades</CardTitle>
                    <CardDescription>
                        Registo detalhado de acções dos usuários no sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar por email, acção ou detalhes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[200px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filtrar por Acção" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Acções</SelectItem>
                                {uniqueActions.map((action: any) => (
                                    <SelectItem key={action} value={action}>
                                        {action}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border overflow-auto max-h-[600px] scrollbar-custom">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                                    <TableHead className="whitespace-nowrap">Usuário</TableHead>
                                    <TableHead className="whitespace-nowrap">Acção</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[300px]">Detalhes</TableHead>
                                    <TableHead className="whitespace-nowrap">IP/Agent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isAdmin === null ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                Verificando permissões...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-destructive">
                                            Erro ao carregar logs: {(error as any)?.message}
                                        </TableCell>
                                    </TableRow>
                                ) : isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                Carregando logs...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhum registo encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log: any) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap font-medium">
                                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: pt })}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">
                                                        {log.user_id ? (
                                                            log.profiles?.name || 'Usuário'
                                                        ) : (
                                                            'Anônimo'
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {log.profiles?.email || (log.user_id ? log.user_id.substring(0, 8) + '...' : '-')}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-secondary text-secondary-foreground whitespace-nowrap">
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="min-w-[400px]">
                                                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-[150px] scrollbar-custom">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap px-4" title={log.user_agent}>
                                                {log.user_agent || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-6 px-2">
                        <div className="text-xs text-muted-foreground">
                            Mostrando {logs.length} de {totalCount} registos
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || isLoading}
                            >
                                Anterior
                            </Button>
                            <div className="text-xs font-bold">
                                Página {currentPage} de {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || isLoading}
                            >
                                Próximo
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
