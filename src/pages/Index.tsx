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

// Data transformation function to handle different field naming conventions
function transformProductData(rawProduct: any): Product {
  // Handle different possible field names from external data sources
  const getField = (fieldVariants: string[]) => {
    for (const variant of fieldVariants) {
      if (rawProduct[variant] !== undefined && rawProduct[variant] !== null && rawProduct[variant] !== 'nan') {
        return rawProduct[variant];
      }
    }
    return undefined;
  };

  const transformed: Product = {
    TITLE: getField(['TITLE', 'title', 'name', 'product_name', 'Name']) || 'Product Name Not Available',
    COMPANY: getField(['COMPANY', 'company', 'brand', 'manufacturer', 'Brand']) || 'Unknown Brand',
    PRICE: getField(['PRICE', 'price', 'cost', 'Price']) || 'Price N/A',
    AMOUNT: getField(['AMOUNT', 'amount', 'size', 'weight', 'quantity', 'Amount']) || undefined,
    PROTEIN_SERVING: getField(['PROTEIN_SERVING', 'protein_serving', 'protein', 'protein_per_serving', 'Protein']) || undefined,
    FLAVOUR: getField(['FLAVOUR', 'flavour', 'flavor', 'Flavor', 'Flavour']) || undefined,
    LINK: getField(['LINK', 'link', 'url', 'product_url', 'URL']) || undefined,
    URL: getField(['URL', 'url', 'link', 'product_url', 'LINK']) || undefined,
    IMAGE_URL: getField(['IMAGE_URL', 'image_url', 'image', 'picture', 'photo', 'img']) || undefined,
    STOCK_STATUS: getField(['STOCK_STATUS', 'stock_status', 'stock', 'availability', 'in_stock']) || undefined,
    VALUE_RATING: getField(['VALUE_RATING', 'value_rating', 'value', 'rating']) || 0,
    POPULARITY: getField(['POPULARITY', 'popularity', 'popular', 'clicks']) || 0,
    FEATURED: getField(['FEATURED', 'featured', 'is_featured']) || false,
  };

  // Copy any other fields that might be useful
  Object.keys(rawProduct).forEach(key => {
    if (!transformed.hasOwnProperty(key.toUpperCase())) {
      transformed[key] = rawProduct[key];
    }
  });

  return transformed;
}

// Helper function to check if a product has sufficient data to display
function hasMinimumData(product: Product): boolean {
  const requiredFields = [
    product.TITLE && product.TITLE !== 'Product Name Not Available',
    product.PRICE && product.PRICE !== 'Price N/A',
    product.IMAGE_URL
  ];
  
  // Count non-null required fields
  const validFields = requiredFields.filter(Boolean).length;
  return validFields >= 2; // At least 2 out of 3 essential fields (title, price, image)
}

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
  const [sortBy, setSortBy] = useState('value');
  const [quantityFilter, setQuantityFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [isRandomized, setIsRandomized] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(28);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingIntervalRef = useRef<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const batchStartRef = useRef(0);
  

// Fetch products from JSON
useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://intake-collection-data.web.app/master_cleaned.json');
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
      
      // Debug: Log the structure of the first few products to understand the data format
      if (items && items.length > 0) {
        console.log('First product structure:', items[0]);
        console.log('Sample product fields:', Object.keys(items[0] || {}));
        console.log('First 3 products:', items.slice(0, 3));
      }
      
      // Transform data to match expected field structure and filter out products with insufficient data
      const transformedProducts = items.map(transformProductData).filter(hasMinimumData);
      
      console.log(`Filtered products: ${transformedProducts.length} out of ${items.length} products have sufficient data`);
      
      setProducts(transformedProducts || []);
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


  // Check if any search criteria is active
  const hasSearchCriteria = useMemo(() => {
    return debouncedQuery.trim() !== '' || quantityFilter !== 'all' || productTypeFilter !== 'all' || sortBy !== 'value';
  }, [debouncedQuery, quantityFilter, productTypeFilter, sortBy]);

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
      
      // Use randomise when no search criteria, otherwise use selected sort
      const effectiveSort = hasSearchCriteria ? sortBy : 'randomise';
      
      switch (effectiveSort) {
        case 'randomise': return Math.random() - 0.5;
        case 'value': return (b.VALUE_RATING || 0) - (a.VALUE_RATING || 0);
        case 'price_low':
          const priceA = parseFloat(String(a.PRICE || '').replace(/[^\d.]/g, '') || '0');
          const priceB = parseFloat(String(b.PRICE || '').replace(/[^\d.]/g, '') || '0');
          return priceA - priceB;
        case 'protein':
          const proteinA = parseFloat(String(a.PROTEIN_SERVING || '').replace(/[^\d.]/g, '') || '0');
          const proteinB = parseFloat(String(b.PROTEIN_SERVING || '').replace(/[^\d.]/g, '') || '0');
          return proteinB - proteinA;
        default: return 0;
      }
    });
  }, [products, debouncedQuery, sortBy, quantityFilter, productTypeFilter, hasSearchCriteria]);

  // Simplified lookups for performance
  const topValueUrls = useMemo(() => new Set(bestValueProducts.map(p => p.URL || p.LINK)), [bestValueProducts]);

  // Products to display with pagination
  const displayedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, displayedCount);
  }, [filteredAndSortedProducts, displayedCount]);

