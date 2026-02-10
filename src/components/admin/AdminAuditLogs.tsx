import { useState } from "react";
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

    const { data: logs = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: async () => {
            let query = (supabase
                .from("activity_logs" as any)
                .select("*") as any)
                .order("created_at", { ascending: false })
                .limit(100);

            if (actionFilter !== "all") {
                query = query.eq("action", actionFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Fetch user emails separately if needed
            if (data && data.length > 0) {
                const userIds = [...new Set(data.map((log: any) => log.user_id).filter(Boolean))] as string[];
                if (userIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("user_id, email, first_name, last_name")
                        .in("user_id", userIds);

                    // Merge profile data into logs
                    return data.map((log: any) => ({
                        ...log,
                        profiles: profiles?.find((p: any) => p.user_id === log.user_id)
                    }));
                }
            }

            return data;
        },
    });

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

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Acção</TableHead>
                                    <TableHead>Detalhes</TableHead>
                                    <TableHead>IP/Agent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isError ? (
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
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">
                                                        {log.user_id ? (
                                                            log.profiles?.first_name
                                                                ? `${log.profiles.first_name} ${log.profiles.last_name || ''}`
                                                                : 'Usuário'
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
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-secondary text-secondary-foreground">
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={log.user_agent}>
                                                {log.user_agent ? log.user_agent.substring(0, 30) + '...' : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
