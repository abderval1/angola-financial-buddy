import { Link } from "react-router-dom";
import {
  TrendingUp,
  PiggyBank,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Wallet,
  Target,
  GraduationCap,
  Trophy,
  Smartphone,
  Zap,
  Newspaper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

const features = [
  {
    icon: Wallet,
    title: "Controle de Orçamento",
    description: "Registe receitas e despesas, visualize gráficos e receba alertas de gastos."
  },
  {
    icon: PiggyBank,
    title: "Metas de Poupança",
    description: "Crie objetivos financeiros, simule crescimento e acompanhe seu progresso."
  },
  {
    icon: BarChart3,
    title: "Gestão de Dívidas",
    description: "Organize empréstimos, calcule amortizações e planeje quitações."
  },
  {
    icon: TrendingUp,
    title: "Investimentos",
    description: "Aprenda sobre opções locais, simule retornos e diversifique sua carteira."
  },
  {
    icon: GraduationCap,
    title: "Educação Financeira",
    description: "Cursos, artigos e vídeos sobre finanças adaptados à realidade angolana."
  },
  {
    icon: Trophy,
    title: "Gamificação",
    description: "Conquistas, desafios e rankings para tornar suas finanças mais divertidas."
  },
];

const stats = [
  { value: "50K+", label: "Usuários Activos" },
  { value: "Kz 100M+", label: "Poupança Total" },
  { value: "95%", label: "Satisfação" },
  { value: "100+", label: "Cursos Disponíveis" },
];

const benefits = [
  "Totalmente adaptado à realidade financeira angolana",
  "Suporte a taxas locais",
  "Conteúdo sobre educação financeira",
  "Comunidade activa de apoio",
  "Segurança e privacidade garantidas",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <PWAInstallPrompt />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl gradient-accent">
                <span className="font-display text-lg sm:text-xl font-bold text-accent-foreground">A</span>
              </div>
              <span className="font-display text-lg sm:text-xl font-bold">
                <span className="text-primary">Angola</span>
                <span className="text-accent">Finance</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <a href="#education" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Educação
              </a>
              <a href="#community" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Comunidade
              </a>
              <a href="#plans" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Planos
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button variant="accent" size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
                  <span className="hidden sm:inline">Criar Conta</span>
                  <span className="sm:hidden">Cria Conta</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 md:pt-32 pb-12 sm:pb-20 overflow-hidden">
        {/* Background decorations - smaller on mobile */}
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="absolute top-20 left-0 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-0 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-success/10 rounded-full blur-3xl animate-float-delayed" />

        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent/10 border border-accent/20 text-accent mb-4 sm:mb-6 animate-fade-in">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">Seguro e adaptado para Angola</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-normal sm:leading-tight animate-slide-up break-words">
              Domine suas finanças,{" "}
              <span className="text-primary block sm:inline">
                construa seu futuro
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 animate-slide-up px-2" style={{ animationDelay: "0.1s" }}>
              A maior plataforma sobre Gestão e Educação Financeira de Angola Integrada com Inteligência Artificial: Orçamento, poupança, investimentos e educação financeira.
              Com funcionalidades que entendem sua realidade.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/auth?mode=register" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="group w-full sm:w-auto">
                  Começar Teste Grátis
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/auth" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-10 sm:mt-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-3 sm:p-4">
                  <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
              Tudo que você precisa para{" "}
              <span className="text-primary">gerir suas finanças</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Ferramentas poderosas e intuitivas para controlar seu dinheiro, poupar mais e investir com confiança.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-background border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-finance-lg"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-accent/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-1.5 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="education" className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                Por que escolher o Angola{" "}
                <span className="text-primary">Finance</span>?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                Criado especialmente para a realidade financeira angolana, com ferramentas
                que entendem suas necessidades e objetivos.
              </p>
              <ul className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth?mode=register" className="inline-block mt-6 sm:mt-8">
                <Button variant="accent" size="default" className="sm:text-base">
                  Iniciar Teste de 3 Dias
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="aspect-square rounded-2xl sm:rounded-3xl gradient-hero p-4 sm:p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xs sm:max-w-sm">
                  <div className="stat-card-income p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-success mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">+23%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Poupança</div>
                  </div>
                  <div className="stat-card-savings p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <Target className="h-6 w-6 sm:h-8 sm:w-8 text-finance-savings mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">85%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Meta</div>
                  </div>
                  <div className="stat-card-expense p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-destructive mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">-12%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Gastos</div>
                  </div>
                  <div className="stat-card-investment p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-finance-investment mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">12</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Conquistas</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 sm:w-32 h-24 sm:h-32 bg-accent/30 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-12 sm:py-20 bg-background overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50" />

        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos Amigos do seu <span className="text-primary">Bolso</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Escolha os módulos que mais fazem sentido para a sua jornada financeira.
              Subscrições mensais sem fidelização.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Básico */}
            <div className="group relative p-8 rounded-3xl bg-card border border-border hover:border-neutral-400/30 transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                3 Dias Grátis
              </div>
              <div className="mb-6 h-12 w-12 rounded-2xl bg-neutral-500/10 flex items-center justify-center text-neutral-500 group-hover:bg-neutral-500 group-hover:text-white transition-all">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Básico</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">2.000</span>
                <span className="text-muted-foreground ml-1">Kz/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Orçamento & Despesas",
                  "Poupança & Dívidas",
                  "Investimentos na BODIVA e em Bancos",
                  "Comparar Preços",
                  "Calculadoras & Renda Extra",
                  "Comunidade & Marketplace",
                  "Blog com conteúdos valiosos"
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth?mode=register" className="block">
                <Button variant="outline" className="w-full rounded-xl">Começar Agora</Button>
              </Link>
            </div>

            {/* Essencial */}
            <div className="group relative p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Essencial</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">4.000</span>
                <span className="text-muted-foreground ml-1">Kz/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Tudo do Plano Básico",
                  "Módulo Metas & FIRE",
                  "Simulador de Independência",
                  "Gestão Metas Avançada",
                  "Coach Virtual Personalizado"
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth?mode=register" className="block">
                <Button className="w-full rounded-xl gradient-accent text-accent-foreground">Ativar Módulo</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="group relative p-8 rounded-3xl bg-card border border-border hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Recomendado
              </div>
              <div className="mb-6 h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">8.000</span>
                <span className="text-muted-foreground ml-1">Kz/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Tudo do Plano Essencial",
                  "Módulo de Educação",
                  "Cursos e Quiz",
                  "Calculadoras Premium",
                  "Recursos Exclusivos"
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth?mode=register" className="block">
                <Button className="w-full rounded-xl gradient-primary text-primary-foreground">Ativar Módulo</Button>
              </Link>
            </div>

            {/* Avançado */}
            <div className="group relative p-8 rounded-3xl bg-card border border-border hover:border-sidebar-primary/50 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6 h-12 w-12 rounded-2xl bg-sidebar-primary/10 flex items-center justify-center text-sidebar-primary group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground transition-all">
                <Newspaper className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Avançado</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">12.000</span>
                <span className="text-muted-foreground ml-1">Kz/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Tudo do Plano Pro",
                  "Módulo Notícias & Mercado",
                  "Indicadores Económicos",
                  "Relatórios Semanais",
                  "Análise de Tendências com IA",
                  "Previsão de preços do mercado com Machine Learning",

                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth?mode=register" className="block">
                <Button variant="outline" className="w-full rounded-xl hover:bg-sidebar-primary hover:text-sidebar-primary-foreground border-sidebar-primary/20">Ativar Módulo</Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-12 sm:py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-success/10 border border-success/20 text-success mb-4 sm:mb-6">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">Comunidade Activa</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 px-2">
              Junte-se a milhares de angolanos{" "}
              <span className="text-success">
                transformando suas vidas financeiras
              </span>
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground mb-8 sm:mb-10 px-4">
              Participe de desafios, compartilhe experiências, aprenda com especialistas
              e construa um futuro financeiro mais sólido junto com nossa comunidade.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/auth?mode=register" className="w-full sm:w-auto">
                <Button variant="success" size="default" className="w-full sm:w-auto">
                  Fazer Parte da Comunidade
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>

            {/* Avatar Stack */}
            <div className="flex items-center justify-center mt-8 sm:mt-10">
              <div className="flex -space-x-2 sm:-space-x-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary flex items-center justify-center ring-2 ring-card"
                    style={{ zIndex: 5 - i }}
                  >
                    <span className="text-[10px] sm:text-xs font-semibold text-primary-foreground">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>
              <span className="ml-3 sm:ml-4 text-xs sm:text-sm text-muted-foreground">
                +50.000 membros activos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-10 right-0 sm:right-10 w-48 sm:w-64 h-48 sm:h-64 bg-accent/20 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Smartphone className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-accent" />
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 px-2">
              Comece hoje a transformar suas finanças
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 sm:mb-10 px-4">
              Cadastre-se para o teste de 3 dias e tenha acesso a todas as ferramentas para
              controlar seu orçamento, poupar e investir.
            </p>
            <Link to="/auth?mode=register" className="inline-block w-full sm:w-auto">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                Iniciar Avaliação de 3 Dias
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-sidebar border-t border-sidebar-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl gradient-accent">
                <span className="font-display text-lg sm:text-xl font-bold text-accent-foreground">A</span>
              </div>
              <span className="font-display text-lg sm:text-xl font-bold">
                <span className="text-sidebar-primary">Angola</span>
                <span className="text-sidebar-foreground">Finance</span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link to="/terms" className="text-xs sm:text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacy" className="text-xs sm:text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                Privacidade
              </Link>
              <a href="#" className="text-xs sm:text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                Suporte
              </a>
            </div>

            <p className="text-xs sm:text-sm text-sidebar-foreground/50 text-center">
              © 2026 Angola Finance. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
