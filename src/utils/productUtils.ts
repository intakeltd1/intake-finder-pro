// Utility functions for product data processing
import { calculateIntakeValueRating, calculateDatasetBenchmarks, calculateScoreRange, DatasetBenchmarks, ScoreRange } from './valueRating';

export interface Product {
  TITLE?: string;
  COMPANY?: string;
  PRICE?: string;
  AMOUNT?: string;
  PROTEIN_SERVING?: string;
  FLAVOUR?: string;
  LINK?: string;
  URL?: string;
  IMAGE_URL?: string;
  STOCK_STATUS?: string;
  RRP?: string;
  SERVINGS?: string;
  [key: string]: any;
}

export interface GroupedProduct extends Product {
  variants: Product[];
  variantCount: number;
}

// Group products by exact title, selecting best value as default
export const groupProductsByTitle = (products: Product[], benchmarks?: DatasetBenchmarks | null, scoreRange?: ScoreRange | null): GroupedProduct[] => {
  const groupedMap = new Map<string, Product[]>();
  
  // Group by exact title (case-insensitive, trimmed)
  products.forEach(product => {
    const title = (product.TITLE || '').toLowerCase().trim();
    if (!title) return;
    
    if (!groupedMap.has(title)) {
      groupedMap.set(title, []);
    }
    groupedMap.get(title)!.push(product);
  });
  
  // Convert to GroupedProduct array, selecting best value variant as default
  const grouped: GroupedProduct[] = [];
  
  groupedMap.forEach((variants) => {
    // Sort variants by Intake Value rating (best first)
    const sortedVariants = [...variants].sort((a, b) => {
      const ratingA = calculateIntakeValueRating(a, benchmarks || undefined, scoreRange || undefined) || 0;
      const ratingB = calculateIntakeValueRating(b, benchmarks || undefined, scoreRange || undefined) || 0;
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

export const parseGrams = (amount?: string): number | null => {
  if (!amount) return null;
  const match = amount.match(/([\d.]+)\s*(kg|g)/i);
  if (!match) return null;
  let value = parseFloat(match[1]);
  if (match[2].toLowerCase() === 'kg') value *= 1000;
  return value;
};

export const numFromPrice = (price?: string | number): number => {
  if (!price) return Infinity;
  const priceStr = String(price);
  const match = priceStr.replace(/[^\d.]/g, '');
  return parseFloat(match) || Infinity;
};

export const numFromProtein = (protein?: string | number): number => {
  if (!protein) return 0;
  const proteinStr = String(protein);
  const match = proteinStr.replace(/[^\d.]/g, '');
  return parseFloat(match) || 0;
};

// Calculate protein value score (protein per serving / price)
export const calculateValueScore = (product: Product): number => {
  const price = numFromPrice(product.PRICE);
  const protein = numFromProtein(product.PROTEIN_SERVING?.toString());
  if (price === Infinity || protein === 0) return 0;
  return protein / price;
};

// Get click count from localStorage
export const getClickCount = (productUrl: string): number => {
  if (typeof window === 'undefined') return 0;
  const clicks = localStorage.getItem('product-clicks');
  if (!clicks) return 0;
  const clickData = JSON.parse(clicks);
  return clickData[productUrl] || 0;
};

// Increment click count
export const incrementClickCount = (productUrl: string): void => {
  if (typeof window === 'undefined') return;
  const clicks = localStorage.getItem('product-clicks');
  const clickData = clicks ? JSON.parse(clicks) : {};
  clickData[productUrl] = (clickData[productUrl] || 0) + 1;
  localStorage.setItem('product-clicks', JSON.stringify(clickData));
};

// Smart search with fuzzy matching and flavor grouping
const createSmartSearch = (query: string): (item: Product) => boolean => {
  if (!query.trim()) return () => true;
  
  const q = query.trim().toLowerCase();
  
  // Flavor groupings
  const flavorGroups = {
    chocolate: ['chocolate', 'choc', 'cocoa', 'mocha', 'brownie'],
    vanilla: ['vanilla', 'cream', 'custard'],
    strawberry: ['strawberry', 'berry', 'berries'],
    banana: ['banana', 'tropical'],
    cookies: ['cookies', 'cookie', 'biscuit', 'oreo'],
    mint: ['mint', 'peppermint', 'spearmint'],
    coffee: ['coffee', 'latte', 'cappuccino', 'espresso'],
    peanut: ['peanut', 'pb', 'nut']
  };
  
  // Enhanced fuzzy matching for common typos and misspellings
  const fuzzyMatches = {
    // Protein variations
    'protien': 'protein',
    'protine': 'protein',
    'protean': 'protein',
    // Whey variations
    'whay': 'whey',
    'wey': 'whey',
    'way': 'whey',
    // Casein variations
    'casien': 'casein',
    'caisen': 'casein',
    'casine': 'casein',
    // Creatine variations
    'creatien': 'creatine',
    'creatin': 'creatine',
    // Flavour variations
    'chocolat': 'chocolate',
    'chocalate': 'chocolate',
    'chocoloate': 'chocolate',
    'vanila': 'vanilla',
    'vanilia': 'vanilla',
    'vanlla': 'vanilla',
    'strawbery': 'strawberry',
    'strawberie': 'strawberry',
    'strawberrie': 'strawberry',
    'stawberry': 'strawberry',
    'strwberry': 'strawberry',
    'strbery': 'strawberry',
    // Other common variations
    'bannana': 'banana',
    'bananana': 'banana',
    'chery': 'cherry',
    'aple': 'apple',
    'lemmon': 'lemon',
    'oragne': 'orange'
  };
  
  // Correct common typos
  let searchTerm = q;
  Object.entries(fuzzyMatches).forEach(([typo, correct]) => {
    if (searchTerm.includes(typo)) {
      searchTerm = searchTerm.replace(typo, correct);
    }
  });
  
  return (item: Product) => {
    const searchFields = [
      item.FLAVOUR || '',
      item.AMOUNT || '',
      item.PRICE || '',
      item.TITLE || '',
      item.COMPANY || ''
    ].join(' ').toLowerCase();
    
    // Direct match
    if (searchFields.includes(searchTerm)) return true;
    
    // Flavor group matching
    for (const [group, variations] of Object.entries(flavorGroups)) {
      if (searchTerm.includes(group)) {
        return variations.some(variant => searchFields.includes(variant));
      }
      if (variations.some(variant => searchTerm.includes(variant))) {
        return variations.some(variant => searchFields.includes(variant)) || 
               searchFields.includes(group);
      }
    }
    
    return false;
  };
};

export const filterProducts = (
  products: Product[],
  query: string,
  quantityFilter: string,
  productTypeFilter: string = 'all'
): Product[] => {
  let filtered = [...products];
  
  // Smart text search
  if (query.trim()) {
    const smartFilter = createSmartSearch(query);
    filtered = filtered.filter(smartFilter);
  }

  // Product type filtering
  if (productTypeFilter && productTypeFilter !== 'all') {
    filtered = filtered.filter(item => {
      const title = (item.TITLE || '').toLowerCase();
      
      switch (productTypeFilter) {
        case 'whey':
          return title.includes('whey');
        case 'vegan':
          return title.includes('vegan') || title.includes('plant') || title.includes('pea protein');
        case 'clear':
          return title.includes('clear') || title.includes('juice') || title.includes('hydro');
        case 'diet':
          return title.includes('diet') || title.includes('lean') || title.includes('meal replacement');
        case 'mass':
          return title.includes('mass') || title.includes('gainer') || title.includes('weight gain');
        default:
          return true;
      }
    });
  }

  // Quantity filter
  if (quantityFilter && quantityFilter !== 'all') {
    filtered = filtered.filter(item => {
      const grams = parseGrams(item.AMOUNT);
      if (!grams) return false;
      
      switch (quantityFilter) {
        case '<1kg': return grams < 1000;
        case '1-2kg': return grams >= 1000 && grams < 2000;
        case '2-3kg': return grams >= 2000 && grams < 3000;
        case '3-5kg': return grams >= 3000 && grams <= 5000;
        case '>5kg': return grams > 5000;
        default: return true;
      }
    });
  }

  return filtered;
};

export const isOutOfStock = (product: Product): boolean => {
  // Check various ways products might indicate out of stock
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
  ) || false;
};

export const sortProducts = (products: Product[], sortBy: string): Product[] => {
  let sorted = [...products];
  
  // Always sort by stock status first (in-stock items first)
  sorted = sorted.sort((a, b) => {
    const aOutOfStock = isOutOfStock(a);
    const bOutOfStock = isOutOfStock(b);
    
    if (aOutOfStock && !bOutOfStock) return 1;  // a goes after b
    if (!aOutOfStock && bOutOfStock) return -1; // a goes before b
    return 0; // same stock status, continue with other sorting
  });
  
  // Then apply secondary sorting while maintaining stock priority
  switch (sortBy) {
    case 'value':
      // Use the new Intake Value algorithm for "Best Value" sorting
      const benchmarks = calculateDatasetBenchmarks(products);
      return sorted.sort((a, b) => {
        const stockDiff = Number(isOutOfStock(a)) - Number(isOutOfStock(b));
        if (stockDiff !== 0) return stockDiff;
        const ratingA = calculateIntakeValueRating(a, benchmarks) || 0;
        const ratingB = calculateIntakeValueRating(b, benchmarks) || 0;
        return ratingB - ratingA;
      });
    case 'popularity':
      return sorted.sort((a, b) => {
        const stockDiff = Number(isOutOfStock(a)) - Number(isOutOfStock(b));
        if (stockDiff !== 0) return stockDiff;
        const aClicks = getClickCount(a.URL || a.LINK || '');
        const bClicks = getClickCount(b.URL || b.LINK || '');
        return bClicks - aClicks;
      });
    case 'price_low':
      return sorted.sort((a, b) => {
        const stockDiff = Number(isOutOfStock(a)) - Number(isOutOfStock(b));
        if (stockDiff !== 0) return stockDiff;
        return numFromPrice(a.PRICE) - numFromPrice(b.PRICE);
      });
    case 'price_high':
      return sorted.sort((a, b) => {
        const stockDiff = Number(isOutOfStock(a)) - Number(isOutOfStock(b));
        if (stockDiff !== 0) return stockDiff;
        return numFromPrice(b.PRICE) - numFromPrice(a.PRICE);
      });
    case 'protein':
      return sorted.sort((a, b) => {
        const stockDiff = Number(isOutOfStock(a)) - Number(isOutOfStock(b));
        if (stockDiff !== 0) return stockDiff;
        return numFromProtein(b.PROTEIN_SERVING?.toString()) - numFromProtein(a.PROTEIN_SERVING?.toString());
      });
    case 'brand':
      return sorted.sort((a, b) => {
        const stockDiff = Number(isOutOfStock(a)) - Number(isOutOfStock(b));
        if (stockDiff !== 0) return stockDiff;
        return (a.TITLE || '').localeCompare(b.TITLE || '');
      });
    default:
      return sorted;
  }
};

// Fuzzy search implementation
function applyFuzzySearch(products: Product[], query: string): Product[] {
  if (!query.trim()) return products;
  
  const smartFilter = createSmartSearch(query);
  return products.filter(smartFilter);
}

// Extract base product name by removing flavour variants
export const getBaseProductName = (title: string): string => {
  if (!title) return '';
  
  const flavorWords = [
    'chocolate', 'choc', 'cocoa', 'mocha', 'brownie',
    'vanilla', 'cream', 'custard',
    'strawberry', 'berry', 'berries',
    'banana', 'tropical',
    'cookies', 'cookie', 'biscuit', 'oreo',
    'mint', 'peppermint', 'spearmint',
    'coffee', 'latte', 'cappuccino', 'espresso',
    'peanut', 'pb', 'nut', 'butter',
    'salted', 'caramel', 'toffee',
    'lemon', 'lime', 'orange', 'citrus',
    'apple', 'grape', 'cherry',
    'unflavoured', 'unflavored', 'natural',
    'smooth', 'crunchy', 'original'
  ];
  
  let baseName = title.toLowerCase();
  
  // Remove flavour words and common descriptors
  flavorWords.forEach(flavor => {
    const regex = new RegExp(`\\b${flavor}\\b`, 'gi');
    baseName = baseName.replace(regex, '');
  });
  
  // Clean up extra spaces and return normalized name
  return baseName.replace(/\s+/g, ' ').trim();
};

// Export the fuzzy search function
export { applyFuzzySearch };

// Get top value products using the new Intake Value algorithm (protein/£, servings/£, discount)
export const getTopValueProducts = (products: Product[], count: number = 15): Product[] => {
  // Calculate benchmarks and score range from the full dataset for accurate scoring
  const benchmarks = calculateDatasetBenchmarks(products);
  const scoreRange = calculateScoreRange(products, benchmarks);
  
  const seenTitles = new Set<string>();
  const topProducts: Product[] = [];
  
  const sorted = products
    .filter(p => {
      if (isOutOfStock(p)) return false;
      
      // Exclude samples (< 100g)
      const grams = parseGrams(p.AMOUNT);
      if (grams !== null && grams < 100) return false;
      
      // Must have a valid rating
      const rating = calculateIntakeValueRating(p, benchmarks, scoreRange);
      return rating !== null && rating > 0;
    })
    .sort((a, b) => {
      const ratingA = calculateIntakeValueRating(a, benchmarks, scoreRange) || 0;
      const ratingB = calculateIntakeValueRating(b, benchmarks, scoreRange) || 0;
      return ratingB - ratingA;
    });
    
  for (const product of sorted) {
    const title = product.TITLE?.toLowerCase().trim();
    if (title && !seenTitles.has(title)) {
      seenTitles.add(title);
      topProducts.push(product);
      if (topProducts.length >= count) break;
    }
  }
  
  return topProducts;
};

// Get deduplicated featured products (one variant per base product)
export const getFeaturedProducts = (products: Product[], count: number = 4): Product[] => {
  const topProducts = getTopValueProducts(products, 50); // Get larger pool first
  const seenBaseNames = new Set<string>();
  const featured: Product[] = [];
  
  for (const product of topProducts) {
    if (featured.length >= count) break;
    
    const baseName = getBaseProductName(product.TITLE || '');
    if (!seenBaseNames.has(baseName) && baseName) {
      seenBaseNames.add(baseName);
      featured.push(product);
    }
  }
  
  return featured;
};

// Get most popular products (by click count)
export const getMostPopularProducts = (products: Product[], count: number = 10): Product[] => {
  return products
    .filter(p => !isOutOfStock(p))
    .sort((a, b) => getClickCount(b.URL || b.LINK || '') - getClickCount(a.URL || a.LINK || ''))
    .slice(0, count);
};

// Randomize in-stock products for variety in default view
export const randomizeInStockProducts = (products: Product[]): Product[] => {
  const inStock = products.filter(p => !isOutOfStock(p));
  const outOfStock = products.filter(p => isOutOfStock(p));
  
  // Shuffle in-stock products
  const shuffled = [...inStock].sort(() => Math.random() - 0.5);
  
  // Return shuffled in-stock products followed by out-of-stock
  return [...shuffled, ...outOfStock];
};