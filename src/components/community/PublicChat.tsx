import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageCircle, Users, Loader2, Reply, X, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useAchievements } from "@/hooks/useAchievements";

// User color palette for distinct message colors
const USER_COLORS = [
  "hsl(200, 90%, 45%)",   // Blue
  "hsl(160, 84%, 39%)",   // Green
  "hsl(270, 60%, 55%)",   // Purple
  "hsl(25, 95%, 53%)",    // Orange
  "hsl(340, 75%, 55%)",   // Pink
  "hsl(45, 93%, 47%)",    // Yellow
  "hsl(180, 70%, 40%)",   // Cyan
  "hsl(300, 60%, 50%)",   // Magenta
  "hsl(120, 60%, 40%)",   // Lime
  "hsl(0, 70%, 55%)",     // Red
];

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  reply_to_id: string | null;
  user_name?: string;
  reply_to_message?: {
    id: string;
    content: string;
    user_name: string;
  } | null;
}

interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

// Hash function to consistently assign colors to users
function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function PublicChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const { awardXP } = useAchievements();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Fetch messages with user profiles
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const { data: chatData, error } = await supabase
        .from("chat_messages")
        .select("*")
        .is("room_id", null)
        .or("is_deleted.is.null,is_deleted.eq.false")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(chatData?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Create a map of messages for reply lookups
      const messageMap = new Map(chatData?.map(m => [m.id, m]) || []);

      return (chatData || []).map(msg => {
        const replyToMsg = msg.reply_to_id ? messageMap.get(msg.reply_to_id) : null;
        const replyToProfile = replyToMsg ? profileMap.get(replyToMsg.user_id) : null;

        return {
          ...msg,
          user_name: profileMap.get(msg.user_id)?.name || profileMap.get(msg.user_id)?.email?.split("@")[0] || "Usuário",
          reply_to_message: replyToMsg ? {
            id: replyToMsg.id,
            content: replyToMsg.content,
            user_name: profileMap.get(replyToMsg.user_id)?.name || profileMap.get(replyToMsg.user_id)?.email?.split("@")[0] || "Usuário",
          } : null,
        };
      }) as ChatMessage[];
    },
    enabled: !!user?.id,
  });

  // Fetch reactions
  const { data: reactions = [] } = useQuery({
    queryKey: ["chat-reactions"],
    queryFn: async () => {
      const messageIds = messages.map(m => m.id);
      if (messageIds.length === 0) return [];

      const { data, error } = await supabase
        .from("chat_reactions")
        .select("*")
        .in("message_id", messageIds);

      if (error) throw error;
      return (data || []) as ChatReaction[];
    },
    enabled: messages.length > 0,
  });

  // Group reactions by message
  const reactionsByMessage = useMemo(() => {
    const grouped: Record<string, Record<string, string[]>> = {};

    reactions.forEach(reaction => {
      if (!grouped[reaction.message_id]) {
        grouped[reaction.message_id] = {};
      }
      if (!grouped[reaction.message_id][reaction.emoji]) {
        grouped[reaction.message_id][reaction.emoji] = [];
      }
      grouped[reaction.message_id][reaction.emoji].push(reaction.user_id);
    });

    return grouped;
  }, [reactions]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          // Listen to all room_id changes and filter in the callback or keep it simple
        },
        (payload: any) => {
          // If it's a delete, we might not have room_id in old, so just invalidate to be safe
          if (payload.eventType === "DELETE") {
            queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
            return;
          }

          // Only invalidate if it's the general chat (room_id is null)
          if (payload.new && payload.new.room_id === null) {
            queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
          } else if (payload.old && payload.old.room_id === null) {
            queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Subscribe to realtime reactions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("chat-reactions-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_reactions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-reactions"] });
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
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("chat_messages").insert({
        user_id: user.id,
        room_id: null,
        content: content.trim(),
        reply_to_id: replyingTo?.id || null,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setMessage("");
      setReplyingTo(null);
      awardXP(1, "Mensagem enviada");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
    onError: (error: any) => {
      console.error("Chat send error:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("chat_messages")
        .update({ content: content.trim() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditingContent("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      toast.success("Mensagem editada!");
    },
    onError: (error: any) => {
      toast.error("Erro ao editar mensagem");
      console.error(error);
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Use SOFT DELETE to avoid foreign key constraint issues with reactions from others
      // The query already filters out messages where is_deleted is true
      const { data, error } = await supabase
        .from("chat_messages")
        .update({ is_deleted: true })
        .eq("id", id)
        .eq("user_id", user.id)
        .select();

      if (error) {
        console.error("Soft delete message error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Não foi possível apagar a mensagem. Verifique se você é o autor.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      toast.success("Mensagem apagada!");
    },
    onError: (error: any) => {
      if (error.message?.includes("row-level security")) {
        toast.error("Erro de permissão! Verifique o SQL Console no Supabase.");
      } else {
        toast.error(error.message || "Erro ao apagar mensagem");
      }
      console.error(error);
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      // Check if user already reacted with this emoji
      const existingReactions = reactionsByMessage[messageId]?.[emoji] || [];
      const hasReacted = existingReactions.includes(user?.id || "");

      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from("chat_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user?.id)
          .eq("emoji", emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("chat_reactions")
          .insert({
            message_id: messageId,
            user_id: user?.id,
            emoji,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-reactions"] });
      setShowEmojiPicker(null);
    },
  });

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-primary/20");
      setTimeout(() => element.classList.remove("bg-primary/20"), 2000);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!user) {
      toast.error("Você precisa estar logado para enviar mensagens");
      return;
    }
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
              {messages.map((msg) => {
                const userColor = getUserColor(msg.user_id);
                const messageReactions = reactionsByMessage[msg.id] || {};

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage(msg) ? "flex-row-reverse" : ""} group`}
                  >
                    <Avatar
                      className="h-8 w-8 flex-shrink-0"
                      style={{ backgroundColor: isOwnMessage(msg) ? undefined : `${userColor}20` }}
                    >
                      <AvatarFallback
                        className="text-xs"
                        style={{
                          backgroundColor: isOwnMessage(msg) ? "hsl(var(--primary))" : `${userColor}30`,
                          color: isOwnMessage(msg) ? "hsl(var(--primary-foreground))" : userColor,
                        }}
                      >
                        {getInitials(msg)}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex flex-col max-w-[70%] ${isOwnMessage(msg) ? "items-end" : ""}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isOwnMessage(msg) ? "flex-row-reverse" : ""}`}>
                        <span
                          className="text-xs font-medium"
                          style={{ color: isOwnMessage(msg) ? "hsl(var(--foreground))" : userColor }}
                        >
                          {isOwnMessage(msg) ? "Você" : getName(msg)}
                          {getName(msg) === "Usuário" && !isOwnMessage(msg) && (
                            <span className="text-[10px] bg-muted px-1 rounded ml-1 opacity-50 font-normal">Sem nome</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                            locale: pt
                          })}
                        </span>
                      </div>

                      {/* Reply preview */}
                      {msg.reply_to_message && (
                        <div
                          className={`text-xs px-2 py-1.5 rounded-t-xl mb-0 border-l-4 cursor-pointer hover:opacity-80 transition-opacity ${isOwnMessage(msg) ? "bg-primary/10 border-primary/50" : "bg-muted border-primary/40"
                            }`}
                          style={{ borderLeftColor: isOwnMessage(msg) ? undefined : userColor }}
                          onClick={() => scrollToMessage(msg.reply_to_message!.id)}
                        >
                          <div className="flex items-center gap-1 mb-0.5 opacity-70">
                            <Reply className="h-2.5 w-2.5" />
                            <span className="font-bold">{msg.reply_to_message.user_name}</span>
                          </div>
                          <span className="text-muted-foreground line-clamp-1">
                            {msg.reply_to_message.content}
                          </span>
                        </div>
                      )}

                      <div
                        className={`px-3 py-2 relative transition-colors ${isOwnMessage(msg)
                          ? `bg-primary text-primary-foreground ${msg.reply_to_message ? 'rounded-b-2xl rounded-tl-2xl' : 'rounded-2xl rounded-tr-none'}`
                          : `rounded-2xl ${msg.reply_to_message ? 'rounded-t-none' : 'rounded-tl-none'}`
                          }`}
                        id={`msg-${msg.id}`}
                        style={{
                          backgroundColor: isOwnMessage(msg) ? undefined : `${userColor}15`,
                          borderLeft: isOwnMessage(msg) ? undefined : `3px solid ${userColor}`,
                        }}
                      >
                        {editingMessageId === msg.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <Input
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              autoFocus
                              className="h-8 text-sm text-foreground bg-background"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") editMessageMutation.mutate({ id: msg.id, content: editingContent });
                                if (e.key === "Escape") setEditingMessageId(null);
                              }}
                            />
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => setEditingMessageId(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => editMessageMutation.mutate({ id: msg.id, content: editingContent })}
                                disabled={editMessageMutation.isPending}
                              >
                                {editMessageMutation.isPending ? "Salvando..." : "Salvar"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        )}

                        {/* Action buttons - WhatsApp style */}
                        <div className={`absolute -top-4 ${isOwnMessage(msg) ? "right-0" : "left-0"} hidden group-hover:flex gap-1 z-20`}>
                          <div className="bg-popover border shadow-lg rounded-full px-2 py-1 flex gap-2">
                            {EMOJI_OPTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                className="text-lg hover:scale-150 transition-transform duration-200"
                                onClick={() => addReactionMutation.mutate({ messageId: msg.id, emoji })}
                              >
                                {emoji}
                              </button>
                            ))}

                            {isOwnMessage(msg) && (
                              <div className="flex gap-2 ml-1 border-l pl-2">
                                <button
                                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditingContent(msg.content);
                                  }}
                                  title="Editar"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
                                  onClick={() => {
                                    if (window.confirm("Apagar esta mensagem?")) {
                                      deleteMessageMutation.mutate(msg.id);
                                    }
                                  }}
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`absolute -bottom-3 ${isOwnMessage(msg) ? "left-0" : "right-0"} flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 rounded-full shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => setReplyingTo(msg)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Reactions display */}
                      {Object.keys(messageReactions).length > 0 && (
                        <div className={`flex gap-1 mt-1 flex-wrap ${isOwnMessage(msg) ? "justify-end" : ""}`}>
                          {Object.entries(messageReactions).map(([emoji, userIds]) => (
                            <button
                              key={emoji}
                              className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 transition-colors ${userIds.includes(user?.id || "")
                                ? "bg-primary/20 border border-primary/30"
                                : "bg-muted hover:bg-muted/80"
                                }`}
                              onClick={() => addReactionMutation.mutate({ messageId: msg.id, emoji })}
                            >
                              <span>{emoji}</span>
                              <span className="text-muted-foreground">{userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Respondendo a</span>
              <span className="font-medium">{replyingTo.user_name}</span>
              <span className="text-muted-foreground line-clamp-1 max-w-[200px]">
                {replyingTo.content}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={replyingTo ? "Escreva sua resposta..." : "Digite sua mensagem..."}
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || sendMessageMutation.isPending || !user}
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
