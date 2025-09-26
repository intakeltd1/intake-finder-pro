import { useState, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Instagram, Info } from "lucide-react";
import { Header, StickyTimer } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { ProductCard } from "@/components/ProductCard";
import { CookiesDisclaimer } from "@/components/CookiesDisclaimer";
import { NavigationDrawer } from "@/components/NavigationDrawer";
import { ComparisonWidget } from "@/components/ComparisonWidget";
import { ComparisonModal } from "@/components/ComparisonModal";
import { ComparisonProvider } from "@/hooks/useComparison";
import { applyFuzzySearch, isOutOfStock, getTopValueProducts, getBaseProductName } from "@/utils/productUtils";
import { useScrollAnimations } from "@/components/ScrollAnimations";

interface Product {
  TITLE?: string;
  COMPANY?: string;
  PRICE?: string;
  VALUE_RATING?: number;
  POPULARITY?: number;
  FEATURED?: boolean;
  AMOUNT?: string;
  PROTEIN_SERVING?: string;
  FLAVOUR?: string;
  LINK?: string;
  URL?: string;
  IMAGE_URL?: string;
  STOCK_STATUS?: string;
  [key: string]: any;
}

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300); // Debounce search for performance
  const [sortBy, setSortBy] = useState('randomize');
  const [quantityFilter, setQuantityFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [isRandomized, setIsRandomized] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(28);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingIntervalRef = useRef<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const displayedCountRef = useRef<number>(displayedCount);
  

// Fetch products from JSON
useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/data/products.json');
      if (!response.ok) throw new Error(`Failed to load products: ${response.status}`);

      // Try to parse flexible shapes and extract lastUpdated
      const text = await response.text();
      let parsed: any;
      try { parsed = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON format'); }

      let items: Product[] = [];
      let metaDate: string | undefined;

      const pickDate = (obj: any) => obj?.lastUpdated || obj?.updatedAt || obj?.timestamp || obj?.generatedAt || obj?.date || obj?.updated;

      if (Array.isArray(parsed)) {
        // If the first element is a meta object with a timestamp, use it and drop it from the list
        const first = parsed[0];
        if (first && !first.URL && (pickDate(first))) {
          metaDate = pickDate(first);
          items = parsed.slice(1) as Product[];
        } else {
          items = parsed as Product[];
        }
      } else if (parsed && typeof parsed === 'object') {
        metaDate = pickDate(parsed);
        items = (parsed.products || parsed.items || parsed.data || parsed.list || []) as Product[];
      }

      console.log('Loaded products:', items?.length, metaDate ? `(lastUpdated: ${metaDate})` : '');
      setProducts(items || []);
      setLastUpdatedAt(metaDate || response.headers.get('last-modified') || response.headers.get('date'));
      setError(null);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, []);

  // Get best value products using utility function (already deduplicates and filters out-of-stock)
  const bestValueProducts = useMemo(() => {
    return getTopValueProducts(products, 4);
  }, [products]);

  // Get top 10 best value products for highlighting (reduced from 30 for performance)
  const top10Products = useMemo(() => {
    const top10 = getTopValueProducts(products, 10);
    return new Set(top10.map(p => p.URL || p.LINK));
  }, [products]);


  // Optimized filtering with debouncing and memoization
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = debouncedQuery.trim() ? applyFuzzySearch(products, debouncedQuery.trim()) : products;

    // Apply quantity filter efficiently
    if (quantityFilter !== 'all') {
      filtered = filtered.filter(product => {
        const amount = product.AMOUNT?.toLowerCase() || '';
        switch (quantityFilter) {
          case '<1kg': return amount.includes('g') && !amount.includes('kg');
          case '1-2kg': return amount.includes('1kg') || amount.includes('1.') || 
                         (amount.includes('2kg') && !amount.includes('2.5') && !amount.includes('2.7'));
          case '2-3kg': return amount.includes('2.') || amount.includes('2kg') || amount.includes('3kg');
          case '3-5kg': return amount.includes('3.') || amount.includes('4') || amount.includes('5kg');
          case '>5kg': return amount.includes('6') || amount.includes('7') || amount.includes('8') || 
                        amount.includes('9') || amount.includes('10');
          default: return true;
        }
      });
    }

    // Apply product type filter efficiently  
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(product => {
        const title = product.TITLE?.toLowerCase() || '';
        switch (productTypeFilter) {
          case 'whey': return title.includes('whey') && !title.includes('vegan');
          case 'vegan': return title.includes('vegan') || title.includes('plant') || title.includes('pea');
          case 'clear': return title.includes('clear') || title.includes('juice');
          case 'diet': return title.includes('diet') || title.includes('lean') || title.includes('cut');
          case 'mass': return title.includes('mass') || title.includes('gainer') || title.includes('bulk');
          default: return true;
        }
      });
    }

    // Optimized sorting with single pass
    return [...filtered].sort((a, b) => {
      const aOutOfStock = isOutOfStock(a);
      const bOutOfStock = isOutOfStock(b);
      
      if (aOutOfStock && !bOutOfStock) return 1;
      if (!aOutOfStock && bOutOfStock) return -1;
      
      switch (sortBy) {
        case 'randomize': return Math.random() - 0.5;
        case 'value': return (b.VALUE_RATING || 0) - (a.VALUE_RATING || 0);
        case 'popularity': return (b.POPULARITY || 0) - (a.POPULARITY || 0);
        case 'price_low':
          const priceA = parseFloat(String(a.PRICE || '').replace(/[^\d.]/g, '') || '0');
          const priceB = parseFloat(String(b.PRICE || '').replace(/[^\d.]/g, '') || '0');
          return priceA - priceB;
        case 'price_high':
          const priceA2 = parseFloat(String(a.PRICE || '').replace(/[^\d.]/g, '') || '0');
          const priceB2 = parseFloat(String(b.PRICE || '').replace(/[^\d.]/g, '') || '0');
          return priceB2 - priceA2;
        case 'protein':
          const proteinA = parseFloat(String(a.PROTEIN_SERVING || '').replace(/[^\d.]/g, '') || '0');
          const proteinB = parseFloat(String(b.PROTEIN_SERVING || '').replace(/[^\d.]/g, '') || '0');
          return proteinB - proteinA;
        case 'brand': return (a.COMPANY || '').localeCompare(b.COMPANY || '');
        default: return 0;
      }
    });
  }, [products, debouncedQuery, sortBy, quantityFilter, productTypeFilter]);

  // Simplified lookups for performance
  const topValueUrls = useMemo(() => new Set(bestValueProducts.map(p => p.URL || p.LINK)), [bestValueProducts]);

  // Products to display with pagination
  const displayedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, displayedCount);
  }, [filteredAndSortedProducts, displayedCount]);

