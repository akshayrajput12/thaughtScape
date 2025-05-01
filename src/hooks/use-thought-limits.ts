
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThoughtLimits {
  canCreate: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  reason: 'daily_limit_reached' | 'monthly_limit_reached' | null;
}

// Define the shape of the data returned from the RPC function
interface ThoughtLimitsResponse {
  can_create: boolean;
  daily_remaining: number;
  monthly_remaining: number;
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
          // Properly cast the data to our expected response type
          const limitsData = data as ThoughtLimitsResponse;
          
          setLimits({
            canCreate: limitsData.can_create,
            dailyRemaining: limitsData.daily_remaining,
            monthlyRemaining: limitsData.monthly_remaining,
            reason: limitsData.reason
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
