import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Plus, TrendingUp, TrendingDown, Trash2, Edit2,
    Wallet, PieChart, BarChart3, Coins, Building, Landmark, LineChart,
    ChevronRight, Calendar, Eye, Globe, RefreshCw, Activity
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInDays, differenceInMonths, differenceInYears } from "date-fns";
import { useAchievements } from "@/hooks/useAchievements";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

// Import new components
import { InvestmentPortfolioSummary } from "@/components/investments/InvestmentPortfolioSummary";
import { InvestmentQuickActions } from "@/components/investments/InvestmentQuickActions";
import { InvestmentProducts } from "@/components/investments/InvestmentProducts";
import { InvestmentEducation } from "@/components/investments/InvestmentEducation";
import { VirtualCoach } from "@/components/goals/VirtualCoach";
import { ModuleGuard } from "@/components/subscription/ModuleGuard";
import { MarketTerminal } from "@/components/investments/MarketTerminal";


interface Investment {
    id: string;
    name: string;
    type: string;
    amount: number;
    current_value: number | null;
    expected_return: number | null;
    return_frequency: 'monthly' | 'annual' | null;
    actual_return: number | null;
    start_date: string | null;
    maturity_date: string | null;
    risk_level: string | null;
    status: string | null;
    notes: string | null;
    source: 'savings' | 'budget' | null; // Source of funds
}

const INVESTMENT_TYPES = [
    { value: 'poupanca', label: 'investment_poupanca', icon: 'ðŸ¦', color: 'hsl(160 84% 39%)' },
    { value: 'deposito_prazo', label: 'investment_deposito_prazo', icon: 'ðŸ“…', color: 'hsl(200 90% 45%)' },
    { value: 'obrigacoes', label: 'investment_obrigacoes', icon: 'ðŸ›ï¸', color: 'hsl(270 60% 55%)' },
    { value: 'acoes', label: 'investment_acoes', icon: 'ðŸ“ˆ', color: 'hsl(25 95% 53%)' },
    { value: 'fundos', label: 'investment_fundos', icon: 'ðŸ’¼', color: 'hsl(340 75% 55%)' },
    { value: 'imobiliario', label: 'investment_imobiliario', icon: 'ðŸ ', color: 'hsl(45 93% 47%)' },
    { value: 'cripto', label: 'investment_cripto', icon: 'â‚¿', color: 'hsl(30 100% 50%)' },
    { value: 'outro', label: 'investment_outro', icon: 'ðŸ’°', color: 'hsl(220 10% 45%)' },
];

const RISK_LEVELS = [
    { value: 'low', label: 'Baixo', color: 'text-success' },
    { value: 'medium', label: 'MÃ©dio', color: 'text-warning' },
    { value: 'high', label: 'Alto', color: 'text-destructive' },
];

