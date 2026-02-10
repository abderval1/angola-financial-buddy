
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, UserCheck, User } from "lucide-react";

export function AdminLiveMonitor() {
    const { onlineUsers } = useOnlinePresence();

    const registeredUsers = onlineUsers.filter(u => !u.isGuest);
    const guestUsers = onlineUsers.filter(u => u.isGuest);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-bold">Monitoramento em Tempo Real</h1>
                <p className="text-muted-foreground">Visualize usuários conectados agora na plataforma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Online</p>
                            <h3 className="text-3xl font-bold text-primary">{onlineUsers.length}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Globe className="h-6 w-6 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Usuários Registrados</p>
                            <h3 className="text-3xl font-bold text-indigo-600">{registeredUsers.length}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-indigo-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Visitantes (Guests)</p>
                            <h3 className="text-3xl font-bold text-amber-600">{guestUsers.length}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-amber-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registered Users Table */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-indigo-600" />
                            Usuários Registrados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {registeredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum usuário registrado online no momento.
                            </div>
                        ) : (
                            <div className="relative overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Usuário</TableHead>
                                            <TableHead>Função</TableHead>
                                            <TableHead>Página Atual</TableHead>
                                            <TableHead className="text-right">Entrou às</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {registeredUsers.map((user, idx) => (
                                            <TableRow key={user.userId || idx}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                                                    {user.view || '/'}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {new Date(user.onlineAt).toLocaleTimeString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Guests Table */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-amber-600" />
                            Visitantes (Não Registrados)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {guestUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum visitante online no momento.
                            </div>
                        ) : (
                            <div className="relative overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID Sessão</TableHead>
                                            <TableHead>Página Atual</TableHead>
                                            <TableHead className="text-right">Entrou às</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {guestUsers.map((user, idx) => (
                                            <TableRow key={user.guestId || idx}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {user.guestId?.substring(0, 12)}...
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                                                    {user.view || '/'}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {new Date(user.onlineAt).toLocaleTimeString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
