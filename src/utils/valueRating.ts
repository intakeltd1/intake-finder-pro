// Intake Value Rating Algorithm
// Dynamic benchmarking: best product = 10, worst = 1
// Weights: 40% Protein/£, 40% Servings/£, 20% Discount %

interface Product {
  PRICE?: string;
  RRP?: string;
  SERVINGS?: string;
  PROTEIN_SERVING?: string;
  [key: string]: any;
}

export interface DatasetBenchmarks {
  minProteinPerPound: number;
  maxProteinPerPound: number;
  minServingsPerPound: number;
  maxServingsPerPound: number;
  minDiscountPercent: number;
  maxDiscountPercent: number;
}

// Parse price from string
const parsePrice = (price?: string): number | null => {
  if (!price) return null;
  const match = String(price).replace(/[^\d.]/g, '');
  const value = parseFloat(match);
  return isNaN(value) || value <= 0 ? null : value;
};

// Parse servings from string
const parseServings = (servings?: string): number | null => {
  if (!servings) return null;
  const match = String(servings).replace(/[^\d.]/g, '');
  const value = parseFloat(match);
  return isNaN(value) || value <= 0 ? null : value;
};

// Parse protein from string
const parseProtein = (protein?: string): number | null => {
  if (!protein) return null;
  const match = String(protein).replace(/[^\d.]/g, '');
  const value = parseFloat(match);
  return isNaN(value) ? null : value;
};

// Calculate percentage discount
const calculateDiscountPercent = (price?: string, rrp?: string): number => {
  const priceVal = parsePrice(price);
  const rrpVal = parsePrice(rrp);
  
  if (!priceVal || !rrpVal || rrpVal <= priceVal) return 0;
  
  return ((rrpVal - priceVal) / rrpVal) * 100;
};

// Calculate raw metrics for a product
const calculateRawMetrics = (product: Product) => {
  const price = parsePrice(product.PRICE);
  const servings = parseServings(product.SERVINGS);
  const protein = parseProtein(product.PROTEIN_SERVING);
  const discountPercent = calculateDiscountPercent(product.PRICE, product.RRP);
  
  return {
    proteinPerPound: price && protein ? protein / price : null,
    servingsPerPound: price && servings ? servings / price : null,
    discountPercent,
    hasServings: servings !== null
  };
};

/**
 * Calculate benchmarks from entire dataset
 * Call this once when data loads, then use for all ratings
 */
export function calculateDatasetBenchmarks(products: Product[]): DatasetBenchmarks {
  let minProteinPerPound = Infinity;
  let maxProteinPerPound = 0;
  let minServingsPerPound = Infinity;
  let maxServingsPerPound = 0;
  let minDiscountPercent = 0;
  let maxDiscountPercent = 0;

  for (const product of products) {
    const metrics = calculateRawMetrics(product);
    
    if (metrics.proteinPerPound !== null) {
      minProteinPerPound = Math.min(minProteinPerPound, metrics.proteinPerPound);
      maxProteinPerPound = Math.max(maxProteinPerPound, metrics.proteinPerPound);
    }
    
    if (metrics.servingsPerPound !== null) {
      minServingsPerPound = Math.min(minServingsPerPound, metrics.servingsPerPound);
      maxServingsPerPound = Math.max(maxServingsPerPound, metrics.servingsPerPound);
    }
    
    maxDiscountPercent = Math.max(maxDiscountPercent, metrics.discountPercent);
  }

  // Handle edge cases where no valid data exists
  if (minProteinPerPound === Infinity) minProteinPerPound = 0;
  if (minServingsPerPound === Infinity) minServingsPerPound = 0;

  return {
    minProteinPerPound,
    maxProteinPerPound,
    minServingsPerPound,
    maxServingsPerPound,
    minDiscountPercent,
    maxDiscountPercent
  };
}

// Normalize a value to 0-1 range
const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

/**
 * Calculate Intake Value Rating (1-10 scale) using dynamic benchmarks
 * 
 * Weights:
 * - Protein per £1 (40%)
 * - Servings per £1 (40%)
 * - Discount % (20%)
 * 
 * @param product - Product to evaluate
 * @param benchmarks - Dataset benchmarks for normalization
 * @returns Value rating from 1-10
 */
export function calculateIntakeValueRating(
  product: Product, 
  benchmarks?: DatasetBenchmarks
): number | null {
  const price = parsePrice(product.PRICE);
  
  // Need at least price to calculate
  if (!price) return null;
  
  const metrics = calculateRawMetrics(product);
  
  // If no benchmarks provided, return null (needs dataset context)
  if (!benchmarks) return null;
  
  // Normalize protein per £1 (penalize missing data with 0.15 instead of neutral)
  const normalizedProtein = metrics.proteinPerPound !== null
    ? normalize(metrics.proteinPerPound, benchmarks.minProteinPerPound, benchmarks.maxProteinPerPound)
    : 0.15;
  
  // Normalize servings per £1 (penalize missing data with 0.15 instead of neutral)
  const normalizedServings = metrics.servingsPerPound !== null
    ? normalize(metrics.servingsPerPound, benchmarks.minServingsPerPound, benchmarks.maxServingsPerPound)
    : 0.15;
  
  // Normalize discount % (0 if no RRP)
  const normalizedDiscount = benchmarks.maxDiscountPercent > 0
    ? normalize(metrics.discountPercent, benchmarks.minDiscountPercent, benchmarks.maxDiscountPercent)
    : 0;
  
  // Weighted average (40% protein, 40% servings, 20% discount)
  const weightedScore = 
    (normalizedProtein * 0.4) +
    (normalizedServings * 0.4) +
    (normalizedDiscount * 0.2);
  
  // Scale to 1-10 range
  const finalScore = 1 + (weightedScore * 9);
  
  return Math.round(finalScore * 10) / 10;
}

/**
 * Get color class for value rating
 * Gray → Amber → Green → Purple (Legendary!)
 */
export function getValueRatingColor(rating: number): string {
  if (rating >= 8) return 'from-purple-500 via-violet-500 to-purple-600'; // Excellent
  if (rating >= 6) return 'from-lime-400 to-green-400'; // Great
  if (rating >= 4) return 'from-amber-300 to-yellow-400'; // Good
  return 'from-gray-300 to-slate-300'; // Average
}

/**
 * Get label for value rating
 */
export function getValueRatingLabel(rating: number): string {
  if (rating >= 8) return 'Excellent';
  if (rating >= 6) return 'Great';
  if (rating >= 4) return 'Good';
  return 'Average';
}
