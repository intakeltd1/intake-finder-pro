import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type PriceTrend = 'falling' | 'rising' | null;

interface PriceRecord {
  price: number;
  recorded_date: string;
}

/**
 * Fetches recent price history for a product and determines if there's a trend.
 * Returns 'falling' if price decreased for 2+ consecutive days.
 * Returns 'rising' if price increased for 2+ consecutive days.
 * Returns null if no clear trend or insufficient data.
 */
export function usePriceTrend(productUrl: string | undefined): PriceTrend {
  const { data: trend } = useQuery({
    queryKey: ['price-trend', productUrl],
    queryFn: async (): Promise<PriceTrend> => {
      if (!productUrl) return null;

      // Fetch last 3 days of price data for this product
      const { data, error } = await supabase
        .from('price_history')
        .select('price, recorded_date')
        .eq('product_url', productUrl)
        .order('recorded_date', { ascending: false })
        .limit(3);

      if (error || !data || data.length < 3) {
        return null;
      }

      // data is ordered newest first: [day3, day2, day1]
      const prices: PriceRecord[] = data;
      
      // Check for falling trend (prices decreasing over time)
      // day1 > day2 > day3 means prices are falling (oldest > middle > newest)
      const day3Price = prices[0].price; // newest/today
      const day2Price = prices[1].price; // yesterday
      const day1Price = prices[2].price; // 2 days ago
      
      // Falling: older prices were higher than newer prices
      if (day1Price > day2Price && day2Price > day3Price) {
        return 'falling';
      }
      
      // Rising: older prices were lower than newer prices
      if (day1Price < day2Price && day2Price < day3Price) {
        return 'rising';
      }

      return null;
    },
    enabled: !!productUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  return trend ?? null;
}
