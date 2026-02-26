import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageCircle, X, Minus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

// User color palette for distinct message colors
const USER_COLORS = [
    "hsl(200, 90%, 45%)",
    "hsl(160, 84%, 39%)",
    "hsl(270, 60%, 55%)",
    "hsl(25, 95%, 53%)",
    "hsl(340, 75%, 55%)",
    "hsl(45, 93%, 47%)",
    "hsl(180, 70%, 40%)",
    "hsl(300, 60%, 50%)",
    "hsl(120, 60%, 40%)",
    "hsl(0, 70%, 55%)",
];

function getUserColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function FloatingChat() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    const { data: messages = [], isLoading, refetch } = useQuery({
        queryKey: ["floating-chat-messages"],
        queryFn: async () => {
            const { data: chatData, error } = await supabase
                .from("chat_messages")
                .select("*")
                .is("room_id", null)
                .or("is_deleted.is.null,is_deleted.eq.false")
                .order("created_at", { ascending: true })
                .limit(50);

            if (error) throw error;

            // Fetch profiles for all unique user IDs
            const userIds = [...new Set(chatData?.map(m => m.user_id) || [])];
            if (userIds.length === 0) return [];

            const { data: profiles } = await supabase
                .from("profiles")
                .select("user_id, name, avatar_url")
                .in("user_id", userIds);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

            return (chatData || []).map(msg => ({
                ...msg,
                profile: profileMap.get(msg.user_id)
            }));
        },
        refetchInterval: 5000, // Refetch every 5 seconds
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const { error } = await supabase
                .from("chat_messages")
                .insert({
                    user_id: user?.id,
                    content,
                    room_id: null,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            setMessage("");
            queryClient.invalidateQueries({ queryKey: ["floating-chat-messages"] });
        },
        onError: (error: any) => {
            toast.error("Erro ao enviar mensagem: " + error.message);
        },
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current && isOpen) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !user) return;
        sendMessageMutation.mutate(message.trim());
    };

    // Don't render if not logged in
    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Chat Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 flex items-center justify-center"
                    size="icon"
                >
                    <MessageCircle className="h-7 w-7" />
                </Button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`bg-background border rounded-lg shadow-xl transition-all duration-300 flex flex-col ${isMinimized
                            ? "w-80 h-14"
                            : "w-80 h-[500px]"
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b bg-primary/5 rounded-t-lg shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-sm">Chat Público</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsMinimized(!isMinimized)}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    {!isMinimized && (
                        <>
                            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                        Nenhuma mensagem ainda. Seja o primeiro!
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.map((msg: any) => {
                                            const isOwn = msg.user_id === user?.id;
                                            const userColor = getUserColor(msg.user_id);
                                            const initials = getInitials(msg.profile?.name || msg.user_id.slice(0, 8));
                                            const timeAgo = formatDistanceToNow(new Date(msg.created_at), {
                                                addSuffix: true,
                                                locale: pt,
                                            });

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                                                >
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        {msg.profile?.avatar_url ? (
                                                            <img src={msg.profile.avatar_url} alt="" />
                                                        ) : (
                                                            <AvatarFallback
                                                                style={{ backgroundColor: userColor }}
                                                                className="text-white text-xs"
                                                            >
                                                                {initials}
                                                            </AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div
                                                        className={`max-w-[70%] rounded-lg p-2 ${isOwn
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted"
                                                            }`}
                                                    >
                                                        {!isOwn && (
                                                            <p className="text-xs font-medium text-primary mb-1">
                                                                {msg.profile?.name || "Usuário"}
                                                            </p>
                                                        )}
                                                        <p className="text-sm break-words">{msg.content}</p>
                                                        <p
                                                            className={`text-[10px] mt-1 ${isOwn
                                                                    ? "text-primary-foreground/70"
                                                                    : "text-muted-foreground"
                                                                }`}
                                                        >
                                                            {timeAgo}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Message Input */}
                            <form onSubmit={handleSend} className="p-3 border-t flex gap-2 shrink-0">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Escreva uma mensagem..."
                                    className="flex-1"
                                    disabled={sendMessageMutation.isPending}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!message.trim() || sendMessageMutation.isPending}
                                >
                                    {sendMessageMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
