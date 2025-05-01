
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThoughtLimits {
  canCreate: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  reason: 'daily_limit_reached' | 'monthly_limit_reached' | null;
}

export const useThoughtLimits = (userId?: string) => {
  const [limits, setLimits] = useState<ThoughtLimits>({
    canCreate: true,
    dailyRemaining: 1,
    monthlyRemaining: 15,
    reason: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLimits = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .rpc('can_create_thought', { user_id: userId });

        if (error) {
          throw error;
        }

        if (data) {
          setLimits({
            canCreate: data.can_create,
            dailyRemaining: data.daily_remaining,
            monthlyRemaining: data.monthly_remaining,
            reason: data.reason
          });
        }
      } catch (error) {
        console.error('Error fetching thought limits:', error);
        toast({
          title: "Error",
          description: "Failed to check posting limits",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLimits();
  }, [userId, toast]);

  return { ...limits, isLoading };
};