// Load more products via IntersectionObserver (batched 28, quick trigger)
useEffect(() => {
  const node = sentinelRef.current;
  if (!node) return;

  let ticking = false;
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    if (ticking || isLoadingRef.current) return;
    if (displayedCount >= filteredAndSortedProducts.length) return;

    ticking = true;
    isLoadingRef.current = true;
    setIsLoadingMore(true);

    const current = displayedCount;
    batchStartRef.current = current;
    const remaining = filteredAndSortedProducts.length - current;
    const toAdd = Math.min(28, Math.max(0, remaining));

    if (toAdd > 0) {
      setDisplayedCount(current + toAdd);
    }

    // Reset guards quickly to allow subsequent batches
    window.setTimeout(() => {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
      ticking = false;
    }, 80);
  }, { root: null, threshold: 0.01, rootMargin: '200px 0px 200px 0px' });

  observer.observe(node);
  return () => {
    observer.disconnect();
  };
}, [displayedCount, filteredAndSortedProducts.length]);

// Fallback: window scroll listener to trigger load when near bottom
useEffect(() => {
  const onScroll = () => {
    if (isLoadingRef.current) return;
    const doc = document.documentElement;
    const scrollPos = window.innerHeight + window.scrollY;
    const threshold = doc.scrollHeight - 600;
    if (scrollPos >= threshold) {
      if (displayedCount >= filteredAndSortedProducts.length) return;
      isLoadingRef.current = true;
      setIsLoadingMore(true);
      const current = displayedCount;
      batchStartRef.current = current;
      const remaining = filteredAndSortedProducts.length - current;
      const toAdd = Math.min(28, Math.max(0, remaining));
      if (toAdd > 0) setDisplayedCount(current + toAdd);
      window.setTimeout(() => {
        isLoadingRef.current = false;
        setIsLoadingMore(false);
      }, 80);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true } as any);
  return () => window.removeEventListener('scroll', onScroll);
}, [displayedCount, filteredAndSortedProducts.length]);

// removed displayedCountRef - using functional updates instead

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

        {/* Combined Header and Search - Single Integrated Box */}
        <div className="relative z-10 transition-all duration-1000 delay-1000 pt-8 md:pt-10 fade-in-up">
          <div className="container mx-auto px-2 md:px-4">
            <div className="bg-background/20 backdrop-blur-xl shadow-lg rounded-lg">
              {/* Main Header */}
              <header className="text-foreground py-3 md:py-5 relative">
                <div className="px-4 md:px-6">
                  {/* Navigation Drawer - positioned absolutely on left */}
                  <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2">
                    <NavigationDrawer />
                  </div>
                  
                  {/* Main content - truly centered against full page width */}
                  <div className="text-center space-y-2 md:space-y-3 px-8 md:px-0">
                    <img 
                      src="/lovable-uploads/147a0591-cb92-4577-9a7e-31de1281abc2.png" 
                      alt="Intake Logo" 
                      className="h-5 md:h-8 mx-auto filter drop-shadow-[0_0_16px_rgba(255,255,255,0.6)]"
                    />
                    <p className="text-xs md:text-base text-foreground/90 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)] leading-tight">
                      Find your next favourite supplement at the best possible price - updated daily.
                    </p>
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      <Info className="h-2 w-2 md:h-3 md:w-3 text-foreground/70 hidden md:inline flex-shrink-0" />
                      <p className="text-[8px] md:text-xs text-foreground/70 drop-shadow-[0_0_2px_rgba(0,0,0,0.4)] leading-tight">
                        All prices, information and images owned by the originators, hyperlinked. Intake may earn commission on purchases.
                      </p>
                    </div>
                    
                    {/* TEMPORARY AWIN TEST LINK - REMOVE AFTER TESTING */}
                    <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-center">
                      <p className="text-xs text-yellow-100 mb-1">AWIN Test Link (Temporary)</p>
                      <a 
                        href="http://convertalinktest.awin.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-yellow-300 underline text-xs hover:text-yellow-100"
                      >
                        Click to Test Convert-a-Link
                      </a>
                    </div>
                  </div>
                </div>
              </header>

              {/* Search Filters - Integrated */}
              <div className="px-4 md:px-6 pb-4 md:pb-5">
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
        </div>

        {/* Products Section */}
        <div className="relative z-10">

          {/* Best Value Products - Price/Protein Ratio - Only show when no search criteria */}
          {bestValueProducts.length > 0 && !hasSearchCriteria && (
            <div className="container mx-auto px-2 md:px-4 pb-6 transition-all duration-300 animate-fade-in">
              <div className="featured-products-container rounded-xl p-3 md:p-4 bg-background/5 backdrop-blur-sm">
                <h2 className="text-lg md:text-xl font-bold text-center mb-3 md:mb-4 text-foreground drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                  Today's Top Picks
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {bestValueProducts.map((product, index) => (
                    <div 
                      key={`best-value-${index}`}
                      className="staggered-fade-in"
                      style={{ animationDelay: `${500 + (index * 100)}ms` }}
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
                      style={{ animationDelay: `${Math.max(0, (index - batchStartRef.current)) * 40}ms` }}
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
                  <div ref={sentinelRef} className="h-10 w-full opacity-0 pointer-events-none" aria-hidden="true" />
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