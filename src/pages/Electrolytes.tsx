import { useState, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, SortDesc } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { NavigationDrawer } from "@/components/NavigationDrawer";
import { CookiesDisclaimer } from "@/components/CookiesDisclaimer";
import { ElectrolyteProductCard } from "@/components/ElectrolyteProductCard";
import { ElectrolyteComparisonWidget } from "@/components/ElectrolyteComparisonWidget";
import { ElectrolyteComparisonModal } from "@/components/ElectrolyteComparisonModal";
import { ElectrolyteComparisonProvider } from "@/hooks/useElectrolyteComparison";
import { filterByValidFlavor, countInvalidFlavors } from "@/utils/flavorFilter";
import {
  ElectrolyteProduct,
  hasValidPrice,
  calculateElectrolyteBenchmarks,
  calculateElectrolyteRankings,
  calculateElectrolyteValueRating,
} from "@/utils/electrolyteValueRating";
import { 
  processElectrolyteProducts,
  GroupedElectrolyteProduct 
} from "@/utils/electrolyteProductUtils";

export default function Electrolytes() {
  const [products, setProducts] = useState<ElectrolyteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [isSubscription, setIsSubscription] = useState(true);
  const [sortBy, setSortBy] = useState('value');
  const [displayedCount, setDisplayedCount] = useState(28);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch products from JSON
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://intake-collection-data.web.app/electrolytes/master_electrolytes.json');
        if (!response.ok) throw new Error(`Failed to load products: ${response.status}`);

        const parsed = await response.json();
        
        let items: ElectrolyteProduct[] = [];
        let metaDate: string | undefined;

        if (parsed._meta) {
          metaDate = parsed._meta.last_updated;
        }
        
        if (parsed.data && Array.isArray(parsed.data)) {
          items = parsed.data;
        } else if (Array.isArray(parsed)) {
          items = parsed;
        }

        // Apply core flavor filtering to remove invalid entries
        const validFlavors = filterByValidFlavor(items);
        const removedCount = countInvalidFlavors(items);
        
        console.log(`Loaded electrolyte products: ${items.length}, filtered out ${removedCount} with invalid flavors, remaining: ${validFlavors.length}`, metaDate ? `(lastUpdated: ${metaDate})` : '');

        setProducts(validFlavors);
        setLastUpdatedAt(metaDate || null);
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

  // Filter products based on subscription mode
  const filteredByMode = useMemo(() => {
    return products.filter(product => hasValidPrice(product, isSubscription));
  }, [products, isSubscription]);

  // Calculate benchmarks for current mode
  const benchmarks = useMemo(() => {
    if (filteredByMode.length === 0) return null;
    return calculateElectrolyteBenchmarks(filteredByMode, isSubscription);
  }, [filteredByMode, isSubscription]);

  // Calculate rankings for current mode
  const rankings = useMemo(() => {
    if (filteredByMode.length === 0 || !benchmarks) return null;
    return calculateElectrolyteRankings(filteredByMode, benchmarks, isSubscription);
  }, [filteredByMode, benchmarks, isSubscription]);

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!debouncedQuery.trim()) return filteredByMode;
    
    const searchLower = debouncedQuery.toLowerCase();
    return filteredByMode.filter(product => {
      const title = (product.TITLE || '').toLowerCase();
      const company = (product.COMPANY || '').toLowerCase();
      const flavour = (product.FLAVOUR || '').toLowerCase();
      
      return title.includes(searchLower) || 
             company.includes(searchLower) || 
             flavour.includes(searchLower);
    });
  }, [filteredByMode, debouncedQuery]);

  // Process: deduplicate and group by flavor (like protein page)
  const { grouped: groupedProducts, stats: processingStats } = useMemo(() => {
    const result = processElectrolyteProducts(searchFiltered, benchmarks, rankings, isSubscription);
    console.log(`Processing pipeline: ${result.stats.original} filtered → ${result.stats.deduplicated} deduplicated → ${result.stats.grouped} grouped tiles`);
    return result;
  }, [searchFiltered, benchmarks, rankings, isSubscription]);

  // Sort grouped products based on selected sort option
  const sortedProducts = useMemo(() => {
    if (!benchmarks || !rankings) return groupedProducts;
    
    return [...groupedProducts].sort((a, b) => {
      switch (sortBy) {
        case 'value':
          const ratingA = calculateElectrolyteValueRating(a, benchmarks, rankings, isSubscription) || 0;
          const ratingB = calculateElectrolyteValueRating(b, benchmarks, rankings, isSubscription) || 0;
          return ratingB - ratingA; // Higher rating = better = comes first
        case 'price_low':
          const priceA = isSubscription 
            ? parseFloat(String(a.SUB_PRICE || a.PRICE || '').replace(/[^\d.]/g, '') || '9999')
            : parseFloat(String(a.PRICE || '').replace(/[^\d.]/g, '') || '9999');
          const priceB = isSubscription 
            ? parseFloat(String(b.SUB_PRICE || b.PRICE || '').replace(/[^\d.]/g, '') || '9999')
            : parseFloat(String(b.PRICE || '').replace(/[^\d.]/g, '') || '9999');
          return priceA - priceB;
        case 'sodium':
          const sodiumA = parseFloat(String(a.SODIUM || '').replace(/[^\d.]/g, '') || '0');
          const sodiumB = parseFloat(String(b.SODIUM || '').replace(/[^\d.]/g, '') || '0');
          return sodiumB - sodiumA; // Higher sodium first
        default:
          return 0;
      }
    });
  }, [groupedProducts, benchmarks, rankings, isSubscription, sortBy]);

  // Get top value products
  const topValueProducts = useMemo(() => {
    return sortedProducts.slice(0, 4);
  }, [sortedProducts]);

  // Top value of day (rank 1)
  const topValueOfDayUrl = useMemo(() => {
    if (!rankings || rankings.totalRankedProducts === 0) return null;
    
    for (const [key, rank] of rankings.rankMap.entries()) {
      if (rank === 1) {
        return key;
      }
    }
    return null;
  }, [rankings]);

  // Products to display with pagination
  const displayedProducts = useMemo(() => {
    return sortedProducts.slice(0, displayedCount);
  }, [sortedProducts, displayedCount]);

  // Infinite scroll
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || isLoadingRef.current) return;
      if (displayedCount >= sortedProducts.length) return;

      isLoadingRef.current = true;
      setIsLoadingMore(true);

      const toAdd = Math.min(28, sortedProducts.length - displayedCount);
      if (toAdd > 0) {
        setDisplayedCount(prev => prev + toAdd);
      }

      setTimeout(() => {
        isLoadingRef.current = false;
        setIsLoadingMore(false);
      }, 80);
    }, { threshold: 0.01, rootMargin: '200px 0px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [displayedCount, sortedProducts.length]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(28);
  }, [debouncedQuery, isSubscription, sortBy]);

  // Ensure video autoplay
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <video 
          ref={videoRef}
          autoPlay muted playsInline loop
          className="video-background"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-foreground drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">Loading Electrolytes...</p>
              <p className="text-sm text-foreground/80 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                Fetching the latest electrolyte supplement prices
              </p>
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
              <strong>Failed to load products:</strong> {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <ElectrolyteComparisonProvider>
    <div className="min-h-screen relative">
      {/* Video Background */}
      <video 
        ref={videoRef}
        autoPlay muted loop playsInline
        className="video-background"
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>

      {/* Header */}
      <div className="relative z-10 pt-4 md:pt-6">
        <div className="container mx-auto px-2 md:px-4">
          <div className="bg-background/20 backdrop-blur-xl shadow-lg rounded-lg">
            <header className="text-foreground py-3 md:py-5 relative">
              <div className="px-4 md:px-6">
                {/* Navigation */}
                <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2">
                  <NavigationDrawer />
                </div>
                
                {/* Header Content */}
                <div className="text-center space-y-2 md:space-y-3 px-8 md:px-0">
                  <Link to="/">
                    <img 
                      src="/lovable-uploads/147a0591-cb92-4577-9a7e-31de1281abc2.png" 
                      alt="Intake Logo" 
                      className="h-5 md:h-8 mx-auto filter drop-shadow-[0_0_16px_rgba(255,255,255,0.6)]"
                    />
                  </Link>
                  <h1 className="text-lg md:text-2xl font-bold text-foreground drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
                    Electrolyte Supplements
                  </h1>
                  <p className="text-xs md:text-sm text-foreground/80 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                    Compare electrolyte supplements - find the best value for hydration
                  </p>
                  {lastUpdatedAt && (
                    <p className="text-[10px] md:text-xs text-foreground/60">
                      Last updated: {lastUpdatedAt}
                    </p>
                  )}
                </div>
              </div>
            </header>

            {/* Search and Toggle */}
            <div className="px-4 md:px-6 pb-4 md:pb-5 space-y-3">
              {/* Subscription Toggle + Sort Dropdown Row */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-3 sm:p-4 bg-background/30 rounded-lg border-2 border-white/20">
                {/* Subscription Toggle */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setIsSubscription(false)}
                    className={`text-xs sm:text-sm font-medium transition-all duration-200 px-2 sm:px-3 py-1.5 rounded-md whitespace-nowrap ${
                      !isSubscription 
                        ? 'text-primary bg-primary/20 shadow-sm' 
                        : 'text-foreground/60 hover:text-foreground/80'
                    }`}
                  >
                    One-Time
                  </button>
                  
                  <Switch
                    id="subscription-toggle"
                    checked={isSubscription}
                    onCheckedChange={setIsSubscription}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
                  />
                  
                  <button
                    onClick={() => setIsSubscription(true)}
                    className={`text-xs sm:text-sm font-medium transition-all duration-200 px-2 sm:px-3 py-1.5 rounded-md whitespace-nowrap ${
                      isSubscription 
                        ? 'text-primary bg-primary/20 shadow-sm' 
                        : 'text-foreground/60 hover:text-foreground/80'
                    }`}
                  >
                    Subscription
                  </button>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-6 bg-white/30" />

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 h-8 text-xs w-full sm:w-[160px]">
                    <div className="flex items-center gap-1 truncate">
                      <SortDesc className="h-3 w-3 shrink-0 text-white/70" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-lg z-50">
                    <SelectItem value="value">Best Value</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="sodium">Sodium per Serving</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search electrolyte supplements..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-background/20 border-white/30 text-foreground placeholder:text-white/70 focus:bg-background/30 focus:border-white/50 h-7 text-xs"
                />
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between text-xs text-foreground/70">
                <span>
                  {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} 
                  {processingStats.grouped < processingStats.deduplicated && (
                    <span className="text-foreground/50 ml-1">
                      ({processingStats.deduplicated} variants)
                    </span>
                  )}
                </span>
                <span>{isSubscription ? 'Subscription mode' : 'One-time purchase mode'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="relative z-10">
        {/* Top Value Products */}
        {topValueProducts.length > 0 && !debouncedQuery.trim() && (
          <div className="container mx-auto px-2 md:px-4 py-6">
            <div className="featured-products-container rounded-xl p-3 md:p-4 bg-background/5 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold text-center mb-3 md:mb-4 text-foreground drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                {isSubscription ? "Best Subscription Deals" : "Best One-Time Purchases"}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {topValueProducts.map((product, index) => {
                  const productUrl = product.PAGE_URL || `${product.TITLE}-${product.FLAVOUR}`;
                  const isTopValueOfDay = topValueOfDayUrl === productUrl;
                  
                  return (
                    <div 
                      key={`top-${index}`}
                      className="staggered-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="white-circle-border">
                        <ElectrolyteProductCard
                          product={product}
                          isSubscription={isSubscription}
                          benchmarks={benchmarks}
                          rankings={rankings}
                          isTopValue={!isTopValueOfDay}
                          isTopValueOfDay={isTopValueOfDay}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="container mx-auto px-2 md:px-4 pb-8">
          {sortedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 mb-8">
                {displayedProducts.map((product, index) => {
                  const productUrl = product.PAGE_URL || `${product.TITLE}-${product.FLAVOUR}`;
                  const isTopValueOfDay = topValueOfDayUrl === productUrl;
                  const isTop10 = index < 10;
                  
                  return (
                    <div 
                      key={`${productUrl}-${index}`}
                      className="staggered-fade-in"
                      style={{ animationDelay: `${Math.min(index, 20) * 40}ms` }}
                    >
                      {(isTop10 || isTopValueOfDay) ? (
                        <div className="white-circle-border">
                          <ElectrolyteProductCard
                            product={product}
                            isSubscription={isSubscription}
                            benchmarks={benchmarks}
                            rankings={rankings}
                            isTopValue={isTop10 && !isTopValueOfDay}
                            isTopValueOfDay={isTopValueOfDay}
                          />
                        </div>
                      ) : (
                        <ElectrolyteProductCard
                          product={product}
                          isSubscription={isSubscription}
                          benchmarks={benchmarks}
                          rankings={rankings}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sentinel for infinite scroll */}
              {displayedCount < sortedProducts.length && (
                <div ref={sentinelRef} className="h-10 w-full opacity-0 pointer-events-none" />
              )}

              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-foreground/70 text-sm">Loading more products...</p>
                </div>
              )}

              {/* Show more message */}
              {displayedCount < sortedProducts.length && !isLoadingMore && (
                <div className="text-center py-8">
                  <p className="text-foreground/70 mb-2">Scroll down to load more products</p>
                  <p className="text-sm text-foreground/50">
                    Showing {displayedCount} of {sortedProducts.length} products
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-foreground/70 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                No products found {isSubscription ? 'with subscription pricing' : 'for one-time purchase'}.
              </p>
              <p className="text-sm text-foreground/50 mt-2">
                Try {isSubscription ? 'switching to one-time purchase' : 'switching to subscription mode'} or adjusting your search.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-foreground/60 space-y-1 mt-8">
            <p>
              Showing {displayedProducts.length} of {sortedProducts.length} products
            </p>
            <p>
              <strong>Value Rating Weightings:</strong> 35% Cost/Serving, 30% Electrolyte Content, 20% Discount, 15% Servings
            </p>
          </div>
        </div>

        <CookiesDisclaimer />
        
        {/* Comparison Widget & Modal */}
        <ElectrolyteComparisonWidget />
        <ElectrolyteComparisonModal 
          isSubscription={isSubscription} 
          benchmarks={benchmarks} 
          rankings={rankings} 
        />
      </div>
    </div>
    </ElectrolyteComparisonProvider>
  );
}
