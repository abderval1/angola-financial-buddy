import { format } from "date-fns";
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
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { enUS, fr, es, pt } from "date-fns/locale";

const localeMap: Record<string, any> = {
    en: enUS,
    fr: fr,
    es: es,
    pt: pt,
};

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


export function TransactionTable({ transactions, categories, onEdit, onDelete }: TransactionTableProps) {
    const { t, i18n } = useTranslation();
    const { formatPrice } = useCurrency();
    const currentLocale = localeMap[i18n.language] || pt;
    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return t("Sem categoria");
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : t("Desconhecido");
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("Data")}</TableHead>
                        <TableHead>{t("Descrição")}</TableHead>
                        <TableHead>{t("Categoria")}</TableHead>
                        <TableHead className="text-right">{t("Valor")}</TableHead>
                        <TableHead className="text-right">{t("Ações")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                {t("Nenhuma transação encontrada")}
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    {format(new Date(transaction.date), "dd/MM/yyyy", { locale: currentLocale })}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {transaction.description || t("Sem descrição")}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-normal">
                                        {getCategoryName(transaction.category_id)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`font-bold flex items-center justify-end gap-1 ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                        {formatPrice(transaction.amount)}
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
