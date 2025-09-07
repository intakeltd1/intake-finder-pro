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

export interface Product {
  TITLE?: string;
  COMPANY?: string;
  PRICE?: string;
  AMOUNT?: string;
  PROTEIN_SERVING?: string;
  FLAVOUR?: string;
  LINK?: string;
}

export const filterProducts = (
  products: Product[],
  query: string,
  quantityFilter: string
): Product[] => {
  let filtered = [...products];
  
  // Text search
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter(item =>
      (item.FLAVOUR || '').toLowerCase().includes(q) ||
      (item.AMOUNT || '').toLowerCase().includes(q) ||
      (item.PRICE || '').toLowerCase().includes(q) ||
      (item.TITLE || '').toLowerCase().includes(q) ||
      (item.COMPANY || '').toLowerCase().includes(q)
    );
  }

  // Quantity filter
  if (quantityFilter) {
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

export const sortProducts = (products: Product[], sortBy: string): Product[] => {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price_low':
      return sorted.sort((a, b) => numFromPrice(a.PRICE) - numFromPrice(b.PRICE));
    case 'price_high':
      return sorted.sort((a, b) => numFromPrice(b.PRICE) - numFromPrice(a.PRICE));
    case 'protein':
      return sorted.sort((a, b) => numFromProtein(b.PROTEIN_SERVING) - numFromProtein(a.PROTEIN_SERVING));
    case 'brand':
      return sorted.sort((a, b) => (a.TITLE || '').localeCompare(b.TITLE || ''));
    default:
      return sorted;
  }
};