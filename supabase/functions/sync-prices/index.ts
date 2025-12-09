import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DATA_SOURCE_URL = 'https://intake-collection-data.web.app/master_cleaned.json';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting price sync...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch product data from Firebase
    console.log('Fetching product data from:', DATA_SOURCE_URL);
    const response = await fetch(DATA_SOURCE_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product data: ${response.status}`);
    }

    const products = await response.json();
    console.log(`Fetched ${products.length} products`);

    // Clean up old price history (older than 30 days)
    const { error: cleanupError } = await supabase.rpc('cleanup_old_price_history');
    if (cleanupError) {
      console.warn('Cleanup warning:', cleanupError.message);
    }

    // Prepare price records
    const priceRecords = products
      .filter((product: any) => {
        const url = product.URL || product.LINK;
        const price = parseFloat(product.Price || product.PRICE || '0');
        return url && price > 0;
      })
      .map((product: any) => {
        const url = product.URL || product.LINK;
        const price = parseFloat(product.Price || product.PRICE || '0');
        const rrp = parseFloat(product.RRP || product['Recommended Retail Price'] || '0') || null;
        const title = product.Title || product.TITLE || product.Name || '';

        return {
          product_url: url,
          product_title: title.substring(0, 255),
          price: price,
          rrp: rrp > 0 ? rrp : null,
          recorded_date: new Date().toISOString().split('T')[0],
        };
      });

    console.log(`Prepared ${priceRecords.length} price records`);

    // Upsert in batches (Supabase has limits)
    const BATCH_SIZE = 500;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < priceRecords.length; i += BATCH_SIZE) {
      const batch = priceRecords.slice(i, i + BATCH_SIZE);
      
      const { error } = await supabase
        .from('price_history')
        .upsert(batch, {
          onConflict: 'product_url,recorded_date',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    console.log(`Sync complete: ${successCount} succeeded, ${errorCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Price sync completed',
        stats: {
          total_products: products.length,
          records_synced: successCount,
          errors: errorCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
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
