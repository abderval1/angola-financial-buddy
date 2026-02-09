import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, ShoppingBag, TrendingDown, Newspaper, BellOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["user-notifications", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false })
                .limit(5);

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
        },
    });

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    const getNotificationIcon = (type: string | null) => {
        switch (type) {
            case "marketplace_status":
                return <ShoppingBag className="h-4 w-4 text-primary" />;
            case "price_drop":
                return <TrendingDown className="h-4 w-4 text-success" />;
            case "news":
                return <Newspaper className="h-4 w-4 text-blue-500" />;
            default:
                return <Bell className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-sm">Notificações</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] text-muted-foreground hover:text-primary"
                            onClick={() => markAllAsReadMutation.mutate()}
                        >
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <BellOff className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                            <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification: any) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 transition-colors hover:bg-muted/50 relative group",
                                        !notification.read && "bg-primary/5"
                                    )}
                                    onClick={() => !notification.read && markAsReadMutation.mutate(notification.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1 overflow-hidden">
                                            <div className="flex items-start justify-between gap-1">
                                                <p className={cn("text-sm font-medium leading-none", !notification.read && "text-primary")}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground shrink-0 uppercase">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: pt })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <div className="absolute top-4 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-primary"
                        onClick={() => navigate("/notifications")}
                    >
                        Ver todas as notificações
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
