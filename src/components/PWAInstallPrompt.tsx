import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user has dismissed before
            const dismissed = localStorage.getItem("pwa-install-dismissed");
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Show prompt on iOS immediately
        if (iOS) {
            const dismissed = localStorage.getItem("pwa-install-dismissed");
            if (!dismissed) {
                setShowPrompt(true);
            }
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", "true");
    };

    const showiOSInstructions = () => {
        alert("Para instalar no iPhone:\n\n1. Toque no botão Compartilhar (quadrado com seta)\n2. Role down e selecione \"Adicionar ao Ecrã Principal\"\n3. Toque em \"Adicionar\"");
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
            <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-4 shadow-lg text-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                            {isIOS ? "📱 Instalar no iPhone" : "📱 Instalar Angola Finance"}
                        </h3>
                        <p className="text-sm text-white/80 mb-3">
                            {isIOS
                                ? "Toque em 'Como Instalar' para ver o passo a passo"
                                : "Adicione à tela inicial para acesso rápido e offline"
                            }
                        </p>
                        <div className="flex gap-2">
                            {isIOS ? (
                                <Button
                                    onClick={showiOSInstructions}
                                    size="sm"
                                    className="bg-white text-primary hover:bg-white/90 font-semibold"
                                >
                                    <Smartphone className="w-4 h-4 mr-2" />
                                    Como Instalar
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleInstall}
                                    size="sm"
                                    className="bg-white text-primary hover:bg-white/90 font-semibold"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Instalar
                                </Button>
                            )}
                            <Button
                                onClick={handleDismiss}
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/20"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
