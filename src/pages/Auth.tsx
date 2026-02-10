import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Chrome, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Referral code from URL
  const refCode = searchParams.get("ref");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: refCode || "",
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast.error(error.message || "Erro ao fazer login");
        setLoading(false);
        return;
      }
      toast.success("Bem-vindo de volta!");
    } else {
      const { error, data } = await signUp(formData.email, formData.password, {
        name: formData.name,
        phone: formData.phone,
        referral_code: formData.referralCode
      });
      if (error) {
        toast.error(error.message || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      // Explicitly create profile if signUp doesn't trigger it (safety measure)
      // Note: Usually handled by Supabase triggers, but let's be explicit to ensure name is saved
      if (data?.user) {
        await supabase.from("profiles").upsert({
          user_id: data.user.id,
          name: formData.name,
          email: formData.email,
        });
      }

      // Process referral code if provided
      if (formData.referralCode.trim()) {
        // Store referral code in localStorage to process after email confirmation
        localStorage.setItem("pendingReferralCode", formData.referralCode.trim().toUpperCase());
      }

      toast.success("Conta criada! Verifique seu email para confirmar.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Google Login Error:", error);
        if (error.message.includes("provider is not enabled")) {
          toast.error("O login com Google não está activado no Supabase Dashboard.");
        } else {
          toast.error(`Erro ao fazer login com Google: ${error.message}`);
        }
      }
    } catch (err: any) {
      console.error("Google Login Exception:", err);
      toast.error("Ocorreu um erro inesperado ao tentar aceder ao Google.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-24 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl gradient-accent">
              <span className="font-display text-lg sm:text-xl font-bold text-accent-foreground">A</span>
            </div>
            <span className="font-display text-lg sm:text-xl font-bold text-foreground">Angola Finance</span>
          </Link>

          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isLogin ? "Entre para continuar gerindo suas finanças" : "Comece a transformar suas finanças hoje"}
            </p>
          </div>

          <Button variant="outline" className="w-full h-11 sm:h-12 mb-4 sm:mb-6" onClick={handleGoogleLogin}>
            <Chrome className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="text-sm sm:text-base">Continuar com Google</span>
          </Button>

          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou continue com email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {!isLogin && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-sm">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="João Silva" className="pl-10 h-10 sm:h-12 text-sm sm:text-base" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required={!isLogin} />
                </div>
              </div>
            )}

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="joao@exemplo.ao" className="pl-10 h-10 sm:h-12 text-sm sm:text-base" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-sm">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 h-10 sm:h-12 text-sm sm:text-base" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" type="password" placeholder="••••••••" className="pl-10 h-10 sm:h-12 text-sm sm:text-base" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required={!isLogin} />
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="referralCode" className="text-sm">Código de Convite (opcional)</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="referralCode"
                    placeholder="Ex: ABC12345"
                    className="pl-10 h-10 sm:h-12 text-sm sm:text-base uppercase"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                  />
                </div>
                {formData.referralCode && (
                  <p className="text-xs text-success">🎁 Você receberá um bónus de boas-vindas!</p>
                )}
              </div>
            )}

            {!isLogin && (
              <p className="text-xs text-muted-foreground mt-2">
                Ao criar uma conta, você concorda com nossos{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Termos de Serviço
                </Link>{" "}
                e{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>
                .
              </p>
            )}

            <Button type="submit" variant="accent" className="w-full h-10 sm:h-12 text-sm sm:text-base" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  {isLogin ? "Entrando..." : "Criando conta..."}
                </div>
              ) : (
                <>
                  {isLogin ? "Entrar" : "Criar Conta"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground">
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl gradient-accent mb-8 animate-float">
              <span className="font-display text-4xl font-bold text-accent-foreground">A</span>
            </div>
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">Gerencie suas finanças com inteligência</h2>
            <p className="text-muted-foreground text-lg">Orçamento, poupança, investimentos e educação financeira — tudo em uma plataforma feita para você.</p>
          </div>
        </div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-success/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
