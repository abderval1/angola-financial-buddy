import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SubscriptionStatus() {
  const { user } = useAuth();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["user-subscriptions-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending');

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded-lg" />;
  }

  if (activeSubscriptions.length === 0 && pendingSubscriptions.length === 0) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Sem assinaturas ativas</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Explore nossos módulos premium para acelerar sua jornada financeira.
        </p>
        <Link to="/plans">
          <Button size="sm" variant="default">
            Ver Módulos
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = {
    active: { icon: CheckCircle, color: "text-success", bgColor: "bg-success/10", label: "Ativo" },
    pending: { icon: Clock, color: "text-warning", bgColor: "bg-warning/10", label: "Análise" },
    expired: { icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Expirado" },
    cancelled: { icon: AlertCircle, color: "text-muted-foreground", bgColor: "bg-muted", label: "Cancelado" },
  };

  return (
    <div className="space-y-3">
      {activeSubscriptions.map((sub) => {
        const status = statusConfig.active;
        const Icon = status.icon;
        return (
          <div key={sub.id} className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold leading-none">{sub.subscription_plans?.name}</p>
                {sub.expires_at && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Expira em: {new Date(sub.expires_at).toLocaleDateString('pt-AO')}
                  </p>
                )}
              </div>
            </div>
            <Badge className={`${status.bgColor} ${status.color} border-0 text-[10px]`}>
              {status.label}
            </Badge>
          </div>
        );
      })}

      {pendingSubscriptions.map((sub) => {
        const status = statusConfig.pending;
        return (
          <div key={sub.id} className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium leading-none">{sub.subscription_plans?.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Aguardando aprovação</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {status.label}
            </Badge>
          </div>
        );
      })}

      <Link to="/plans" className="block text-center">
        <Button variant="link" size="sm" className="text-xs">
          Gerir planos e módulos
        </Button>
      </Link>
    </div>
  );
}
