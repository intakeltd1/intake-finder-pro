// Intake Value Rating Algorithm
// Calculates a 1-10 value score based on protein per serving, price, and amount

interface Product {
  PRICE?: string;
  AMOUNT?: string;
  PROTEIN_SERVING?: string;
  [key: string]: any;
}

// Parse grams from amount string
const parseGrams = (amount?: string): number | null => {
  if (!amount) return null;
  const match = amount.match(/([\d.]+)\s*(kg|g)/i);
  if (!match) return null;
  let value = parseFloat(match[1]);
  if (match[2].toLowerCase() === 'kg') value *= 1000;
  return value;
};

// Parse price from string
const parsePrice = (price?: string): number | null => {
  if (!price) return null;
  const match = String(price).replace(/[^\d.]/g, '');
  const value = parseFloat(match);
  return isNaN(value) ? null : value;
};

// Parse protein from string
const parseProtein = (protein?: string): number | null => {
  if (!protein) return null;
  const match = String(protein).replace(/[^\d.]/g, '');
  const value = parseFloat(match);
  return isNaN(value) ? null : value;
};

/**
 * Calculate Intake Value Rating (1-10 scale)
 * 
 * Factors:
 * - Protein per £1 (40% weight)
 * - Protein per 100g (30% weight)
 * - Size/value ratio (30% weight)
 * 
 * @param product - Product to evaluate
 * @returns Value rating from 1-10, or null if insufficient data
 */
export function calculateIntakeValueRating(product: Product): number | null {
  const price = parsePrice(product.PRICE);
  const grams = parseGrams(product.AMOUNT);
  const protein = parseProtein(product.PROTEIN_SERVING);

  // Need at least price to calculate (protein is optional with fallback)
  if (!price || price <= 0) return null;
  
  // Use estimated protein if not available (typical whey protein ~25g per serving)
  const effectiveProtein = protein || 25;

  // Calculate protein per £1 (higher is better)
  const proteinPerPound = effectiveProtein / price;

  // Calculate protein density (protein per 100g) - assumes one serving
  let proteinDensity = 0;
  if (grams && grams > 0) {
    // Estimate servings (typical tub is 25-30 servings)
    const estimatedServings = Math.max(1, Math.round(grams / 30));
    const proteinPer100g = (effectiveProtein / (grams / estimatedServings)) * 100;
    proteinDensity = Math.min(100, proteinPer100g); // Cap at 100
  } else {
    // If no amount data, use protein per serving as proxy
    proteinDensity = Math.min(100, effectiveProtein * 3);
  }

  // Calculate size value (larger sizes typically better value)
  let sizeScore = 0;
  if (grams) {
    if (grams >= 2500) sizeScore = 10; // 2.5kg+
    else if (grams >= 2000) sizeScore = 9; // 2kg
    else if (grams >= 1500) sizeScore = 7; // 1.5kg
    else if (grams >= 1000) sizeScore = 5; // 1kg
    else if (grams >= 500) sizeScore = 3; // 500g
    else sizeScore = 1; // Small samples
  } else {
    sizeScore = 5; // Neutral if unknown
  }

  // Normalize protein per pound (typical range: 0.5 to 4)
  const normalizedProteinPerPound = Math.min(10, (proteinPerPound / 4) * 10);

  // Normalize protein density (typical range: 20% to 90%)
  const normalizedProteinDensity = Math.min(10, (proteinDensity / 90) * 10);

  // Weighted average
  const weightedScore = 
    (normalizedProteinPerPound * 0.4) +
    (normalizedProteinDensity * 0.3) +
    (sizeScore * 0.3);

  // Scale to 1-10 and round to 1 decimal
  const finalScore = Math.max(1, Math.min(10, weightedScore));
  
  return Math.round(finalScore * 10) / 10;
}

/**
 * Get color class for value rating
 * Logical progression: Gray → Amber → Lime → Gold (Premium!)
 */
export function getValueRatingColor(rating: number): string {
  if (rating >= 8) return 'from-amber-400 via-yellow-400 to-amber-500'; // Excellent - Premium Gold
  if (rating >= 6) return 'from-lime-400 to-green-400'; // Great value (lime/yellow-green)
  if (rating >= 4) return 'from-amber-300 to-yellow-400'; // Good (amber/yellow)
  return 'from-gray-300 to-slate-300'; // Standard (neutral gray)
}

/**
 * Get label for value rating
 */
export function getValueRatingLabel(rating: number): string {
  if (rating >= 9) return 'Exceptional';
  if (rating >= 8) return 'Excellent';
  if (rating >= 7) return 'Great';
  if (rating >= 6) return 'Good';
  if (rating >= 5) return 'Fair';
  if (rating >= 4) return 'Below Average';
  return 'Poor';
}
