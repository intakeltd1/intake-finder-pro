import React, { useEffect, useState, useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { SearchFilters } from '@/components/SearchFilters';
import { Header, StickyTimer } from '@/components/Header';
import { filterProducts, sortProducts, getTopValueProducts, getMostPopularProducts, type Product } from '@/utils/productUtils';
import { Loader2, Package, AlertCircle, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [quantityFilter, setQuantityFilter] = useState('all');
  const [goalFilter, setGoalFilter] = useState('all');

  // Fetch products data
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/data/products.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: Product[] = await response.json();
        
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load product data');
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = filterProducts(products, query, quantityFilter, goalFilter);
    return sortProducts(filtered, sortBy);
  }, [products, query, quantityFilter, goalFilter, sortBy]);

  // Get featured and special products
  const topValueProducts = useMemo(() => getTopValueProducts(products, 15), [products]);
  const mostPopularProducts = useMemo(() => getMostPopularProducts(products, 10), [products]);
  const featuredProducts = useMemo(() => getTopValueProducts(products, 4), [products]);

  // Create sets for quick lookup
  const topValueUrls = useMemo(() => new Set(topValueProducts.map(p => p.URL || p.LINK)), [topValueProducts]);
  const popularUrls = useMemo(() => new Set(mostPopularProducts.map(p => p.URL || p.LINK)), [mostPopularProducts]);
  const featuredUrls = useMemo(() => new Set(featuredProducts.map(p => p.URL || p.LINK)), [featuredProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-brand-teal-light">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="relative">
              <Package className="h-16 w-16 text-primary mx-auto animate-pulse" />
              <Loader2 className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Loading Products</h2>
              <p className="text-muted-foreground">Fetching the latest product data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-brand-teal-light">
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Error loading products:</strong> {error}
              <br />
              Please check your internet connection and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-brand-teal-light">
      <Header />
      <StickyTimer />
      
      {/* Main Header */}
      <header className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3">
            <img 
              src="/lovable-uploads/7e55fb2f-97f7-4fa3-8d87-769e628542ab.png" 
              alt="Intake Logo" 
              className="h-20 mx-auto"
            />
            <p className="text-xl text-primary-foreground/90">
              Find your next favourite supplement at the best possible price - updated daily.
            </p>
            <p className="text-xs text-primary-foreground/70 max-w-3xl mx-auto">
              All prices & images owned by originators. Intake may earn commission on purchases.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Filters */}
        <div className="mb-8">
          <SearchFilters
            query={query}
            setQuery={setQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            quantityFilter={quantityFilter}
            setQuantityFilter={setQuantityFilter}
            goalFilter={goalFilter}
            setGoalFilter={setGoalFilter}
            resultCount={filteredAndSortedProducts.length}
          />
        </div>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && !query && goalFilter === 'all' && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Featured - Best Value Products</h2>
            </div>
            <div className="featured-products-container p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product, index) => (
                  <ProductCard 
                    key={`featured-${index}`} 
                    product={product} 
                    isFeatured={true}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product, index) => {
              const productUrl = product.URL || product.LINK;
              const isTopValue = topValueUrls.has(productUrl);
              const isPopular = popularUrls.has(productUrl);
              const isFeatured = featuredUrls.has(productUrl);
              
              return (
                <ProductCard 
                  key={index} 
                  product={product} 
                  isTopValue={isTopValue && !isFeatured}
                  isPopular={isPopular && !isFeatured && !isTopValue}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {query || quantityFilter || goalFilter !== 'all'
                ? "Try adjusting your search criteria or filters"
                : "No products available at the moment"
              }
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted mt-12 py-8">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-muted-foreground">
            Showing {filteredAndSortedProducts.length} of {products.length} products
          </p>
          <p className="text-sm text-muted-foreground">
            {(() => {
              const outOfStockCount = filteredAndSortedProducts.filter(product => {
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
                );
              }).length;
              const inStockCount = filteredAndSortedProducts.length - outOfStockCount;
              return `${inStockCount} in stock • ${outOfStockCount} out of stock`;
            })()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;