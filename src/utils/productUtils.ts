// Utility functions for product data processing

export const parseGrams = (amount?: string): number | null => {
  if (!amount) return null;
  const match = amount.match(/([\d.]+)\s*(kg|g)/i);
  if (!match) return null;
  let value = parseFloat(match[1]);
  if (match[2].toLowerCase() === 'kg') value *= 1000;
  return value;
};

export const numFromPrice = (price?: string): number => {
  if (!price) return Infinity;
  const match = price.replace(/[^\d.]/g, '');
  return parseFloat(match) || Infinity;
};

export const numFromProtein = (protein?: string): number => {
  if (!protein) return 0;
  const match = protein.replace(/[^\d.]/g, '');
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
  [key: string]: any; // For any additional fields
}

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
  
  // Simple fuzzy matching for common typos
  const fuzzyMatches = {
    'protien': 'protein',
    'protine': 'protein',
    'whay': 'whey',
    'wey': 'whey',
    'casien': 'casein',
    'creatien': 'creatine',
    'chocolat': 'chocolate',
    'vanila': 'vanilla',
    'strawbery': 'strawberry'
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
  goalFilter: string = 'all'
): Product[] => {
  let filtered = [...products];
  
  // Smart text search
  if (query.trim()) {
    const smartFilter = createSmartSearch(query);
    filtered = filtered.filter(smartFilter);
  }

  // Goal-based filtering
  if (goalFilter && goalFilter !== 'all') {
    filtered = filtered.filter(item => {
      const title = (item.TITLE || '').toLowerCase();
      
      if (goalFilter === 'weight_loss') {
        return title.includes('diet') || 
               title.includes('lean') || 
               title.includes('meal replacement') ||
               title.includes('fat burn') ||
               title.includes('weight loss');
      } else if (goalFilter === 'build_muscle') {
        return title.includes('mass') || 
               title.includes('gainer') || 
               title.includes('beef') ||
               title.includes('creatine') ||
               (numFromProtein(item.PROTEIN_SERVING?.toString()) >= 25);
      }
      return true;
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

const isOutOfStock = (product: Product): boolean => {
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
      return sorted.sort((a, b) => {
        const stockDiff = Number(isOutOfStock(a)) - Number(isOutOfStock(b));
        if (stockDiff !== 0) return stockDiff;
        return calculateValueScore(b) - calculateValueScore(a);
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

// Get top value products (best protein per price ratio)
export const getTopValueProducts = (products: Product[], count: number = 15): Product[] => {
  return products
    .filter(p => !isOutOfStock(p) && calculateValueScore(p) > 0)
    .sort((a, b) => calculateValueScore(b) - calculateValueScore(a))
    .slice(0, count);
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