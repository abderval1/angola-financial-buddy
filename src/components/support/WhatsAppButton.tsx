import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function WhatsAppButton() {
    const phoneNumber = "244953130299";
    const message = "Olá! Preciso de ajuda com o Angola Finance.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fixed bottom-24 right-4 z-40 group"
                    >
                        <div className="relative">
                            {/* Hidden by default, peeks out on hover */}
                            <div className="translate-x-[calc(100%-12px)] group-hover:translate-x-0 transition-transform duration-300 ease-out">
                                <Button
                                    size="icon"
                                    className="h-12 w-12 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-lg border-2 border-white/20"
                                >
                                    <MessageCircle className="h-6 w-6 text-white fill-white" />
                                    <span className="sr-only">Falar com Suporte no WhatsApp</span>
                                </Button>
                                {/* Pulsing effect ring - always visible */}
                                <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />
                            </div>
                        </div>
                    </a>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-[#25D366] text-white border-none mb-2">
                    <p className="font-semibold">Precisa de ajuda? Fale connosco!</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
