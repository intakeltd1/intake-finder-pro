import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Package, ImageIcon, TrendingUp, Star, Plus } from "lucide-react";
import { useState } from "react";
import { incrementClickCount } from "@/utils/productUtils";
import { useComparison } from "@/hooks/useComparison";

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
  if (!value) return 'N/A';
  const s = String(value).trim();
  if (!s) return 'N/A';
  if (/[0-9]\s*(g|mg)\b/i.test(s)) {
    return s.replace(/\s*(g|mg)\b/i, ' $1');
  }
  const num = s.match(/[\d.]+/);
  return num ? `${num[0]} g` : s;
};

export function ProductCard({ product, isTopValue, isFeatured, isPopular }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [addAnimation, setAddAnimation] = useState(false);
  const outOfStock = isOutOfStock(product);
  const { addToComparison, isInComparison, comparisonProducts } = useComparison();
  
  const handleCardClick = () => {
    const url = product.URL || product.LINK;
    if (url) {
      incrementClickCount(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddToComparison = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInComparison(product) && comparisonProducts.length < 4) {
      addToComparison(product);
      setAddAnimation(true);
      setTimeout(() => setAddAnimation(false), 600);
    }
  };

  const getBorderClass = () => {
    if (outOfStock) return 'border-border/20';
    if (isFeatured) return 'border border-border';
    if (isTopValue) return 'border border-border';
    if (isPopular) return 'border-2 border-white';
    return 'border-border hover:border-primary/30';
  };

  return (
    <Card 
      className={`transition-all duration-300 cursor-pointer group hover:shadow-card ${getBorderClass()} ${
        outOfStock ? 'opacity-60 grayscale' : 'hover:scale-[1.02] hover:rounded-lg'
      } flex relative overflow-hidden rounded-lg
      /* Mobile: horizontal row layout */
      h-32 flex-row md:h-[380px] md:flex-col`}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className={`relative overflow-hidden bg-white flex-shrink-0
        /* Mobile: fixed width, full height */
        w-24 h-full md:w-full md:h-48 rounded-l-lg md:rounded-t-lg md:rounded-l-none`}>
        {product.IMAGE_URL && !imageError ? (
          <img
            src={product.IMAGE_URL}
            alt={product.TITLE || "Product image"}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              outOfStock ? 'grayscale' : 'group-hover:scale-105'
            }`}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <ImageIcon className="h-6 w-6 md:h-12 md:w-12 text-muted-foreground" />
          </div>
        )}

        {/* Add to comparison button - desktop only */}
        <Button
          onClick={handleAddToComparison}
          disabled={isInComparison(product) || comparisonProducts.length >= 4 || outOfStock}
          size="sm"
          variant="outline"
          className={`absolute top-2 right-2 h-8 w-8 p-0 border-2 border-primary bg-background/90 backdrop-blur-sm transition-transform duration-200 rounded-full hover:scale-110 ${
            addAnimation ? 'animate-bounce' : ''
          } ${
            isInComparison(product) ? 'bg-primary text-primary-foreground' : ''
          } hidden md:flex`}
        >
          <Plus className={`h-4 w-4 font-bold ${isInComparison(product) ? 'text-primary-foreground' : 'text-primary'}`} />
        </Button>

        {/* Stock Status Badge */}
        {outOfStock && (
          <Badge variant="destructive" className="absolute bottom-2 left-2 text-xs">
            Out of Stock
          </Badge>
        )}

        {/* Special Product Badges */}
        <div className="absolute top-1 left-1 md:top-2 md:left-2 flex flex-col gap-0.5 md:gap-1">
          {isFeatured && !outOfStock && (
            <Badge className="bg-primary text-primary-foreground font-medium flex items-center gap-1 text-xs px-1 py-0 md:px-2 md:py-1">
              <Star className="h-2 w-2 md:h-3 md:w-3" />
              <span className="hidden md:inline">Featured</span>
              <span className="md:hidden">F</span>
            </Badge>
          )}
          {isTopValue && !outOfStock && !isFeatured && (
            <Badge className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white font-medium text-xs px-1 py-0 md:px-2 md:py-1">
              <span className="hidden md:inline">Best Value</span>
              <span className="md:hidden">BV</span>
            </Badge>
          )}
          {isPopular && !outOfStock && !isFeatured && !isTopValue && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium flex items-center gap-1 text-xs px-1 py-0 md:px-2 md:py-1">
              <TrendingUp className="h-2 w-2 md:h-3 md:w-3" />
              <span className="hidden md:inline">Popular</span>
              <span className="md:hidden">P</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Product Info */}
      <CardContent className={`flex flex-col justify-between p-3 md:p-4 flex-1`}>
        
        {/* Mobile Layout - One field per row */}
        <div className="md:hidden flex flex-col space-y-1 h-full">
          {/* Brand */}
          <p className="text-xs text-muted-foreground">
            {getBrandFromProduct(product)}
          </p>
          
          {/* Title */}
          <h3 className="text-sm font-semibold line-clamp-2 leading-tight">
            {product.TITLE || "Product Title Not Available"}
          </h3>
          
          {/* Price */}
          <div className="text-sm font-bold text-primary">
            {product.PRICE || "N/A"}
          </div>
          
          {/* Protein */}
          <div className="text-xs text-muted-foreground">
            Protein: {product.PROTEIN_SERVING ? formatProtein(product.PROTEIN_SERVING) : 'N/A'}
          </div>
          
          {/* Amount */}
          {product.AMOUNT && (
            <div className="text-xs text-muted-foreground">
              Size: {product.AMOUNT}
            </div>
          )}
          
          {/* Add button */}
          <div className="mt-auto pt-1">
            <Button
              onClick={handleAddToComparison}
              disabled={isInComparison(product) || comparisonProducts.length >= 4 || outOfStock}
              size="sm"
              variant="outline"
              className={`text-xs h-6 px-3 w-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground ${
                addAnimation ? 'animate-bounce' : ''
              } ${
                isInComparison(product) ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              {isInComparison(product) ? "Added" : "Add to Compare"}
            </Button>
          </div>
        </div>

        {/* Desktop Layout - Restored original good layout */}
        <div className="hidden md:block h-full flex flex-col">
          {/* Company Name */}
          <div className="mb-2">
            <p className="text-sm text-muted-foreground line-clamp-1">
              {getBrandFromProduct(product)}
            </p>
          </div>

          {/* Product Title */}
          <CardTitle className="text-base font-semibold mb-3 line-clamp-2 min-h-[3rem] flex items-start leading-tight">
            {product.TITLE || "Product Title Not Available"}
          </CardTitle>

          {/* Price and Amount */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-primary">
              {product.PRICE || "Price N/A"}
            </span>
            {product.AMOUNT && (
              <Badge variant="secondary" className="text-sm px-2 py-1">
                {product.AMOUNT}
              </Badge>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Protein:</span>
              <span className="font-medium text-foreground">
                {formatProtein(product.PROTEIN_SERVING)}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Flavour:</span>
              <span className="font-medium text-foreground line-clamp-1">
                {product.FLAVOUR || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}