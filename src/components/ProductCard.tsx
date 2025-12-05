import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Package, ImageIcon, TrendingUp, Star, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { incrementClickCount } from "@/utils/productUtils";
import { useComparison } from "@/hooks/useComparison";
import { useValueBenchmarks } from "@/hooks/useValueBenchmarks";
import { calculateIntakeValueRating, getValueRatingColor, getValueRatingLabel } from "@/utils/valueRating";

interface Product {
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
  [key: string]: any;
}

interface ProductCardProps {
  product: Product;
  isTopValue?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
}

const isOutOfStock = (product: Product): boolean => {
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

// Brand extraction helpers
const prettifyBrand = (s: string) => s.split(/[-_ ]+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const extractBrandFromUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    let host = u.hostname.toLowerCase().replace(/^www\./, '');
    
    // Special case for ESN (uk.esn.com should show "ESN")
    if (host.includes('esn.com')) {
      return 'ESN';
    }
    
    const parts = host.split('.');
    let base = parts[0];
    if (parts.length >= 3 && parts[parts.length - 2] === 'co') {
      base = parts[parts.length - 3];
    }
    return prettifyBrand(base.replace(/[-_]/g, ' '));
  } catch {
    return undefined;
  }
};
const getBrandFromProduct = (product: Product): string => {
  const candidate = (product.COMPANY || '').trim();
  const generic = new Set(['see website','see site','website','visit site','n/a','unknown','see web']);
  if (candidate && !generic.has(candidate.toLowerCase())) return candidate;
  const url = product.URL || product.LINK || product.IMAGE_URL;
  return extractBrandFromUrl(url) || candidate || 'Unknown Brand';
};

const formatProtein = (value?: string) => {
  if (!value || value === 'nan' || value === 'undefined' || String(value).toLowerCase() === 'nan') return 'N/A';
  const s = String(value).trim();
  if (!s || s === 'nan') return 'N/A';
  if (/[0-9]\s*(g|mg)\b/i.test(s)) {
    return s.replace(/\s*(g|mg)\b/i, ' $1');
  }
  const num = s.match(/[\d.]+/);
  return num ? `${num[0]} g` : s;
};

// Helper function to safely display values and avoid "nan"
const safeDisplayValue = (value: any, fallback: string = 'N/A'): string => {
  if (value === undefined || value === null || value === 'nan' || 
      value === 'undefined' || String(value).toLowerCase() === 'nan' || 
      String(value).trim() === '') {
    return fallback;
  }
  return String(value);
};

