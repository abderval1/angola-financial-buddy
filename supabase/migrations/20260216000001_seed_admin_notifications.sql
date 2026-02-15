-- One-time script to generate notifications for existing pending items
DO $$
DECLARE
    admin_record RECORD;
    pending_marketplace RECORD;
    pending_course RECORD;
    pending_subscription RECORD;
    user_name TEXT;
    item_title TEXT;
BEGIN
    -- 1. Process pending Marketplace Purchases
    FOR pending_marketplace IN SELECT * FROM public.marketplace_purchases WHERE status = 'pending' LOOP
        SELECT name INTO user_name FROM public.profiles WHERE user_id = pending_marketplace.user_id;
        SELECT title INTO item_title FROM public.marketplace_products WHERE id = pending_marketplace.product_id;
        
        FOR admin_record IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LOOP
            -- Check if notification already exists to avoid duplicates (optional, but safer)
            IF NOT EXISTS (
                SELECT 1 FROM public.notifications 
                WHERE user_id = admin_record.user_id 
                AND type = 'admin_new_marketplace_purchase' 
                AND message LIKE '%' || pending_marketplace.id || '%' -- Or use metadata if available
            ) THEN
                INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
                VALUES (
                    admin_record.user_id, 
                    'Venda Pendente: Marketplace', 
                    COALESCE(user_name, 'Utilizador') || ' comprou: ' || COALESCE(item_title, 'Produto'), 
                    'admin_new_marketplace_purchase', 
                    false,
                    pending_marketplace.purchased_at
                );
            END IF;
        END LOOP;
    END LOOP;

    -- 2. Process pending Course Purchases
    FOR pending_course IN SELECT * FROM public.course_purchases WHERE status = 'pending' LOOP
        SELECT name INTO user_name FROM public.profiles WHERE user_id = pending_course.user_id;
        SELECT title INTO item_title FROM public.educational_content WHERE id = pending_course.course_id;
        
        FOR admin_record IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LOOP
            INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
            VALUES (
                admin_record.user_id, 
                'Venda Pendente: Curso', 
                COALESCE(user_name, 'Utilizador') || ' comprou curso: ' || COALESCE(item_title, 'Curso Premium'), 
                'admin_new_course_purchase', 
                false,
                pending_course.purchased_at
            );
        END LOOP;
    END LOOP;

    -- 3. Process pending Subscriptions
    FOR pending_subscription IN SELECT * FROM public.user_subscriptions WHERE status = 'pending' LOOP
        SELECT name INTO user_name FROM public.profiles WHERE user_id = pending_subscription.user_id;
        SELECT name INTO item_title FROM public.subscription_plans WHERE id = pending_subscription.plan_id;
        
        FOR admin_record IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LOOP
            INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
            VALUES (
                admin_record.user_id, 
                'Assinatura Pendente', 
                COALESCE(user_name, 'Utilizador') || ' assinou: ' || COALESCE(item_title, 'Plano'), 
                'admin_new_subscription', 
                false,
                pending_subscription.created_at
            );
        END LOOP;
    END LOOP;
END $$;
