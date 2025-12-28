// Utility functions for electrolyte product data processing
import { 
  ElectrolyteProduct, 
  calculateElectrolyteValueRating, 
  ElectrolyteBenchmarks, 
  ElectrolyteRankings 
} from './electrolyteValueRating';

// Calculate data completeness score for deduplication
const getDataCompletenessScore = (product: ElectrolyteProduct): number => {
  let score = 0;
  const priceSub = typeof product.PRICE_SUB_NUM === 'number' ? product.PRICE_SUB_NUM : parseFloat(String(product.PRICE_SUB_NUM)) || 0;
  const priceOtp = typeof product.PRICE_OTP_NUM === 'number' ? product.PRICE_OTP_NUM : parseFloat(String(product.PRICE_OTP_NUM)) || 0;
  if (priceSub > 0) score += 2;
  if (priceOtp > 0) score += 2;
  if (product.SERVINGS) score += 1;
  if (product.SODIUM_MG && product.SODIUM_MG > 0) score += 1;
  if (product.POTASSIUM_MG && product.POTASSIUM_MG > 0) score += 1;
  if (product.MAGNESIUM_MG && product.MAGNESIUM_MG > 0) score += 1;
  if (product.IMAGE_URL) score += 1;
  if (product.FLAVOUR) score += 1;
  if (product.SUB_AMOUNT) score += 1;
  return score;
};

// Generate a unique key for exact duplicate detection
const getExactDuplicateKey = (product: ElectrolyteProduct): string => {
  return [
    (product.TITLE || '').toLowerCase().trim(),
    (product.FLAVOUR || '').toLowerCase().trim(),
    String(product.PRICE_SUB_NUM || 0),
    String(product.PRICE_OTP_NUM || 0),
    String(product.SERVINGS || ''),
    String(product.SODIUM_MG || 0),
    String(product.POTASSIUM_MG || 0),
    String(product.MAGNESIUM_MG || 0),
  ].join('|');
};

// Remove exact duplicates where all key variables are identical
export const deduplicateExact = (products: ElectrolyteProduct[]): ElectrolyteProduct[] => {
  const seen = new Map<string, ElectrolyteProduct>();
  
  products.forEach(product => {
    const key = getExactDuplicateKey(product);
    const existing = seen.get(key);
    
    if (!existing) {
      seen.set(key, product);
    } else {
      // Keep the one with more complete data
      const existingScore = getDataCompletenessScore(existing);
      const newScore = getDataCompletenessScore(product);
      if (newScore > existingScore) {
        seen.set(key, product);
      }
    }
  });
  
  return Array.from(seen.values());
};

// Generate grouping key for products that should share a tile (same product, different flavors)
const getGroupingKey = (product: ElectrolyteProduct): string => {
  // Group by title + package size (SUB_AMOUNT) to consolidate flavor variants
  // Products with same name and same package size but different flavors will be grouped
  const title = (product.TITLE || '').toLowerCase().trim();
  // Use SUB_AMOUNT (e.g., "30 sachets") as the package identifier
  const packageSize = (product.SUB_AMOUNT || String(product.SERVINGS || '')).toLowerCase().trim();
  return `${title}|${packageSize}`;
};

export interface GroupedElectrolyteProduct extends ElectrolyteProduct {
  variants: ElectrolyteProduct[];
  variantCount: number;
}

// Group products by title + servings, selecting best value as default
// Each group becomes one tile with a flavor dropdown
export const groupElectrolytesByTitle = (
  products: ElectrolyteProduct[], 
  benchmarks: ElectrolyteBenchmarks | null, 
  rankings: ElectrolyteRankings | null,
  isSubscription: boolean
): GroupedElectrolyteProduct[] => {
  const groupedMap = new Map<string, ElectrolyteProduct[]>();
  
  // Group products
  products.forEach(product => {
    const key = getGroupingKey(product);
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key)!.push(product);
  });
  
  // Convert to GroupedElectrolyteProduct array, selecting best value variant as default
  const grouped: GroupedElectrolyteProduct[] = [];
  
  groupedMap.forEach((variants) => {
    // Sort variants by value rating (best first)
    const sortedVariants = [...variants].sort((a, b) => {
      const ratingA = calculateElectrolyteValueRating(a, benchmarks, rankings, isSubscription) || 0;
      const ratingB = calculateElectrolyteValueRating(b, benchmarks, rankings, isSubscription) || 0;
      return ratingB - ratingA;
    });
    
    // Use the best value variant as the default display
    const bestVariant = sortedVariants[0];
    
    grouped.push({
      ...bestVariant,
      variants: sortedVariants,
      variantCount: sortedVariants.length
    });
  });
  
  return grouped;
};

// Main processing pipeline: deduplicate then group
export const processElectrolyteProducts = (
  products: ElectrolyteProduct[],
  benchmarks: ElectrolyteBenchmarks | null,
  rankings: ElectrolyteRankings | null,
  isSubscription: boolean
): { grouped: GroupedElectrolyteProduct[]; stats: { original: number; deduplicated: number; grouped: number } } => {
  const original = products.length;
  
  // Step 1: Remove exact duplicates
  const deduplicated = deduplicateExact(products);
  
  // Step 2: Group by title + servings (flavor variants)
  const grouped = groupElectrolytesByTitle(deduplicated, benchmarks, rankings, isSubscription);
  
  return {
    grouped,
    stats: {
      original,
      deduplicated: deduplicated.length,
      grouped: grouped.length
    }
  };
};
