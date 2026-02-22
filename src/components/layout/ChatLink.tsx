import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function ChatLink() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Get the latest message timestamp for the user to show indicator
    const { data: lastMessage } = useQuery({
        queryKey: ["chat-last-message"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("chat_messages")
                .select("created_at, user_id")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        refetchInterval: 30000, // Check every 30 seconds
    });

    // Check if user has seen the latest message
    const { data: lastRead } = useQuery({
        queryKey: ["chat-last-read", user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from("user_settings")
                .select("last_chat_read_at")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== 'PGRST116') return null;
            return data?.last_chat_read_at;
        },
        enabled: !!user,
    });

    // Determine if there's a new message (show badge if last message is newer than last read)
    const hasNewMessages = lastMessage &&
        user &&
        lastMessage.user_id !== user.id &&
        (!lastRead || new Date(lastMessage.created_at) > new Date(lastRead));

    const handleClick = () => {
        navigate("/community?tab=chat");
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 sm:h-10 sm:w-10"
            onClick={handleClick}
            title="Chat da Comunidade"
        >
            <MessageCircle className="h-5 w-5 text-muted-foreground lg:text-foreground" />
            {hasNewMessages && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground z-50 border-2 border-background">
                </span>
            )}
        </Button>
    );
}
