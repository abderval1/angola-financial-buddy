import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SubscriptionStatus() {
  const { user } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ["user-subscription-status", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: downloadCount = 0 } = useQuery({
    queryKey: ["ebook-downloads-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("ebook_downloads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .eq("is_free_download", true);
      
      return count || 0;
    },
    enabled: !!user?.id,
  });

  if (!subscription) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Sem assinatura ativa</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Assine um plano para ter acesso a ebooks gratuitos e recursos exclusivos.
        </p>
        <Link to="/marketplace?tab=plans">
          <Button size="sm" variant="default">
            Ver Planos
          </Button>
        </Link>
      </div>
    );
  }

  const ebookLimit = subscription.subscription_plans?.ebook_limit || 0;
  const progress = ebookLimit > 0 ? (downloadCount / ebookLimit) * 100 : 0;
  const remaining = Math.max(0, ebookLimit - downloadCount);

  const statusConfig = {
    active: { icon: CheckCircle, color: "text-success", bgColor: "bg-success/10", label: "Ativo" },
    pending: { icon: Clock, color: "text-warning", bgColor: "bg-warning/10", label: "Pendente" },
    expired: { icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Expirado" },
    cancelled: { icon: AlertCircle, color: "text-muted-foreground", bgColor: "bg-muted", label: "Cancelado" },
  };

  const status = statusConfig[subscription.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className={`p-4 rounded-lg border ${subscription.status === "active" ? "border-primary/20 bg-primary/5" : "border-border"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${status.color}`} />
          <span className="font-medium">
            Plano {subscription.subscription_plans?.name}
          </span>
        </div>
        <Badge className={`${status.bgColor} ${status.color} border-0`}>
          {status.label}
        </Badge>
      </div>

      {subscription.status === "active" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Ebooks gratuitos
            </span>
            <span className="font-medium">
              {downloadCount} / {ebookLimit}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {remaining > 0 ? (
            <p className="text-xs text-muted-foreground">
              Você ainda pode baixar <strong>{remaining}</strong> ebook{remaining !== 1 ? "s" : ""} grátis.
            </p>
          ) : (
            <p className="text-xs text-destructive">
              Você atingiu o limite de downloads gratuitos do seu plano.
            </p>
          )}
        </div>
      )}

      {subscription.status === "pending" && (
        <p className="text-sm text-muted-foreground">
          Seu pagamento está sendo analisado. Você receberá uma notificação quando for aprovado.
        </p>
      )}
    </div>
  );
}
