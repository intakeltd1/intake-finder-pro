/**
 * Core flavor filtering logic to remove products with invalid or missing flavors.
 * This is a reusable utility for filtering any product dataset.
 */

const INVALID_FLAVOR_VALUES = new Set([
  '',
  'flavour',
  'flavor',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  '-',
  '--',
  'see website',
  'see site',
  'unknown',
  'tbc',
  'tbd',
]);

/**
 * Check if a flavor value is valid (not empty or a placeholder)
 */
export function isValidFlavor(flavor: any): boolean {
  if (flavor === undefined || flavor === null) {
    return false;
  }
  
  const flavorStr = String(flavor).trim().toLowerCase();
  
  // Check for empty or whitespace-only
  if (flavorStr === '' || flavorStr.length === 0) {
    return false;
  }
  
  // Check against known invalid values
  if (INVALID_FLAVOR_VALUES.has(flavorStr)) {
    return false;
  }
  
  // Check for "nan" variations
  if (flavorStr === 'nan' || flavorStr === 'NaN') {
    return false;
  }
  
  return true;
}

/**
 * Filter an array of products to only include those with valid flavors
 */
export function filterByValidFlavor<T extends { FLAVOUR?: string | null }>(
  products: T[]
): T[] {
  return products.filter(product => isValidFlavor(product.FLAVOUR));
}

/**
 * Get count of products with invalid flavors (for debugging/logging)
 */
export function countInvalidFlavors<T extends { FLAVOUR?: string | null }>(
  products: T[]
): number {
  return products.filter(product => !isValidFlavor(product.FLAVOUR)).length;
}
