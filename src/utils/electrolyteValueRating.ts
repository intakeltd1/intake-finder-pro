// Electrolyte Value Rating Algorithm
// RANK-BASED scoring: distributes scores across full 5.0-10.0 range
// Weightings: 35% Cost per serving, 30% Total electrolytes, 20% Discount %, 15% Servings per pack

export interface ElectrolyteProduct {
  TITLE?: string;
  COMPANY?: string;
  PRICE_SUB_NUM?: number | string;
  PRICE_OTP_NUM?: number | string;
  RRP_NUM?: number;
  SERVINGS?: string;
  SODIUM_MG?: number;
  POTASSIUM_MG?: number;
  MAGNESIUM_MG?: number;
  SUB_AMOUNT?: string;
  PAGE_URL?: string;
  IMAGE_URL?: string;
  FLAVOUR?: string;
  FORMAT?: string;
  IN_STOCK?: boolean;
  [key: string]: any;
}

export interface ElectrolyteBenchmarks {
  minCostPerServing: number;
  maxCostPerServing: number;
  minTotalElectrolytes: number;
  maxTotalElectrolytes: number;
  minServings: number;
  maxServings: number;
  minDiscountPercent: number;
  maxDiscountPercent: number;
}

export interface ElectrolyteScoreRange {
  minScore: number;
  maxScore: number;
}

export interface ElectrolyteRankings {
  rankMap: Map<string, number>;
  totalRankedProducts: number;
  rawScores: Map<string, number>;
  hasMissingDataMap: Map<string, boolean>;
}

// Get the active price based on subscription mode
export function getActivePrice(product: ElectrolyteProduct, isSubscription: boolean): number | null {
  if (isSubscription) {
    const subPrice = product.PRICE_SUB_NUM;
    if (typeof subPrice === 'number' && subPrice > 0) return subPrice;
    return null;
  } else {
    const otpPrice = product.PRICE_OTP_NUM;
    if (typeof otpPrice === 'number' && otpPrice > 0) return otpPrice;
    if (typeof otpPrice === 'string' && !isNaN(parseFloat(otpPrice))) {
      const parsed = parseFloat(otpPrice);
      return parsed > 0 ? parsed : null;
    }
    return null;
  }
}

// Check if product has valid price for the given mode
export function hasValidPrice(product: ElectrolyteProduct, isSubscription: boolean): boolean {
  return getActivePrice(product, isSubscription) !== null;
}

// Parse servings from string
function parseServings(servings?: string): number | null {
  if (!servings) return null;
  const match = String(servings).replace(/[^\d.]/g, '');
  const value = parseFloat(match);
  return isNaN(value) || value <= 0 ? null : value;
}

// Calculate total electrolytes (Na + K + Mg)
function calculateTotalElectrolytes(product: ElectrolyteProduct): number | null {
  const sodium = product.SODIUM_MG ?? 0;
  const potassium = product.POTASSIUM_MG ?? 0;
  const magnesium = product.MAGNESIUM_MG ?? 0;
  
  const total = sodium + potassium + magnesium;
  return total > 0 ? total : null;
}

// Calculate discount percentage
function calculateDiscountPercent(price: number, rrp?: number): number {
  if (!rrp || rrp <= price) return 0;
  return ((rrp - price) / rrp) * 100;
}

// Calculate raw metrics for a product
function calculateRawMetrics(product: ElectrolyteProduct, isSubscription: boolean) {
  const price = getActivePrice(product, isSubscription);
  const servings = parseServings(product.SERVINGS);
  const totalElectrolytes = calculateTotalElectrolytes(product);
  const discountPercent = price && product.RRP_NUM 
    ? calculateDiscountPercent(price, product.RRP_NUM)
    : 0;
  
  return {
    costPerServing: price && servings ? price / servings : null,
    totalElectrolytes,
    servings,
    discountPercent,
    hasValidData: servings !== null && totalElectrolytes !== null
  };
}

/**
 * Calculate benchmarks from entire dataset for a given pricing mode
 */
export function calculateElectrolyteBenchmarks(
  products: ElectrolyteProduct[],
  isSubscription: boolean
): ElectrolyteBenchmarks {
  let minCostPerServing = Infinity;
  let maxCostPerServing = 0;
  let minTotalElectrolytes = Infinity;
  let maxTotalElectrolytes = 0;
  let minServings = Infinity;
  let maxServings = 0;
  let maxDiscountPercent = 0;

  for (const product of products) {
    if (!hasValidPrice(product, isSubscription)) continue;
    
    const metrics = calculateRawMetrics(product, isSubscription);
    
    if (metrics.costPerServing !== null) {
      minCostPerServing = Math.min(minCostPerServing, metrics.costPerServing);
      maxCostPerServing = Math.max(maxCostPerServing, metrics.costPerServing);
    }
    
    if (metrics.totalElectrolytes !== null) {
      minTotalElectrolytes = Math.min(minTotalElectrolytes, metrics.totalElectrolytes);
      maxTotalElectrolytes = Math.max(maxTotalElectrolytes, metrics.totalElectrolytes);
    }
    
    if (metrics.servings !== null) {
      minServings = Math.min(minServings, metrics.servings);
      maxServings = Math.max(maxServings, metrics.servings);
    }
    
    maxDiscountPercent = Math.max(maxDiscountPercent, metrics.discountPercent);
  }

  // Handle edge cases
  if (minCostPerServing === Infinity) minCostPerServing = 0;
  if (minTotalElectrolytes === Infinity) minTotalElectrolytes = 0;
  if (minServings === Infinity) minServings = 0;

  return {
    minCostPerServing,
    maxCostPerServing,
    minTotalElectrolytes,
    maxTotalElectrolytes,
    minServings,
    maxServings,
    minDiscountPercent: 0,
    maxDiscountPercent
  };
}

