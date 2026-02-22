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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Search, Filter, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export function AdminAuditLogs() {
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const PAGE_SIZE = 20;

    // Check if user is admin
    useEffect(() => {
        const checkAdminRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setIsAdmin(false);
                return;
            }

            // Try the new secure rpc first
            try {
                const { data: hasPerm, error: rpcError } = await supabase.rpc('has_permission', { p_permission: 'read:audit' });
                if (!rpcError && hasPerm !== null) {
                    setIsAdmin(hasPerm);
                    return;
                }
            } catch (e) {
                console.warn('has_permission RPC not found, falling back to direct query');
            }

            // Fallback for older schema
            const { data: roles } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id);

            const isUserAdmin = roles?.some(r => r.role === 'admin') || false;
            setIsAdmin(isUserAdmin);
        };

        checkAdminRole();
    }, []);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["audit-logs", actionFilter, currentPage, isAdmin],
        queryFn: async () => {
            const from = (currentPage - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // Use the new secure RPC functions to bypass RLS for admins
            // 1. Get total count via RPC
            const { data: countData, error: countError } = await supabase
                .rpc('get_audit_logs_count' as any, {
                    p_is_admin: isAdmin,
                    p_action_filter: actionFilter
                });

            if (countError) {
                console.error('Error fetching logs count:', countError);
            }
            const count = Number(countData) || 0;

            // 2. Get paginated logs via RPC
            const { data: logsData, error: logsError } = await supabase
                .rpc('get_audit_logs' as any, {
                    p_is_admin: isAdmin,
                    p_action_filter: actionFilter
                })
                .range(from, to);

            if (logsError) {
                console.error('Error fetching logs via RPC:', logsError);
                throw logsError;
            }

            const logs = logsData as any || [];

            // 3. Get user info for each log (Profiles RLS allows public read for authenticated)
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
        enabled: isAdmin !== null,
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

                    <div className="rounded-md border overflow-x-auto max-h-[600px] scrollbar-custom w-full">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                                    <TableHead className="whitespace-nowrap">Usuário</TableHead>
                                    <TableHead className="whitespace-nowrap">Role</TableHead>
                                    <TableHead className="whitespace-nowrap">Acção</TableHead>
                                    <TableHead className="whitespace-nowrap">Recurso</TableHead>
                                    <TableHead className="whitespace-nowrap">Status</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">Detalhes</TableHead>
                                    <TableHead className="whitespace-nowrap">IP/Agent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isAdmin === null ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
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
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                Carregando logs...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
                                            <TableCell className="whitespace-nowrap">
                                                <Badge
                                                    variant={log.role === 'admin' ? "default" : log.role === 'moderator' ? "secondary" : "outline"}
                                                    className="capitalize text-[10px]"
                                                >
                                                    {log.role || 'user'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-secondary text-secondary-foreground whitespace-nowrap">
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                                                {log.resource || 'system'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] ${log.status === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                                                >
                                                    {log.status || 'success'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-[100px] scrollbar-custom">
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

                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 px-2">
                        <div className="text-xs text-muted-foreground order-2 sm:order-1">
                            Mostrando {logs.length} de {totalCount} registos
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 order-1 sm:order-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Smart Pagination Numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}

                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <>
                                        <span className="text-muted-foreground text-xs px-1">...</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage(totalPages)}
                                        >
                                            {totalPages}
                                        </Button>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || isLoading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
