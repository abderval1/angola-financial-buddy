-- ==============================================================
-- QUIZZES E QUESTÕES
-- ==============================================================

-- Tabela de quizzes associados a módulos ou cursos
CREATE TABLE public.course_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.educational_content(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  is_final_quiz BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Questões do quiz
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Respostas do usuário no quiz
CREATE TABLE public.user_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================================
-- CERTIFICADOS
-- ==============================================================

CREATE TABLE public.user_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.educational_content(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_name TEXT,
  course_title TEXT,
  completion_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================================
-- NOTIFICAÇÕES APRIMORADAS
-- ==============================================================

-- Adicionar campo para armazenar tipo de notificação e metadados
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- ==============================================================
-- MELHORIAS NA TABELA DE MÓDULOS
-- ==============================================================

ALTER TABLE public.course_modules
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text' CHECK (media_type IN ('text', 'video', 'youtube', 'image', 'mixed')),
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT false;

-- ==============================================================
-- RLS POLICIES
-- ==============================================================

-- Course Quizzes
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quizzes are viewable by everyone"
ON public.course_quizzes FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage quizzes"
ON public.course_quizzes FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Quiz Questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are viewable by everyone"
ON public.quiz_questions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage questions"
ON public.quiz_questions FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- User Quiz Attempts
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
ON public.user_quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
ON public.user_quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts"
ON public.user_quiz_attempts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
ON public.user_quiz_attempts FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- User Certificates
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
ON public.user_certificates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates"
ON public.user_certificates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage certificates"
ON public.user_certificates FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Notifications RLS atualizado
CREATE POLICY "Users can insert notifications for themselves"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ==============================================================
-- INDEXES
-- ==============================================================

CREATE INDEX IF NOT EXISTS idx_course_quizzes_course ON public.course_quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_course_quizzes_module ON public.course_quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user ON public.user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_quiz ON public.user_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_certificates_user ON public.user_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certificates_course ON public.user_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- ==============================================================
-- TRIGGERS
-- ==============================================================

CREATE TRIGGER update_course_quizzes_updated_at
BEFORE UPDATE ON public.course_quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================
-- REALTIME
-- ==============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_certificates;