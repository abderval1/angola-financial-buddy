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
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  { value: "Kz 2B+", label: "Poupança Total" },
  { value: "95%", label: "Satisfação" },
  { value: "100+", label: "Cursos Disponíveis" },
];

const benefits = [
  "Totalmente adaptado à realidade financeira angolana",
  "Suporte a Kwanza e taxas locais",
  "Integração com bancos angolanos",
  "Conteúdo educativo em português",
  "Comunidade activa de apoio",
  "Segurança e privacidade garantidas",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                <span className="font-display text-xl font-bold text-accent-foreground">K</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">Kuanza</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#education" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Educação
              </a>
              <a href="#community" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Comunidade
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button variant="accent" size="sm">
                  Criar Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-float-delayed" />
        
        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent mb-6 animate-fade-in">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Seguro e adaptado para Angola</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-slide-up">
              Domine suas finanças,{" "}
              <span className="text-transparent bg-clip-text gradient-accent">
                construa seu futuro
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              A plataforma completa para orçamento, poupança, investimentos e educação financeira. 
              Feita para angolanos, com funcionalidades que entendem sua realidade.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/auth?mode=register">
                <Button variant="hero" size="xl" className="group">
                  Começar Gratuitamente
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="xl">
                  Já tenho conta
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para{" "}
              <span className="text-transparent bg-clip-text gradient-accent">gerir suas finanças</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas e intuitivas para controlar seu dinheiro, poupar mais e investir com confiança.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-background border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-finance-lg"
              >
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Por que escolher o{" "}
                <span className="text-transparent bg-clip-text gradient-accent">Kuanza</span>?
              </h2>
              <p className="text-muted-foreground mb-8">
                Criado especialmente para a realidade financeira angolana, com ferramentas 
                que entendem suas necessidades e objetivos.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth?mode=register" className="inline-block mt-8">
                <Button variant="accent" size="lg">
                  Criar Conta Grátis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl gradient-hero p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="stat-card-income p-4 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-success mb-2" />
                    <div className="text-2xl font-bold text-foreground">+23%</div>
                    <div className="text-sm text-muted-foreground">Poupança</div>
                  </div>
                  <div className="stat-card-savings p-4 rounded-xl">
                    <Target className="h-8 w-8 text-finance-savings mb-2" />
                    <div className="text-2xl font-bold text-foreground">85%</div>
                    <div className="text-sm text-muted-foreground">Meta</div>
                  </div>
                  <div className="stat-card-expense p-4 rounded-xl">
                    <BarChart3 className="h-8 w-8 text-destructive mb-2" />
                    <div className="text-2xl font-bold text-foreground">-12%</div>
                    <div className="text-sm text-muted-foreground">Gastos</div>
                  </div>
                  <div className="stat-card-investment p-4 rounded-xl">
                    <Trophy className="h-8 w-8 text-finance-investment mb-2" />
                    <div className="text-2xl font-bold text-foreground">12</div>
                    <div className="text-sm text-muted-foreground">Conquistas</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/30 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success mb-6">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Comunidade Activa</span>
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Junte-se a milhares de angolanos{" "}
              <span className="text-transparent bg-clip-text gradient-success">
                transformando suas vidas financeiras
              </span>
            </h2>
            
            <p className="text-muted-foreground mb-10">
              Participe de desafios, compartilhe experiências, aprenda com especialistas 
              e construa um futuro financeiro mais sólido junto com nossa comunidade.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=register">
                <Button variant="success" size="lg">
                  Fazer Parte da Comunidade
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Avatar Stack */}
            <div className="flex items-center justify-center mt-10">
              <div className="flex -space-x-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full bg-primary flex items-center justify-center ring-2 ring-card"
                    style={{ zIndex: 5 - i }}
                  >
                    <span className="text-xs font-semibold text-primary-foreground">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>
              <span className="ml-4 text-sm text-muted-foreground">
                +50.000 membros activos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Smartphone className="h-16 w-16 mx-auto mb-6 text-accent" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Comece hoje a transformar suas finanças
            </h2>
            <p className="text-muted-foreground mb-10">
              Cadastre-se gratuitamente e tenha acesso a todas as ferramentas para 
              controlar seu orçamento, poupar e investir.
            </p>
            <Link to="/auth?mode=register">
              <Button variant="hero" size="xl">
                Criar Conta Gratuita
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-sidebar border-t border-sidebar-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                <span className="font-display text-xl font-bold text-accent-foreground">K</span>
              </div>
              <span className="font-display text-xl font-bold text-sidebar-foreground">Kuanza</span>
            </Link>

            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                Suporte
              </a>
            </div>

            <p className="text-sm text-sidebar-foreground/50">
              © 2024 Kuanza. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
