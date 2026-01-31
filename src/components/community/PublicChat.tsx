import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageCircle, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

export function PublicChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Fetch messages with user profiles separately
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const { data: chatData, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", "general")
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);
      
      if (error) throw error;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(chatData?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      // Map profiles to messages
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return (chatData || []).map(msg => ({
        ...msg,
        user_name: profileMap.get(msg.user_id)?.name || profileMap.get(msg.user_id)?.email?.split("@")[0] || "Usuário",
      })) as ChatMessage[];
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: "room_id=eq.general",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Track online users with presence
  useEffect(() => {
    if (!user?.id) return;

    const presenceChannel = supabase.channel("online-users");

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flat().map((p: any) => p.user_id);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("chat_messages").insert({
        user_id: user?.id,
        room_id: "general",
        content: content.trim(),
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const getInitials = (msg: ChatMessage) => {
    const name = msg.user_name || "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getName = (msg: ChatMessage) => {
    return msg.user_name || "Usuário";
  };

  const isOwnMessage = (msg: ChatMessage) => msg.user_id === user?.id;

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            Chat da Comunidade
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{onlineUsers.length} online</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
              <p>Seja o primeiro a enviar uma mensagem!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwnMessage(msg) ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={`text-xs ${
                      isOwnMessage(msg) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-secondary-foreground"
                    }`}>
                      {getInitials(msg)}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex flex-col max-w-[70%] ${isOwnMessage(msg) ? "items-end" : ""}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isOwnMessage(msg) ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-medium text-foreground">
                        {isOwnMessage(msg) ? "Você" : getName(msg)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), { 
                          addSuffix: true, 
                          locale: pt 
                        })}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-2xl ${
                        isOwnMessage(msg)
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-secondary text-secondary-foreground rounded-tl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
