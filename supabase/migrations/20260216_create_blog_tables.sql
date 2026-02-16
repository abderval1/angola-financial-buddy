-- Migration: Create blog tables for blog posts and comments
-- Date: 2026-02-16

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    author_name VARCHAR(255) DEFAULT 'Kudila Finance',
    author_id UUID REFERENCES auth.users(id),
    category VARCHAR(100) DEFAULT 'financas',
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    read_time_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Create blog_comments table
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    content TEXT NOT NULL,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(post_id, is_approved);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
-- Anyone can read published posts
CREATE POLICY "Public can view published blog posts" ON blog_posts
    FOR SELECT USING (is_published = true);

-- Only admins can insert, update, delete
CREATE POLICY "Admins can manage blog posts" ON blog_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- RLS Policies for blog_comments
-- Anyone can read approved comments
CREATE POLICY "Public can view approved comments" ON blog_comments
    FOR SELECT USING (is_approved = true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can create comments" ON blog_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own comments, admins can update all
CREATE POLICY "Users can update own comments" ON blog_comments
    FOR UPDATE USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ));

-- Users can delete their own comments, admins can delete all
CREATE POLICY "Users can delete own comments" ON blog_comments
    FOR DELETE USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ));

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_post_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE blog_posts
    SET view_count = view_count + 1
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for view count
CREATE TRIGGER on_blog_post_view
    AFTER INSERT ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION increment_blog_post_views();

-- Function to increment blog view count (for RPC)
CREATE OR REPLACE FUNCTION increment_blog_view_count(p_post_id UUID)
RETURNS void AS $
BEGIN
    UPDATE blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_post_id;
END;
$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample blog posts for testing
INSERT INTO blog_posts (title, slug, summary, content, category, is_published, is_featured, read_time_minutes, published_at) VALUES
('Como Começar a Investir em Angola', 'como-comecar-investir-angola', 'Um guia completo para iniciantes no mundo dos investimentos em Angola.', 
'<h2>Por que Investir em Angola?</h2><p>Angola oferece diversas oportunidades de investimento para quem deseja fazer seu dinheiro render. Neste artigo, vamos explorar as principais opções disponíveis no mercado angolano.</p><h2>Passo 1: Defina seus Objetivos</h2><p>Antes de investir, é fundamental definir seus objetivos financeiros. Você está ahorrando para a aposentadoria, para comprar uma casa, ou para criar uma renda passiva?</p><h2>Passo 2: Crie uma Reserva de Emergência</h2><p>Antes de investir, tenha uma reserva de emergência equivalente a 3-6 meses de despesas.</p><h2>Passo 3: Escolha seus Investimentos</h2><p>Existem várias opções em Angola: depósitos a prazo, fundos de investimento, ações na BODIVA, e imóveis.</p>', 
'financas', true, true, 8, NOW()),

('Guia de Economia para Jovens Angolanos', 'guia-economia-jovens-angolanos', 'Aprenda a gerir suas finanças desde cedo.',
'<h2>A Importância da Educação Financeira</h2><p>Quanto mais cedo você começar a cuidar do seu dinheiro, mais tempo ele terá para crescer.</p><h2>Dicas Práticas</h2><ul><li>Comece a economizar desde o primeiro salário</li><li>Evite compras por impulso</li><li>Use o método 50/30/20</li></ul>',
'economia', true, false, 5, NOW()),

('Entenda o Mercado de Ações em Angola', 'mercado-acoes-angola', 'Tudo o que precisa saber sobre a BODIVA e investimentos em ações.',
'<h2>O que é a BODIVA?</h2><p>A Bolsa de Dívida e Valores de Angola (BODIVA) é o mercado onde são negociados títulos e ações em Angola.</p><h2>Como Funciona?</h2><p>Aprenda a analisar empresas e fazer seus primeiros investimentos em ações.</p>',
'investimentos', true, true, 10, NOW());

-- Insert sample comments
INSERT INTO blog_comments (post_id, user_name, content, is_approved) VALUES
((SELECT id FROM blog_posts WHERE slug = 'como-comecar-investir-angola' LIMIT 1), 'João Silva', 'Excelente artigo! Muito útil para quem está começando.', true),
((SELECT id FROM blog_posts WHERE slug = 'como-comecar-investir-angola' LIMIT 1), 'Maria Costa', 'Gostaria de saber mais sobre os fundos de investimento em Angola.', true),
((SELECT id FROM blog_posts WHERE slug = 'mercado-acoes-angola' LIMIT 1), 'Pedro Santos', 'Artikel muito informativo. Obrigado!', true);
