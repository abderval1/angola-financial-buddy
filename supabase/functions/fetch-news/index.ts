import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  image_url?: string;
  published_at?: string;
}

// Angola API base URL
const ANGOLA_API_BASE = 'https://api.angolaapi.ao';

// Fetch exchange rates from Angola API
async function fetchExchangeRates(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${ANGOLA_API_BASE}/taxas/cambio`);
    if (!response.ok) return [];
    
    const data = await response.json();
    const rates = data.data || data;
    
    if (!rates || !Array.isArray(rates)) return [];
    
    // Create a news item summarizing exchange rates
    const usdRate = rates.find((r: any) => r.moeda === 'USD' || r.currency === 'USD');
    const eurRate = rates.find((r: any) => r.moeda === 'EUR' || r.currency === 'EUR');
    
    const summary = `Taxas de câmbio atualizadas: ${usdRate ? `USD: ${usdRate.venda || usdRate.sell} Kz` : ''} ${eurRate ? `| EUR: ${eurRate.venda || eurRate.sell} Kz` : ''}`;
    
    return [{
      title: 'Taxas de Câmbio do BNA Atualizadas',
      summary,
      source: 'BNA',
      category: 'economia',
      url: 'https://www.bna.ao',
      published_at: new Date().toISOString(),
    }];
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return [];
  }
}

// Fetch inflation rate from Angola API
async function fetchInflationRate(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${ANGOLA_API_BASE}/taxas/inflacao`);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return [{
      title: `Taxa de Inflação em Angola: ${data.taxa || data.rate || 'N/A'}%`,
      summary: `A taxa de inflação atual em Angola está em ${data.taxa || data.rate}%. Acompanhe as atualizações económicas do Banco Nacional de Angola.`,
      source: 'BNA',
      category: 'economia',
      url: 'https://www.bna.ao',
      published_at: new Date().toISOString(),
    }];
  } catch (error) {
    console.error('Error fetching inflation rate:', error);
    return [];
  }
}

// Fetch BNA interest rate
async function fetchBNAInterestRate(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${ANGOLA_API_BASE}/taxas/juro-bna`);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return [{
      title: `Taxa de Juro do BNA: ${data.taxa || data.rate || 'N/A'}%`,
      summary: `A taxa de juro de referência do Banco Nacional de Angola está em ${data.taxa || data.rate}%. Esta taxa influencia o custo do crédito em todo o sistema bancário.`,
      source: 'BNA',
      category: 'investimentos',
      url: 'https://www.bna.ao',
      published_at: new Date().toISOString(),
    }];
  } catch (error) {
    console.error('Error fetching BNA interest rate:', error);
    return [];
  }
}

// Fetch Luibor rates
async function fetchLuiborRates(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${ANGOLA_API_BASE}/taxas/luibor`);
    if (!response.ok) return [];
    
    const data = await response.json();
    const rates = data.data || data;
    
    if (!rates) return [];
    
    return [{
      title: 'Taxas Luibor Atualizadas',
      summary: `As taxas interbancárias de oferta de fundos do mercado de Luanda (LUIBOR) foram atualizadas. Estas taxas são referência para empréstimos entre bancos.`,
      source: 'BNA',
      category: 'investimentos',
      url: 'https://www.bna.ao',
      published_at: new Date().toISOString(),
    }];
  } catch (error) {
    console.error('Error fetching Luibor rates:', error);
    return [];
  }
}

// Generate financial tips as news
function generateFinancialTips(): NewsItem[] {
  const tips = [
    {
      title: 'Como Proteger o Seu Dinheiro da Inflação em Angola',
      summary: 'Descubra estratégias práticas para manter o poder de compra do seu dinheiro face à inflação. Investimentos em USD, depósitos a prazo e outras opções.',
      category: 'investimentos',
    },
    {
      title: 'Guia de Poupança para Angolanos: Comece com 10% do Salário',
      summary: 'A regra dos 10% é um excelente ponto de partida. Aprenda como automatizar a sua poupança e criar um fundo de emergência.',
      category: 'poupanca',
    },
    {
      title: 'Oportunidades de Renda Extra em Luanda',
      summary: 'Explore ideias de negócios e trabalhos freelance que podem aumentar a sua renda mensal. Do e-commerce ao marketing digital.',
      category: 'renda_extra',
    },
    {
      title: 'Entendendo os Títulos do Tesouro de Angola',
      summary: 'Os Obrigações do Tesouro são uma forma segura de investir. Saiba como funcionam, quais os prazos e rentabilidades esperadas.',
      category: 'bodiva',
    },
    {
      title: 'Dicas para Reduzir Gastos Mensais sem Perder Qualidade de Vida',
      summary: 'Pequenas mudanças no dia-a-dia podem resultar em grandes economias. Veja como otimizar o seu orçamento familiar.',
      category: 'economia',
    },
  ];

  return tips.map(tip => ({
    ...tip,
    source: 'Kuanza',
    url: '/education',
    published_at: new Date().toISOString(),
  }));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting news fetch...');

    // Fetch news from all sources in parallel
    const [exchangeRates, inflation, bnaRate, luibor] = await Promise.all([
      fetchExchangeRates(),
      fetchInflationRate(),
      fetchBNAInterestRate(),
      fetchLuiborRates(),
    ]);

    // Get financial tips
    const tips = generateFinancialTips();

    // Combine all news
    const allNews: NewsItem[] = [
      ...exchangeRates,
      ...inflation,
      ...bnaRate,
      ...luibor,
      ...tips,
    ];

    console.log(`Fetched ${allNews.length} news items`);

    // Insert news into database (upsert based on title to avoid duplicates)
    let insertedCount = 0;
    for (const news of allNews) {
      // Check if news with same title already exists today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existing } = await supabase
        .from('news')
        .select('id')
        .eq('title', news.title)
        .gte('created_at', today.toISOString())
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('news')
          .insert({
            title: news.title,
            summary: news.summary,
            source: news.source,
            category: news.category,
            url: news.url,
            image_url: news.image_url,
            published_at: news.published_at,
            is_approved: true, // Auto-approve API-fetched news
          });

        if (!error) {
          insertedCount++;
        } else {
          console.error('Error inserting news:', error);
        }
      }
    }

    console.log(`Inserted ${insertedCount} new articles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Fetched ${allNews.length} news items, inserted ${insertedCount} new articles`,
        total: allNews.length,
        inserted: insertedCount,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in fetch-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
