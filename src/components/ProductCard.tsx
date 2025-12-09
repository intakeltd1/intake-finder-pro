import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, TrendingUp, Star, Plus, ChevronDown, Crown, Heart } from "lucide-react";
import { useState, useRef } from "react";
import { incrementClickCount, parseGrams, formatAmount } from "@/utils/productUtils";
import { useComparison } from "@/hooks/useComparison";
import { useValueBenchmarks } from "@/hooks/useValueBenchmarks";
import { usePriceTrend } from "@/hooks/usePriceTrend";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { calculateIntakeValueRating, getValueRatingColor, getValueRatingLabel } from "@/utils/valueRating";
import { PriceTrendIcon } from "@/components/PriceTrendIcon";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  RRP?: string;
  [key: string]: any;
}

interface ProductCardProps {
  product: Product & { variants?: Product[]; variantCount?: number };
  isTopValue?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  isTopValueOfDay?: boolean;
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

// Format amount to normalized display (lowercase units, kg for 1000g+)
const formatDisplayAmount = (amount?: string): string => {
  if (!amount || amount === 'nan' || amount === 'undefined') return '';
  const grams = parseGrams(amount);
  if (grams === null) return amount; // Return original if can't parse
  return formatAmount(grams);
};

export function ProductCard({ product, isTopValue, isFeatured, isPopular, isTopValueOfDay }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [addAnimation, setAddAnimation] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Handle variants - selectedVariant tracks which flavour is selected
  const hasVariants = product.variants && product.variants.length > 1;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const currentProduct = hasVariants ? product.variants![selectedVariantIndex] : product;
  const productUrl = currentProduct.URL || currentProduct.LINK;
  
  const outOfStock = isOutOfStock(currentProduct);
  const { addToComparison, isInComparison, comparisonProducts } = useComparison();
  const { benchmarks, scoreRange, rankings } = useValueBenchmarks();
  const valueRating = calculateIntakeValueRating(currentProduct, benchmarks || undefined, scoreRange || undefined, rankings || undefined);
  const priceTrend = usePriceTrend(productUrl);
  
  // Auth & Favorites
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isProductFavorited = productUrl ? isFavorite(productUrl) : false;
  
  // Toggle to show value bar on all tiles (set to false to only show in comparison mode)
  const SHOW_VALUE_BAR_ALWAYS = true;
  
  const handleCardClick = (e: React.MouseEvent) => {
    const url = currentProduct.URL || currentProduct.LINK;
    if (url) {
      incrementClickCount(url);
    }
  };

  const handleAddToComparison = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isInComparison(currentProduct) && comparisonProducts.length < 4) {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const clone = cardRef.current.cloneNode(true) as HTMLElement;
        
        clone.style.position = 'fixed';
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.zIndex = '9999';
        clone.style.pointerEvents = 'none';
        clone.style.transition = 'none';
        
        document.body.appendChild(clone);
        
        const targetX = window.innerWidth - rect.left - rect.width / 2 - 80;
        const targetY = window.innerHeight - rect.top - rect.height / 2 - 80;
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            clone.style.transition = 'all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
            clone.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.2) rotate(3deg)`;
            clone.style.opacity = '0';
          });
        });
        
        setTimeout(() => {
          if (document.body.contains(clone)) {
            document.body.removeChild(clone);
          }
          addToComparison(currentProduct);
        }, 500);
      } else {
        addToComparison(currentProduct);
      }
      
      setAddAnimation(true);
      setTimeout(() => setAddAnimation(false), 500);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    toggleFavorite(currentProduct);
  };

  const getBorderClass = () => {
    if (outOfStock) return 'border-border/20';
    if (isFeatured) return 'border border-border';
    if (isTopValue) return 'border border-border';
    if (isPopular) return 'border-2 border-white';
    return 'border-border hover:border-primary/30';
  };


  // Handle variant selection
  const handleVariantChange = (value: string) => {
    const index = parseInt(value, 10);
    if (!isNaN(index)) {
      setSelectedVariantIndex(index);
      setImageError(false); // Reset image error when changing variant
    }
  };

  const cardContent = (
    <>
      {/* Product Image */}
      <div className="relative w-full overflow-hidden rounded-t-lg bg-white h-[50%] md:h-[48%]">
        {currentProduct.IMAGE_URL && !imageError ? (
          <img
            src={currentProduct.IMAGE_URL}
            alt={currentProduct.TITLE || "Product image"}
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
          {isTopValueOfDay && !outOfStock && (
            <Badge className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-900 font-bold shadow-xl animate-pulse flex items-center gap-1 border border-amber-300">
              <Crown className="h-3 w-3" />
              Top Value of the Day
            </Badge>
          )}
          {isFeatured && !outOfStock && !isTopValueOfDay && (
            <Badge className="bg-primary text-primary-foreground font-medium flex items-center gap-1">
              <Star className="h-3 w-3" />
              Featured
            </Badge>
          )}
          {isTopValue && !outOfStock && !isFeatured && !isTopValueOfDay && (
            <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-semibold shadow-lg">
              Best Value
            </Badge>
          )}
          {isPopular && !outOfStock && !isFeatured && !isTopValue && !isTopValueOfDay && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Popular
            </Badge>
          )}
        </div>
      </div>

      {/* Product Info */}
      <CardContent className="p-2 pb-3 flex flex-col justify-between h-[50%] md:h-[52%]">
        {/* Company Name */}
        <div className="mb-0.5">
          <p className="text-xs text-muted-foreground line-clamp-1">
            {getBrandFromProduct(currentProduct)}
          </p>
        </div>

        {/* Product Title */}
        <CardTitle className="text-xs mb-1 line-clamp-2 min-h-[2rem] flex items-start leading-tight">
          {safeDisplayValue(currentProduct.TITLE, "Product Title Not Available")}
        </CardTitle>

        {/* Flavour Section - Static or Dropdown */}
        <div 
          className="mb-1 relative z-[150]" 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {hasVariants ? (
            <div className="flex items-center justify-between gap-1">
              <Select
                value={selectedVariantIndex.toString()}
                onValueChange={handleVariantChange}
              >
                <SelectTrigger 
                  className="h-6 text-[10px] px-2 py-0 bg-background border-border/50 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <SelectValue placeholder="Select flavour">
                    {safeDisplayValue(currentProduct.FLAVOUR, 'No flavour')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent 
                  className="bg-background border-border z-[200] max-h-48"
                  onPointerDownOutside={(e) => e.stopPropagation()}
                >
                  {product.variants!.map((variant, idx) => (
                    <SelectItem 
                      key={idx} 
                      value={idx.toString()}
                      className="text-xs"
                    >
                      {safeDisplayValue(variant.FLAVOUR, 'No flavour')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                +{product.variantCount! - 1} more
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {safeDisplayValue(currentProduct.FLAVOUR, '')}
            </p>
          )}
        </div>

        {/* Price and Amount */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex flex-col">
            {currentProduct.RRP && currentProduct.RRP !== currentProduct.PRICE && (
              <span className="text-xs text-muted-foreground line-through">
                was {safeDisplayValue(currentProduct.RRP)}
              </span>
            )}
            <span className="text-base font-bold text-primary">
              {safeDisplayValue(currentProduct.PRICE, "Price N/A")}
            </span>
          </div>
          {currentProduct.AMOUNT && formatDisplayAmount(currentProduct.AMOUNT) && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {formatDisplayAmount(currentProduct.AMOUNT)}
            </Badge>
          )}
        </div>

        {/* Product Details - Compact */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Protein/Serving:</span>
            <span className="font-medium text-foreground">
              {formatProtein(currentProduct.PROTEIN_SERVING)}
            </span>
          </div>
        </div>

        {/* Intake Value Bar */}
        {(SHOW_VALUE_BAR_ALWAYS || comparisonProducts.length > 0) && valueRating && !outOfStock && (
          <div className="mt-1 pt-1 border-t border-border/30">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                Intake Value
              </span>
              <span className={`text-[10px] md:text-xs font-bold bg-gradient-to-r ${getValueRatingColor(valueRating)} bg-clip-text text-transparent flex-shrink-0 ml-1`}>
                {valueRating}
              </span>
            </div>
            <div className="relative h-1 md:h-1.5 bg-muted/20 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getValueRatingColor(valueRating)} rounded-full transition-all duration-500 ${
                  valueRating >= 9.5 ? 'shadow-lg animate-[shimmer_2s_ease-in-out_infinite]' : 'shadow-sm'
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
            <p className="text-[8px] md:text-[9px] text-muted-foreground/70 mt-0.5 text-right truncate">
              {getValueRatingLabel(valueRating)}
            </p>
          </div>
        )}
      </CardContent>
    </>
  );

  return (
    <>
      <Card 
        ref={cardRef}
        className={`h-[360px] sm:h-[380px] md:h-[420px] transition-all duration-300 group hover:shadow-card ${getBorderClass()} ${
          outOfStock ? 'opacity-60 grayscale' : 'hover:scale-[1.02] hover:rounded-lg'
        } flex flex-col relative overflow-hidden rounded-lg`}
      >
        {/* Right-side icon stack */}
        <div className="absolute top-2 right-2 z-[100] flex flex-col gap-1.5">
          {/* Add to comparison button */}
          <Button
            onClick={handleAddToComparison}
            disabled={isInComparison(currentProduct) || comparisonProducts.length >= 4 || outOfStock}
            size="sm"
            variant="outline"
            className={`h-8 w-8 p-0 border-2 backdrop-blur-sm transition-all duration-300 rounded-full hover:scale-110 ${
              addAnimation ? 'scale-0' : ''
            } ${
              isInComparison(currentProduct) 
                ? 'bg-purple-500 border-purple-500 text-white' 
                : 'bg-background/80 border-white/60 text-white hover:border-purple-500 hover:text-purple-500 hover:bg-purple-500/10'
            }`}
          >
            <Plus className="h-4 w-4 font-bold" />
          </Button>

          {/* Favorite button */}
          <Button
            onClick={handleFavoriteClick}
            size="sm"
            variant="outline"
            className={`h-8 w-8 p-0 border-2 backdrop-blur-sm transition-all duration-300 rounded-full hover:scale-110 ${
              isProductFavorited 
                ? 'bg-red-500 border-red-500 text-white' 
                : 'bg-background/80 border-white/60 text-white hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
            }`}
          >
            <Heart className={`h-4 w-4 ${isProductFavorited ? 'fill-current' : ''}`} />
          </Button>

          {/* Price trend indicator */}
          {priceTrend && !outOfStock && (
            <PriceTrendIcon trend={priceTrend} />
          )}
        </div>

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

      {/* Login Prompt Dialog */}
      <LoginPromptDialog 
        open={showLoginPrompt} 
        onOpenChange={setShowLoginPrompt} 
      />
    </>
  );
}
