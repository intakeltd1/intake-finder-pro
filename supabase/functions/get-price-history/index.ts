import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const productUrl = url.searchParams.get('product_url');

    if (!productUrl) {
      return new Response(
        JSON.stringify({ error: 'product_url parameter is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Fetching price history for:', productUrl);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get last 30 days of price history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('price_history')
      .select('price, rrp, recorded_date')
      .eq('product_url', productUrl)
      .gte('recorded_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('recorded_date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} price records`);

    // Calculate statistics
    const prices = data?.map(d => Number(d.price)) || [];
    const stats = prices.length > 0 ? {
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

    return new Response(
      JSON.stringify({
        success: true,
        history: data || [],
        stats,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
