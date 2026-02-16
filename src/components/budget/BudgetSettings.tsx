
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface BudgetConfig {
    savings_goal_pct: number;
    needs_limit_pct: number;
    wants_limit_pct: number;
}

interface BudgetSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
    currentConfig?: BudgetConfig;
}

export function BudgetSettings({ open, onOpenChange, onUpdate, currentConfig }: BudgetSettingsProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<BudgetConfig>({
        savings_goal_pct: 20,
        needs_limit_pct: 50,
        wants_limit_pct: 30
    });

    useEffect(() => {
        if (currentConfig) {
            setConfig(currentConfig);
        }
    }, [currentConfig]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Enforce 100% total? Maybe not strictly necessary to block, but good to warn.
            // For now, flexible.

            const { error } = await supabase
                .from('financial_profiles')
                .update({
                    budget_config: config as any // Cast to any because generic JSONB
                })
                .eq('user_id', user?.id);

            if (error) throw error;

            toast.success(t("Configurações salvas!", { defaultValue: "Configurações salvas!" }));
            onUpdate();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(t("Erro ao salvar", { defaultValue: "Erro ao salvar" }) + ": " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("Configurações de Orçamento")}</DialogTitle>
                    <DialogDescription>
                        {t("Defina suas metas e limites pessoais.", { defaultValue: "Defina suas metas e limites pessoais." })}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="savings" className="text-right col-span-2">
                            {t("Meta de Poupança (%)", { defaultValue: "Meta de Poupança (%)" })}
                        </Label>
                        <Input
                            id="savings"
                            type="number"
                            value={config.savings_goal_pct}
                            onChange={(e) => setConfig({ ...config, savings_goal_pct: Number(e.target.value) })}
                            className="col-span-2"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="needs" className="text-right col-span-2">
                            {t("Limite de Necessidades (%)", { defaultValue: "Limite de Necessidades (%)" })}
                        </Label>
                        <Input
                            id="needs"
                            type="number"
                            value={config.needs_limit_pct}
                            onChange={(e) => setConfig({ ...config, needs_limit_pct: Number(e.target.value) })}
                            className="col-span-2"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="wants" className="text-right col-span-2">
                            {t("Limite de Desejos (%)", { defaultValue: "Limite de Desejos (%)" })}
                        </Label>
                        <Input
                            id="wants"
                            type="number"
                            value={config.wants_limit_pct}
                            onChange={(e) => setConfig({ ...config, wants_limit_pct: Number(e.target.value) })}
                            className="col-span-2"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {t("Save changes")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
