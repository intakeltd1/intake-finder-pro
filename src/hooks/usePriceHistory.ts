import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PriceHistoryRecord {
  price: number;
  rrp: number | null;
  recorded_date: string;
}

interface PriceStats {
  current: number;
  min: number;
  max: number;
  average: number;
  change: number;
  dataPoints: number;
  isLowest: boolean;
  isHighest: boolean;
}

interface PriceHistoryResponse {
  success: boolean;
  history: PriceHistoryRecord[];
  stats: PriceStats | null;
  error?: string;
}

export function usePriceHistory(productUrl: string | undefined) {
  return useQuery({
    queryKey: ['priceHistory', productUrl],
    queryFn: async (): Promise<PriceHistoryResponse> => {
      if (!productUrl) {
        return { success: false, history: [], stats: null, error: 'No product URL' };
      }

      // Query directly from the database
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: historyData, error: dbError } = await supabase
        .from('price_history')
        .select('price, rrp, recorded_date')
        .eq('product_url', productUrl)
        .gte('recorded_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('recorded_date', { ascending: true });

      if (dbError) {
        console.error('Database query error:', dbError);
        return { success: false, history: [], stats: null, error: dbError.message };
      }

      const prices = historyData?.map(d => Number(d.price)) || [];
      const stats: PriceStats | null = prices.length > 0 ? {
        current: prices[prices.length - 1],
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        change: prices.length > 1 
          ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 
          : 0,
        dataPoints: prices.length,
        isLowest: prices[prices.length - 1] === Math.min(...prices),
        isHighest: prices[prices.length - 1] === Math.max(...prices),
      } : null;

      return {
        success: true,
        history: historyData || [],
        stats,
      };
    },
    enabled: !!productUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
