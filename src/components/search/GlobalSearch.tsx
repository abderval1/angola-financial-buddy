import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calculator,
    Calendar,
    CreditCard,
    LayoutDashboard,
    PiggyBank,
    Search,
    Settings,
    Target,
    TrendingDown,
    TrendingUp,
    Wallet,
    Plus,
    FileText
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface SearchResult {
    id: string;
    type: 'transaction' | 'goal' | 'budget';
    title: string;
    subtitle: string;
    url: string;
    icon: any;
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Simple debounce implementation if hook doesn't exist
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    useEffect(() => {
        async function search() {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Search Transactions
                const { data: transactions } = await supabase
                    .from('transactions')
                    .select('id, description, amount, type, date, category:post_categories(name)')
                    .ilike('description', `%${debouncedQuery}%`)
                    .order('date', { ascending: false })
                    .limit(5);

                const txResults: SearchResult[] = (transactions || []).map(tx => ({
                    id: tx.id,
                    type: 'transaction',
                    title: tx.description,
                    subtitle: `${tx.type === 'income' ? '+' : '-'}Kz ${tx.amount.toLocaleString()} • ${format(new Date(tx.date), 'dd/MM/yyyy')}`,
                    url: '/budget', // Navigate to budget (ideally open tx details, but budget is fine for now)
                    icon: tx.type === 'income' ? TrendingUp : TrendingDown
                }));

                setResults([...txResults]);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        }

        search();
    }, [debouncedQuery]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <span className="hidden lg:inline-flex">Pesquisar...</span>
                <span className="inline-flex lg:hidden">Pesquisar...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Digite para pesquisar..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                    {/* Recent/Dynamic Results */}
                    {results.length > 0 && (
                        <CommandGroup heading="Resultados">
                            {results.map((result) => (
                                <CommandItem
                                    key={result.id}
                                    value={`${result.title} ${result.subtitle}`}
                                    onSelect={() => runCommand(() => navigate(result.url))}
                                >
                                    <result.icon className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{result.title}</span>
                                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    <CommandSeparator />

                    <CommandGroup heading="Navegação">
                        <CommandItem value="Dashboard" onSelect={() => runCommand(() => navigate("/dashboard"))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </CommandItem>
                        <CommandItem value="Orçamento" onSelect={() => runCommand(() => navigate("/budget"))}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Orçamento
                        </CommandItem>
                        <CommandItem value="Poupança" onSelect={() => runCommand(() => navigate("/savings"))}>
                            <PiggyBank className="mr-2 h-4 w-4" />
                            Poupança
                        </CommandItem>
                        <CommandItem value="Metas" onSelect={() => runCommand(() => navigate("/goals"))}>
                            <Target className="mr-2 h-4 w-4" />
                            Metas & FIRE
                        </CommandItem>
                        <CommandItem value="Configurações" onSelect={() => runCommand(() => navigate("/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Ações Rápidas">
                        <CommandItem value="Nova Transação" onSelect={() => runCommand(() => navigate("/budget?open=new-transaction"))}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Transação
                        </CommandItem>
                        <CommandItem value="Calculadoras" onSelect={() => runCommand(() => navigate("/calculators"))}>
                            <Calculator className="mr-2 h-4 w-4" />
                            Calculadoras
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
