-- Audit System Refinement: IP Extraction and Identity Mapping
-- This migration ensures IP addresses are captured from headers and identities are mapped during triggers.

-- 1. Helper function to extract IP from Supabase request headers
CREATE OR REPLACE FUNCTION public.get_request_ip()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.headers', true)::json->>'x-real-ip';
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Trigger to automatically populate IP on INSERT for activity_logs
CREATE OR REPLACE FUNCTION public.populate_audit_ip()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ip_address IS NULL THEN
        NEW.ip_address := public.get_request_ip();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_populate_audit_ip ON public.activity_logs;
CREATE TRIGGER tr_populate_audit_ip
BEFORE INSERT ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.populate_audit_ip();

-- 3. Enhanced Automated Tracker: Fixing identity capture during sign-up
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_action TEXT;
    v_details JSONB;
BEGIN
    -- Try auth.uid() first
    v_user_id := auth.uid();
    
    -- Special case for profiles: if auth.uid() is null (e.g. during sign up), 
    -- attempt to use the record's user_id or id
    IF v_user_id IS NULL AND TG_TABLE_NAME = 'profiles' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_user_id := NEW.user_id;
            IF v_user_id IS NULL THEN v_user_id := NEW.id; END IF;
        END IF;
    END IF;
    
    -- Get role
    IF v_user_id IS NOT NULL THEN
        SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_user_id;
    END IF;
    
    -- Fallback to 'user' if we have an ID but no role record yet
    IF v_user_id IS NOT NULL AND v_role IS NULL THEN
        v_role := 'user';
    END IF;
    
    v_action := TG_OP;
    v_details := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );

    INSERT INTO public.activity_logs (user_id, action, resource, details, role, status, ip_address)
    VALUES (
        v_user_id, 
        'AUTO_' || TG_OP, 
        TG_TABLE_NAME, 
        v_details, 
        v_role, 
        'success',
        public.get_request_ip()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
