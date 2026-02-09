import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Lightbulb, TrendingUp, BadgePercent, Shield } from "lucide-react";

interface EducationalContextProps {
    topic: "fire" | "inflation" | "real_return" | "otnr" | "emergency_fund";
}

const TOPICS = {
    fire: {
        title: "O que é FIRE?",
        content: "FIRE (Financial Independence, Retire Early) é um movimento que visa a independência financeira através de alta taxa de poupança e investimentos. Em Angola, o desafio é proteger o capital da inflação enquanto ele cresce.",
        icon: Lightbulb
    },
    inflation: {
        title: "O Vilão Invisível: Inflação",
        content: "Inflação é o aumento generalizado de preços. Se a inflação é 15% e seu dinheiro rende 10%, você está perdendo poder de compra (-5% real). Em Angola, busque sempre superar a inflação oficial.",
        icon: TrendingUp
    },
    real_return: {
        title: "Juro Nominal vs. Real",
        content: "Juro Nominal é o que o banco anuncia (ex: 18%). Juro Real é o que sobra depois de descontar a inflação. É o Juro Real que enriquece você de verdade. Sempre faça a conta: (1+Nominal)/(1+Inflação)-1.",
        icon: GraduationCap
    },
    otnr: {
        title: "Tesouro Direto (OTNR/BT)",
        content: "Obrigações do Tesouro (OTNR) são títulos da dívida pública e geralmente pagam as melhores taxas do mercado angolano, muitas vezes indexadas ao Dólar ou à Inflação, protegendo seu patrimônio.",
        icon: BadgePercent
    },
    emergency_fund: {
        title: "Fundo de Emergência",
        content: "Antes de investir, tenha de 6 a 12 meses de despesas pagas guardados em liquidez imediata (conta a prazo resgatável). Em economias instáveis, segurança vem antes de rentabilidade.",
        icon: Shield
    }
};



export function EducationalContext({ topic }: EducationalContextProps) {
    const data = TOPICS[topic];
    const Icon = data.icon;

    return (
        <Card className="bg-secondary/20 border-secondary/40 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
                <Icon className="h-4 w-4 text-secondary-foreground" />
                <CardTitle className="text-sm font-medium text-secondary-foreground">{data.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.content}
                </p>
            </CardContent>
        </Card>
    );
}
