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
      className={`h-[340px] sm:h-[360px] md:h-[400px] transition-all duration-300 cursor-pointer group hover:shadow-card ${getBorderClass()} ${
        outOfStock ? 'opacity-60 grayscale' : 'hover:scale-[1.02] hover:rounded-lg'
      } flex flex-col relative overflow-hidden rounded-lg`}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-white">
        {product.IMAGE_URL && !imageError ? (
          <img
            src={product.IMAGE_URL}
            alt={product.TITLE || "Product image"}
            className={`w-full h-full object-contain transition-transform duration-300 rounded-t-lg ${
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

        {/* Add to comparison button */}
        <Button
          onClick={handleAddToComparison}
          disabled={isInComparison(product) || comparisonProducts.length >= 4 || outOfStock}
          size="sm"
          variant="outline"
          className={`absolute top-2 right-2 h-8 w-8 p-0 border-2 border-primary bg-background/90 backdrop-blur-sm transition-transform duration-200 rounded-full hover:scale-110 ${
            addAnimation ? 'animate-bounce' : ''
          } ${
            isInComparison(product) ? 'bg-primary text-primary-foreground' : ''
          }`}
        >
          <Plus className={`h-4 w-4 font-bold ${isInComparison(product) ? 'text-primary-foreground' : 'text-primary'}`} />
        </Button>

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
            <Badge className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white font-medium">
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

      <CardContent className="p-2 sm:p-3 flex-1 flex flex-col">
        {/* Company Name */}
        <div className="mb-2">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            {getBrandFromProduct(product)}
          </p>
        </div>

        {/* Product Title */}
        <CardTitle className="text-xs sm:text-sm mb-2 line-clamp-2 min-h-[2.5rem] flex items-start">
          {product.TITLE || "Product Title Not Available"}
        </CardTitle>

        <div className="flex-1 space-y-2">
          {/* Price and Amount */}
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-bold text-primary">
              {product.PRICE || "Price N/A"}
            </span>
            {product.AMOUNT && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-medium">
                <Package className="h-3 w-3 mr-1" />
                {product.AMOUNT}
              </Badge>
            )}
          </div>

          {/* Product Details - Fixed structure for alignment */}
          <div className="space-y-2 min-h-[3rem]">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground">Protein per serving:</span>
              <span className="font-medium text-foreground">
                {formatProtein(product.PROTEIN_SERVING)}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground">Flavour:</span>
              <span className="font-medium text-foreground">
                {product.FLAVOUR || "N/A"}
              </span>
            </div>
          </div>

          {/* Click hint */}
          {(product.URL || product.LINK) && !outOfStock && (
            <div className="text-[10px] sm:text-xs text-muted-foreground text-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Click to view product details
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}