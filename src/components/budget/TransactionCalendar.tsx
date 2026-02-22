import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { enUS, fr, es, pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";

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

interface TransactionCalendarProps {
    transactions: Transaction[];
    categories: Category[];
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (id: string) => void;
}


export function TransactionCalendar({ transactions, categories, onEdit, onDelete }: TransactionCalendarProps) {
    const { t, i18n } = useTranslation();
    const { formatPrice } = useCurrency();
    const currentLocale = localeMap[i18n.language] || pt;
    const [date, setDate] = useState<Date | undefined>(new Date());

    const getDayTransactions = (day: Date) => {
        return transactions.filter(t => isSameDay(new Date(t.date), day));
    };

    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return t("Sem categoria");
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : t("Desconhecido");
    };

    // Custom day renderer to show indicators
    const modifiers = {
        hasTransaction: (date: Date) => getDayTransactions(date).length > 0,
        income: (date: Date) => getDayTransactions(date).some(t => t.type === 'income'),
        expense: (date: Date) => getDayTransactions(date).some(t => t.type === 'expense'),
    };

    const modifiersStyles = {
        hasTransaction: { fontWeight: 'bold' },
    };

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div className="border rounded-md p-4 bg-card w-fit mx-auto md:mx-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={currentLocale}
                    className="rounded-md border"
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    components={{
                        DayContent: (props) => {
                            const transactions = getDayTransactions(props.date);
                            const hasIncome = transactions.some(t => t.type === 'income');
                            const hasExpense = transactions.some(t => t.type === 'expense');

                            return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {props.date.getDate()}
                                    <div className="absolute bottom-1 flex gap-0.5">
                                        {hasIncome && <div className="h-1 w-1 rounded-full bg-emerald-500" />}
                                        {hasExpense && <div className="h-1 w-1 rounded-full bg-red-500" />}
                                    </div>
                                </div>
                            );
                        }
                    }}
                />
            </div>

            <div className="flex-1 bg-card rounded-md border p-4">
                <h3 className="text-lg font-semibold mb-4">
                    {date ? format(date, "d 'de' MMMM 'de' yyyy", { locale: currentLocale }) : t("Selecione uma data")}
                </h3>

                {date ? (
                    <div className="space-y-3">
                        {getDayTransactions(date).length > 0 ? (
                            getDayTransactions(date).map(transaction => (
                                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 group hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">{transaction.description || t("Sem descrição")}</span>
                                            <Badge variant="secondary" className="w-fit text-xs">
                                                {getCategoryName(transaction.category_id)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold flex items-center gap-1 ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            {formatPrice(transaction.amount)}
                                        </span>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => onEdit?.(transaction)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                                                onClick={() => onDelete?.(transaction.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                {t("Nenhuma transação neste dia.")}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        {t("Selecione um dia no calendário para ver as transações.")}
                    </div>
                )}
            </div>
        </div>
    );
}
