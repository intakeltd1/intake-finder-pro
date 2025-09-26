import { useState, useEffect, useMemo } from 'react';
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
import { applyFuzzySearch } from "@/utils/productUtils";
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
  const [sortBy, setSortBy] = useState('default');
  const [quantityFilter, setQuantityFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [isRandomized, setIsRandomized] = useState(false);
  const { isScrolled } = useScrollAnimations();

  // Fetch products from JSON
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/products.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded products:', data?.length);
        setProducts(data || []);
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

  // Helper function to check if product is out of stock
  const isOutOfStock = (product: Product): boolean => {
    const stockIndicators = [
      product.STOCK_STATUS?.toLowerCase(),
      product.PRICE?.toLowerCase(),
      product.TITLE?.toLowerCase(),
      product.AMOUNT?.toLowerCase()
    ];
    
    return stockIndicators.some(indicator => 
      indicator?.includes('out of stock') ||
      indicator?.includes('unavailable') ||
      indicator?.includes('sold out') ||
      indicator === 'out' ||
      indicator === '0'
    ) || false;
  };

  // Calculate best value products (price/protein ratio)
  const bestValueProducts = useMemo(() => {
    return products
      .filter(p => p.PRICE && p.PROTEIN_SERVING)
      .map(p => {
        const price = parseFloat(p.PRICE.replace(/[^\d.]/g, '') || '0');
        const protein = parseFloat(p.PROTEIN_SERVING.replace(/[^\d.]/g, '') || '0');
        const ratio = protein > 0 ? protein / price : 0;
        return { ...p, valueRatio: ratio };
      })
      .sort((a, b) => b.valueRatio - a.valueRatio)
      .slice(0, 4);
  }, [products]);

  // Filter and sort products with fuzzy search
  const filteredAndSortedProducts = useMemo(() => {
    console.log('Filtering products with query:', query);
    let filtered = applyFuzzySearch(products, query);
    console.log('After fuzzy search:', filtered.length);

    // Apply quantity filter
    if (quantityFilter !== 'all') {
      filtered = filtered.filter(product => {
        const amount = product.AMOUNT?.toLowerCase() || '';
        switch (quantityFilter) {
          case '<1kg':
            return amount.includes('g') && !amount.includes('kg');
          case '1-2kg':
            return amount.includes('1kg') || amount.includes('1.') || 
                   (amount.includes('2kg') && !amount.includes('2.5') && !amount.includes('2.7'));
          case '2-3kg':
            return amount.includes('2.') || amount.includes('2kg') || amount.includes('3kg');
          case '3-5kg':
            return amount.includes('3.') || amount.includes('4') || amount.includes('5kg');
          case '>5kg':
            return amount.includes('6') || amount.includes('7') || amount.includes('8') || 
                   amount.includes('9') || amount.includes('10');
          default:
            return true;
        }
      });
    }

    // Apply product type filter
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(product => {
        const title = product.TITLE?.toLowerCase() || '';
        const company = product.COMPANY?.toLowerCase() || '';
        
        switch (productTypeFilter) {
          case 'whey':
            return title.includes('whey') && !title.includes('vegan');
          case 'vegan':
            return title.includes('vegan') || title.includes('plant') || title.includes('pea');
          case 'clear':
            return title.includes('clear') || title.includes('juice');
          case 'diet':
            return title.includes('diet') || title.includes('lean') || title.includes('cut');
          case 'mass':
            return title.includes('mass') || title.includes('gainer') || title.includes('bulk');
          default:
            return true;
        }
      });
    }

    // Sort products - out of stock always go to bottom
    let sorted = [...filtered].sort((a, b) => {
      const aOutOfStock = isOutOfStock(a);
      const bOutOfStock = isOutOfStock(b);
      
      // First, separate in-stock from out-of-stock
      if (aOutOfStock && !bOutOfStock) return 1;
      if (!aOutOfStock && bOutOfStock) return -1;
      
      // Then apply regular sorting within each group
      switch (sortBy) {
        case 'randomize':
          return Math.random() - 0.5;
        case 'value':
          return (b.VALUE_RATING || 0) - (a.VALUE_RATING || 0);
        case 'popularity':
          return (b.POPULARITY || 0) - (a.POPULARITY || 0);
        case 'price_low':
          const priceA = parseFloat(a.PRICE?.replace(/[^\d.]/g, '') ? a.PRICE.replace(/[^\d.]/g, '') : '0');
          const priceB = parseFloat(b.PRICE?.replace(/[^\d.]/g, '') ? b.PRICE.replace(/[^\d.]/g, '') : '0');
          return priceA - priceB;
        case 'price_high':
          const priceA2 = parseFloat(a.PRICE?.replace(/[^\d.]/g, '') ? a.PRICE.replace(/[^\d.]/g, '') : '0');
          const priceB2 = parseFloat(b.PRICE?.replace(/[^\d.]/g, '') ? b.PRICE.replace(/[^\d.]/g, '') : '0');
          return priceB2 - priceA2;
        case 'protein':
          const proteinA = parseFloat(a.PROTEIN_SERVING?.replace(/[^\d.]/g, '') ? a.PROTEIN_SERVING.replace(/[^\d.]/g, '') : '0');
          const proteinB = parseFloat(b.PROTEIN_SERVING?.replace(/[^\d.]/g, '') ? b.PROTEIN_SERVING.replace(/[^\d.]/g, '') : '0');
          return proteinB - proteinA;
        case 'brand':
          return (a.COMPANY || '').localeCompare(b.COMPANY || '');
        default:
          return 0;
      }
    });

    // If randomize is selected, shuffle again to ensure true randomization
    if (sortBy === 'randomize') {
      const inStock = sorted.filter(p => !isOutOfStock(p));
      const outOfStock = sorted.filter(p => isOutOfStock(p));
      
      for (let i = inStock.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [inStock[i], inStock[j]] = [inStock[j], inStock[i]];
      }
      
      sorted = [...inStock, ...outOfStock];
    }

    return sorted;
  }, [products, query, sortBy, quantityFilter, productTypeFilter]);

  // Special product categories
  const topValueProducts = useMemo(() => {
    return products
      .filter(p => p.VALUE_RATING && p.VALUE_RATING >= 8)
      .sort((a, b) => (b.VALUE_RATING || 0) - (a.VALUE_RATING || 0))
      .slice(0, 8);
  }, [products]);

  const mostPopularProducts = useMemo(() => {
    return products
      .filter(p => p.POPULARITY && p.POPULARITY >= 8)
      .sort((a, b) => (b.POPULARITY || 0) - (a.POPULARITY || 0))
      .slice(0, 8);
  }, [products]);

  const featuredProducts = useMemo(() => {
    return products.filter(p => p.FEATURED === true).slice(0, 8);
  }, [products]);

  // Create Sets for O(1) lookup
  const topValueUrls = useMemo(() => new Set(topValueProducts.map(p => p.URL || p.LINK)), [topValueProducts]);
  const popularUrls = useMemo(() => new Set(mostPopularProducts.map(p => p.URL || p.LINK)), [mostPopularProducts]);
  const featuredUrls = useMemo(() => new Set(featuredProducts.map(p => p.URL || p.LINK)), [featuredProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Video Background for Loading */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="video-background"
          preload="auto"
        >
          <source src="/background-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
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
        {/* Video Background */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="video-background"
          preload="auto"
          onLoadStart={() => console.log('Video loading started')}
          onCanPlay={() => console.log('Video can play')}
          onError={(e) => console.error('Video error:', e)}
        >
          <source src="/background-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Sticky Timer - Always at top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <StickyTimer />
        </div>

        {/* Combined Header and Search - Animated */}
        <div className={`relative z-10 transition-all duration-1000 delay-1000 pt-12 ${isScrolled ? 'fade-out-down' : 'fade-in-up'}`}>
          <div className="bg-background/30 backdrop-blur-xl border-b border-white/30 shadow-lg">
            {/* Main Header */}
            <header className="text-foreground py-6 relative">
              <div className="container mx-auto px-4">
                {/* Navigation Drawer - positioned absolutely on left */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <NavigationDrawer />
                </div>
                
                {/* Main content - truly centered against full page width */}
                <div className="text-center space-y-3">
                  <img 
                    src="/lovable-uploads/147a0591-cb92-4577-9a7e-31de1281abc2.png" 
                    alt="Intake Logo" 
                    className="h-10 mx-auto filter drop-shadow-[0_0_16px_rgba(255,255,255,0.6)]"
                  />
                  <p className="text-lg text-foreground/90 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                    Find your next favourite supplement at the best possible price - updated daily.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Info className="h-3 w-3 text-foreground/70" />
                    <p className="text-xs text-foreground/70 drop-shadow-[0_0_2px_rgba(0,0,0,0.4)]">
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
            <div className="container mx-auto px-4 pb-6">
              <div className="featured-products-container rounded-xl p-4 bg-background/10 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-center mb-4 text-foreground drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                  Best Value Products (Protein per £)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {bestValueProducts.map((product, index) => (
                    <div 
                      key={`best-value-${index}`}
                      className="staggered-fade-in"
                      style={{ animationDelay: `${2000 + (index * 200)}ms` }}
                    >
                      <ProductCard
                        product={product}
                        isFeatured={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="container mx-auto px-4 pb-8">
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
                {filteredAndSortedProducts.map((product, index) => (
                  <div 
                    key={index}
                    className="staggered-fade-in"
                    style={{ animationDelay: `${2000 + (index * 100)}ms` }}
                  >
                    <ProductCard
                      product={product}
                      isTopValue={topValueUrls.has(product.URL || product.LINK || '')}
                      isPopular={popularUrls.has(product.URL || product.LINK || '')}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-foreground/70 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">No products found matching your criteria.</p>
                <p className="text-sm text-foreground/50 mt-2 drop-shadow-[0_0_2px_rgba(0,0,0,0.4)]">Try adjusting your search or filters.</p>
              </div>
            )}

            {/* Footer with product count and stock status */}
            <div className="text-center text-sm text-foreground/60 space-y-1">
              <p>
                Showing {filteredAndSortedProducts.length} of {products.length} products
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