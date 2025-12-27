// Intake Value Rating Algorithm
// RANK-BASED scoring: distributes scores across full 5.0-10.0 range
// Best product = 10.0, worst = 5.0, all others distributed by percentile rank
// Weights: 55% Servings/£, 38.3% Protein/£, 6.7% Discount %

import { isValidServings, parseGrams } from '@/utils/productUtils';

interface Product {
  PRICE?: string;
  RRP?: string;
  SERVINGS?: string;
  PROTEIN_SERVING?: string;
  AMOUNT?: string;
  URL?: string;
  LINK?: string;
  [key: string]: any;
}

export interface DatasetBenchmarks {
  minProteinPerPound: number;
  maxProteinPerPound: number;
  minServingsPerPound: number;
  maxServingsPerPound: number;
  minAmountPerPound: number;
  maxAmountPerPound: number;
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

// Parse servings from string - returns null for invalid formats (mass/volume units)
const parseServings = (servings?: string): number | null => {
  if (!servings) return null;
  
  // Validate that this is actually a serving count, not a weight like "500g"
  if (!isValidServings(servings)) return null;
  
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
  
  // Parse AMOUNT as fallback when SERVINGS is invalid
  const amountGrams = parseGrams(product.AMOUNT);
  
  return {
    proteinPerPound: price && protein ? protein / price : null,
    servingsPerPound: price && servings ? servings / price : null,
    amountPerPound: price && amountGrams ? amountGrams / price : null,
    discountPercent,
    hasValidServings: servings !== null,
    hasValidAmount: amountGrams !== null
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
  let minAmountPerPound = Infinity;
  let maxAmountPerPound = 0;
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
    
    if (metrics.amountPerPound !== null) {
      minAmountPerPound = Math.min(minAmountPerPound, metrics.amountPerPound);
      maxAmountPerPound = Math.max(maxAmountPerPound, metrics.amountPerPound);
    }
    
    maxDiscountPercent = Math.max(maxDiscountPercent, metrics.discountPercent);
  }

  // Handle edge cases where no valid data exists
  if (minProteinPerPound === Infinity) minProteinPerPound = 0;
  if (minServingsPerPound === Infinity) minServingsPerPound = 0;
  if (minAmountPerPound === Infinity) minAmountPerPound = 0;

  return {
    minProteinPerPound,
    maxProteinPerPound,
    minServingsPerPound,
    maxServingsPerPound,
    minAmountPerPound,
    maxAmountPerPound,
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
 * Returns { score, hasMissingData } to track data quality
 * 
 * Now supports AMOUNT fallback: if SERVINGS is invalid, uses AMOUNT (grams/£) instead
 */
function calculateRawWeightedScore(
  product: Product,
  benchmarks: DatasetBenchmarks
): { score: number; hasMissingData: boolean } | null {
  const price = parsePrice(product.PRICE);
  if (!price) return null; // Products without price cannot be scored
  
  const metrics = calculateRawMetrics(product);
  
  // Track if product has missing essential data
  // Now acceptable if EITHER servings OR amount is available
  const hasMissingData = metrics.proteinPerPound === null || 
    (metrics.servingsPerPound === null && metrics.amountPerPound === null);
  
  // Normalize protein per £1 (penalize missing data with 0.15)
  const normalizedProtein = metrics.proteinPerPound !== null
    ? normalize(metrics.proteinPerPound, benchmarks.minProteinPerPound, benchmarks.maxProteinPerPound)
    : 0.15;
  
  // Normalize servings per £1, OR fallback to amount per £1
  let normalizedServingsOrAmount: number;
  if (metrics.servingsPerPound !== null) {
    // Primary: use servings
    normalizedServingsOrAmount = normalize(metrics.servingsPerPound, benchmarks.minServingsPerPound, benchmarks.maxServingsPerPound);
  } else if (metrics.amountPerPound !== null) {
    // Fallback: use amount (grams per £)
    normalizedServingsOrAmount = normalize(metrics.amountPerPound, benchmarks.minAmountPerPound, benchmarks.maxAmountPerPound);
  } else {
    // Neither available - penalize
    normalizedServingsOrAmount = 0.15;
  }
  
  // Normalize discount %
  const normalizedDiscount = benchmarks.maxDiscountPercent > 0
    ? normalize(metrics.discountPercent, benchmarks.minDiscountPercent, benchmarks.maxDiscountPercent)
    : 0;
  
  // Weighted average (38.3% protein, 55% servings/amount, 6.7% discount)
  const score = (normalizedProtein * 0.383) + (normalizedServingsOrAmount * 0.55) + (normalizedDiscount * 0.067);
  
  return { score, hasMissingData };
}

// Get unique identifier for a product
function getProductKey(product: Product): string {
  return product.URL || product.LINK || `${product.TITLE}-${product.FLAVOUR}-${product.PRICE}`;
}

export interface ScoreRange {
  minScore: number;
  maxScore: number;
}

/**
 * DEPRECATED: Use calculateProductRankings instead
 * Kept for backward compatibility
 */
export function calculateScoreRange(
  products: Product[],
  benchmarks: DatasetBenchmarks
): ScoreRange {
  let minScore = Infinity;
  let maxScore = -Infinity;
  
  for (const product of products) {
    const result = calculateRawWeightedScore(product, benchmarks);
    if (result !== null) {
      minScore = Math.min(minScore, result.score);
      maxScore = Math.max(maxScore, result.score);
    }
  }
  
  // Handle edge cases
  if (minScore === Infinity) minScore = 0;
  if (maxScore === -Infinity) maxScore = 1;
  if (minScore === maxScore) maxScore = minScore + 0.01;
  
  return { minScore, maxScore };
}

export interface ProductRankings {
  rankMap: Map<string, number>;       // productKey -> rank (1 = best)
  totalRankedProducts: number;        // Total products with valid scores
  rawScores: Map<string, number>;     // productKey -> raw score (for debugging)
  hasMissingDataMap: Map<string, boolean>; // productKey -> whether product has missing data
}

/**
 * Calculate rank-based scores for all products
 * This ensures the full 5.0-10.0 range is utilized based on percentile ranking
 */
export function calculateProductRankings(
  products: Product[],
  benchmarks: DatasetBenchmarks
): ProductRankings {
  // Calculate raw scores for all products
  const scoredProducts: { key: string; score: number; hasMissingData: boolean }[] = [];
  const rawScores = new Map<string, number>();
  const hasMissingDataMap = new Map<string, boolean>();
  
  for (const product of products) {
    const result = calculateRawWeightedScore(product, benchmarks);
    if (result !== null) {
      const key = getProductKey(product);
      scoredProducts.push({ key, score: result.score, hasMissingData: result.hasMissingData });
      rawScores.set(key, result.score);
      hasMissingDataMap.set(key, result.hasMissingData);
    }
  }
  
  // Sort by score descending (best first)
  scoredProducts.sort((a, b) => b.score - a.score);
  
  // Assign ranks (handling ties - products with same score get same rank)
  const rankMap = new Map<string, number>();
  let currentRank = 1;
  let previousScore: number | null = null;
  let sameRankCount = 0;
  
  for (let i = 0; i < scoredProducts.length; i++) {
    const { key, score } = scoredProducts[i];
    
    if (previousScore !== null && Math.abs(score - previousScore) < 0.0001) {
      // Same score as previous - assign same rank
      rankMap.set(key, currentRank);
      sameRankCount++;
    } else {
      // New score - advance rank by count of tied products
      currentRank = currentRank + sameRankCount;
      rankMap.set(key, currentRank);
      sameRankCount = 1;
    }
    
    previousScore = score;
  }
  
  return {
    rankMap,
    totalRankedProducts: scoredProducts.length,
    rawScores,
    hasMissingDataMap
  };
}

/**
 * Calculate Intake Value Rating using RANK-BASED scoring (5.0-10.0 scale)
 * Best product = 10.0, Worst product = 5.0
 * All products distributed by percentile rank across this range
 * 
 * @param product - Product to evaluate
 * @param benchmarks - Dataset benchmarks for normalization
 * @param scoreRange - DEPRECATED: kept for backward compatibility, ignored if rankings provided
 * @param rankings - Rank-based scoring data (preferred method)
 * @returns Value rating from 5.0-10.0
 */
export function calculateIntakeValueRating(
  product: Product, 
  benchmarks?: DatasetBenchmarks,
  scoreRange?: ScoreRange,
  rankings?: ProductRankings
): number | null {
  if (!benchmarks) return null;
  
  // Check if price is missing - products without price cannot be scored
  const price = product.PRICE?.replace(/[^\d.]/g, '');
  const priceVal = price ? parseFloat(price) : null;
  if (!priceVal || priceVal <= 0) {
    return null; // No rating for products without valid price
  }
  
  // Use rank-based scoring if rankings are provided
  if (rankings && rankings.totalRankedProducts > 0) {
    const key = product.URL || product.LINK || `${product.TITLE}-${product.FLAVOUR}-${product.PRICE}`;
    const rank = rankings.rankMap.get(key);
    
    if (rank === undefined) {
      // Product not in rankings
      return null;
    }
    
    // Check if product has missing data (protein or servings)
    const hasMissingData = rankings.hasMissingDataMap.get(key) ?? false;
    
    // Convert rank to 5.0-10.0 scale
    // Rank 1 (best) -> 10.0
    // Last rank (worst) -> 5.0
    const totalProducts = rankings.totalRankedProducts;
    
    let finalScore: number;
    if (totalProducts === 1) {
      finalScore = 10.0; // Only one product = best
    } else {
      // Percentile position: 0 = worst, 1 = best
      const percentile = (totalProducts - rank) / (totalProducts - 1);
      
      // Scale to 5.0-10.0 range
      finalScore = 5.0 + (percentile * 5.0);
    }
    
    // CAP: Products with missing price/protein/servings data cannot score above 5.1
    if (hasMissingData && finalScore > 5.1) {
      finalScore = 5.1;
    }
    
    return Math.round(finalScore * 10) / 10;
  }
  
  // Fallback to old linear scaling (deprecated path)
  const rawResult = calculateRawWeightedScore(product, benchmarks);
  if (rawResult === null) return null;
  
  let finalScore: number;
  if (!scoreRange) {
    finalScore = 5 + rawResult.score * 5;
  } else {
    const normalizedScore = Math.max(0, Math.min(1, normalize(rawResult.score, scoreRange.minScore, scoreRange.maxScore)));
    finalScore = 5.0 + (normalizedScore * 5.0);
  }
  
  // CAP: Products with missing data cannot score above 5.1
  if (rawResult.hasMissingData && finalScore > 5.1) {
    finalScore = 5.1;
  }
  
  return Math.round(finalScore * 10) / 10;
}

/**
 * Get color class for value rating (5.0-10.0 scale)
 * All products shown positively: Gray → Amber → Green → Purple (Excellent!)
 */
export function getValueRatingColor(rating: number): string {
  if (rating >= 9.5) return 'from-purple-500 via-violet-500 to-purple-600'; // Excellent (top ~10%)
  if (rating >= 7) return 'from-lime-400 to-green-400'; // Great
  if (rating >= 6) return 'from-amber-300 to-yellow-400'; // Good
  return 'from-gray-300 to-slate-300'; // Average (5.0-5.9)
}

/**
 * Get label for value rating (5.0-10.0 scale)
 */
export function getValueRatingLabel(rating: number): string {
  if (rating >= 9.5) return 'Excellent';
  if (rating >= 7) return 'Great';
  if (rating >= 6) return 'Good';
  return 'Average';
}
