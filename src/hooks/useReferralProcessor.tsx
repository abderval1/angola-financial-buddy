import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useReferralProcessor() {
  const { user } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    const processReferral = async () => {
      if (!user?.id || processedRef.current) return;
      
      const pendingCode = localStorage.getItem("pendingReferralCode");
      if (!pendingCode) return;

      processedRef.current = true;
      
      try {
        const { data: success, error } = await supabase.rpc("process_referral_signup", {
          p_referred_id: user.id,
          p_referral_code: pendingCode,
        });

        if (error) {
          console.error("Referral processing error:", error);
          return;
        }

        if (success) {
          localStorage.removeItem("pendingReferralCode");
          toast.success("🎁 Bónus de boas-vindas creditado na sua conta!");
        }
      } catch (err) {
        console.error("Failed to process referral:", err);
      }
    };

    processReferral();
  }, [user?.id]);
}
