-- Advanced Auditing and RBAC Implementation
-- This migration enhances the logging system with more details, immutability, and automated change tracking.

-- 1. Extend activity_logs with more granular fields
ALTER TABLE public.activity_logs
ADD COLUMN IF NOT EXISTS resource TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success',
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS method TEXT;

-- 2. Enforce Immutability: Prevent anyone (even admins) from editing/deleting logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_audit_modification ON public.activity_logs;
CREATE TRIGGER tr_prevent_audit_modification
BEFORE UPDATE OR DELETE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 3. Advanced RBAC Helper: Permission-based check
-- This allows checking for specific permissions rather than just 'admin'
CREATE OR REPLACE FUNCTION public.has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = auth.uid();
    
    -- Basic Permission Mapping
    IF v_role = 'admin' THEN
        RETURN TRUE; -- Admins have all permissions
    ELSIF v_role = 'moderator' THEN
        -- Moderators can manage content but not system settings
        IF p_permission IN ('read:all', 'write:content', 'write:blog', 'read:audit') THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 4. Automated Change Tracking Trigger Function
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_action TEXT;
    v_details JSONB;
BEGIN
    v_user_id := auth.uid();
    
    -- Get role
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_user_id;
    
    v_action := TG_OP; -- INSERT, UPDATE, or DELETE
    v_details := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );

    INSERT INTO public.activity_logs (user_id, action, resource, details, role, status)
    VALUES (
        v_user_id, 
        'AUTO_' || TG_OP, 
        TG_TABLE_NAME, 
        v_details, 
        v_role, 
        'success'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Automated Tracking to Critical Tables
-- Profiles
DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- Subscriptions (if table name is correct, checking typical names)
-- Note: Adjusting based on common names in this project
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'subscriptions') THEN
        DROP TRIGGER IF EXISTS tr_audit_subscriptions ON public.subscriptions;
        CREATE TRIGGER tr_audit_subscriptions
        AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
        FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();
    END IF;
END $$;

-- BODIVA Data
DROP TRIGGER IF EXISTS tr_audit_bodiva ON public.bodiva_market_data;
CREATE TRIGGER tr_audit_bodiva
AFTER INSERT OR UPDATE OR DELETE ON public.bodiva_market_data
FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.has_permission TO authenticated;
