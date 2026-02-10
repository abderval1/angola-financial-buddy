-- LIST USERS AND SET ADMIN
-- Run this in Supabase SQL Editor

-- 1. List all profiles to find your user
SELECT id, name, email, created_at FROM public.profiles;

-- 2. Once you find your email/id in the list above, copy the email and run this:
-- Replace 'seu-email-da-lista@exemplo.com' with the email you found above.

DO $$
DECLARE
    v_user_email text := 'seu-email-da-lista@exemplo.com'; 
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NOT NULL THEN
        DELETE FROM public.user_roles WHERE user_id = v_user_id;
        INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
        RAISE NOTICE 'Usuário % definido como ADMIN com sucesso!', v_user_email;
    ELSE
        RAISE NOTICE 'Usuário com email % não encontrado!', v_user_email;
    END IF;
END $$;