// Load more products via IntersectionObserver (sequential)
useEffect(() => {
  const node = sentinelRef.current;
  if (!node) return;

  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry?.isIntersecting) return;
    if (isLoadingMore || loadingIntervalRef.current) return;
    if (displayedCountRef.current >= filteredAndSortedProducts.length) return;

    const remaining = filteredAndSortedProducts.length - displayedCountRef.current;
    const itemsToAdd = Math.min(28, Math.max(0, remaining));
    if (itemsToAdd <= 0) return;

    setIsLoadingMore(true);
    let added = 0;
    const step = () => {
      added += 1;
      setDisplayedCount((prev) => prev + 1);
      if (added >= itemsToAdd) {
        setIsLoadingMore(false);
        if (loadingIntervalRef.current) {
          window.clearTimeout(loadingIntervalRef.current);
          loadingIntervalRef.current = null;
        }
        return;
      }
      loadingIntervalRef.current = window.setTimeout(step, 80);
    };
    step();
  }, { root: null, threshold: 0.1 });

  observer.observe(node);
  return () => {
    observer.disconnect();
    if (loadingIntervalRef.current) {
      window.clearTimeout(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };
}, [filteredAndSortedProducts.length, isLoadingMore]);

// Keep displayedCount in a ref for observer without re-subscribing
useEffect(() => {
  displayedCountRef.current = displayedCount;
}, [displayedCount]);

// Ensure background video autoplays on mount/update
useEffect(() => {
  const v = videoRef.current;
  if (!v) return;
  v.muted = true;
  const p = v.play();
  if (p && typeof (p as any).catch === 'function') {
    (p as Promise<void>).catch(() => {
      v.muted = true;
      v.setAttribute('muted', 'true');
      v.play().catch(() => {});
    });
  }
}, [loading]);

