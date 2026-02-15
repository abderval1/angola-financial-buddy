-- Function to notify all admins about new purchases and subscriptions
CREATE OR REPLACE FUNCTION public.handle_new_admin_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
    user_name TEXT;
    item_title TEXT;
BEGIN
    -- Get the name of the user who made the purchase/subscription
    SELECT name INTO user_name FROM public.profiles WHERE user_id = NEW.user_id;
    IF user_name IS NULL OR user_name = '' THEN 
        user_name := 'Um utilizador'; 
    END IF;

    -- Determine notification details based on the table where the event occurred
    IF TG_TABLE_NAME = 'marketplace_purchases' THEN
        SELECT title INTO item_title FROM public.marketplace_products WHERE id = NEW.product_id;
        FOR admin_record IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LOOP
            INSERT INTO public.notifications (user_id, title, message, type, read)
            VALUES (
                admin_record.user_id, 
                'Nova Venda no Marketplace', 
                user_name || ' comprou: ' || COALESCE(item_title, 'Produto'), 
                'admin_new_marketplace_purchase', 
                false
            );
        END LOOP;
    ELSIF TG_TABLE_NAME = 'course_purchases' THEN
        SELECT title INTO item_title FROM public.educational_content WHERE id = NEW.course_id;
        FOR admin_record IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LOOP
            INSERT INTO public.notifications (user_id, title, message, type, read)
            VALUES (
                admin_record.user_id, 
                'Nova Venda de Curso', 
                user_name || ' comprou o curso: ' || COALESCE(item_title, 'Curso Premium'), 
                'admin_new_course_purchase', 
                false
            );
        END LOOP;
    ELSIF TG_TABLE_NAME = 'user_subscriptions' THEN
        SELECT name INTO item_title FROM public.subscription_plans WHERE id = NEW.plan_id;
        FOR admin_record IN (SELECT user_id FROM public.user_roles WHERE role = 'admin') LOOP
            INSERT INTO public.notifications (user_id, title, message, type, read)
            VALUES (
                admin_record.user_id, 
                'Nova Assinatura', 
                user_name || ' assinou o plano: ' || COALESCE(item_title, 'Plano'), 
                'admin_new_subscription', 
                false
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for each table
DROP TRIGGER IF EXISTS trigger_notif_admin_marketplace ON marketplace_purchases;
CREATE TRIGGER trigger_notif_admin_marketplace
    AFTER INSERT ON marketplace_purchases
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_admin_notification();

DROP TRIGGER IF EXISTS trigger_notif_admin_course ON course_purchases;
CREATE TRIGGER trigger_notif_admin_course
    AFTER INSERT ON course_purchases
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_admin_notification();

DROP TRIGGER IF EXISTS trigger_notif_admin_subscription ON user_subscriptions;
CREATE TRIGGER trigger_notif_admin_subscription
    AFTER INSERT ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_admin_notification();