export function ProductCard({ product, isTopValue, isFeatured, isPopular }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [addAnimation, setAddAnimation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const outOfStock = isOutOfStock(product);
  const { addToComparison, isInComparison, comparisonProducts } = useComparison();
  const { benchmarks } = useValueBenchmarks();
  const valueRating = calculateIntakeValueRating(product, benchmarks || undefined);
  
  // Toggle to show value bar on all tiles (set to false to only show in comparison mode)
  const SHOW_VALUE_BAR_ALWAYS = true;
  
  const handleCardClick = (e: React.MouseEvent) => {
    const url = product.URL || product.LINK;
    if (url) {
      incrementClickCount(url);
      // Let the browser handle the navigation via the <a> tag
    }
  };

  const handleAddToComparison = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent the <a> tag from navigating
    
    if (!isInComparison(product) && comparisonProducts.length < 4) {
      // Get card position for animation
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const clone = cardRef.current.cloneNode(true) as HTMLElement;
        
        // Style the clone for animation
        clone.style.position = 'fixed';
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.zIndex = '9999';
        clone.style.pointerEvents = 'none';
        clone.style.transition = 'none';
        
        document.body.appendChild(clone);
        
        // Calculate target position (bottom right corner)
        const targetX = window.innerWidth - rect.left - rect.width / 2 - 80;
        const targetY = window.innerHeight - rect.top - rect.height / 2 - 80;
        
        // Single smooth arc animation with slight upward curve
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            clone.style.transition = 'all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
            clone.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.2) rotate(3deg)`;
            clone.style.opacity = '0';
          });
        });
        
        // Clean up and add to comparison
        setTimeout(() => {
          if (document.body.contains(clone)) {
            document.body.removeChild(clone);
          }
          addToComparison(product);
        }, 500);
      } else {
        addToComparison(product);
      }
      
      setAddAnimation(true);
      setTimeout(() => setAddAnimation(false), 500);
    }
  };

  const getBorderClass = () => {
    if (outOfStock) return 'border-border/20';
    if (isFeatured) return 'border border-border';
    if (isTopValue) return 'border border-border';
    if (isPopular) return 'border-2 border-white';
    return 'border-border hover:border-primary/30';
  };

  const productUrl = product.URL || product.LINK;

  const cardContent = (
    <>
      {/* Product Image - 50% mobile, 65% desktop */}
      <div className="relative w-full overflow-hidden rounded-t-lg bg-white h-[52%] md:h-[52%]">
        {product.IMAGE_URL && !imageError ? (
          <img
            src={product.IMAGE_URL}
            alt={product.TITLE || "Product image"}
            className={`w-full h-full object-cover object-center transition-transform duration-300 rounded-t-lg ${
              outOfStock ? 'grayscale' : ''
            }`}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white rounded-t-lg">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Stock Status Badge */}
        {outOfStock && (
          <Badge variant="destructive" className="absolute bottom-2 left-2">
            Out of Stock
          </Badge>
        )}

        {/* Special Product Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isFeatured && !outOfStock && (
            <Badge className="bg-primary text-primary-foreground font-medium flex items-center gap-1">
              <Star className="h-3 w-3" />
              Featured
            </Badge>
          )}
          {isTopValue && !outOfStock && !isFeatured && (
            <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-semibold shadow-lg">
              Best Value
            </Badge>
          )}
          {isPopular && !outOfStock && !isFeatured && !isTopValue && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Popular
            </Badge>
          )}
        </div>
      </div>

      {/* Product Info - 50% mobile, 35% desktop */}
      <CardContent className="p-2 pb-3 flex flex-col justify-between h-[48%] md:h-[48%]">
        {/* Company Name */}
        <div className="mb-1">
          <p className="text-xs text-muted-foreground line-clamp-1">
            {getBrandFromProduct(product)}
          </p>
        </div>

        {/* Product Title */}
        <CardTitle className="text-xs mb-1 line-clamp-2 min-h-[2rem] flex items-start leading-tight">
          {safeDisplayValue(product.TITLE, "Product Title Not Available")}
        </CardTitle>

        {/* Price and Amount */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-primary">
            {safeDisplayValue(product.PRICE, "Price N/A")}
          </span>
          {product.AMOUNT && safeDisplayValue(product.AMOUNT) !== 'N/A' && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {safeDisplayValue(product.AMOUNT)}
            </Badge>
          )}
        </div>

        {/* Product Details - Compact */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Protein per Serving:</span>
            <span className="font-medium text-foreground">
              {formatProtein(product.PROTEIN_SERVING)}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Flavour:</span>
            <span className="font-medium text-foreground">
              {safeDisplayValue(product.FLAVOUR)}
            </span>
          </div>
        </div>

        {/* Intake Value Bar - toggle SHOW_VALUE_BAR_ALWAYS to control visibility */}
        {(SHOW_VALUE_BAR_ALWAYS || comparisonProducts.length > 0) && valueRating && !outOfStock && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Intake Value
              </span>
              <span className={`text-xs font-bold bg-gradient-to-r ${getValueRatingColor(valueRating)} bg-clip-text text-transparent`}>
                {valueRating}
              </span>
            </div>
            <div className="relative h-1.5 bg-muted/20 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getValueRatingColor(valueRating)} rounded-full transition-all duration-500 ${
                  valueRating >= 8 ? 'shadow-lg animate-[shimmer_2s_ease-in-out_infinite]' : 'shadow-sm'
                }`}
                style={{ 
                  width: `${(valueRating / 10) * 100}%`,
                  boxShadow: valueRating >= 8 ? '0 0 8px rgba(168, 85, 247, 0.5)' : undefined
                }}
              />
              {valueRating >= 8 && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide_3s_ease-in-out_infinite]"
                  style={{ width: '30%' }}
                />
              )}
            </div>
            <p className="text-[9px] text-muted-foreground/70 mt-0.5 text-right">
              {getValueRatingLabel(valueRating)}
            </p>
          </div>
        )}
      </CardContent>
    </>
  );

  return (
    <Card 
      ref={cardRef}
      className={`h-[360px] sm:h-[380px] md:h-[420px] transition-all duration-300 group hover:shadow-card ${getBorderClass()} ${
        outOfStock ? 'opacity-60 grayscale' : 'hover:scale-[1.02] hover:rounded-lg'
      } flex flex-col relative overflow-hidden rounded-lg`}
    >
      {/* Add to comparison button - OUTSIDE the link wrapper */}
      <Button
        onClick={handleAddToComparison}
        disabled={isInComparison(product) || comparisonProducts.length >= 4 || outOfStock}
        size="sm"
        variant="outline"
        className={`absolute top-2 right-2 h-8 w-8 p-0 border-2 border-primary bg-background/90 backdrop-blur-sm transition-all duration-200 rounded-full hover:scale-110 z-[100] ${
          addAnimation ? 'scale-0' : ''
        } ${
          isInComparison(product) ? 'bg-primary text-primary-foreground' : ''
        }`}
      >
        <Plus className={`h-4 w-4 font-bold ${isInComparison(product) ? 'text-primary-foreground' : 'text-primary'}`} />
      </Button>

      {productUrl ? (
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCardClick}
          className="block h-full w-full cursor-pointer text-inherit no-underline hover:text-inherit"
        >
          <div className="h-full flex flex-col">
            {cardContent}
          </div>
        </a>
      ) : (
        <div className="h-full flex flex-col">
          {cardContent}
        </div>
      )}
    </Card>
  );
}