/**
 * Text formatting utilities for consistent display across the application
 * Automatically normalizes source data to professional title case
 */

// Known abbreviations that should remain uppercase
const PRESERVE_UPPERCASE = new Set([
  'ISO', 'BCAA', 'BCAAS', 'EAA', 'EAAS', 'HMB', 'ZMA', 'CLA', 'MCT', 
  'EHP', 'USN', 'PHD', 'MRE', 'RTD', 'WPC', 'WPI', 'MRP', 'XL', 'XXL',
  'PRO', 'MAX', 'DNA', 'ATP', 'GNC', 'BSN', 'ON', 'MP', 'UK', 'USA',
  'ZERO', 'PLUS', 'HD', 'HP', 'XT', 'LTD', 'PB', 'AB', 'CBD'
]);

// Known brand capitalizations
const BRAND_MAP: Record<string, string> = {
  'myprotein': 'Myprotein',
  'optimum nutrition': 'Optimum Nutrition',
  'bulk': 'Bulk',
  'esn': 'ESN',
  'sci-mx': 'SCI-MX',
  'scimx': 'SCI-MX',
  'phd': 'PhD',
  'usn': 'USN',
  'grenade': 'Grenade',
  'applied nutrition': 'Applied Nutrition',
  'ehplabs': 'EHPlabs',
  'ehp labs': 'EHPlabs',
  'bsn': 'BSN',
  'gnc': 'GNC',
  'musclepharm': 'MusclePharm',
  'muscletech': 'MuscleTech',
  'cellucor': 'Cellucor',
  'dymatize': 'Dymatize',
  'isopure': 'Isopure',
  'quest': 'Quest',
  'ghost': 'GHOST',
  'ryse': 'RYSE',
  'cbum': 'CBUM',
  'raw nutrition': 'RAW Nutrition',
  'rule 1': 'Rule 1',
  'rule one': 'Rule One',
  'pe science': 'PEScience',
  'pescience': 'PEScience',
  'redcon1': 'Redcon1',
  'redcon 1': 'Redcon1',
  'jym': 'JYM',
  'nutrabio': 'NutraBio',
  'allmax': 'ALLMAX',
  'mutant': 'Mutant',
  'gaspari': 'Gaspari',
  'nutrex': 'Nutrex',
  'evlution': 'EVL',
  'evl': 'EVL',
  'betancourt': 'Betancourt',
  'kaged': 'Kaged',
  'kaged muscle': 'Kaged',
  'transparent labs': 'Transparent Labs',
  'legion': 'Legion',
  'garden of life': 'Garden of Life',
  'vega': 'Vega',
  'orgain': 'Orgain',
  'sunwarrior': 'Sunwarrior',
  'nuzest': 'Nuzest',
  'huel': 'Huel',
  'protein works': 'Protein Works',
  'the protein works': 'The Protein Works',
  'bulk powders': 'Bulk Powders',
  'reflex': 'Reflex',
  'reflex nutrition': 'Reflex Nutrition',
  'maximuscle': 'Maximuscle',
  'for goodness shakes': 'For Goodness Shakes',
  'maxi nutrition': 'Maxi Nutrition',
  'maxinutrition': 'MaxiNutrition',
  'cnp': 'CNP',
  'cnp professional': 'CNP Professional',
  'warrior': 'Warrior',
  'phd nutrition': 'PhD Nutrition',
  'in the zone': 'In The Zone',
  'boditronics': 'Boditronics',
  'nutrisport': 'Nutrisport',
  'multipower': 'Multipower',
  'weider': 'Weider',
  'olimp': 'Olimp',
  'scitec': 'Scitec',
  'scitec nutrition': 'Scitec Nutrition',
  'biotech usa': 'BioTech USA',
  'biotechusa': 'BioTechUSA',
  'amix': 'Amix',
  'kevin levrone': 'Kevin Levrone',
  'yamamoto': 'Yamamoto',
  'yamamoto nutrition': 'Yamamoto Nutrition',
};

/**
 * Converts text to Title Case (e.g., "CLEAR WHEY" → "Clear Whey")
 * Smart handling for abbreviations and special cases
 */
export function toTitleCase(text?: string): string {
  if (!text || text === 'nan' || text === 'undefined' || text === 'null') return '';
  
  const str = String(text).trim();
  if (!str) return '';
  
  return str
    .split(/\s+/)
    .map(word => {
      // Check if entire word is a known abbreviation
      const upperWord = word.toUpperCase();
      if (PRESERVE_UPPERCASE.has(upperWord)) {
        return upperWord;
      }
      
      // Handle hyphenated words
      if (word.includes('-')) {
        return word.split('-').map(part => {
          const upperPart = part.toUpperCase();
          if (PRESERVE_UPPERCASE.has(upperPart)) {
            return upperPart;
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join('-');
      }
      
      // Handle words with numbers (e.g., "100g" → "100g")
      if (/^\d/.test(word)) {
        return word.toLowerCase();
      }
      
      // Standard title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Format brand name with proper capitalization
 */
export function formatBrand(brand?: string): string {
  if (!brand || brand === 'nan' || brand === 'undefined') return '';
  
  const normalized = brand.toLowerCase().trim();
  
  // Check if we have a known brand mapping
  if (BRAND_MAP[normalized]) {
    return BRAND_MAP[normalized];
  }
  
  // Fall back to title case
  return toTitleCase(brand);
}

/**
 * Format flavour name consistently
 */
export function formatFlavour(flavour?: string): string {
  if (!flavour || flavour === 'nan' || flavour === 'undefined') return '';
  return toTitleCase(flavour);
}

/**
 * Format product title consistently
 */
export function formatProductTitle(title?: string): string {
  if (!title || title === 'nan' || title === 'undefined') return '';
  return toTitleCase(title);
}
