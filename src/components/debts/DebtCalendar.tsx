import { useState, useMemo } from "react";
import { format, isSameDay, isSameMonth, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { pt, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DebtItem {
    id: string;
    creditor?: string;
    borrower_name?: string;
    current_amount: number;
    due_date?: string | null;
    expected_return_date?: string | null;
    status: string | null;
    type?: 'debt' | 'loan';
}

interface DebtCalendarProps {
    debts: DebtItem[];
    loans: DebtItem[];
}

export function DebtCalendar({ debts, loans }: DebtCalendarProps) {
    const { t, i18n } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const allItems = useMemo(() => {
        return [
            ...debts.map(d => ({ ...d, type: 'debt' as const, date: d.due_date })),
            ...loans.map(l => ({ ...l, type: 'loan' as const, date: l.expected_return_date }))
        ].filter(item => item.date);
    }, [debts, loans]);

    const getDayItems = (date: Date) => {
        return allItems.filter(item => item.date && isSameDay(new Date(item.date), date));
    };

    const selectedDayItems = selectedDate ? getDayItems(selectedDate) : [];

    // Calculate monthly totals
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const monthlyDebtTotal = useMemo(() => {
        return allItems
            .filter(item => item.type === 'debt' && item.date && isSameMonth(new Date(item.date), currentMonth))
            .reduce((sum, item) => sum + item.current_amount, 0);
    }, [allItems, currentMonth]);

    const monthlyLoanTotal = useMemo(() => {
        return allItems
            .filter(item => item.type === 'loan' && item.date && isSameMonth(new Date(item.date), currentMonth))
            .reduce((sum, item) => sum + item.current_amount, 0);
    }, [allItems, currentMonth]);

    // Calendar modifiers
    const modifiers = {
        hasDebt: (date: Date) => allItems.some(item => item.type === 'debt' && item.date && isSameDay(new Date(item.date), date)),
        hasLoan: (date: Date) => allItems.some(item => item.type === 'loan' && item.date && isSameDay(new Date(item.date), date)),
        hasBoth: (date: Date) => {
            const dayItems = getDayItems(date);
            return dayItems.some(i => i.type === 'debt') && dayItems.some(i => i.type === 'loan');
        }
    };

    const modifiersStyles = {
        hasDebt: { borderBottom: '3px solid #ef4444' },
        hasLoan: { borderBottom: '3px solid #22c55e' },
        hasBoth: { borderBottom: '3px solid #3b82f6' }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{t('Calendário de Vencimentos')}</CardTitle>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-2 py-1 text-sm bg-secondary rounded">←</button>
                                <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy', { locale: i18n.language === 'en' ? enUS : pt })}</span>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-2 py-1 text-sm bg-secondary rounded">→</button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={i18n.language === 'en' ? enUS : pt}
                            className="rounded-md"
                            modifiers={modifiers}
                            modifiersStyles={modifiersStyles}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Selected Day Details + Monthly Summary */}
            <div className="space-y-4">
                {/* Monthly Summary */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{t('Resumo do Mês')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t('Dívidas a vencer')}</span>
                            <span className="font-bold text-red-500">Kz {monthlyDebtTotal.toLocaleString('pt-AO')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t('Empréstimos a receber')}</span>
                            <span className="font-bold text-green-500">Kz {monthlyLoanTotal.toLocaleString('pt-AO')}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t('Saldo do mês')}</span>
                            <span className={`font-bold ${monthlyLoanTotal - monthlyDebtTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                Kz {(monthlyLoanTotal - monthlyDebtTotal).toLocaleString('pt-AO')}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Day Details */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                            {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: i18n.language === 'en' ? enUS : pt }) : t('Selecione uma data')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDayItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('Nenhum vencimento nesta data')}</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedDayItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                                        <div>
                                            <p className="font-medium text-sm">{item.creditor || item.borrower_name}</p>
                                            <Badge variant={item.type === 'debt' ? 'destructive' : 'default'} className={item.type === 'loan' ? 'bg-green-500' : ''}>
                                                {item.type === 'debt' ? t('Dívida') : t('Empréstimo')}
                                            </Badge>
                                        </div>
                                        <span className="font-bold">Kz {item.current_amount.toLocaleString('pt-AO')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Legend */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span>{t('Dívida')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>{t('Empréstimo')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
