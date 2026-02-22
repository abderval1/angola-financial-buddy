import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  Clock,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Coins
} from "lucide-react";

// Full interface for Livro de Ordens data from database
interface BodivaMarketData {
  id?: string;
  data_date: string;
  symbol: string;
  title_type?: string;
  price?: number;
  variation?: number;
  num_trades?: number;
  quantity?: number;
  amount?: number;
  // Extended fields that may come from Excel upload
  isin?: string;
  tipologia?: string;
  taxa_cupao?: number;
  data_emissao?: string;
  data_vencimento?: number;
  vnua?: number;
  // Buy side (Compra)
  compra_preco?: number;
  compra_quantidade?: number;
  compra_yield?: number;
  // Sell side (Venda)
  venda_preco?: number;
  venda_quantidade?: number;
  venda_yield?: number;
}

interface InvestmentProductsProps {
  onSelectProduct: (productId: string) => void;
  savingsBalance?: number;
  monthlyExpenses?: number;
  budgetBalance?: number;
  investmentsTotal?: number;
}

export function InvestmentProducts({ onSelectProduct, savingsBalance = 0, monthlyExpenses = 0, budgetBalance = 0, investmentsTotal = 0 }: InvestmentProductsProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [marketData, setMarketData] = useState<BodivaMarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<BodivaMarketData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Fetch data directly from bodiva_market_data table
  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bodiva_market_data')
        .select('*')
        .order('data_date', { ascending: false })
        .order('symbol', { ascending: true });

      if (error) throw error;
      setMarketData(data || []);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setMarketData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  // Convert marketData to display products
  const allProducts = useMemo(() => {
    return marketData.map((item, index) => {
      const isBond = item.title_type?.toLowerCase().includes('obrigação') ||
        item.title_type?.toLowerCase().includes('ot-') ||
        item.title_type?.toLowerCase().includes('bt-') ||
        item.title_type?.toLowerCase().includes('titulo') ||
        item.symbol?.startsWith('OI') ||
        item.symbol?.startsWith('OJ') ||
        item.symbol?.startsWith('OK');

      const price = item.price || 0;
      const compraPrice = item.compra_preco || item.price || 0;
      const variation = item.variation || (price && compraPrice ? ((price - compraPrice) / compraPrice * 100) : undefined);

      return {
        id: `lo-${item.symbol}-${index}`,
        item,
        symbol: item.symbol,
        tipo: item.title_type || item.tipologia || 'Ação',
        isin: item.isin || '-',
        taxaCupao: item.taxa_cupao,
        dataVencimento: item.data_vencimento?.toString(),
        vnua: item.vnua,
        // Ultima Cotação
        ultimoPreco: item.price,
        ultimoQuantidade: item.quantity,
        ultimoYield: undefined,
        // Compra
        compraPreco: item.compra_preco || item.price,
        compraQuantidade: item.compra_quantidade,
        compraYield: item.compra_yield,
        // Venda
        vendaPreco: item.venda_preco,
        vendaQuantidade: item.venda_quantidade,
        vendaYield: item.venda_yield,
        // Calculated
        variation,
        icon: isBond ? <TrendingUp className="h-4 w-4 rotate-0" /> : <TrendingUp className="h-4 w-4" />,
        risk: isBond ? 'low' : 'high' as const,
      };
    });
  }, [marketData]);

  // Pagination
  const totalPages = Math.ceil(allProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = allProducts.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  // Handle product click - show detail dialog
  const handleProductClick = (product: typeof allProducts[0]) => {
    setSelectedProduct(product.item);
    setIsDetailOpen(true);
  };

  // Generate Prof (AI) recommendations based on product data
  const generateProfRecommendations = (product: BodivaMarketData): string[] => {
    const recommendations: string[] = [];
    const tipo = product.title_type || '';

    if (tipo.toLowerCase().includes('ação') || tipo.toLowerCase().includes('acção') || !tipo) {
      // Stock recommendations
      if (product.variation && product.variation > 5) {
        recommendations.push(`✨ A ação ${product.symbol} teve uma valorização de ${product.variation.toFixed(2)}% - considere recolher lucros.`);
      } else if (product.variation && product.variation < -5) {
        recommendations.push(`📉 A ação ${product.symbol} caiu ${Math.abs(product.variation).toFixed(2)}% - pode ser uma oportunidade de compra.`);
      }

      if (product.price && product.compra_preco) {
        const spread = ((product.price - product.compra_preco) / product.compra_preco * 100);
        recommendations.push(`📊 O spread compra/venda é de ${spread.toFixed(2)}% - ${spread < 2 ? 'excelente liquidez' : 'liquidez moderada'}.`);
      }

      if (product.num_trades) {
        recommendations.push(`📈 ${product.num_trades} transações hoje - ${product.num_trades > 100 ? 'muito ativa' : 'atividade moderada'}.`);
      }

      recommendations.push(`💡 Para ações, diversifique em pelo menos 5 empresas diferentes.`);
      recommendations.push(`📅 Investir a longo prazo (5+ anos) ajuda a mitigar a volatilidade.`);
    } else {
      // Bond recommendations
      if (product.taxa_cupao && product.taxa_cupao > 15) {
        recommendations.push(`🎯 Taxa de cupão de ${product.taxa_cupao}% é excelente para títulos de rendimento fixo!`);
      } else if (product.taxa_cupao) {
        recommendations.push(`📈 Taxa de cupão de ${product.taxa_cupao}% está acima da média do mercado.`);
      }

      if (product.data_vencimento) {
        recommendations.push(`📅 Este título vence em ${product.data_vencimento} - planeie o seu investimento.`);
      }

      if (product.amount) {
        recommendations.push(`💰 Volume de negociação: ${formatPrice(product.amount)} - ${product.amount > 100000000 ? 'alta liquidez' : 'liquidez moderada'}.`);
      }

      recommendations.push(`🛡️ Obrigações são mais seguras que ações, ideal para preservação de capital.`);
      recommendations.push(`💰 Considere uma carteira 60/40: 60% obrigações, 40% ações.`);
    }

    return recommendations;
  };

  // Get risk badge color
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{t("Baixo Risco")}</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">{t("Risco Médio")}</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">{t("Alto Risco")}</Badge>;
      default:
        return null;
    }
  };

  // Simple product card for grid display
  const ProductCard = ({ product }: { product: typeof allProducts[0] }) => (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer group border-border/50 hover:border-primary/30 bg-card"
      onClick={() => handleProductClick(product)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {product.icon}
            </div>
            <div>
              <h4 className="font-bold text-sm">{product.symbol}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">{product.tipo}</p>
            </div>
          </div>
          {getRiskBadge(product.risk)}
        </div>

        {/* Show key data points */}
        <div className="space-y-1 text-xs">
          {product.taxaCupao && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cupão:</span>
              <span className="font-semibold text-primary">{product.taxaCupao.toFixed(2)}%</span>
            </div>
          )}
          {product.ultimoPreco && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço:</span>
              <span className="font-semibold">{formatPrice(product.ultimoPreco)}</span>
            </div>
          )}
          {product.variation !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Var:</span>
              <span className={`font-semibold ${product.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(product.variation >= 0 ? '+' : '') + product.variation.toFixed(2)}%
              </span>
            </div>
          )}
          {product.compraPreco && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compra:</span>
              <span className="font-semibold">{formatPrice(product.compraPreco)}</span>
            </div>
          )}
          {product.vendaPreco && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Venda:</span>
              <span className="font-semibold">{formatPrice(product.vendaPreco)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("Livro de Ordens - Produtos de Investimento")}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchMarketData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <span className="text-sm text-muted-foreground">
            {allProducts.length} {t("itens")}
          </span>
        </div>
      </div>

      {/* Products Grid - 10 columns */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p>{t("A carregar dados do mercado...")}</p>
        </div>
      ) : allProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("Sem dados do Livro de Ordens disponíveis")}</p>
          <p className="text-sm">{t("Importe os dados no Admin para ver os produtos")}</p>
        </div>
      )}

      {/* Detail Dialog with Prof Recommendations */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProduct?.title_type?.toLowerCase().includes('ação') ? <TrendingUp className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
              {selectedProduct?.symbol} - {selectedProduct?.title_type || 'Ação'}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos do título e recomendações do Prof
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Código de Negociação</p>
                  <p className="font-semibold">{selectedProduct.symbol}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ISIN</p>
                  <p className="font-semibold">{selectedProduct.isin || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipologia</p>
                  <p className="font-semibold">{selectedProduct.title_type || selectedProduct.tipologia || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">VNUA / Dividendos</p>
                  <p className="font-semibold">{selectedProduct.vnua ? formatPrice(selectedProduct.vnua) : '-'}</p>
                </div>
              </div>

              {/* Taxa de Cupão */}
              {selectedProduct.taxa_cupao && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">Taxa de Cupão</p>
                  <p className="text-2xl font-bold text-primary">{selectedProduct.taxa_cupao.toFixed(2)}%</p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {selectedProduct.data_emissao && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Data de Emissão</p>
                    <p className="font-medium">{selectedProduct.data_emissao}</p>
                  </div>
                )}
                {selectedProduct.data_vencimento && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Data de Vencimento</p>
                    <p className="font-medium">{selectedProduct.data_vencimento}</p>
                  </div>
                )}
              </div>

              {/* Última Cotação */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Última Cotação
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Preço</p>
                    <p className="font-semibold">{selectedProduct.price ? formatPrice(selectedProduct.price) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantidade</p>
                    <p className="font-semibold">{selectedProduct.quantity?.toLocaleString('pt-AO') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Variação</p>
                    <p className={`font-semibold ${(selectedProduct.variation || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedProduct.variation ? `${selectedProduct.variation >= 0 ? '+' : ''}${selectedProduct.variation.toFixed(2)}%` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compra */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Compra (Melhor Oferta)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Preço</p>
                    <p className="font-semibold">{selectedProduct.compra_preco ? formatPrice(selectedProduct.compra_preco) : (selectedProduct.price ? formatPrice(selectedProduct.price) : '-')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantidade</p>
                    <p className="font-semibold">{selectedProduct.compra_quantidade?.toLocaleString('pt-AO') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Yield</p>
                    <p className="font-semibold">{selectedProduct.compra_yield ? `${selectedProduct.compra_yield.toFixed(2)}%` : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Venda */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Venda (Melhor Oferta)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Preço</p>
                    <p className="font-semibold">{selectedProduct.venda_preco ? formatPrice(selectedProduct.venda_preco) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantidade</p>
                    <p className="font-semibold">{selectedProduct.venda_quantidade?.toLocaleString('pt-AO') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Yield</p>
                    <p className="font-semibold">{selectedProduct.venda_yield ? `${selectedProduct.venda_yield.toFixed(2)}%` : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Nº de Transações</p>
                  <p className="font-semibold">{selectedProduct.num_trades?.toLocaleString('pt-AO') || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volume Total</p>
                  <p className="font-semibold">{selectedProduct.amount ? formatPrice(selectedProduct.amount) : '-'}</p>
                </div>
              </div>

              {/* Prof Recommendations */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Recomendações do Prof
                </h4>
                <ul className="space-y-2">
                  {generateProfRecommendations(selectedProduct).map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add Investment Button */}
              <Button
                className="w-full"
                onClick={() => {
                  setIsDetailOpen(false);
                  onSelectProduct(selectedProduct.symbol);
                }}
              >
                <Coins className="h-4 w-4 mr-2" />
                {t("Registar Este Investimento")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
