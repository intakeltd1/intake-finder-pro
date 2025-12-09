-- Create price_history table for 30-day price tracking
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_url TEXT NOT NULL,
  product_title TEXT,
  price DECIMAL(10,2) NOT NULL,
  rrp DECIMAL(10,2),
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per product per day
  CONSTRAINT unique_product_daily UNIQUE (product_url, recorded_date)
);

-- Index for fast lookups by product URL
CREATE INDEX idx_price_history_product ON public.price_history(product_url);
CREATE INDEX idx_price_history_date ON public.price_history(recorded_date);

-- Enable RLS with public read access (price data is not sensitive)
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price history" 
ON public.price_history 
FOR SELECT 
USING (true);

-- Create cleanup function to remove data older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_price_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.price_history 
  WHERE recorded_date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;