import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, TrendingDown, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { month: "Jan", receita: 450000, despesa: 320000 },
  { month: "Fev", receita: 480000, despesa: 340000 },
  { month: "Mar", receita: 520000, despesa: 380000 },
  { month: "Abr", receita: 490000, despesa: 350000 },
  { month: "Mai", receita: 550000, despesa: 400000 },
  { month: "Jun", receita: 600000, despesa: 420000 },
];

const stats = [
  { title: "Saldo Atual", value: "Kz 1.250.000", change: "+12%", positive: true, icon: TrendingUp, type: "income" },
  { title: "Despesas do Mês", value: "Kz 420.000", change: "-8%", positive: true, icon: TrendingDown, type: "expense" },
  { title: "Poupança Total", value: "Kz 850.000", change: "+23%", positive: true, icon: PiggyBank, type: "savings" },
  { title: "Dívidas", value: "Kz 180.000", change: "-15%", positive: true, icon: CreditCard, type: "expense" },
];

const transactions = [
  { id: 1, name: "Salário", category: "Receita", amount: 600000, type: "income", date: "Hoje" },
  { id: 2, name: "Supermercado", category: "Alimentação", amount: -45000, type: "expense", date: "Hoje" },
  { id: 3, name: "Energia", category: "Contas", amount: -25000, type: "expense", date: "Ontem" },
  { id: 4, name: "Freelance", category: "Receita Extra", amount: 150000, type: "income", date: "Ontem" },
];

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Visão geral das suas finanças">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`stat-card-${stat.type} p-6`}
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`h-6 w-6 ${stat.type === "income" || stat.type === "savings" ? "text-success" : "text-destructive"}`} />
                <span className={`text-sm font-medium flex items-center gap-1 ${stat.positive ? "text-success" : "text-destructive"}`}>
                  {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 card-finance">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Fluxo de Caixa</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="receita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="despesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => `Kz ${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(160 84% 39%)" fill="url(#receita)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesa" stroke="hsl(0 72% 51%)" fill="url(#despesa)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card-finance">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Últimas Transações</h3>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{tx.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.category} • {tx.date}</p>
                  </div>
                  <span className={`font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : ""}{tx.amount.toLocaleString()} Kz
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
