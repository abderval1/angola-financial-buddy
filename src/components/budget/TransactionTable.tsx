import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Transaction {
    id: string;
    type: string;
    amount: number;
    description: string | null;
    date: string;
    category_id: string | null;
}

interface Category {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
}

interface TransactionTableProps {
    transactions: Transaction[];
    categories: Category[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
        style: "currency",
        currency: "AOA",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export function TransactionTable({ transactions, categories, onEdit, onDelete }: TransactionTableProps) {
    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return "Sem categoria";
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : "Desconhecido";
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Nenhuma transação encontrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    {format(new Date(transaction.date), "dd/MM/yyyy", { locale: pt })}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {transaction.description || "Sem descrição"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-normal">
                                        {getCategoryName(transaction.category_id)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`font-bold flex items-center justify-end gap-1 ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                        {formatCurrency(transaction.amount)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(transaction)}
                                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(transaction.id)}
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
