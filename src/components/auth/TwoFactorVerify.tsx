import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Loader2, ArrowRight, Lock } from "lucide-react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

interface TwoFactorVerifyProps {
    factorId: string;
    onVerify: () => void;
    onCancel: () => void;
}

export function TwoFactorVerify({ factorId, onVerify, onCancel }: TwoFactorVerifyProps) {
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase.rpc as any)('mfa_login_verify', {
                p_code: otpCode
            });

            if (error || !data?.success) throw error || new Error((data as any)?.error || "Erro desconhecido");

            toast.success("Autenticação concluída!");
            onVerify();
        } catch (error: any) {
            toast.error("Código inválido ou expirado: " + error.message);
            setOtpCode("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold font-display">Verificação em Duas Etapas</h2>
                <p className="text-muted-foreground">
                    Introduza o código de 6 dígitos da sua aplicação de autenticação.
                </p>
            </div>

            <div className="flex justify-center py-4">
                <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={loading}
                    autoFocus
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                </InputOTP>
            </div>

            <div className="space-y-3">
                <Button
                    className="w-full h-12 gradient-primary text-primary-foreground"
                    onClick={handleVerify}
                    disabled={otpCode.length !== 6 || loading}
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                        <>
                            Verificar Código
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    className="w-full h-12"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar e voltar
                </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-4">
                Não consegue aceder à sua aplicação? <br />
                Contacte o suporte técnico para recuperar o acesso.
            </p>
        </div>
    );
}
