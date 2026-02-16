import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wallet, Users, Gift, Copy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function MonetizationWidget() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Fetch referral code
  const { data: referralCode } = useQuery({
    queryKey: ["referral-code-widget", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await supabase.rpc("ensure_user_referral_code", { p_user_id: user?.id });
        const { data: newCode } = await supabase
          .from("referral_codes")
          .select("*")
          .eq("user_id", user?.id)
          .single();
        return newCode;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch balance
  const { data: balance } = useQuery({
    queryKey: ["user-balance-widget", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_balance", { p_user_id: user?.id });
      if (error) throw error;
      return data?.[0] || { available_balance: 0, total_earned: 0 };
    },
    enabled: !!user?.id,
  });

  // Fetch monetization settings
  const { data: settings } = useQuery({
    queryKey: ["monetization-settings-widget"],
    queryFn: async () => {
      const { data, error } = await supabase.from("monetization_settings").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      data?.forEach(s => map[s.setting_key] = s.setting_value);
      return map;
    },
  });

  const copyCode = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${referralCode.code}`);
      toast.success(t("Link copiado!"));
    }
  };

  const minPayout = settings?.minimum_payout?.amount || 5000;
  const availableBalance = balance?.available_balance || 0;
  const progress = Math.min((availableBalance / minPayout) * 100, 100);

  return (
    <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Gift className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("Monetização")}</CardTitle>
              <CardDescription>{t("Ganhe indicando amigos")}</CardDescription>
            </div>
          </div>
          <Link to="/monetization">
            <Button variant="ghost" size="sm">
              {t("Ver Tudo")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <Wallet className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{availableBalance.toLocaleString()} Kz</p>
            <p className="text-xs text-muted-foreground">{t("Disponível")}</p>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-lg font-bold">{referralCode?.successful_referrals || 0}</p>
            <p className="text-xs text-muted-foreground">{t("Indicados Ativos")}</p>
          </div>
        </div>

        {availableBalance < minPayout && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{t("Para levantamento")}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {t("Faltam")} {(minPayout - availableBalance).toLocaleString()} Kz
            </p>
          </div>
        )}

        {referralCode?.code && (
          <div className="flex items-center gap-2 p-2 bg-background rounded-lg border">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">{t("Seu código")}</p>
              <p className="font-mono font-bold text-primary">{referralCode.code}</p>
            </div>
            <Button variant="outline" size="icon" className="shrink-0" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
