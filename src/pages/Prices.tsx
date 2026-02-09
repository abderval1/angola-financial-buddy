import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import {
  TrendingDown,
  TrendingUp,
  MapPin,
  Store,
  Plus,
  Search,
  Star,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  ArrowDownIcon,
  ArrowUpIcon,
  Sparkles,
  Filter,
  Calendar,
  Check,
  Minus,
  Tag,
  Bell,
  BellOff,
  Heart,
  HeartOff,
  ChevronsUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const CATEGORIES = [
  { value: "all", label: "Todas", icon: Package },
  { value: "Alimentação", label: "Alimentação", icon: ShoppingCart },
  { value: "Bebidas", label: "Bebidas", icon: ShoppingCart },
  { value: "Higiene", label: "Higiene", icon: ShoppingCart },
  { value: "Transporte", label: "Transporte", icon: ShoppingCart },
  { value: "Saúde", label: "Saúde", icon: ShoppingCart },
  { value: "Telecomunicações", label: "Telecom", icon: ShoppingCart },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface PriceEntry {
  id: string;
  user_id: string;
  product_name: string;
  store_name: string;
  price: number;
  quantity: number;
  unit: string;
  is_essential: boolean;
  purchase_date: string;
  created_at: string;
  notes?: string;
}

interface Store {
  id: string;
  name: string;
  location: string;
  city: string;
  store_type: string;
  is_verified: boolean;
}

interface PriceProduct {
  id: string;
  name: string;
  category: string;
  is_essential: boolean;
  unit: string;
}

interface ProductFollow {
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string | null;
  lowest_price_seen: number | null;
  created_at: string;
  is_essential: boolean;
  unit: string;
}

export default function Prices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEssentialOnly, setShowEssentialOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("compare");

  // Form state
  const [newEntry, setNewEntry] = useState({
    product_name: "",
    store_name: "",
    category: "Alimentação",
    brand: "",
    price: "",
    quantity: "1",
    unit: "unidade",
    is_essential: true,
    notes: "",
    purchase_date: new Date().toISOString().split("T")[0],
  });

  // Fetch price entries
  const { data: priceEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["price-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as PriceEntry[];
    },
  });

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Store[];
    },
  });

  // Fetch products catalog
  const { data: productsCatalog = [] } = useQuery({
    queryKey: ["price-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_products")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as PriceProduct[];
    },
  });

  // Fetch user's product follows
  const { data: productFollows = [] } = useQuery({
    queryKey: ["product-follows", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_product_follows")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data as ProductFollow[];
    },
    enabled: !!user?.id,
  });

  // Fetch user's own entries
  const { data: myEntries = [] } = useQuery({
    queryKey: ["my-price-entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_entries")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PriceEntry[];
    },
    enabled: !!user?.id,
  });

  // Add entry mutation
  const addEntryMutation = useMutation({
    mutationFn: async (entry: typeof newEntry) => {
      // 1. Ensure Product exists or create it
      let productId = productsCatalog.find(p => p.name.toLowerCase() === entry.product_name.toLowerCase())?.id;

      if (!productId) {
        const { data: newProd, error: prodErr } = await supabase
          .from("price_products")
          .insert({
            name: entry.product_name,
            category: entry.category,
            is_essential: entry.is_essential,
            unit: entry.unit
          })
          .select()
          .single();

        if (prodErr) throw prodErr;
        productId = newProd.id;
      }

      // 2. Ensure Store exists or create it
      let storeId = stores.find(s => s.name.toLowerCase() === entry.store_name.toLowerCase())?.id;

      if (!storeId) {
        const { data: newStore, error: storeErr } = await supabase
          .from("stores")
          .insert({
            name: entry.store_name,
            created_by: user?.id
          })
          .select()
          .single();

        if (storeErr) throw storeErr;
        storeId = newStore.id;
      }

      // 3. Insert the entry
      const brandNote = entry.brand ? `[MARCA: ${entry.brand}] ` : "";
      const { error } = await supabase.from("price_entries").insert({
        user_id: user?.id,
        product_id: productId,
        product_name: entry.product_name,
        store_id: storeId,
        store_name: entry.store_name,
        price: parseFloat(entry.price),
        quantity: parseFloat(entry.quantity),
        unit: entry.unit,
        is_essential: entry.is_essential,
        notes: brandNote + (entry.notes || ""),
        purchase_date: entry.purchase_date,
      });

      if (error) throw error;

      // 4. Trigger Notifications for followers
      const newPrice = parseFloat(entry.price);
      const { data: followers } = await supabase
        .from("user_product_follows")
        .select("*")
        .or(`product_id.eq.${productId},product_name.ilike.${entry.product_name}`);

      if (followers && followers.length > 0) {
        for (const follower of followers) {
          // Don't notify the person who just registered the price
          if (follower.user_id === user?.id) continue;

          if (!follower.lowest_price_seen || newPrice < follower.lowest_price_seen) {
            // Create notification
            await supabase.from("notifications").insert({
              user_id: follower.user_id,
              title: "Preço Baixou! 📉",
              message: `O produto ${entry.product_name} agora custa ${formatCurrency(newPrice)} no ${entry.store_name}. Aproveite para poupar!`,
              type: "price_drop",
              action_url: "/prices",
              metadata: {
                product_id: productId,
                price: newPrice,
                store_name: entry.store_name
              }
            });

            // Update lowest price seen for the follower
            await supabase
              .from("user_product_follows")
              .update({ lowest_price_seen: newPrice })
              .eq("id", follower.id);
          }
        }
      }

      return {
        price: newPrice,
        productName: entry.product_name,
        storeName: entry.store_name
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["price-entries"] });
      queryClient.invalidateQueries({ queryKey: ["my-price-entries"] });
      queryClient.invalidateQueries({ queryKey: ["price-products"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });

      toast.success("Preço registrado com sucesso!");
      setShowAddDialog(false);

      // Intelligent Coach Feedback
      const productStats = pricesByProduct[data.productName.toLowerCase().trim()];
      if (productStats) {
        if (data.price <= productStats.minPrice) {
          toast("Bravo! 🏆 Registraste o preço mais baixo até agora para este produto.");
        } else {
          const savingsPossible = data.price - productStats.minPrice;
          toast.info(`Dica do Coach: Já vimos este produto por ${formatCurrency(productStats.minPrice)} no ${productStats.bestStore}. Estás a pagar ${formatCurrency(savingsPossible)} a mais.`);
        }
      }

      setNewEntry({
        product_name: "",
        store_name: "",
        category: "Alimentação",
        brand: "",
        price: "",
        quantity: "1",
        unit: "unidade",
        is_essential: true,
        notes: "",
        purchase_date: new Date().toISOString().split("T")[0],
      });
    },
    onError: () => {
      toast.error("Erro ao registrar preço");
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("price_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-entries"] });
      queryClient.invalidateQueries({ queryKey: ["my-price-entries"] });
      toast.success("Entrada removida");
    },
  });

  // Follow product mutation
  const followProductMutation = useMutation({
    mutationFn: async ({ productId, productName, currentPrice }: { productId?: string; productName: string; currentPrice?: number }) => {
      const { error } = await supabase.from("user_product_follows").insert({
        user_id: user?.id,
        product_id: productId || null,
        product_name: productId ? null : productName,
        lowest_price_seen: currentPrice || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-follows"] });
      toast.success("Produto seguido! Você será notificado quando o preço baixar.");
    },
    onError: () => {
      toast.error("Erro ao seguir produto");
    },
  });

  // Unfollow product mutation
  const unfollowProductMutation = useMutation({
    mutationFn: async ({ productId, productName }: { productId?: string; productName?: string }) => {
      let query = supabase.from("user_product_follows").delete().eq("user_id", user?.id);

      if (productId) {
        query = query.eq("product_id", productId);
      } else if (productName) {
        query = query.eq("product_name", productName);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-follows"] });
      toast.success("Deixou de seguir o produto");
    },
  });

  // Helper to check if product is followed
  const isProductFollowed = (productName: string, productId?: string) => {
    return productFollows.some(
      (f) => f.product_id === productId || f.product_name?.toLowerCase() === productName.toLowerCase()
    );
  };

  // Get follow data for a product
  const getProductFollow = (productName: string, productId?: string) => {
    return productFollows.find(
      (f) => f.product_id === productId || f.product_name?.toLowerCase() === productName.toLowerCase()
    );
  };

  // Group prices by product and find best prices
  const pricesByProduct = priceEntries.reduce((acc, entry) => {
    const key = entry.product_name.toLowerCase().trim();
    if (!acc[key]) {
      acc[key] = {
        product_name: entry.product_name,
        entries: [],
        minPrice: Infinity,
        maxPrice: 0,
        avgPrice: 0,
        bestStore: "",
        is_essential: entry.is_essential,
      };
    }
    acc[key].entries.push(entry);

    // Capture category from entry if available or from catalog
    if (!acc[key].category) {
      const catalogProd = productsCatalog.find(p => p.name.toLowerCase() === key);
      acc[key].category = catalogProd?.category || "Geral";
    }

    if (entry.price < acc[key].minPrice) {
      acc[key].minPrice = entry.price;
      acc[key].bestStore = entry.store_name;
    }
    if (entry.price > acc[key].maxPrice) {
      acc[key].maxPrice = entry.price;
    }
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages
  Object.values(pricesByProduct).forEach((product: any) => {
    const total = product.entries.reduce((sum: number, e: PriceEntry) => sum + e.price, 0);
    product.avgPrice = total / product.entries.length;
    product.savings = product.maxPrice - product.minPrice;
    product.savingsPercent = ((product.maxPrice - product.minPrice) / product.maxPrice) * 100;
  });

  // Filter products
  const filteredProducts = Object.values(pricesByProduct)
    .filter((product: any) => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEssential = !showEssentialOnly || product.is_essential;
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesEssential && matchesCategory;
    })
    .sort((a: any, b: any) => b.entries.length - a.entries.length);

  // Stats
  const totalProducts = Object.keys(pricesByProduct).length;
  const totalEntries = priceEntries.length;
  const totalContributors = new Set(priceEntries.map(e => e.user_id)).size;
  const avgSavings = filteredProducts.length > 0
    ? filteredProducts.reduce((sum: number, p: any) => sum + (p.savingsPercent || 0), 0) / filteredProducts.length
    : 0;

  const bestDeals = Object.values(pricesByProduct)
    .filter((p: any) => p.entries.length >= 2)
    .sort((a: any, b: any) => b.savingsPercent - a.savingsPercent)
    .slice(0, 5);

  const filteredFollows = productFollows.filter(f => {
    const productName = f.product_name || productsCatalog.find(p => p.id === f.product_id)?.name || "";
    const catalogProd = productsCatalog.find(p => p.name.toLowerCase() === productName.toLowerCase());
    const matchesCategory = selectedCategory === "all" || catalogProd?.category === selectedCategory;
    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredSuggestions = productsCatalog.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEssential = !showEssentialOnly || p.is_essential;
    return matchesCategory && matchesSearch && matchesEssential;
  });

  const filteredMyEntries = myEntries.filter(e => {
    const catalogProd = productsCatalog.find(p => p.name.toLowerCase() === e.product_name.toLowerCase());
    const matchesCategory = selectedCategory === "all" || catalogProd?.category === selectedCategory;
    const matchesSearch = e.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppLayout
      title="Comparador de Preços"
      subtitle="Compare preços e encontre onde comprar mais barato em Angola"
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center relative">
                  <TrendingDown className="h-7 w-7 text-primary-foreground" />
                  <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground border-none text-[10px] px-1">COMUNIDADE</Badge>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Economize nas suas compras</h2>
                  <p className="text-muted-foreground">
                    Colabore com a comunidade e descubra os melhores preços
                  </p>
                </div>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Preço
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Registrar Preço de Produto</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden">
                    <div className="px-6">
                      <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex items-start gap-3 mb-4">
                        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-bold text-primary">Ganhe Pontos de Contribuidor! 🌟</p>
                          <p className="text-xs text-muted-foreground">Cada preço que registras ajuda a comunidade a poupar e aumenta o teu nível de Reputação Financeira na rede.</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-gutter-stable" style={{ maxHeight: "calc(90vh - 180px)" }}>
                      <div className="px-6 space-y-4 pb-6">
                        <div className="space-y-2">
                          <Label>Categoria *</Label>
                          <Select
                            value={newEntry.category}
                            onValueChange={(value) => setNewEntry({ ...newEntry, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.filter(c => c.value !== "all").map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  <div className="flex items-center gap-2">
                                    <cat.icon className="h-4 w-4" />
                                    {cat.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Produto *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal"
                              >
                                {newEntry.product_name || "Selecione ou pesquise um produto..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Pesquisar produto..." />
                                <CommandList>
                                  <CommandEmpty className="p-2 text-xs flex flex-col gap-2">
                                    Nenhum produto encontrado.
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-7 text-[10px]"
                                      onClick={() => {
                                        // The search text is preserved in the CommandInput usually, 
                                        // but for simplicity we allow manual typing too.
                                      }}
                                    >
                                      Usar nome digitado
                                    </Button>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {productsCatalog.map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={(value) => {
                                          const prod = productsCatalog.find(p => p.name.toLowerCase() === value.toLowerCase());
                                          setNewEntry({
                                            ...newEntry,
                                            product_name: prod?.name || value,
                                            unit: prod?.unit || "unidade",
                                            is_essential: prod?.is_essential ?? true,
                                          });
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${newEntry.product_name === product.name ? "opacity-100" : "opacity-0"}`}
                                        />
                                        <div className="flex flex-col">
                                          <span>{product.name}</span>
                                          <span className="text-[10px] text-muted-foreground">{product.category}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <Input
                            placeholder="Ou digite um novo produto..."
                            value={newEntry.product_name}
                            onChange={(e) => setNewEntry({ ...newEntry, product_name: e.target.value })}
                            className="mt-2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Loja/Mercado *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between font-normal"
                                >
                                  {newEntry.store_name || "Selecione ou pesquise..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Pesquisar loja..." />
                                  <CommandList>
                                    <CommandEmpty className="p-2 text-xs">Nenhuma loja encontrada.</CommandEmpty>
                                    <CommandGroup>
                                      {stores.map((store) => (
                                        <CommandItem
                                          key={store.id}
                                          value={store.name}
                                          onSelect={(value) => {
                                            const s = stores.find(st => st.name.toLowerCase() === value.toLowerCase());
                                            setNewEntry({ ...newEntry, store_name: s?.name || value });
                                          }}
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${newEntry.store_name === store.name ? "opacity-100" : "opacity-0"}`}
                                          />
                                          <div className="flex items-center gap-2">
                                            {store.name}
                                            {store.is_verified && <Check className="h-3 w-3 text-success" />}
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Input
                              placeholder="Ou nome da loja..."
                              value={newEntry.store_name}
                              onChange={(e) => setNewEntry({ ...newEntry, store_name: e.target.value })}
                              className="mt-2"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Marca (Opcional)</Label>
                            <Input
                              placeholder="Ex: Fula, Tio Lucas..."
                              value={newEntry.brand}
                              onChange={(e) => setNewEntry({ ...newEntry, brand: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Preço (Kz) *</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newEntry.price}
                              onChange={(e) => setNewEntry({ ...newEntry, price: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              placeholder="1"
                              value={newEntry.quantity}
                              onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Unidade</Label>
                            <Select
                              value={newEntry.unit}
                              onValueChange={(value) => setNewEntry({ ...newEntry, unit: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unidade">Unidade</SelectItem>
                                <SelectItem value="kg">1 Kg</SelectItem>
                                <SelectItem value="5kg">5 Kg</SelectItem>
                                <SelectItem value="10kg">10 Kg</SelectItem>
                                <SelectItem value="25kg">25 Kg</SelectItem>
                                <SelectItem value="50kg">50 Kg</SelectItem>
                                <SelectItem value="100kg">100 Kg</SelectItem>
                                <SelectItem value="litro">Litro</SelectItem>
                                <SelectItem value="pacote">Pacote</SelectItem>
                                <SelectItem value="cartela">Cartela</SelectItem>
                                <SelectItem value="caixa">Caixa</SelectItem>
                                <SelectItem value="garrafa">Garrafa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Data da Compra</Label>
                            <Input
                              type="date"
                              value={newEntry.purchase_date}
                              onChange={(e) => setNewEntry({ ...newEntry, purchase_date: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={newEntry.is_essential}
                            onCheckedChange={(checked) => setNewEntry({ ...newEntry, is_essential: checked })}
                          />
                          <Label>Produto essencial</Label>
                        </div>

                        <div className="space-y-2">
                          <Label>Observações (opcional)</Label>
                          <Textarea
                            placeholder="Ex: Promoção de fim de semana..."
                            value={newEntry.notes}
                            onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="p-6 pt-2 border-t mt-0">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button
                      className="gradient-primary"
                      onClick={() => addEntryMutation.mutate(newEntry)}
                      disabled={!newEntry.product_name || !newEntry.store_name || !newEntry.price || addEntryMutation.isPending}
                    >
                      {addEntryMutation.isPending ? "Salvando..." : "Registrar Preço"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEntries}</p>
                  <p className="text-xs text-muted-foreground">Registros</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalContributors}</p>
                  <p className="text-xs text-muted-foreground">Contribuidores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgSavings.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Economia Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community Info Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Transparência e Colaboração 🇦🇴</h3>
            <p className="text-xs text-muted-foreground">
              Os preços apresentados são registados por utilizadores como tu. Ao registar um preço, estás a ajudar toda a comunidade angolana a encontrar as melhores oportunidades de poupança.
            </p>
          </div>
          <div className="ml-auto flex flex-col items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30">Dados Partilhados</Badge>
            <p className="text-[10px] font-bold text-success animate-pulse">#AngolaPoupeMais</p>
          </div>
        </div>

        {/* Best Deals */}
        {bestDeals.length > 0 && (
          <Card className="border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Maiores Oportunidades de Economia
              </CardTitle>
              <CardDescription>Produtos com maior diferença de preço entre lojas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {bestDeals.map((product: any, index) => (
                  <Card key={index} className="min-w-[200px] border-success/30 bg-success/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-success/20 text-success">
                          -{product.savingsPercent.toFixed(0)}%
                        </Badge>
                        {product.is_essential && (
                          <Badge variant="outline" className="text-xs">Essencial</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mb-2 line-clamp-2">{product.product_name}</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Mais barato:</span>
                          <span className="font-bold text-success">{formatCurrency(product.minPrice)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {product.bestStore}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
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
          <div className="flex items-center gap-2">
            <Switch
              checked={showEssentialOnly}
              onCheckedChange={setShowEssentialOnly}
            />
            <Label className="text-sm">Apenas essenciais</Label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className={selectedCategory === cat.value ? "gradient-primary" : ""}
            >
              <cat.icon className="h-4 w-4 mr-2" />
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compare">
              <BarChart3 className="h-4 w-4 mr-2" />
              Comparar
            </TabsTrigger>
            <TabsTrigger value="following" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              Seguindo
              {productFollows.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                  {productFollows.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <Sparkles className="h-4 w-4 mr-2" />
              Sugestões
            </TabsTrigger>
            <TabsTrigger value="my-entries">
              <Tag className="h-4 w-4 mr-2" />
              Meus Registros
            </TabsTrigger>
          </TabsList>

          {/* Compare Tab */}
          <TabsContent value="compare" className="mt-6">

            {loadingEntries ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Seja o primeiro a registrar preços!
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Preço
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product: any, index) => {
                  const catalogProduct = productsCatalog.find(
                    (p) => p.name.toLowerCase() === product.product_name.toLowerCase()
                  );
                  const isFollowed = isProductFollowed(product.product_name, catalogProduct?.id);

                  return (
                    <Card key={index} className={`hover:shadow-md transition-shadow ${isFollowed ? 'ring-2 ring-primary/30' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{product.product_name}</h3>
                              {product.is_essential && (
                                <Badge variant="outline" className="text-xs">Essencial</Badge>
                              )}
                              <Badge className="bg-muted text-muted-foreground text-xs">
                                {product.entries.length} registro(s)
                              </Badge>
                              {isFollowed && (
                                <Badge className="bg-primary/20 text-primary text-xs">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Seguindo
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Menor preço:</span>
                                <p className="font-bold text-success flex items-center gap-1">
                                  <ArrowDownIcon className="h-3 w-3" />
                                  {formatCurrency(product.minPrice)}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Maior preço:</span>
                                <p className="font-bold text-destructive flex items-center gap-1">
                                  <ArrowUpIcon className="h-3 w-3" />
                                  {formatCurrency(product.maxPrice)}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Média:</span>
                                <p className="font-medium">{formatCurrency(product.avgPrice)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Economia:</span>
                                <p className="font-bold text-success">
                                  {product.savingsPercent.toFixed(0)}%
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 text-success bg-success/10 px-3 py-2 rounded-lg">
                              <MapPin className="h-4 w-4" />
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Compre em:</p>
                                <p className="font-semibold">{product.bestStore}</p>
                              </div>
                            </div>
                            {user && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={isFollowed ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => {
                                        if (isFollowed) {
                                          unfollowProductMutation.mutate({
                                            productId: catalogProduct?.id,
                                            productName: product.product_name,
                                          });
                                        } else {
                                          followProductMutation.mutate({
                                            productId: catalogProduct?.id,
                                            productName: product.product_name,
                                            currentPrice: product.minPrice,
                                          });
                                        }
                                      }}
                                      disabled={followProductMutation.isPending || unfollowProductMutation.isPending}
                                      className={isFollowed ? "gradient-primary" : ""}
                                    >
                                      {isFollowed ? (
                                        <>
                                          <BellOff className="h-4 w-4 mr-1" />
                                          Parar
                                        </>
                                      ) : (
                                        <>
                                          <Bell className="h-4 w-4 mr-1" />
                                          Seguir
                                        </>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isFollowed
                                      ? "Deixar de receber notificações de preço"
                                      : "Receber notificação quando o preço baixar"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>

                        {/* Price History */}
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Histórico de preços:</p>
                          <div className="flex flex-wrap gap-2">
                            {product.entries.slice(0, 5).map((entry: PriceEntry) => (
                              <Badge
                                key={entry.id}
                                variant="outline"
                                className={`text-xs ${entry.price === product.minPrice ? 'border-success text-success' : ''}`}
                              >
                                <Store className="h-3 w-3 mr-1" />
                                {entry.store_name}: {formatCurrency(entry.price)}
                              </Badge>
                            ))}
                            {product.entries.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.entries.length - 5} mais
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="mt-6">
            {!user ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Faça login para seguir produtos</h3>
                  <p className="text-muted-foreground mb-4">
                    Receba notificações quando os preços baixarem!
                  </p>
                </CardContent>
              </Card>
            ) : productFollows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Você não está seguindo nenhum produto</h3>
                  <p className="text-muted-foreground mb-4">
                    Siga produtos na aba "Comparar" para receber notificações quando o preço baixar!
                  </p>
                  <Button onClick={() => setActiveTab("compare")}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Produtos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Alertas de Preço Ativos</h3>
                        <p className="text-sm text-muted-foreground">
                          Você será notificado quando alguém registrar um preço mais baixo
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {filteredFollows.map((follow) => {
                  const productName = follow.product_name ||
                    productsCatalog.find(p => p.id === follow.product_id)?.name || "Produto";
                  const productData = pricesByProduct[productName.toLowerCase().trim()];

                  return (
                    <Card key={follow.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{productName}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Seguindo desde {format(new Date(follow.created_at), "dd/MM/yyyy", { locale: pt })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              {productData ? (
                                <>
                                  <p className="font-bold text-success">{formatCurrency(productData.minPrice)}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {productData.bestStore}
                                  </p>
                                  {follow.lowest_price_seen && productData.minPrice < follow.lowest_price_seen && (
                                    <Badge className="bg-success/20 text-success text-xs mt-1">
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      -{((follow.lowest_price_seen - productData.minPrice) / follow.lowest_price_seen * 100).toFixed(0)}%
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">Sem dados</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => unfollowProductMutation.mutate({
                                productId: follow.product_id || undefined,
                                productName: follow.product_name || undefined,
                              })}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <BellOff className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Sugestões de Compra Inteligentes
                </CardTitle>
                <CardDescription>
                  Baseado nos preços registrados pela comunidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {filteredSuggestions
                      .map((catalogProduct) => {
                        const productData = pricesByProduct[catalogProduct.name.toLowerCase().trim()];
                        const isFollowed = isProductFollowed(catalogProduct.name, catalogProduct.id);

                        return (
                          <div key={catalogProduct.id} className={`flex items-center justify-between p-4 rounded-lg ${isFollowed ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/50'}`}>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{catalogProduct.name}</h4>
                                  {isFollowed && (
                                    <Bell className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{catalogProduct.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                {productData ? (
                                  <>
                                    <p className="font-bold text-success">{formatCurrency(productData.minPrice)}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {productData.bestStore}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-xs text-muted-foreground">Sem dados</p>
                                )}
                              </div>
                              {user && (
                                <Button
                                  variant={isFollowed ? "default" : "ghost"}
                                  size="icon"
                                  onClick={() => {
                                    if (isFollowed) {
                                      unfollowProductMutation.mutate({
                                        productId: catalogProduct.id,
                                        productName: catalogProduct.name,
                                      });
                                    } else {
                                      followProductMutation.mutate({
                                        productId: catalogProduct.id,
                                        productName: catalogProduct.name,
                                        currentPrice: productData?.minPrice,
                                      });
                                    }
                                  }}
                                  disabled={followProductMutation.isPending || unfollowProductMutation.isPending}
                                  className={isFollowed ? "gradient-primary h-8 w-8" : "h-8 w-8"}
                                >
                                  {isFollowed ? (
                                    <BellOff className="h-4 w-4" />
                                  ) : (
                                    <Bell className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Entries Tab */}
          <TabsContent value="my-entries" className="mt-6">
            {myEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Você ainda não registrou preços</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece a contribuir com a comunidade!
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Preço
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredMyEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${entry.is_essential ? 'bg-primary/10' : 'bg-muted'
                            }`}>
                            <ShoppingCart className={`h-5 w-5 ${entry.is_essential ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                          </div>
                          <div>
                            <h4 className="font-medium">{entry.product_name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Store className="h-3 w-3" />
                              {entry.store_name}
                              <span>•</span>
                              <Calendar className="h-3 w-3" />
                              {format(new Date(entry.purchase_date), "dd/MM/yyyy", { locale: pt })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-lg">{formatCurrency(entry.price)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEntryMutation.mutate(entry.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                          {entry.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
