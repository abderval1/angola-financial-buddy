
-- Create stores table for common shopping locations
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  location VARCHAR,
  city VARCHAR DEFAULT 'Luanda',
  store_type VARCHAR DEFAULT 'supermarket', -- supermarket, market, pharmacy, etc.
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create product catalog for common products
CREATE TABLE public.price_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL, -- alimentação, higiene, transporte, etc.
  is_essential BOOLEAN DEFAULT true,
  unit VARCHAR DEFAULT 'unidade', -- kg, litro, unidade, pacote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create price entries submitted by users
CREATE TABLE public.price_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID REFERENCES public.price_products(id),
  store_id UUID REFERENCES public.stores(id),
  product_name VARCHAR NOT NULL, -- in case product not in catalog
  store_name VARCHAR NOT NULL, -- in case store not in list
  price NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'AOA',
  quantity NUMERIC DEFAULT 1,
  unit VARCHAR DEFAULT 'unidade',
  is_essential BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  notes TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_entries ENABLE ROW LEVEL SECURITY;

-- Stores policies (anyone can view, authenticated can add)
CREATE POLICY "Anyone can view stores" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add stores" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage stores" ON public.stores
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Products policies (anyone can view, admins manage)
CREATE POLICY "Anyone can view products" ON public.price_products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.price_products
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Price entries policies
CREATE POLICY "Anyone can view price entries" ON public.price_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own entries" ON public.price_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON public.price_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON public.price_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Insert common Angolan stores
INSERT INTO public.stores (name, location, city, store_type, is_verified) VALUES
  ('Kero', 'Vários locais', 'Luanda', 'supermarket', true),
  ('Candando', 'Vários locais', 'Luanda', 'supermarket', true),
  ('Maxi', 'Vários locais', 'Luanda', 'supermarket', true),
  ('Shoprite', 'Vários locais', 'Luanda', 'supermarket', true),
  ('Jumbo', 'Vários locais', 'Luanda', 'supermarket', true),
  ('Mercado do Kikolo', 'Kikolo', 'Luanda', 'market', true),
  ('Mercado do Roque Santeiro', 'Roque Santeiro', 'Luanda', 'market', true),
  ('Mercado dos Congolenses', 'Congolenses', 'Luanda', 'market', true),
  ('Farmácia Mãe', 'Vários locais', 'Luanda', 'pharmacy', true),
  ('Farmácia Angolana', 'Vários locais', 'Luanda', 'pharmacy', true);

-- Insert common products
INSERT INTO public.price_products (name, category, is_essential, unit) VALUES
  ('Arroz (1kg)', 'Alimentação', true, 'kg'),
  ('Feijão (1kg)', 'Alimentação', true, 'kg'),
  ('Óleo de Cozinha (1L)', 'Alimentação', true, 'litro'),
  ('Açúcar (1kg)', 'Alimentação', true, 'kg'),
  ('Farinha de Milho (1kg)', 'Alimentação', true, 'kg'),
  ('Fuba (1kg)', 'Alimentação', true, 'kg'),
  ('Frango (1kg)', 'Alimentação', true, 'kg'),
  ('Carne de Vaca (1kg)', 'Alimentação', true, 'kg'),
  ('Peixe Carapau (1kg)', 'Alimentação', true, 'kg'),
  ('Tomate (1kg)', 'Alimentação', true, 'kg'),
  ('Cebola (1kg)', 'Alimentação', true, 'kg'),
  ('Batata (1kg)', 'Alimentação', true, 'kg'),
  ('Pão', 'Alimentação', true, 'unidade'),
  ('Leite (1L)', 'Alimentação', true, 'litro'),
  ('Ovos (30 unidades)', 'Alimentação', true, 'cartela'),
  ('Água (5L)', 'Bebidas', true, 'garrafa'),
  ('Gasóleo (1L)', 'Transporte', true, 'litro'),
  ('Gasolina (1L)', 'Transporte', true, 'litro'),
  ('Sabão em Barra', 'Higiene', true, 'unidade'),
  ('Detergente (1L)', 'Higiene', true, 'litro'),
  ('Pasta de Dentes', 'Higiene', true, 'unidade'),
  ('Medicamento Paracetamol', 'Saúde', true, 'caixa'),
  ('Cerveja Cuca', 'Bebidas', false, 'unidade'),
  ('Refrigerante (1.5L)', 'Bebidas', false, 'garrafa'),
  ('Dados Móveis (1GB)', 'Telecomunicações', true, 'pacote');
