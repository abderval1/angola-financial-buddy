import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShoppingBag,
  Book,
  GraduationCap,
  FileText,
  Wrench,
  Search,
  Star,
  Download,
  Eye,
  ShoppingCart,
  CheckCircle,
  Package,
} from "lucide-react";

const PRODUCT_TYPES = [
  { value: "all", label: "Todos", icon: Package },
  { value: "ebook", label: "E-books", icon: Book },
  { value: "course", label: "Cursos", icon: GraduationCap },
  { value: "template", label: "Templates", icon: FileText },
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

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user purchases
  const { data: purchases = [] } = useQuery({
    queryKey: ["user-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_purchases")
        .select("product_id")
        .eq("user_id", user?.id);
      
      if (error) throw error;
      return data?.map(p => p.product_id) || [];
    },
    enabled: !!user?.id,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (product: any) => {
      // For free products, just register the purchase
      const { error } = await supabase.from("marketplace_purchases").insert({
        user_id: user?.id,
        product_id: product.id,
        purchase_price: product.price,
      });
      
      if (error) throw error;

      // Increment download count
      await supabase
        .from("marketplace_products")
        .update({ download_count: (product.download_count || 0) + 1 })
        .eq("id", product.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-products"] });
      toast.success("Produto adquirido com sucesso!");
      setSelectedProduct(null);
    },
    onError: () => {
      toast.error("Erro ao adquirir produto");
    },
  });

  const filteredProducts = products.filter((product: any) => {
    const matchesType = selectedType === "all" || product.product_type === selectedType;
    const matchesSearch = 
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const isPurchased = (productId: string) => purchases.includes(productId);

  const getProductIcon = (type: string) => {
    switch (type) {
      case "ebook": return Book;
      case "course": return GraduationCap;
      case "template": return FileText;
      case "tool": return Wrench;
      default: return Package;
    }
  };

  const getProductLabel = (type: string) => {
    const found = PRODUCT_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  return (
    <AppLayout title="Marketplace" subtitle="Ebooks, cursos e ferramentas para sua jornada financeira">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Produtos Disponíveis</p>
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
                  <p className="text-2xl font-bold">{purchases.length}</p>
                  <p className="text-sm text-muted-foreground">Suas Aquisições</p>
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
                  <p className="text-sm text-muted-foreground">E-books</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {products.filter((p: any) => p.product_type === "course").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Cursos</p>
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
                  const owned = isPurchased(product.id);

                  return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all group">
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
                        {owned && (
                          <Badge className="absolute top-3 right-3 bg-success/90 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Adquirido
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {getProductLabel(product.product_type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {product.view_count || 0}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {product.download_count || 0}
                          </span>
                        </div>

                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                          {product.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div>
                            {product.price > 0 ? (
                              <p className="text-xl font-bold text-primary">
                                {formatCurrency(product.price)}
                              </p>
                            ) : (
                              <Badge className="bg-success/10 text-success">Gratuito</Badge>
                            )}
                          </div>

                          {owned ? (
                            <Button size="sm" variant="outline" asChild>
                              <a href={product.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </a>
                            </Button>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="gradient-primary"
                                  onClick={() => setSelectedProduct(product)}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  {product.price > 0 ? "Comprar" : "Obter"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmar Aquisição</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <ProductIcon className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold">{product.title}</h3>
                                      <p className="text-sm text-muted-foreground">{product.description}</p>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-muted rounded-lg">
                                    <div className="flex justify-between items-center">
                                      <span>Preço</span>
                                      <span className="text-xl font-bold text-primary">
                                        {product.price > 0 ? formatCurrency(product.price) : "Gratuito"}
                                      </span>
                                    </div>
                                  </div>

                                  <Button 
                                    className="w-full gradient-primary"
                                    onClick={() => purchaseMutation.mutate(product)}
                                    disabled={purchaseMutation.isPending}
                                  >
                                    {purchaseMutation.isPending ? (
                                      "Processando..."
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Confirmar Aquisição
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
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
      </div>
    </AppLayout>
  );
}