// Reset displayed count when filters change
useEffect(() => {
  setDisplayedCount(28);
  if (loadingIntervalRef.current) {
    window.clearTimeout(loadingIntervalRef.current);
    loadingIntervalRef.current = null;
  }
  setIsLoadingMore(false);
}, [debouncedQuery, sortBy, quantityFilter, productTypeFilter, filteredAndSortedProducts.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Video Background with optimized loading */}
        <video 
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          disablePictureInPicture
          aria-hidden="true"
          className="video-background"
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) {
              v.muted = true;
              v.play().catch(() => {
                v.muted = true;
                v.setAttribute('muted', 'true');
                v.play().catch(() => {});
              });
            }
          }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-foreground drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">Loading Products...</p>
              <p className="text-sm text-foreground/80 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                Fetching the latest supplement prices and information
              </p>
            </div>
            <div className="flex justify-center space-x-2">
              <div className="w-4 h-4 bg-primary rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></div>
              <div className="w-4 h-4 bg-primary rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></div>
              <div className="w-4 h-4 bg-primary rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Failed to load products:</strong> {error}<br/>
              Please check your internet connection and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <ComparisonProvider>
      <div className="min-h-screen relative">
        {/* Video Background with optimized loading */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="video-background"
          preload="metadata"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        
        {/* Sticky Timer - Always at top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <StickyTimer lastUpdatedISO={lastUpdatedAt || undefined} />
        </div>

        {/* Background video for main view */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          disablePictureInPicture
          aria-hidden="true"
          className="video-background"
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) {
              v.muted = true;
              v.play().catch(() => {
                v.muted = true;
                v.setAttribute('muted', 'true');
                v.play().catch(() => {});
              });
            }
          }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>

        {/* Combined Header and Search - Single Animation */}
        <div className="relative z-10 transition-all duration-1000 delay-1000 pt-10 md:pt-12 fade-in-up">
          <div className="bg-background/20 backdrop-blur-xl shadow-lg">
            {/* Main Header */}
            <header className="text-foreground py-4 md:py-6 relative border border-white/10 rounded-lg mx-2 md:mx-4 bg-background/5">
              <div className="container mx-auto px-4">
                {/* Navigation Drawer - positioned absolutely on left */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <NavigationDrawer />
                </div>
                
                {/* Main content - truly centered against full page width */}
                <div className="text-center space-y-2 md:space-y-3">
                  <img 
                    src="/lovable-uploads/147a0591-cb92-4577-9a7e-31de1281abc2.png" 
                    alt="Intake Logo" 
                    className="h-8 md:h-10 mx-auto filter drop-shadow-[0_0_16px_rgba(255,255,255,0.6)]"
                  />
                  <p className="text-base md:text-lg text-foreground/90 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                    Find your next favourite supplement at the best possible price - updated daily.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Info className="h-3 w-3 text-foreground/70 hidden md:inline" />
                    <p className="text-[10px] md:text-xs text-foreground/70 drop-shadow-[0_0_2px_rgba(0,0,0,0.4)]">
                      All prices, information and images owned by the originators, hyperlinked. Intake may earn commission on purchases.
                    </p>
                  </div>
                  {/* Social Media Links */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <a 
                      href="https://instagram.com/use.intake" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-foreground/60 hover:text-foreground/90 transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </header>

            {/* Search Filters */}
            <div className="container mx-auto px-4 pb-6">
              <SearchFilters
                query={query}
                setQuery={setQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                quantityFilter={quantityFilter}
                setQuantityFilter={setQuantityFilter}
                productTypeFilter={productTypeFilter}
                setProductTypeFilter={setProductTypeFilter}
                resultCount={filteredAndSortedProducts.length}
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="relative z-10">

          {/* Best Value Products - Price/Protein Ratio */}
          {bestValueProducts.length > 0 && (
            <div className="container mx-auto px-2 md:px-4 pb-6">
              <div className="featured-products-container rounded-xl p-3 md:p-4 bg-background/5 backdrop-blur-sm">
                <h2 className="text-lg md:text-xl font-bold text-center mb-3 md:mb-4 text-foreground drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                  Today's Top Picks
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {bestValueProducts.map((product, index) => (
                    <div 
                      key={`best-value-${index}`}
                      className="staggered-fade-in"
                      style={{ animationDelay: `${1500 + (index * 150)}ms` }}
                    >
                      <div className="white-circle-border">
                        <ProductCard
                          product={product}
                          isFeatured={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="container mx-auto px-2 md:px-4 pb-8">
            {filteredAndSortedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 mb-8">
                  {displayedProducts.map((product, index) => (
                    <div 
                      key={`${product.URL || product.LINK}-${index}`}
                      className="staggered-fade-in"
                      style={{ animationDelay: `${Math.min(index * 50, 2000)}ms` }}
                    >
                      {top10Products.has(product.URL || product.LINK || '') ? (
                        <div className="white-circle-border">
                          <ProductCard
                            product={product}
                            isTopValue={true}
                          />
                        </div>
                      ) : (
                        <ProductCard
                          product={product}
                          isTopValue={false}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* IntersectionObserver sentinel */}
                {displayedCount < filteredAndSortedProducts.length && (
                  <div ref={sentinelRef} className="h-1" />
                )}

                {/* Loading more indicator */}
                {isLoadingMore && (
                  <div className="text-center py-6 md:py-8">
                    <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto mb-3 md:mb-4"></div>
                    <p className="text-foreground/70 text-sm">Loading more products...</p>
                  </div>
                )}

                {/* Load more message */}
                {displayedCount < filteredAndSortedProducts.length && !isLoadingMore && (
                  <div className="text-center py-8">
                    <p className="text-foreground/70 mb-2">Scroll down to load more products</p>
                    <p className="text-sm text-foreground/50">
                      Showing {displayedCount} of {filteredAndSortedProducts.length} products
                    </p>
                  </div>
                )}
              </>
            ) : (
               <div className="text-center py-12">
                 <p className="text-lg text-foreground/70 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">No products found matching your criteria.</p>
                 <p className="text-sm text-foreground/50 mt-2 drop-shadow-[0_0_2px_rgba(0,0,0,0.4)]">Try adjusting your search or filters.</p>
               </div>
             )}

             {/* Footer with product count and stock status */}
             <div className="text-center text-sm text-foreground/60 space-y-1">
               <p>
                 Showing {displayedProducts.length} of {products.length} products total
               </p>
               <p>
                 Stock levels and prices are updated regularly. Click any product to view current availability.
               </p>
             </div>
           </div>

          <CookiesDisclaimer />
          <ComparisonWidget />
          <ComparisonModal />
        </div>
      </div>
    </ComparisonProvider>
  );
}