import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Shield, ShieldCheck, ShieldAlert, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

interface TwoFactorSetupProps {
    onStatusChange?: (isEnabled: boolean) => void;
}

export function TwoFactorSetup({ onStatusChange }: TwoFactorSetupProps) {
    const [step, setStep] = useState<"status" | "enroll" | "verify" | "backup">("status");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMFAEnabled, setIsMFAEnabled] = useState(false);

    useEffect(() => {
        checkMFASetup();
    }, []);

    const checkMFASetup = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase.rpc as any)('mfa_check');
            if (error) throw error;

            setIsMFAEnabled((data as any)?.enabled);
            onStatusChange?.((data as any)?.enabled);
        } catch (error: any) {
            console.error("Error checking MFA status:", error);
        } finally {
            setLoading(false);
        }
    };

    const onEnroll = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase.rpc as any)('mfa_setup');

            if (error) throw error;

            setQrCode((data as any)?.qrUri);
            setSecret((data as any)?.secret);
            setStep("verify");
        } catch (error: any) {
            toast.error("Erro ao iniciar configuração 2FA: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const onVerify = async () => {
        if (!secret) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase.rpc as any)('mfa_verify_and_enable', {
                p_code: otpCode,
                p_secret: secret
            });

            if (error) throw error;

            setBackupCodes((data as any)?.backupCodes);
            toast.success("Autenticação de dois factores activada!");
            setIsMFAEnabled(true);
            onStatusChange?.(true);
            setStep("backup");
        } catch (error: any) {
            toast.error("Código inválido ou erro na verificação: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const onUnenroll = async (confirmCode: string) => {
        setLoading(true);
        try {
            const { error } = await (supabase.rpc as any)('mfa_disable', {
                p_code: confirmCode
            });

            if (error) throw error;

            toast.success("Autenticação de dois factores desactivada.");
            setIsMFAEnabled(false);
            onStatusChange?.(false);
            setStep("status");
        } catch (error: any) {
            toast.error("Erro ao desactivar 2FA: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        if (secret) {
            navigator.clipboard.writeText(secret);
            toast.success("Código copiado!");
        }
    };

    if (loading && step === "status") {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (step === "status") {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isMFAEnabled ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                            {isMFAEnabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                        </div>
                        <div>
                            <p className="font-semibold">{isMFAEnabled ? "2FA Activado" : "2FA Desactivado"}</p>
                            <p className="text-sm text-muted-foreground">
                                {isMFAEnabled ? "A sua conta está protegida com uma camada extra." : "Adicione segurança extra à sua conta."}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isMFAEnabled ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" disabled={loading}>Desactivar</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Desactivar 2FA</DialogTitle>
                                        <DialogDescription>
                                            Por segurança, introduza um código válido da sua aplicação para desactivar o 2FA.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 flex justify-center">
                                        <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="destructive" onClick={() => onUnenroll(otpCode)} disabled={otpCode.length !== 6 || loading}>
                                            Confirmar Desactivação
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Button onClick={onEnroll} disabled={loading}>Configurar</Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (step === "enroll" || step === "verify") {
        return (
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Configurar Autenticação de 2 Factores
                    </CardTitle>
                    <CardDescription>
                        Siga os passos abaixo para proteger a sua conta usando uma aplicação de autenticação.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl inline-block mx-auto md:mx-0 shadow-sm border">
                                {qrCode && <QRCodeSVG value={qrCode} size={180} includeMargin={true} />}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground font-bold">Código Manual</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={secret || ""} className="font-mono text-xs bg-muted" />
                                    <Button variant="outline" size="icon" onClick={copySecret}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Passo 1: Digitalize o QR Code</h4>
                                <p className="text-sm text-muted-foreground">
                                    Abra a sua aplicação de 2FA (Google Authenticator, Microsoft Authenticator, etc) e digitalize o código à esquerda.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm">Passo 2: Introduza o código de verificação</h4>
                                <p className="text-sm text-muted-foreground">
                                    Introduza o código de 6 dígitos gerado pela sua aplicação para confirmar a configuração.
                                </p>
                                <div className="flex justify-center md:justify-start">
                                    <InputOTP
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={setOtpCode}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-3 justify-end border-t pt-6">
                    <Button variant="ghost" onClick={() => setStep("status")} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={onVerify}
                        disabled={otpCode.length !== 6 || loading}
                        className="gradient-primary text-primary-foreground min-w-[120px]"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                        Confirmar e Activar
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (step === "backup") {
        return (
            <Card className="border-success/20 bg-success/5">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-success">
                        <ShieldCheck className="h-5 w-5" />
                        Códigos de Recuperação
                    </CardTitle>
                    <CardDescription>
                        Guarde estes códigos num local seguro. Eles permitem aceder à conta se perder o telemóvel.
                        Cada código só pode ser usado uma vez.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2 bg-background p-4 rounded-xl border font-mono text-sm">
                        {backupCodes.map((code, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-muted-foreground">{i + 1}.</span>
                                <span>{code}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-6">
                    <Button variant="outline" onClick={() => {
                        const content = backupCodes.join('\n');
                        const blob = new Blob([content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'angola-finance-backup-codes.txt';
                        a.click();
                    }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Descarregar .txt
                    </Button>
                    <Button onClick={() => setStep("status")}>Concluído</Button>
                </CardFooter>
            </Card>
        );
    }

    return null;
}