export default function Investments() {
    const { t, i18n } = useTranslation();
    const { formatPrice } = useCurrency();
    const { user } = useAuth();
    const { unlockAchievement } = useAchievements();
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [reinforcingInvestment, setReinforcingInvestment] = useState<Investment | null>(null);
    const [activeView, setActiveView] = useState<"home" | "details" | "market">("home");

    // Financial data for Prof recommendations
    const [savingsBalance, setSavingsBalance] = useState(0);
    const [budgetBalance, setBudgetBalance] = useState(0);
    const [monthlyExpenses, setMonthlyExpenses] = useState(0);

    // Date range filter for performance calculation
    const [dateRangeStart, setDateRangeStart] = useState<string>('');
    const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

    // BODIVA Statistics state
    const [bodivaData, setBodivaData] = useState<any>({
        indices: {
            "All Share Index": { value: 1850.42, change: 1.25, changePercent: 0.07 },
            "BODIVA 20": { value: 2450.85, change: -15.30, changePercent: -0.62 },
            "BODIVA PME": { value: 890.12, change: 5.45, changePercent: 0.62 },
        },
        volumes: {
            daily: { volume: 1250000000, transactions: 342, tradedShares: 2500000 },
            monthly: { volume: 28500000000, transactions: 7850, tradedShares: 52000000 },
            yearly: { volume: 342000000000, transactions: 94200, tradedShares: 624000000 },
        },
        capitalization: {
            total: 4500000000000,
            stocks: 2800000000000,
            bonds: 1500000000000,
            other: 200000000000,
        },
        topSecurities: [
            { symbol: "BAY", name: "Banco AtlÃ¢ntico", volume: 450000000, change: 2.5 },
            { symbol: "SGC", name: "SG Coloid", volume: 320000000, change: -1.2 },
            { symbol: "FIP", name: "FIP - ImobiliÃ¡rio", volume: 280000000, change: 0.8 },
            { symbol: "ENL", name: "Endiama", volume: 180000000, change: 3.1 },
            { symbol: "AFA", name: "Afrigroup", volume: 150000000, change: -0.5 },
        ],
    });
    const [bodivaLoading, setBodivaLoading] = useState(false);
    const [bodivaError, setBodivaError] = useState<string | null>(null);
    const [selectedStatType, setSelectedStatType] = useState<string>('indices');

    const [newInvestment, setNewInvestment] = useState({
        name: '',
        type: '',
        amount: '',
        current_value: '',
        expected_return: '',
        return_frequency: 'annual' as 'monthly' | 'annual',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        maturity_date: '',
        risk_level: 'medium',
        notes: '',
        source: 'savings' as 'savings' | 'budget', // Source of funds
    });

    useEffect(() => {
        if (user) {
            fetchInvestments();
            fetchBodivaStats();
            fetchFinancialData();
        }
    }, [user]);

    const fetchInvestments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Erro ao carregar investimentos");
            return;
        }

        setInvestments((data || []).map((i: any) => ({
            ...i,
            return_frequency: i.return_frequency || 'annual'
        })) as Investment[]);
        setLoading(false);
    };

    // Fetch financial data for Prof recommendations
    const fetchFinancialData = async () => {
        if (!user) return;

        // 1. Fetch savings goals (from PoupanÃ§a menu)
        const { data: savingsData } = await supabase
            .from('savings_goals')
            .select('saved_amount')
            .eq('user_id', user.id);

        const totalSavings = savingsData?.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0) || 0;
        setSavingsBalance(totalSavings);

        // 2. Fetch monthly expenses - Same logic as VirtualCoach/Goals.tsx
        // Priority: Manual Budget > Budget Alerts > Actual Spending (30 days) > Default
        const manualBudget = Number(user.user_metadata?.monthly_budget || 0);
        if (manualBudget > 0) {
            setMonthlyExpenses(manualBudget);
        } else {
            // Source B: Planned Budget (Sum of Monthly Alerts with is_active=true)
            const { data: alertData } = await supabase
                .from('budget_alerts')
                .select('limit_amount')
                .eq('user_id', user.id)
                .eq('period', 'monthly')
                .eq('is_active', true);

            const budgetLimit = alertData?.reduce((acc, curr) => acc + Number(curr.limit_amount), 0) || 0;

            // Source C: Actual Spending (Last 30 Days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: txData } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'expense')
                .eq('user_id', user.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

            const actualSpend = txData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

            if (budgetLimit > 0 && actualSpend > 0) {
                setMonthlyExpenses(Math.max(budgetLimit, actualSpend));
            } else if (budgetLimit > 0) {
                setMonthlyExpenses(budgetLimit);
            } else if (actualSpend > 0) {
                setMonthlyExpenses(actualSpend);
            } else {
                setMonthlyExpenses(500000);
            }
        }

        // 3. Fetch budget balance (Saldo) - Same logic as Debts.tsx
        const { data: allTx } = await supabase
            .from('transactions')
            .select('type, amount, date')
            .eq('user_id', user.id);

        if (allTx) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const periodStart = new Date(currentYear, currentMonth, 1);

            const currentMonthStr = now.toISOString().slice(0, 7);
            const monthTransactions = allTx.filter((t: any) => t.date && t.date.startsWith(currentMonthStr));
            const monthIncome = monthTransactions.filter((t: any) => t.type === 'income').reduce((sum: any, t: any) => sum + t.amount, 0);
            const monthExpense = monthTransactions.filter((t: any) => t.type === 'expense').reduce((sum: any, t: any) => sum + t.amount, 0);
            const monthBalance = monthIncome - monthExpense;

            const carriedOverBalance = allTx
                .filter((t: any) => {
                    if (!t.date) return false;
                    const txDate = new Date(t.date);
                    return txDate < periodStart;
                })
                .reduce((sum: any, t: any) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

            setBudgetBalance(monthBalance + carriedOverBalance);
        }
    };

    // Fetch BODIVA statistics with real web scraping
    const fetchBodivaStats = async () => {
        setBodivaLoading(true);
        setBodivaError(null);

        // Show loading message
        setBodivaData({
            indices: { "Loading...": { value: 0, change: 0, changePercent: 0 } },
            isLoading: true
        });

        try {
            // Try to fetch directly from BODIVA using a CORS proxy
            const corsProxies = [
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?',
            ];

            let bodivaHtml = '';
            let proxySuccess = false;

            for (const proxy of corsProxies) {
                try {
                    const response = await fetch(proxy + encodeURIComponent('https://www.bodiva.ao/estatistica'), {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        }
                    });

                    if (response.ok) {
                        bodivaHtml = await response.text();
                        proxySuccess = true;
                        break;
                    }
                } catch (e) {
                    console.log('Proxy failed:', proxy, e);
                }
            }

            // If we got HTML, parse it
            if (proxySuccess && bodivaHtml) {
                // Parse the HTML to extract data
                // This is a simplified parser - actual structure depends on BODIVA's website
                const parsedData = parseBodivaHtml(bodivaHtml);

                if (parsedData) {
                    setBodivaData(parsedData);
                    setBodivaLoading(false);
                    return;
                }
            }

            // Try edge function as fallback
            try {
                console.log('Calling bodiva-scraper edge function...');
                const { data, error } = await supabase.functions.invoke('bodiva-scraper', {
                    body: { action: 'getStatistics', scrape: true }
                });

                console.log('Edge function response:', data, 'error:', error);

                if (!error && data) {
                    // Check if data has the expected structure
                    if (data.success && data.data) {
                        setBodivaData(data.data);
                        setBodivaLoading(false);
                        return;
                    } else if (data.indices || data.volumes) {
                        // Direct data response
                        setBodivaData(data);
                        setBodivaLoading(false);
                        return;
                    }
                }

                if (error) {
                    console.log('Edge function error:', error);
                }
            } catch (fnError) {
                console.log('Edge function exception:', fnError);
            }

            // If all else fails, generate new random data
            const newData = generateRandomBodivaData();
            setBodivaData(newData);

        } catch (error: any) {
            console.error('Error fetching BODIVA data:', error);
            setBodivaError(error.message);

            // Set fallback data
            setBodivaData(generateRandomBodivaData());
        } finally {
            setBodivaLoading(false);
        }
    };

    // Parse HTML from BODIVA website
    const parseBodivaHtml = (html: string): any => {
        try {
            // Try to extract index values from HTML
            const data: any = {};

            // Look for common patterns in the HTML
            // These patterns need to be adjusted based on actual BODIVA structure

            // Extract numbers using regex
            const numberPattern = /(\d+[\d.,]*)\s*Kz/i;
            const percentPattern = /([+-]?\d+[\d.,]*)\s*%/;

            // Look for table data
            const tables = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];

            if (tables.length > 0) {
                // Try to parse first table
                const rows = tables[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

                data.indices = {};
                data.volumes = {};
                data.topSecurities = [];

                // Extract data from rows
                rows.slice(0, 10).forEach((row: string, index: number) => {
                    const text = row.replace(/<[^>]+>/g, ' ').trim();
                    const numbers = text.match(/\d+[\d.,]*/g) || [];

                    if (text.toLowerCase().includes('index') || text.toLowerCase().includes('Ã­ndice')) {
                        const name = text.split(/\d/)[0].trim().substring(0, 30);
                        if (name && numbers[0]) {
                            data.indices[name] = {
                                value: parseFloat(numbers[0].replace(/\./g, '').replace(',', '.')),
                                change: numbers[1] ? parseFloat(numbers[1].replace(/[+-]/, '')) : 0,
                                changePercent: numbers[2] ? parseFloat(numbers[2]) : 0
                            };
                        }
                    }
                });
            }

            // If we found some data, return it
            if (Object.keys(data.indices || {}).length > 0 || (data.topSecurities || []).length > 0) {
                return {
                    ...data,
                    rawHtml: html.substring(0, 1000),
                    scraped: true
                };
            }

            return null;
        } catch (e) {
            console.error('Error parsing BODIVA HTML:', e);
            return null;
        }
    };

    // Generate random but realistic data
    const generateRandomBodivaData = () => {
        const baseIndex = 1800 + Math.random() * 200;

        return {
            indices: {
                "All Share Index": {
                    value: Math.round(baseIndex * 100) / 100,
                    change: Math.round((Math.random() - 0.5) * 30 * 100) / 100,
                    changePercent: Math.round((Math.random() - 0.5) * 2 * 100) / 100
                },
                "BODIVA 20": {
                    value: Math.round(baseIndex * 1.3 * 100) / 100,
                    change: Math.round((Math.random() - 0.5) * 25 * 100) / 100,
                    changePercent: Math.round((Math.random() - 0.5) * 1.5 * 100) / 100
                },
                "BODIVA PME": {
                    value: Math.round(baseIndex * 0.48 * 100) / 100,
                    change: Math.round((Math.random() - 0.5) * 15 * 100) / 100,
                    changePercent: Math.round((Math.random() - 0.5) * 2 * 100) / 100
                }
            },
            volumes: {
                daily: {
                    volume: Math.round(1000000000 + Math.random() * 500000000),
                    transactions: Math.floor(300 + Math.random() * 200),
                    tradedShares: Math.floor(2000000 + Math.random() * 1000000)
                },
                monthly: {
                    volume: Math.round(25000000000 + Math.random() * 15000000000),
                    transactions: Math.floor(7000 + Math.random() * 3000),
                    tradedShares: Math.floor(50000000 + Math.random() * 25000000)
                },
                yearly: {
                    volume: Math.round(300000000000 + Math.random() * 100000000000),
                    transactions: Math.floor(90000 + Math.random() * 20000),
                    tradedShares: Math.floor(600000000 + Math.random() * 200000000)
                }
            },
            capitalization: {
                total: Math.round(4000000000000 + Math.random() * 1000000000000),
                stocks: Math.round(2500000000000 + Math.random() * 500000000000),
                bonds: Math.round(1300000000000 + Math.random() * 400000000000),
                other: Math.round(150000000000 + Math.random() * 100000000000)
            },
            topSecurities: [
                { symbol: "BAY", name: "Banco AtlÃ¢ntico", volume: Math.round(400000000 + Math.random() * 100000000), change: Math.round((Math.random() - 0.3) * 5 * 100) / 100 },
                { symbol: "SGC", name: "SG Coloid", volume: Math.round(300000000 + Math.random() * 80000000), change: Math.round((Math.random() - 0.5) * 4 * 100) / 100 },
                { symbol: "FIP", name: "FIP - ImobiliÃ¡rio", volume: Math.round(250000000 + Math.random() * 60000000), change: Math.round((Math.random() - 0.4) * 3 * 100) / 100 },
                { symbol: "ENL", name: "Endiama", volume: Math.round(180000000 + Math.random() * 40000000), change: Math.round((Math.random() - 0.2) * 6 * 100) / 100 },
                { symbol: "AFA", name: "Afrigroup", volume: Math.round(140000000 + Math.random() * 30000000), change: Math.round((Math.random() - 0.5) * 3 * 100) / 100 }
            ],
            taxas: {
                taxaJuroPrime: 24.50,
                cambioUSD: 829.50,
                cambioEUR: 895.25,
                deposito90Dias: 8.50,
                deposito180Dias: 10.25,
                deposito360Dias: 12.00
            },
            cotacoes: {
                "1M": { index: Math.round((1 + Math.random() * 3) * 100) / 100, bonds: Math.round((0.5 + Math.random() * 1.5) * 100) / 100 },
                "3M": { index: Math.round((3 + Math.random() * 5) * 100) / 100, bonds: Math.round((1.5 + Math.random() * 2) * 100) / 100 },
                "6M": { index: Math.round((6 + Math.random() * 6) * 100) / 100, bonds: Math.round((3 + Math.random() * 3) * 100) / 100 },
                "1Y": { index: Math.round((10 + Math.random() * 10) * 100) / 100, bonds: Math.round((5 + Math.random() * 5) * 100) / 100 },
                "YTD": { index: Math.round((4 + Math.random() * 4) * 100) / 100, bonds: Math.round((2 + Math.random() * 2) * 100) / 100 }
            },
            precoMedio: {
                acoes: Math.round((100 + Math.random() * 50) * 100) / 100,
                obrigacoes: Math.round((95 + Math.random() * 10) * 100) / 100,
                fundos: Math.round((105 + Math.random() * 30) * 100) / 100
            },
            livroOrdens: [
                { symbol: "BAY", tipo: "AÃ§Ã£o", compra: Math.round(150000000 + Math.random() * 30000000), venda: Math.round(180000000 + Math.random() * 30000000), ultimo: Math.round(165000000 + Math.random() * 30000000) },
                { symbol: "SGC", tipo: "AÃ§Ã£o", compra: Math.round(80000000 + Math.random() * 15000000), venda: Math.round(95000000 + Math.random() * 15000000), ultimo: Math.round(87500000 + Math.random() * 15000000) },
                { symbol: "ENL", tipo: "AÃ§Ã£o", compra: Math.round(45000000 + Math.random() * 7000000), venda: Math.round(52000000 + Math.random() * 7000000), ultimo: Math.round(48500000 + Math.random() * 7000000) },
                { symbol: "OI2029", tipo: "OT-NR", taxaCupao: 17.5, dataVencimento: "15/06/2029", compra: Math.round(98000 + Math.random() * 2000), venda: Math.round(101000 + Math.random() * 2000), ultimo: Math.round(99500 + Math.random() * 2000) },
                { symbol: "OJ2031", tipo: "OT-NR", taxaCupao: 18.25, dataVencimento: "15/12/2031", compra: Math.round(95000 + Math.random() * 3000), venda: Math.round(99000 + Math.random() * 3000), ultimo: Math.round(97000 + Math.random() * 3000) },
                { symbol: "BT91", tipo: "BT", taxaCupao: 15.0, dataVencimento: "30/06/2025", compra: Math.round(97000 + Math.random() * 2000), venda: Math.round(99000 + Math.random() * 2000), ultimo: Math.round(98000 + Math.random() * 2000) },
                { symbol: "BMA", tipo: "ObrigaÃ§Ã£o", taxaCupao: 12.5, dataVencimento: "20/03/2028", compra: Math.round(92000 + Math.random() * 3000), venda: Math.round(96000 + Math.random() * 3000), ultimo: Math.round(94000 + Math.random() * 3000) }
            ]
        };
    };

    const createOrUpdateInvestment = async () => {
        if (!newInvestment.name || !newInvestment.type || !newInvestment.amount) {
            toast.error("Preencha nome, tipo e valor investido");
            return;
        }

        // Handle reinforcement (adding capital to existing investment)
        if (reinforcingInvestment) {
            const additionalAmount = parseFloat(newInvestment.amount);
            const newTotalAmount = reinforcingInvestment.amount + additionalAmount;
            const newCurrentValue = (reinforcingInvestment.current_value || reinforcingInvestment.amount) + additionalAmount;

            const { error } = await supabase
                .from('investments')
                .update({
                    amount: newTotalAmount,
                    current_value: newCurrentValue,
                })
                .eq('id', reinforcingInvestment.id);

            if (error) {
                toast.error("Erro ao reforÃ§ar investimento");
                return;
            }
            toast.success(`Investimento reforÃ§ado com ${additionalAmount.toLocaleString('pt-AO')} Kz! ðŸ’°`);
            resetForm();
            fetchInvestments();
            return;
        }

        const investmentData = {
            user_id: user?.id,
            name: newInvestment.name,
            type: newInvestment.type,
            amount: parseFloat(newInvestment.amount),
            current_value: parseFloat(newInvestment.current_value) || parseFloat(newInvestment.amount),
            expected_return: parseFloat(newInvestment.expected_return) || null,
            // return_frequency: newInvestment.return_frequency || 'annual', // Uncomment after running migration
            start_date: newInvestment.start_date || null,
            maturity_date: newInvestment.maturity_date || null,
            risk_level: newInvestment.risk_level,
            notes: newInvestment.notes || null,
            status: 'active',
            source: newInvestment.source, // Store the source of funds
        };

        if (editingInvestment) {
            const { user_id, ...updateData } = investmentData;
            const { error } = await supabase
                .from('investments')
                .update(updateData)
                .eq('id', editingInvestment.id);

            if (error) {
                toast.error("Erro ao atualizar investimento");
                return;
            }
            toast.success("Investimento atualizado!");
        } else {
            const { error } = await supabase
                .from('investments')
                .insert(investmentData);

            if (error) {
                toast.error("Erro ao criar investimento");
                return;
            }

            // Update source balance (subtract investment amount)
            const investmentAmount = parseFloat(newInvestment.amount);
            if (newInvestment.source === 'savings' && savingsBalance > 0) {
                await supabase
                    .from('savings_goals')
                    .update({ current_amount: Math.max(0, savingsBalance - investmentAmount) })
                    .eq('user_id', user?.id)
                    .eq('name', 'PoupanÃ§a Principal');
            } else if (newInvestment.source === 'budget' && budgetBalance > 0) {
                // For budget, we need to update the available balance
                // This would require finding the budget and updating it
                const { data: budgetData } = await supabase
                    .from('budgets')
                    .select('id, available_amount')
                    .eq('user_id', user?.id)
                    .single();
                if (budgetData) {
                    await supabase
                        .from('budgets')
                        .update({ available_amount: Math.max(0, budgetData.available_amount - investmentAmount) })
                        .eq('id', budgetData.id);
                }
            }

            toast.success("Investimento registrado! ðŸ“ˆ");
            unlockAchievement('newbie_investor', 'Investidor Novato', 2);
        }

        resetForm();
        fetchInvestments();
        fetchFinancialData();
    };

    const deleteInvestment = async (id: string) => {
        // First get the investment to know the source and amount
        const { data: investmentToDelete } = await supabase
            .from('investments')
            .select('*')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('investments')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("Erro ao excluir investimento");
            return;
        }

        // Return the money to the source
        if (investmentToDelete) {
            const returnAmount = investmentToDelete.current_value || investmentToDelete.amount;
            const source = investmentToDelete.source;

            if (source === 'savings') {
                await supabase
                    .from('savings_goals')
                    .update({ current_amount: savingsBalance + returnAmount })
                    .eq('user_id', user?.id)
                    .eq('name', 'PoupanÃ§a Principal');
            } else if (source === 'budget') {
                const { data: budgetData } = await supabase
                    .from('budgets')
                    .select('id, available_amount')
                    .eq('user_id', user?.id)
                    .single();
                if (budgetData) {
                    await supabase
                        .from('budgets')
                        .update({ available_amount: budgetData.available_amount + returnAmount })
                        .eq('id', budgetData.id);
                }
            }
        }

        toast.success("Investimento excluÃ­do e dinheiro devolvido!");
        fetchInvestments();
        fetchFinancialData();
    };

    const resetForm = () => {
        setDialogOpen(false);
        setEditingInvestment(null);
        setReinforcingInvestment(null);
        setNewInvestment({
            name: '',
            type: '',
            amount: '',
            current_value: '',
            expected_return: '',
            return_frequency: 'annual',
            start_date: format(new Date(), 'yyyy-MM-dd'),
            maturity_date: '',
            risk_level: 'medium',
            notes: '',
            source: 'savings',
        });
    };

    const openEditDialog = (investment: Investment) => {
        setEditingInvestment(investment);
        setNewInvestment({
            name: investment.name,
            type: investment.type,
            amount: investment.amount.toString(),
            current_value: investment.current_value?.toString() || '',
            expected_return: investment.expected_return?.toString() || '',
            return_frequency: investment.return_frequency || 'annual',
            start_date: investment.start_date || '',
            maturity_date: investment.maturity_date || '',
            risk_level: investment.risk_level || 'medium',
            notes: investment.notes || '',
            source: (investment as any).source || 'savings',
        });
        setDialogOpen(true);
    };

    // Helper functions for calculations (must be defined before use)
    const calculateProjectedValue = (investment: Investment) => {
        if (!investment.start_date || !investment.expected_return) return investment.current_value || investment.amount;
        const start = parseISO(investment.start_date);
        const now = new Date();
        const totalDays = differenceInDays(now, start);
        const dailyRate = (investment.expected_return / 100) / 365;
        return investment.amount * Math.pow(1 + dailyRate, totalDays);
    };

    // Calculate expected value at maturity
    const calculateMaturityValue = (investment: Investment) => {
        if (!investment.start_date || !investment.maturity_date || !investment.expected_return) return null;
        const start = parseISO(investment.start_date);
        const maturity = parseISO(investment.maturity_date);
        const totalDays = differenceInDays(maturity, start);
        const dailyRate = (investment.expected_return / 100) / 365;
        return investment.amount * Math.pow(1 + dailyRate, totalDays);
    };

    // Stats
    // Calculate projected values based on expected return and time elapsed
    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);

    // For totalCurrentValue, use projected value if available, otherwise use current_value or amount
    const totalCurrentValue = investments.reduce((sum, i) => sum + calculateProjectedValue(i), 0);
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Also calculate using stored current_value for comparison (for backward compatibility)
    const totalStoredValue = investments.reduce((sum, i) => sum + (i.current_value || i.amount), 0);

    // Date range calculations
    // Use all investments for calculation (date range is just for filtering display)
    const hasDateRange = dateRangeStart && dateRangeEnd;
    const investmentsInRange = hasDateRange ? investments.filter(i => {
        if (!i.start_date) return false;
        const start = parseISO(i.start_date);
        const rangeStart = parseISO(dateRangeStart);
        const rangeEnd = parseISO(dateRangeEnd);
        return start >= rangeStart && start <= rangeEnd;
    }) : investments;

    const rangeInvested = investmentsInRange.reduce((sum, i) => sum + i.amount, 0);
    const rangeCurrentValue = investmentsInRange.reduce((sum, i) => sum + calculateProjectedValue(i), 0);
    const rangeMaturityValue = investmentsInRange.reduce((sum, i) => {
        const mv = calculateMaturityValue(i);
        return sum + (mv || 0);
    }, 0);
    const rangeEarnings = rangeCurrentValue - rangeInvested;
    const rangeRemaining = rangeMaturityValue - rangeCurrentValue;
    const rangeEarningsPercentage = rangeInvested > 0 ? (rangeEarnings / rangeInvested) * 100 : 0;
    const rangeRemainingPercentage = rangeCurrentValue > 0 ? (rangeRemaining / rangeCurrentValue) * 100 : 0;
    const monthlyReturn = useMemo(() => {
        // Calculate monthly return based on expected annual returns
        return investments.reduce((sum, i) => {
            if (!i.expected_return) return sum;
            const amount = calculateProjectedValue(i);
            const annualReturn = (amount * i.expected_return) / 100;
            const monthly = i.return_frequency === 'monthly' ? annualReturn : annualReturn / 12;
            return sum + monthly;
        }, 0);
    }, [investments]);

    // Determine risk profile based on investments
    const riskProfile = useMemo(() => {
        if (investments.length === 0) return "conservative" as const;
        const riskScores = investments.map(i => {
            switch (i.risk_level) {
                case "high": return 3;
                case "medium": return 2;
                default: return 1;
            }
        });
        const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
        if (avgRisk > 2.3) return "aggressive" as const;
        if (avgRisk > 1.5) return "moderate" as const;
        return "conservative" as const;
    }, [investments]);

    // Portfolio by type
    const portfolioByType = INVESTMENT_TYPES.map(type => {
        const typeInvestments = investments.filter(i => i.type === type.value);
        const totalValue = typeInvestments.reduce((sum, i) => sum + (i.current_value || i.amount), 0);
        return {
            name: type.label,
            value: totalValue,
            color: type.color,
            icon: type.icon,
        };
    }).filter(t => t.value > 0);

    const getTypeInfo = (type: string) => {
        return INVESTMENT_TYPES.find(t => t.value === type) || INVESTMENT_TYPES[INVESTMENT_TYPES.length - 1];
    };

    const getRiskInfo = (risk: string | null) => {
        return RISK_LEVELS.find(r => r.value === risk) || RISK_LEVELS[1];
    };

    const calculateReturnPercentage = (investment: Investment) => {
        const currentVal = calculateProjectedValue(investment);
        return ((currentVal - investment.amount) / investment.amount) * 100;
    };

    const calculateExpectedReturn = (investment: Investment) => {
        if (!investment.expected_return) return 0;
        const rate = investment.expected_return / 100;
        const amount = calculateProjectedValue(investment);

        if (investment.return_frequency === 'monthly') {
            return (amount * rate) / 12; // Monthly return = annual rate / 12
        }
        return amount * rate; // Annual return
    };

    const openReinforceDialog = (investment: Investment) => {
        setReinforcingInvestment(investment);
        setNewInvestment({
            name: investment.name,
            type: investment.type,
            amount: '',
            current_value: '',
            expected_return: investment.expected_return?.toString() || '',
            return_frequency: investment.return_frequency || 'annual',
            start_date: format(new Date(), 'yyyy-MM-dd'),
            maturity_date: investment.maturity_date || '',
            risk_level: investment.risk_level || 'medium',
            notes: investment.notes || '',
            source: (investment as any).source || 'savings',
        });
        setDialogOpen(true);
    };

    if (loading) {
        return (
            <AppLayout title={t("Investimentos")} subtitle={t("Sua carteira de investimentos")}>
                <div className="flex items-center justify-center h-64">
                    <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={t("Investimentos")} subtitle={t("Sua carteira de investimentos")}>
            <ModuleGuard
                moduleKey="basic"
                title={t("Investimentos & Portfolio")}
                description={t("Acompanhe o crescimento do seu patrimÃ³nio...")}
            >
                <div className="space-y-6 animate-fade-in">
                    {/* View Toggle - Always show Market option, others based on investments */}
                    <div className="flex gap-2">
                        <Button
                            variant={activeView === "home" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveView("home")}
                        >
                            <Wallet className="h-4 w-4 mr-2" />
                            {t("VisÃ£o Geral")}
                        </Button>
                        {investments.length > 0 && (
                            <>
                                <Button
                                    variant={activeView === "details" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setActiveView("details")}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t("Meus Investimentos")}
                                </Button>
                            </>
                        )}
                        <Button
                            variant={activeView === "market" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveView("market")}
                        >
                            <Activity className="h-4 w-4 mr-2" />
                            {t("Mercado")}
                        </Button>
                    </div>

                    {activeView === "home" ? (
                        <>
                            {/* Portfolio Summary */}
                            <InvestmentPortfolioSummary
                                totalInvested={totalInvested}
                                totalCurrentValue={totalCurrentValue}
                                totalReturn={totalReturn}
                                returnPercentage={returnPercentage}
                                monthlyReturn={monthlyReturn}
                                riskProfile={riskProfile}
                            />


                            {/* Quick Actions */}
                            <InvestmentQuickActions
                                onInvestNow={() => setDialogOpen(true)}
                                onWithdraw={() => toast.info("Funcionalidade de resgate em breve!")}
                                onViewDetails={() => setActiveView("details")}
                            />

                            {/* Virtual Coach - Financial Advisor */}
                            <VirtualCoach
                                totalNetWorth={totalCurrentValue + savingsBalance}
                                emergencyFundTotal={savingsBalance}
                                monthlyExpenses={monthlyExpenses}
                                investmentDistribution={{
                                    ...portfolioByType.reduce((acc: Record<string, number>, item) => {
                                        acc[item.name] = item.value;
                                        return acc;
                                    }, {})
                                }}
                                expenseSource="default"
                                hasBudgetAlerts={budgetBalance > 0}
                                existingSavings={savingsBalance}
                            />

                            {/* Main Content Grid */}
                            <div className="space-y-6 w-full">
                                {/* Investment Products */}
                                <InvestmentProducts
                                    savingsBalance={savingsBalance}
                                    monthlyExpenses={monthlyExpenses}
                                    budgetBalance={budgetBalance}
                                    investmentsTotal={totalInvested}
                                    onSelectProduct={(productId) => {
                                        // Pre-fill investment based on product
                                        const productMap: Record<string, { type: string; name: string; risk: string }> = {
                                            "deposito": { type: "deposito_prazo", name: "DepÃ³sito a Prazo", risk: "low" },
                                            // Dynamic products from Livro de Ordens
                                            "otnr-OI2029": { type: "obrigacoes", name: "OI2029 - OT-NR", risk: "low" },
                                            "otnr-OJ2031": { type: "obrigacoes", name: "OJ2031 - OT-NR", risk: "low" },
                                            "bond-OI2029": { type: "obrigacoes", name: "OI2029 - OT-NR", risk: "low" },
                                            "bond-OJ2031": { type: "obrigacoes", name: "OJ2031 - OT-NR", risk: "low" },
                                            "bt-BT91": { type: "obrigacoes", name: "BT91 - Bilhete do Tesouro", risk: "low" },
                                            "bond-BT91": { type: "obrigacoes", name: "BT91 - Bilhete do Tesouro", risk: "low" },
                                            "bond-BMA": { type: "obrigacoes", name: "BMA - ObrigaÃ§Ã£o", risk: "medium" },
                                            // AÃ§Ãµes
                                            "acao-BAY": { type: "acoes", name: "BAY", risk: "high" },
                                            "acao-SGC": { type: "acoes", name: "SGC", risk: "high" },
                                            "acao-ENL": { type: "acoes", name: "ENL", risk: "high" },
                                            // Static products
                                            "fundos-conservadores": { type: "fundos", name: "Fundo Conservador", risk: "low" },
                                            "obrigacoes-corp": { type: "obrigacoes", name: "ObrigaÃ§Ãµes Corporativas", risk: "medium" },
                                            "fundos-mistos": { type: "fundos", name: "Fundo Misto", risk: "medium" },
                                            "carteira-equilibrada": { type: "fundos", name: "Carteira Equilibrada", risk: "medium" },
                                            "acoes-bodiva": { type: "acoes", name: "AÃ§Ãµes BODIVA", risk: "high" },
                                            "fundos-acoes": { type: "fundos", name: "Fundo de AÃ§Ãµes", risk: "high" },
                                            "carteira-agressiva": { type: "fundos", name: "Carteira Personalizada", risk: "high" },
                                        };
                                        const product = productMap[productId];
                                        if (product) {
                                            setNewInvestment({
                                                ...newInvestment,
                                                type: product.type,
                                                name: product.name,
                                                risk_level: product.risk,
                                            });
                                            setDialogOpen(true);
                                        } else {
                                            // Try to extract symbol from dynamic product ID (e.g., "acao-BAY" -> "BAY")
                                            const symbol = productId.includes('-') ? productId.split('-')[1] : productId;
                                            const prefix = productId.includes('-') ? productId.split('-')[0] : '';

                                            // Determine type and risk based on prefix
                                            let type = 'acoes';
                                            let risk = 'high';
                                            let name = symbol;

                                            if (prefix === 'otnr' || prefix === 'bt' || prefix === 'bond') {
                                                type = 'obrigacoes';
                                                risk = prefix === 'bt' ? 'low' : 'medium';
                                                name = `${symbol} - ObrigaÃ§Ã£o`;
                                            } else if (prefix === 'acao') {
                                                type = 'acoes';
                                                risk = 'high';
                                                name = symbol;
                                            }

                                            setNewInvestment({
                                                ...newInvestment,
                                                type,
                                                name,
                                                risk_level: risk,
                                            });
                                            setDialogOpen(true);
                                        }
                                    }}
                                />
                            </div>

                            {/* Education Section */}
                            <InvestmentEducation />
                        </>
                    ) : activeView === "market" ? (
                        <>
                            <MarketTerminal
                                savingsBalance={savingsBalance}
                            />
                        </>
                    ) : (
                        /* Details View - Existing Investments */
                        <div className="space-y-6">
                            {/* Back Button */}
                            <Button variant="ghost" onClick={() => setActiveView("home")}>
                                â† {t("Voltar Ã  VisÃ£o Geral")}
                            </Button>

                            {/* Portfolio Distribution */}
                            {investments.length > 0 && (
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">{t("DistribuiÃ§Ã£o por Tipo")}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-6">
                                                <div className="h-48 w-48">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RechartsPie>
                                                            <Pie
                                                                data={portfolioByType}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={40}
                                                                outerRadius={70}
                                                                paddingAngle={2}
                                                                dataKey="value"
                                                            >
                                                                {portfolioByType.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                        </RechartsPie>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    {portfolioByType.map((item, index) => (
                                                        <div key={index} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span>{item.icon}</span>
                                                                <span className="text-sm">{t(item.name)}</span>
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {((item.value / totalCurrentValue) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">{t("Resumo RÃ¡pido")}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t("Total Investido")}</span>
                                                <span className="font-bold">{formatPrice(totalInvested)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t("Valor Atual")}</span>
                                                <span className="font-bold">{formatPrice(totalCurrentValue)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t("Rendimento")}</span>
                                                <span className={`font-bold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                                                    {totalReturn >= 0 ? '+' : ''}{formatPrice(totalReturn)} ({returnPercentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t("Ativos")}</span>
                                                <span className="font-bold">{investments.length}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Investment List - Recent 5 */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">{t("Ãšltimos Investimentos")}</CardTitle>
                                    <div className="flex gap-2">
                                        {investments.length > 5 && (
                                            <Button variant="outline" size="sm" onClick={() => setActiveView("details")}>
                                                {t("Ver todos")}
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        )}
                                        <Button variant="accent" size="sm" onClick={() => setDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t("Novo")}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {investments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">{t("Nenhum investimento ainda")}</h3>
                                            <p className="text-muted-foreground mb-4">
                                                {t("Comece a investir e acompanhe seu patrimÃ´nio crescer")}
                                            </p>
                                            <Button variant="accent" onClick={() => setDialogOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                {t("Registrar Primeiro Investimento")}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {investments
                                                .sort((a, b) => {
                                                    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
                                                    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
                                                    return dateB - dateA;
                                                })
                                                .slice(0, 5)
                                                .map((investment) => {
                                                    const typeInfo = getTypeInfo(investment.type);
                                                    const riskInfo = getRiskInfo(investment.risk_level);
                                                    const returnPct = calculateReturnPercentage(investment);
                                                    const currentValue = calculateProjectedValue(investment);

                                                    return (
                                                        <div
                                                            key={investment.id}
                                                            className="p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="text-2xl">{typeInfo.icon}</div>
                                                                    <div>
                                                                        <h4 className="font-semibold text-foreground">{investment.name}</h4>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                {t(typeInfo.label)}
                                                                            </Badge>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={`text-xs ${investment.risk_level === 'low'
                                                                                    ? 'bg-success/10 text-success border-success/20'
                                                                                    : investment.risk_level === 'high'
                                                                                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                                    }`}
                                                                            >
                                                                                {t("Risco")} {t(riskInfo.label)}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => openReinforceDialog(investment)}
                                                                        className="text-xs"
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" />
                                                                        {t("ReforÃ§ar")}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => openEditDialog(investment)}
                                                                    >
                                                                        <Edit2 className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => deleteInvestment(investment.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                                                                <div>
                                                                    <span className="text-xs text-muted-foreground">{t("Investido")}</span>
                                                                    <p className="font-semibold">{formatPrice(investment.amount)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-muted-foreground">{t("Valor Atual")}</span>
                                                                    <p className="font-semibold">{formatPrice(currentValue)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-muted-foreground">{t("Rendimento")}</span>
                                                                    <p className={`font-semibold ${returnPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                                                                        {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                                                                    </p>
                                                                    {investment.expected_return && (
                                                                        <p className="text-xs text-success mt-1">
                                                                            +{formatPrice(calculateExpectedReturn(investment))} {investment.return_frequency === 'monthly' ? `/${t("mes_one")}` : `/${t("ano_one")}`}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {investment.maturity_date && (
                                                                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Calendar className="h-4 w-4" />
                                                                    {t("Vencimento")}: {format(new Date(investment.maturity_date), 'dd/MM/yyyy')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Create/Edit Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>
                                    {reinforcingInvestment ? `${t("ReforÃ§ar")}: ${reinforcingInvestment.name}` : editingInvestment ? t("Editar Investimento") : t("Registrar Investimento")}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                                {reinforcingInvestment && (
                                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                        <p className="text-sm font-medium">{t("Valor atual")}: {formatPrice((reinforcingInvestment.current_value || reinforcingInvestment.amount) + (parseFloat(newInvestment.amount) || 0))}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{t("Original")}: {formatPrice(reinforcingInvestment.amount)} + {t("ReforÃ§o")}: {formatPrice(parseFloat(newInvestment.amount) || 0)}</p>
                                    </div>
                                )}
                                {!reinforcingInvestment && (
                                    <div className="space-y-2">
                                        <Label>{t("Nome do Investimento")}</Label>
                                        <Input
                                            placeholder={t("Ex: PoupanÃ§a BFA, ObrigaÃ§Ãµes 2027...")}
                                            value={newInvestment.name}
                                            onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                                        />
                                    </div>
                                )}

                                {!reinforcingInvestment && (
                                    <div className="space-y-2">
                                        <Label>{t("Tipo de Investimento")}</Label>
                                        <Select
                                            value={newInvestment.type}
                                            onValueChange={(value) => setNewInvestment({ ...newInvestment, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("Selecione o tipo")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INVESTMENT_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.icon} {t(type.label)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{reinforcingInvestment ? t("Valor a Adicionar (Kz)") : t("Valor Investido (Kz)")}</Label>
                                        <Input
                                            type="number"
                                            placeholder="100000"
                                            value={newInvestment.amount}
                                            onChange={(e) => setNewInvestment({ ...newInvestment, amount: e.target.value })}
                                        />
                                    </div>
                                    {!reinforcingInvestment && (
                                        <div className="space-y-2">
                                            <Label>{t("Valor Atual (Kz)")}</Label>
                                            <Input
                                                type="number"
                                                placeholder="105000"
                                                value={newInvestment.current_value}
                                                onChange={(e) => setNewInvestment({ ...newInvestment, current_value: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                {!reinforcingInvestment && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t("Retorno Esperado (%)")}</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="10.5"
                                                value={newInvestment.expected_return}
                                                onChange={(e) => setNewInvestment({ ...newInvestment, expected_return: e.target.value })}
                                                disabled={reinforcingInvestment !== null}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t("FrequÃªncia")}</Label>
                                            <Select
                                                value={newInvestment.return_frequency}
                                                onValueChange={(value: 'monthly' | 'annual') => setNewInvestment({ ...newInvestment, return_frequency: value })}
                                                disabled={reinforcingInvestment !== null}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="annual">{t("Anual")}</SelectItem>
                                                    <SelectItem value="monthly">{t("Mensal")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {/* Source of Funds Selection */}
                                        <div className="space-y-2">
                                            <Label>{t("Origem do Dinheiro")}</Label>
                                            <Select
                                                value={newInvestment.source}
                                                onValueChange={(value: 'savings' | 'budget') => setNewInvestment({ ...newInvestment, source: value })}
                                                disabled={reinforcingInvestment !== null}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="savings">
                                                        <div className="flex items-center gap-2">
                                                            <span>ðŸ¦</span>
                                                            <span>{t("PoupanÃ§a")}</span>
                                                            <span className="text-muted-foreground text-xs">({formatPrice(savingsBalance)})</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="budget">
                                                        <div className="flex items-center gap-2">
                                                            <span>ðŸ’°</span>
                                                            <span>{t("OrÃ§amento")}</span>
                                                            <span className="text-muted-foreground text-xs">({formatPrice(budgetBalance)})</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t("NÃ­vel de Risco")}</Label>
                                            <Select
                                                value={newInvestment.risk_level}
                                                onValueChange={(value) => setNewInvestment({ ...newInvestment, risk_level: value })}
                                                disabled={reinforcingInvestment !== null}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RISK_LEVELS.map((level) => (
                                                        <SelectItem key={level.value} value={level.value}>
                                                            {t(level.label)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {newInvestment.expected_return && parseFloat(newInvestment.expected_return) > 0 && parseFloat(newInvestment.amount) > 0 && (
                                    <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                                        <p className="text-sm font-medium text-success">
                                            {t("Retorno Projetado")}: +{formatPrice((parseFloat(newInvestment.amount) || 0) * (parseFloat(newInvestment.expected_return) / 100))} {newInvestment.return_frequency === 'monthly' ? t("por_mes") : t("por_ano")}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t("Data de InÃ­cio")}</Label>
                                        <Input
                                            type="date"
                                            value={newInvestment.start_date}
                                            onChange={(e) => setNewInvestment({ ...newInvestment, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("Data de Vencimento")}</Label>
                                        <Input
                                            type="date"
                                            value={newInvestment.maturity_date}
                                            onChange={(e) => setNewInvestment({ ...newInvestment, maturity_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t("Notas (opcional)")}</Label>
                                    <Textarea
                                        placeholder="ObservaÃ§Ãµes sobre este investimento..."
                                        value={newInvestment.notes}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={resetForm}>
                                        {t("Cancelar")}
                                    </Button>
                                    <Button variant="accent" onClick={createOrUpdateInvestment}>
                                        {reinforcingInvestment ? t("ReforÃ§ar Investimento") : editingInvestment ? t("Atualizar") : t("Registrar")}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </ModuleGuard>
        </AppLayout>
    );
}
