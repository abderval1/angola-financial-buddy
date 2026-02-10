import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, LogOut, Mail } from "lucide-react";

export default function Blocked() {
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldAlert className="h-12 w-12 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-display font-bold text-foreground">Acesso Bloqueado</h1>
                    <p className="text-muted-foreground">
                        Sua conta foi suspensa temporariamente ou bloqueada por violar nossos termos de uso.
                    </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-border text-left space-y-3">
                    <p className="text-sm font-medium">O que você pode fazer:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Verifique seu email para notificações.</li>
                        <li>Entre em contato com nossa equipe de suporte.</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <a href="mailto:suporte@angolafinance.com" className="w-full">
                        <Button variant="default" className="w-full">
                            <Mail className="mr-2 h-4 w-4" />
                            Contactar Suporte
                        </Button>
                    </a>

                    <Button variant="outline" onClick={() => signOut()} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Terminar Sessão
                    </Button>
                </div>
            </div>
        </div>
    );
}
