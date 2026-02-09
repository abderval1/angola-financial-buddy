import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, ShoppingBag, TrendingDown, Newspaper, BellOff, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Notifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["user-notifications-full", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["user-notifications-full"] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user?.id)
                .eq("read", false);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["user-notifications-full"] });
            toast.success("Todas as notificações foram marcadas como lidas");
        },
    });

    const getNotificationIcon = (type: string | null) => {
        switch (type) {
            case "marketplace_status":
                return <ShoppingBag className="h-5 w-5 text-primary" />;
            case "price_drop":
                return <TrendingDown className="h-5 w-5 text-success" />;
            case "news":
                return <Newspaper className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return (
        <AppLayout title="Minhas Notificações" subtitle="Mantenha-se actualizado com as suas actividades">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                            {unreadCount} não lidas
                        </Badge>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => markAllAsReadMutation.mutate()}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>

                <Card className="border-none bg-transparent shadow-none">
                    <CardContent className="p-0 space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col gap-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                        <BellOff className="h-10 w-10 text-muted-foreground opacity-20" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Tudo em dia!</h3>
                                    <p className="text-muted-foreground mt-2">Você não tem nenhuma notificação no momento.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {notifications.map((notification: any) => (
                                    <Card
                                        key={notification.id}
                                        className={cn(
                                            "transition-all cursor-pointer hover:shadow-md",
                                            !notification.read ? "border-primary/30 bg-primary/5" : "bg-card"
                                        )}
                                        onClick={() => !notification.read && markAsReadMutation.mutate(notification.id)}
                                    >
                                        <CardContent className="p-5">
                                            <div className="flex gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-background border flex items-center justify-center shrink-0 shadow-sm">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-start justify-between">
                                                        <h4 className={cn("font-bold text-lg", !notification.read && "text-primary")}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: pt })}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    {notification.action_url && (
                                                        <Button variant="link" className="p-0 h-auto text-primary text-sm font-semibold mt-2" asChild>
                                                            <a href={notification.action_url}>Ver mais detalhes</a>
                                                        </Button>
                                                    )}
                                                </div>
                                                {!notification.read && (
                                                    <div className="h-3 w-3 rounded-full bg-primary mt-1 shrink-0" />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
