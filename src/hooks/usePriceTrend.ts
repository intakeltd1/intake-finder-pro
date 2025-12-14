import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type PriceTrend = 'falling' | 'rising' | null;

interface PriceRecord {
  price: number;
  recorded_date: string;
}

/**
 * Fetches recent price history for a product and determines if there's a trend.
 * Returns 'falling' if price decreased from the previous day.
 * Returns 'rising' if price increased from the previous day.
 * Returns null if no change or insufficient data.
 */
export function usePriceTrend(productUrl: string | undefined): PriceTrend {
  const { data: trend } = useQuery({
    queryKey: ['price-trend', productUrl],
    queryFn: async (): Promise<PriceTrend> => {
      if (!productUrl) return null;

      // Fetch last 2 days of price data for this product
      const { data, error } = await supabase
        .from('price_history')
        .select('price, recorded_date')
        .eq('product_url', productUrl)
        .order('recorded_date', { ascending: false })
        .limit(2);

      if (error || !data || data.length < 2) {
        return null;
      }

      // data is ordered newest first: [today, yesterday]
      const todayPrice = data[0].price;
      const yesterdayPrice = data[1].price;
      
      // Falling: yesterday's price was higher than today's
      if (yesterdayPrice > todayPrice) {
        return 'falling';
      }
      
      // Rising: yesterday's price was lower than today's
      if (yesterdayPrice < todayPrice) {
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
