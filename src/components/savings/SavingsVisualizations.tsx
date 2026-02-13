import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from "recharts";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChartData {
    date: string;
    balance: number;
}

export function ReservesEvolutionChart({ data }: { data: ChartData[] }) {
    if (!data || data.length === 0) {
        return (
            <Card className="h-[400px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados suficientes para o gráfico</p>
            </Card>
        );
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Evolução das Reservas</CardTitle>
                <CardDescription>Crescimento do seu patrimônio nos últimos meses</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => format(parseISO(str), 'MMM', { locale: pt })}
                                stroke="#9ca3af"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                fontSize={12}
                                tickFormatter={(value) => `Kz ${(value / 1000).toFixed(0)}k`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`Kz ${value.toLocaleString()}`, 'Saldo Total']}
                                labelFormatter={(label) => format(parseISO(label), 'dd MMM yyyy', { locale: pt })}
                            />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorBalance)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

interface SavingsTableProps {
    goals: any[];
    onEdit: (goal: any) => void;
    onDelete: (id: string) => void;
}

export function SavingsTable({ goals, onEdit, onDelete }: SavingsTableProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Visão Detalhada</CardTitle>
                    <Badge variant="outline">{goals.length} Metas</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Meta</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Progresso</TableHead>
                            <TableHead>Acumulado</TableHead>
                            <TableHead>Objetivo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {goals.map((goal) => {
                            const progress = Math.min(((goal.saved_amount || 0) / goal.target_amount) * 100, 100);
                            return (
                                <TableRow key={goal.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{goal.icon}</span>
                                            <span>{goal.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`bg-${goal.color}-50 text-${goal.color}-600 border-${goal.color}-200`}>
                                            {goal.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold">{progress.toFixed(0)}%</span>
                                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">Kz {(goal.saved_amount || 0).toLocaleString()}</TableCell>
                                    <TableCell className="font-mono text-muted-foreground">Kz {goal.target_amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        {goal.status === 'completed' ? (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600">Concluída</Badge>
                                        ) : goal.status === 'paused' ? (
                                            <Badge variant="secondary">Pausada</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Ativa</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(goal)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(goal.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
