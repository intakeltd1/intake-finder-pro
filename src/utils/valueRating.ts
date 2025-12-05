// Intake Value Rating Algorithm
// Dynamic benchmarking: best product = 10, worst = 5.0 (brand-friendly)
// Weights: 48.5% Protein/£, 48.5% Servings/£, 3% Discount %

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
 * Calculate raw weighted score for a product (internal use)
 */
function calculateRawWeightedScore(
  product: Product,
  benchmarks: DatasetBenchmarks
): number | null {
  const price = parsePrice(product.PRICE);
  if (!price) return null;
  
  const metrics = calculateRawMetrics(product);
  
  // Normalize protein per £1 (penalize missing data with 0.15)
  const normalizedProtein = metrics.proteinPerPound !== null
    ? normalize(metrics.proteinPerPound, benchmarks.minProteinPerPound, benchmarks.maxProteinPerPound)
    : 0.15;
  
  // Normalize servings per £1 (penalize missing data with 0.15)
  const normalizedServings = metrics.servingsPerPound !== null
    ? normalize(metrics.servingsPerPound, benchmarks.minServingsPerPound, benchmarks.maxServingsPerPound)
    : 0.15;
  
  // Normalize discount %
  const normalizedDiscount = benchmarks.maxDiscountPercent > 0
    ? normalize(metrics.discountPercent, benchmarks.minDiscountPercent, benchmarks.maxDiscountPercent)
    : 0;
  
  // Weighted average (55% protein, 38.3% servings, 6.7% discount)
  // This prioritizes protein content while still valuing servings and minor discount consideration
  return (normalizedProtein * 0.55) + (normalizedServings * 0.383) + (normalizedDiscount * 0.067);
}

export interface ScoreRange {
  minScore: number;
  maxScore: number;
}

/**
 * Calculate score range from entire dataset
 * Call this once when data loads alongside benchmarks
 */
export function calculateScoreRange(
  products: Product[],
  benchmarks: DatasetBenchmarks
): ScoreRange {
  let minScore = Infinity;
  let maxScore = -Infinity;
  
  for (const product of products) {
    const score = calculateRawWeightedScore(product, benchmarks);
    if (score !== null) {
      minScore = Math.min(minScore, score);
      maxScore = Math.max(maxScore, score);
    }
  }
  
  // Handle edge cases
  if (minScore === Infinity) minScore = 0;
  if (maxScore === -Infinity) maxScore = 1;
  if (minScore === maxScore) maxScore = minScore + 0.01;
  
  return { minScore, maxScore };
}

/**
 * Calculate Intake Value Rating (5.0-10.0 scale) using dynamic benchmarks
 * Best product = 10, Worst product = 5.0 (brand-friendly, no product is "bad")
 * 
 * @param product - Product to evaluate
 * @param benchmarks - Dataset benchmarks for normalization
 * @param scoreRange - Min/max scores from dataset for final scaling
 * @returns Value rating from 5.0-10.0
 */
export function calculateIntakeValueRating(
  product: Product, 
  benchmarks?: DatasetBenchmarks,
  scoreRange?: ScoreRange
): number | null {
  if (!benchmarks) return null;
  
  const rawScore = calculateRawWeightedScore(product, benchmarks);
  if (rawScore === null) return null;
  
  // If no score range, use raw score scaled to 5-10
  if (!scoreRange) {
    return Math.round((5 + rawScore * 5) * 10) / 10;
  }
  
  // Normalize to 0-1 based on actual dataset range, clamped to prevent out-of-range
  const normalizedScore = Math.max(0, Math.min(1, normalize(rawScore, scoreRange.minScore, scoreRange.maxScore)));
  
  // Scale to 5.0-10.0 range (best = 10, worst = 5.0)
  // This ensures no product appears "bad" - all are at least average
  const finalScore = 5.0 + (normalizedScore * 5.0);
  
  return Math.round(finalScore * 10) / 10;
}

/**
 * Get color class for value rating (5.0-10.0 scale)
 * All products shown positively: Amber → Green → Purple (Excellent!)
 */
export function getValueRatingColor(rating: number): string {
  if (rating >= 8.5) return 'from-purple-500 via-violet-500 to-purple-600'; // Excellent
  if (rating >= 7) return 'from-lime-400 to-green-400'; // Great
  if (rating >= 6) return 'from-amber-300 to-yellow-400'; // Good
  return 'from-gray-300 to-slate-300'; // Average (5.0-5.9)
}

/**
 * Get label for value rating (5.0-10.0 scale)
 */
export function getValueRatingLabel(rating: number): string {
  if (rating >= 8.5) return 'Excellent';
  if (rating >= 7) return 'Great';
  if (rating >= 6) return 'Good';
  return 'Average';
}
