import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Anthropic Claude API configuration
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

if (!ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not configured - AI Coach will return fallback responses');
}

// Simple in-memory quota tracking
const quotaMap = new Map<string, { count: number }>();
const DAILY_LIMIT = 50;

function getUserQuotaKey(userId: string | null): string {
    const now = Date.now();
    const hour = Math.floor(now / (24 * 60 * 60 * 1000));
    return `${userId || 'anonymous'}:${hour}`;
}

function checkQuota(userId: string | null) {
    const key = getUserQuotaKey(userId);
    const quota = quotaMap.get(key) || { count: 0 };
    const remaining = Math.max(0, DAILY_LIMIT - quota.count);
    return { allowed: remaining > 0, remaining, limit: DAILY_LIMIT };
}

function recordUsage(userId: string | null) {
    const key = getUserQuotaKey(userId);
    const quota = quotaMap.get(key) || { count: 0 };
    quota.count++;
    quotaMap.set(key, quota);
    return { remaining: Math.max(0, DAILY_LIMIT - quota.count), limit: DAILY_LIMIT };
}

// Simple JWT decode
function decodeJWT(token: string): { sub: string } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return { sub: payload.sub || null };
    } catch {
        return null;
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get user ID from JWT
        let userId: string | null = null;
        const authHeader = req.headers.get('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = decodeJWT(token);
            if (decoded?.sub) {
                userId = decoded.sub;
            }
        }

        const { tip, context } = await req.json();

        if (!tip) {
            return new Response(
                JSON.stringify({ error: 'tip is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Check quota
        const quota = checkQuota(userId);

        if (!quota.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'Quota exceeded',
                    quota: { remaining: 0, limit: DAILY_LIMIT }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
            );
        }

        // Record usage
        const newQuota = recordUsage(userId);

        // Generate advice based on tip content
        const tipLower = tip.toLowerCase();
        let advice = '';

        // Analyze tip and generate appropriate advice
        if (tipLower.includes('gastos superaram as receitas') || tipLower.includes('despesas')) {
            advice = `📊 **O que significa:** Os seus gastos são superiores às suas receitas, o que significa que está a gastar mais do que ganha. A longo prazo, isto leva a dívidas e dificuldades financeiras.

💡 **3 Ações concretas:**
1. **Corte 20% das despesas** - Reveja os seus gastos fixos e elimine os supérfluos (assinaturas, restaurantes, compras desnecessárias).
2. **Crie um orçamento** - Use a regra 50/30/20: 50% para necessidades, 30% para desejos, 20% para poupança.
3. **Aumente receitas** - Procure formas de rendimento extra: freelance, vender itens usados, ou investir numa formação que aumentE o seu salário.

💪 **Dica de motivação:** "Cada céntimo que não gasto hoje é um passo hacia a liberdade financeira amanhã. Comece pequeno e seja consistente!"`;
        } else if (tipLower.includes('poupança') || tipLower.includes('poupar')) {
            advice = `🏦 **O que significa:** A sua taxa de poupança está negativa ou muito baixa. Isto indica que não está a conseguir reservar dinheiro para o futuro.

💡 **3 Ações concretas:**
1. **Pague-se primeiro** - Assim que receber o salário, transfira imediatamente 20% para uma conta de poupança antes de gastar em qualquer coisa.
2. **Automatize** - Configure transferências automáticas mensais para a poupança no dia do salário.
3. **Comece com pouco** - Mesmo AOA 5.000 por mês fazem diferença a longo prazo com os juros compostos.

💪 **Dica de motivação:** "A poupança é um hábito, não uma quantidade. Comece com o que puder e aumente progressivamente!"`;
        } else if (tipLower.includes('maior gasto') || tipLower.includes('categoria')) {
            advice = `🏷️ **O que significa:** Identificámos que uma categoria de gastos está a consumir demasiado do seu orçamento.

💡 **3 Ações concretas:**
1. **Analise os gastos** - Reveja os últimos 3 meses dessa categoria e identifique padrões de consumo.
2. **Defina limites** - Estabeleça um teto mensal para essa categoria e use alertas de orçamento.
3. **Substitua por alternativas** - Encontre formas mais económicas de satisfazer essa necessidade.

💪 **Dica de motivação:** "O conhecimento é poder. Agora que sabe onde o seu dinheiro vai, pode tomar decisões melhores!"`;
        } else if (tipLower.includes('80%') || tipLower.includes('redesenhar')) {
            advice = `🔴 **O que significa:** Está a usar mais de 80% das suas receitas apenas para despesas. Isto deixa pouco ou nada para poupança e emergências.

💡 **3 Ações concretas:**
1. **Corte Urgente** - Reduza despesas não essenciais imediatamente: streaming,jantar fora, compras online.
2. **Renegocie contratos** - Contacte operadores de telemóvel, internet e seguros para renegociar preços.
3. **Faça uma semana sem gastos** - Challenge: 7 dias sem gastar dinheiro em nada além do essencial.

💪 **Dica de motivação:** "O caminho para a estabilidade financeira começa com um único passo de redução de gastos. Você consegue!"`;
        } else if (tipLower.includes('saúde financeira') || tipLower.includes('score')) {
            advice = `📈 **O que significa:** A sua saúde financeira está em risco. É hora de agir para recuperar o controlo das suas finanças.

💡 **3 Ações concretas:**
1. **Crie um fundo de emergência** - Comece com AOA 100.000 (3 meses de despesas básicas).
2. **Pague dívidas com juros altos** - Priorize cartões de crédito e empréstimos pessoais.
3. **Acompanhe tudo** - Use o AngolaFinance para registar cada transação e ver para onde vai o seu dinheiro.

💪 **Dica de motivação:** "A situação actual não define o seu futuro. Com as decisões certas hoje, pode construir a estabilidade que deseja!"`;
        } else if (tipLower.includes('renda') || tipLower.includes('aluguer')) {
            advice = `🏠 **O que significa:** Os custos de habitação estão a consumir uma parte significativa do seu orçamento.

💡 **3 Ações concretas:**
1. **Negocie o landlord** - Pergunte se aceita pagamento antecipado por desconto.
2. **Considere mudar** - Se está acima de 30% do rendimento, procure alternativas mais económicas.
3. **Inclui despesas fixas** - Conta de luz, água, internet devem ser incluidas no cálculo do custo real.

💪 **Dica de motivação:** "A casa certa não é a mais cara, é a que permite poupar para o futuro!"`;
        } else {
            // Default advice for general cases
            advice = `💡 **3 Ações concretas para melhorar:**
1. **Registe tudo** - Anote todos os seus gastos durante 30 dias para ter uma visão clara.
2. **Defina prioridades** - Identifique as 3 despesas mais importantes e elimine as outras.
3. **Estabeleça metas** - Defina objectivos de poupança mensais e acompanhe o progresso.

💪 **Dica de motivação:** "O sucesso financeiro não acontece da noite para o dia. É a soma de pequenas decisões correctas todos os dias. Continue!

⚠️ Nota: Para dicas mais personalizadas, considere configurar uma API de IA no sistema."`;
        }

        return new Response(
            JSON.stringify({
                advice,
                quota: newQuota
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
