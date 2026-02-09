import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShoppingBag,
  Book,
  FileText,
  Wrench,
  Search,
  Star,
  Download,
  Eye,
  ShoppingCart,
  CheckCircle,
  Package,
  ExternalLink,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";

const PRODUCT_TYPES = [
  { value: "all", label: "Todos", icon: Package },
  { value: "ebook", label: "E-books", icon: Book },
  { value: "template", label: "Planilhas", icon: FileText },
  { value: "tool", label: "Ferramentas", icon: Wrench },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function Marketplace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Fetch products - only ebooks, templates, tools (no courses - those are in Education)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("is_published", true)
        .in("product_type", ["ebook", "template", "tool"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user purchases
  const { data: userPurchases = [] } = useQuery({
    queryKey: ["user-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_purchases")
        .select("product_id, status")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (product: any) => {
      const { error } = await supabase.from("marketplace_purchases").insert({
        user_id: user?.id,
        product_id: product.id,
        purchase_price: product.price,
        status: product.price > 0 ? "pending" : "completed",
      });

      if (error) throw error;

      // Increment download count
      await supabase
        .from("marketplace_products")
        .update({ download_count: (product.download_count || 0) + 1 })
        .eq("id", product.id);
    },
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ["user-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-products"] });
      toast.success(product.price > 0 ? "Solicitação enviada! Aguarde a aprovação." : "Produto adquirido com sucesso!");
      setSelectedProduct(null);
      // Open file if free
      if (product.price === 0 && product.file_url) {
        window.open(product.file_url, "_blank");
      }
    },
    onError: () => {
      toast.error("Erro ao adquirir produto");
    },
  });

  // Buy again mutation (resets status to pending)
  const buyAgainMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("marketplace_purchases")
        .update({ status: "pending" } as any)
        .eq("user_id", user?.id)
        .eq("product_id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-purchases"] });
      toast.success("Solicitação reenviada! Aguarde a aprovação.");
    },
    onError: () => {
      toast.error("Erro ao processar solicitação");
    },
  });

  const filteredProducts = products.filter((product: any) => {
    const matchesType = selectedType === "all" || product.product_type === selectedType;
    const matchesSearch =
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getPurchaseStatus = (productId: string) => {
    return userPurchases.find((p: any) => p.product_id === productId)?.status;
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "ebook":
        return Book;
      case "template":
        return FileText;
      case "tool":
        return Wrench;
      default:
        return Package;
    }
  };

  const getProductLabel = (type: string) => {
    const found = PRODUCT_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  const handleDownload = (product: any) => {
    if (product.file_url) {
      window.open(product.file_url, "_blank");
    }
  };

  const handleBuy = (product: any) => {
    if (product.price === 0) {
      // Free product - register and download
      purchaseMutation.mutate(product);
    } else {
      // Paid product - show details dialog
      setSelectedProduct(product);
    }
  };

  return (
    <AppLayout
      title="Marketplace"
      subtitle="Ebooks, planilhas e ferramentas para sua jornada financeira"
    >
      <div className="space-y-6">
        {/* Hero Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-primary/30 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <ShoppingBag className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Produtos Digitais</h2>
                    <p className="text-muted-foreground">
                      Ebooks, planilhas e ferramentas para acelerar seu crescimento financeiro
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status Widget */}
          <div>
            <SubscriptionStatus />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Produtos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Download className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userPurchases.length}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Comprados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Book className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {products.filter((p: any) => p.product_type === "ebook").length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">E-books</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {products.filter((p: any) => p.product_type === "template").length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Planilhas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
            {PRODUCT_TYPES.map((type) => (
              <TabsTrigger
                key={type.value}
                value={type.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <type.icon className="h-4 w-4 mr-2" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                  <p className="text-muted-foreground">
                    Novos produtos serão adicionados em breve!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: any) => {
                  const ProductIcon = getProductIcon(product.product_type);

                  return (
                    <Card
                      key={product.id}
                      className="overflow-hidden hover:shadow-lg transition-all group"
                    >
                      {/* Cover Image */}
                      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        {product.cover_image_url ? (
                          <img
                            src={product.cover_image_url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ProductIcon className="h-16 w-16 text-primary/50" />
                        )}
                        {product.is_featured && (
                          <Badge className="absolute top-3 left-3 badge-premium">
                            <Star className="h-3 w-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                        {product.price === 0 && (
                          <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
                            Grátis
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            <ProductIcon className="h-3 w-3 mr-1" />
                            {getProductLabel(product.product_type)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {product.view_count || 0}
                            <Download className="h-3 w-3 ml-2" />
                            {product.download_count || 0}
                          </div>
                        </div>

                        <div className="mb-2">
                          {(() => {
                            const status = getPurchaseStatus(product.id);
                            if (status === "pending") {
                              return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Aguardando Aprovação</Badge>;
                            }
                            if (status === "rejected") {
                              return <Badge variant="destructive">Compra Rejeitada</Badge>;
                            }
                            if (status === "completed") {
                              return <Badge className="bg-green-100 text-green-800 border-green-200">Adquirido</Badge>;
                            }
                            return null;
                          })()}
                        </div>

                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                          {product.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-primary">
                              {product.price === 0 ? "Grátis" : formatCurrency(product.price)}
                            </span>

                            {(() => {
                              const status = getPurchaseStatus(product.id);
                              if (status === "completed") {
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(product)}
                                    className="border-success text-success hover:bg-success/10"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Baixar
                                  </Button>
                                );
                              }
                              if (status === "pending") {
                                return (
                                  <Button size="sm" variant="outline" disabled className="bg-muted text-muted-foreground">
                                    Pendente
                                  </Button>
                                );
                              }
                              if (status === "rejected") {
                                return (
                                  <Button
                                    size="sm"
                                    className="gradient-primary"
                                    onClick={() => buyAgainMutation.mutate(product.id)}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Comprar Novamente
                                  </Button>
                                );
                              }
                              return (
                                <Button
                                  size="sm"
                                  className="gradient-primary"
                                  onClick={() => handleBuy(product)}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-1" />
                                  {product.price === 0 ? "Obter" : "Comprar"}
                                </Button>
                              );
                            })()}
                          </div>

                          {getPurchaseStatus(product.id) === "rejected" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs text-muted-foreground hover:text-primary"
                              asChild
                            >
                              <a href="mailto:rosarioabderval@gmail.com">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Entrar em contacto com o suporte
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Purchase Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adquirir Produto</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-4">
                  {selectedProduct.cover_image_url ? (
                    <img
                      src={selectedProduct.cover_image_url}
                      alt={selectedProduct.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-primary/10 rounded-lg flex items-center justify-center">
                      {(() => {
                        const Icon = getProductIcon(selectedProduct.product_type);
                        return <Icon className="h-10 w-10 text-primary" />;
                      })()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedProduct.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedProduct.description}
                    </p>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {formatCurrency(selectedProduct.price)}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Como comprar:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      Faça a transferência para a conta indicada
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      Envie o comprovativo pelo WhatsApp
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      Receba o acesso em até 24h
                    </li>
                  </ol>
                </div>

                <Card className="border-primary/30">
                  <CardContent className="p-4">
                    <p className="font-medium">Dados para transferência:</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Banco:</span> BAI
                      </p>
                      <p>
                        <span className="text-muted-foreground">IBAN:</span>{" "}
                        AO06.0040.0000.0000.0000.0000.0
                      </p>
                      <p>
                        <span className="text-muted-foreground">Titular:</span> Angola Finance
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                Cancelar
              </Button>
              <Button className="gradient-primary">
                <ExternalLink className="h-4 w-4 mr-2" />
                Enviar Comprovativo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
