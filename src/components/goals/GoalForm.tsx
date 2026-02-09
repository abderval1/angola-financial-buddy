
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Shield, Home, Car, GraduationCap, Plane, Target, AlertCircle } from "lucide-react";

interface GoalFormProps {
    onSubmit: (goal: any) => void;
    monthlyExpenses: number; // For smart suggestions
}

const GOAL_TYPES = [
    { value: "emergency_fund", label: "Fundo de Emergência", icon: Shield },
    { value: "house", label: "Casa Própria", icon: Home },
    { value: "car", label: "Veículo", icon: Car },
    { value: "education", label: "Educação", icon: GraduationCap },
    { value: "travel", label: "Viagem", icon: Plane },
    { value: "other", label: "Outro", icon: Target },
];

export function GoalForm({ onSubmit, monthlyExpenses }: GoalFormProps) {
    const [goalType, setGoalType] = useState("other");
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [deadline, setDeadline] = useState("");
    const [monthlyContribution, setMonthlyContribution] = useState("");
    const [riskProfile, setRiskProfile] = useState("medium");
    const [investmentType, setInvestmentType] = useState("poupanca");

    // Smart Presets
    useEffect(() => {
        if (goalType === "emergency_fund" && monthlyExpenses > 0) {
            setName("Fundo de Emergência");
            setTargetAmount((monthlyExpenses * 6).toString());
            setRiskProfile("low");
            setInvestmentType("deposito_prazo");
        } else if (goalType === "house") {
            setName("Entrada para Casa");
            setRiskProfile("low"); // Down payment should be safe
        } else if (goalType === "education") {
            setName("Fundo Universitário");
            setRiskProfile("medium");
        }
    }, [goalType, monthlyExpenses]);

    const handleSubmit = () => {
        onSubmit({
            name,
            type: goalType,
            target_amount: parseFloat(targetAmount),
            target_date: deadline,
            monthly_contribution: parseFloat(monthlyContribution),
            risk_profile: riskProfile,
            investment_type: investmentType
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
                {GOAL_TYPES.map((type) => (
                    <Button
                        key={type.value}
                        variant={goalType === type.value ? "default" : "outline"}
                        className="flex flex-col items-center h-20 gap-2"
                        onClick={() => setGoalType(type.value)}
                    >
                        <type.icon className="h-5 w-5" />
                        <span className="text-xs">{type.label}</span>
                    </Button>
                ))}
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Nome da Meta</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Minha Independência" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Valor Alvo (Kz)</Label>
                        <Input
                            type="number"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            placeholder="1.000.000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Data Limite</Label>
                        <Input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Aporte Mensal Planejado (Kz)</Label>
                    <Input
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        placeholder="50.000"
                    />
                    {targetAmount && deadline && (
                        <p className="text-xs text-muted-foreground">
                            * Valor sugerido para atingir a meta a tempo: Kz ... (cálculo simples)
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Perfil de Risco</Label>
                        <Select value={riskProfile} onValueChange={setRiskProfile}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Baixo (Conservador)</SelectItem>
                                <SelectItem value="medium">Médio (Moderado)</SelectItem>
                                <SelectItem value="high">Alto (Arrojado)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Onde Investir?</Label>
                        <Select value={investmentType} onValueChange={setInvestmentType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="poupanca">Poupança Simples</SelectItem>
                                <SelectItem value="deposito_prazo">Depósito a Prazo</SelectItem>
                                <SelectItem value="otnr">Obrigações (OTNR)</SelectItem>
                                <SelectItem value="acoes">Ações (BODIVA)</SelectItem>
                                <SelectItem value="imobiliario">Imóveis</SelectItem>
                                <SelectItem value="negocio">Negócio Próprio</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Contextual Tip */}
                {goalType === 'emergency_fund' && parseFloat(targetAmount) < monthlyExpenses * 3 && (
                    <div className="p-3 bg-amber-500/10 text-amber-600 rounded-md text-xs flex gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>O recomendado para um Fundo de Emergência em Angola é pelo menos 3 a 6 meses de suas despesas mensais.</p>
                    </div>
                )}

                <Button onClick={handleSubmit} className="w-full" size="lg">
                    Criar Meta Inteligente
                </Button>
            </div>
        </div>
    );
}
