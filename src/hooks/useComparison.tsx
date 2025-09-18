import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Product } from '@/utils/productUtils';

interface ComparisonContextType {
  comparisonProducts: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (productUrl: string) => void;
  clearComparison: () => void;
  isInComparison: (product: Product) => boolean;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const addToComparison = useCallback((product: Product) => {
    setComparisonProducts(prev => {
      if (prev.length >= 4) return prev;
      const productUrl = product.URL || product.LINK;
      if (prev.some(p => (p.URL || p.LINK) === productUrl)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromComparison = useCallback((productUrl: string) => {
    setComparisonProducts(prev => 
      prev.filter(p => (p.URL || p.LINK) !== productUrl)
    );
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
    setShowComparison(false);
  }, []);

  const isInComparison = useCallback((product: Product) => {
    const productUrl = product.URL || product.LINK;
    return comparisonProducts.some(p => (p.URL || p.LINK) === productUrl);
  }, [comparisonProducts]);

  return (
    <ComparisonContext.Provider value={{
      comparisonProducts,
      addToComparison,
      removeFromComparison,
      clearComparison,
      isInComparison,
      showComparison,
      setShowComparison
    }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}