// Normalize a value to 0-1 range
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

// Normalize inversely (lower is better, like cost)
function normalizeInverse(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return 1 - ((value - min) / (max - min));
}

// Get unique identifier for a product
function getProductKey(product: ElectrolyteProduct): string {
  return product.PAGE_URL || `${product.TITLE}-${product.FLAVOUR}-${product.PRICE_SUB_NUM}-${product.PRICE_OTP_NUM}`;
}

/**
 * Calculate raw weighted score for a product
 * Weightings: 35% Cost per serving (lower is better), 30% Total electrolytes, 20% Discount, 15% Servings
 */
function calculateRawWeightedScore(
  product: ElectrolyteProduct,
  benchmarks: ElectrolyteBenchmarks,
  isSubscription: boolean
): { score: number; hasMissingData: boolean } | null {
  const price = getActivePrice(product, isSubscription);
  if (!price) return null;
  
  const metrics = calculateRawMetrics(product, isSubscription);
  
  const hasMissingData = metrics.costPerServing === null || 
    metrics.totalElectrolytes === null || 
    metrics.servings === null;
  
  // Normalize cost per serving (INVERSE - lower is better)
  const normalizedCost = metrics.costPerServing !== null
    ? normalizeInverse(metrics.costPerServing, benchmarks.minCostPerServing, benchmarks.maxCostPerServing)
    : 0.15;
  
  // Normalize total electrolytes (higher is better)
  const normalizedElectrolytes = metrics.totalElectrolytes !== null
    ? normalize(metrics.totalElectrolytes, benchmarks.minTotalElectrolytes, benchmarks.maxTotalElectrolytes)
    : 0.15;
  
  // Normalize servings (higher is better)
  const normalizedServings = metrics.servings !== null
    ? normalize(metrics.servings, benchmarks.minServings, benchmarks.maxServings)
    : 0.15;
  
  // Normalize discount %
  const normalizedDiscount = benchmarks.maxDiscountPercent > 0
    ? normalize(metrics.discountPercent, benchmarks.minDiscountPercent, benchmarks.maxDiscountPercent)
    : 0;
  
  // Weighted average: 35% cost, 30% electrolytes, 20% discount, 15% servings
  const score = (normalizedCost * 0.35) + 
                (normalizedElectrolytes * 0.30) + 
                (normalizedDiscount * 0.20) + 
                (normalizedServings * 0.15);
  
  return { score, hasMissingData };
}

/**
 * Calculate rank-based scores for all products
 */
export function calculateElectrolyteRankings(
  products: ElectrolyteProduct[],
  benchmarks: ElectrolyteBenchmarks,
  isSubscription: boolean
): ElectrolyteRankings {
  const scoredProducts: { key: string; score: number; hasMissingData: boolean }[] = [];
  const rawScores = new Map<string, number>();
  const hasMissingDataMap = new Map<string, boolean>();
  
  for (const product of products) {
    if (!hasValidPrice(product, isSubscription)) continue;
    
    const result = calculateRawWeightedScore(product, benchmarks, isSubscription);
    if (result !== null) {
      const key = getProductKey(product);
      scoredProducts.push({ key, score: result.score, hasMissingData: result.hasMissingData });
      rawScores.set(key, result.score);
      hasMissingDataMap.set(key, result.hasMissingData);
    }
  }
  
  // Sort by score descending (best first)
  scoredProducts.sort((a, b) => b.score - a.score);
  
  // Assign ranks with tie handling
  const rankMap = new Map<string, number>();
  let currentRank = 1;
  let previousScore: number | null = null;
  let sameRankCount = 0;
  
  for (let i = 0; i < scoredProducts.length; i++) {
    const { key, score } = scoredProducts[i];
    
    if (previousScore !== null && Math.abs(score - previousScore) < 0.0001) {
      rankMap.set(key, currentRank);
      sameRankCount++;
    } else {
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
 * Calculate Electrolyte Value Rating (5.0-10.0 scale)
 */
export function calculateElectrolyteValueRating(
  product: ElectrolyteProduct,
  benchmarks: ElectrolyteBenchmarks,
  rankings: ElectrolyteRankings,
  isSubscription: boolean
): number | null {
  const price = getActivePrice(product, isSubscription);
  if (!price) return null;
  
  if (rankings.totalRankedProducts === 0) return null;
  
  const key = getProductKey(product);
  const rank = rankings.rankMap.get(key);
  
  if (rank === undefined) return null;
  
  const hasMissingData = rankings.hasMissingDataMap.get(key) ?? false;
  
  const totalProducts = rankings.totalRankedProducts;
  
  let finalScore: number;
  if (totalProducts === 1) {
    finalScore = 10.0;
  } else {
    const percentile = (totalProducts - rank) / (totalProducts - 1);
    finalScore = 5.0 + (percentile * 5.0);
  }
  
  // Cap products with missing data at 5.1
  if (hasMissingData && finalScore > 5.1) {
    finalScore = 5.1;
  }
  
  return Math.round(finalScore * 10) / 10;
}

/**
 * Get color class for electrolyte value rating
 */
export function getElectrolyteValueRatingColor(rating: number): string {
  if (rating >= 9.5) return 'from-purple-500 via-violet-500 to-purple-600';
  if (rating >= 7) return 'from-lime-400 to-green-400';
  if (rating >= 6) return 'from-amber-300 to-yellow-400';
  return 'from-gray-300 to-slate-300';
}

/**
 * Get label for electrolyte value rating
 */
export function getElectrolyteValueRatingLabel(rating: number): string {
  if (rating >= 9.5) return 'Excellent';
  if (rating >= 7) return 'Great';
  if (rating >= 6) return 'Good';
  return 'Average';
}
