import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { ElectrolyteProduct } from '@/utils/electrolyteValueRating';

interface ElectrolyteComparisonContextType {
  comparisonProducts: ElectrolyteProduct[];
  addToComparison: (product: ElectrolyteProduct) => void;
  removeFromComparison: (productKey: string) => void;
  clearComparison: () => void;
  isInComparison: (product: ElectrolyteProduct) => boolean;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
}

const ElectrolyteComparisonContext = createContext<ElectrolyteComparisonContextType | undefined>(undefined);

const getProductKey = (product: ElectrolyteProduct | undefined | null): string => {
  if (!product) return '';
  return product.PAGE_URL || `${product.TITLE}-${product.FLAVOUR}`;
};

export function ElectrolyteComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonProducts, setComparisonProducts] = useState<ElectrolyteProduct[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const addToComparison = useCallback((product: ElectrolyteProduct) => {
    setComparisonProducts(prev => {
      if (prev.length >= 4) return prev;
      const productKey = getProductKey(product);
      if (prev.some(p => getProductKey(p) === productKey)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromComparison = useCallback((productKey: string) => {
    setComparisonProducts(prev => 
      prev.filter(p => getProductKey(p) !== productKey)
    );
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
    setShowComparison(false);
  }, []);

  const isInComparison = useCallback((product: ElectrolyteProduct | undefined | null) => {
    if (!product) return false;
    const productKey = getProductKey(product);
    return comparisonProducts.some(p => getProductKey(p) === productKey);
  }, [comparisonProducts]);

  return (
    <ElectrolyteComparisonContext.Provider value={{
      comparisonProducts,
      addToComparison,
      removeFromComparison,
      clearComparison,
      isInComparison,
      showComparison,
      setShowComparison
    }}>
      {children}
    </ElectrolyteComparisonContext.Provider>
  );
}

export function useElectrolyteComparison() {
  const context = useContext(ElectrolyteComparisonContext);
  if (context === undefined) {
    throw new Error('useElectrolyteComparison must be used within an ElectrolyteComparisonProvider');
  }
  return context;
}

export { getProductKey };
