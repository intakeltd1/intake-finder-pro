import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Package, ImageIcon, TrendingUp, Star } from "lucide-react";
import { useState } from "react";
import { incrementClickCount } from "@/utils/productUtils";

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

export function ProductCard({ product, isTopValue, isFeatured, isPopular }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const outOfStock = isOutOfStock(product);
  
  const handleCardClick = () => {
    const url = product.URL || product.LINK;
    if (url) {
      incrementClickCount(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const url = product.URL || product.LINK;
    if (url) {
      incrementClickCount(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getBorderClass = () => {
    if (outOfStock) return 'border-brand-grey/20';
    if (isFeatured) return 'border-2 border-primary animate-pulse shadow-lg shadow-primary/20';
    if (isTopValue) return 'border-2 rainbow-border animate-pulse';
    if (isPopular) return 'border-2 fire-border animate-pulse';
    return 'border-brand-grey/20 hover:border-primary/30';
  };

  return (
    <Card 
      className={`h-full transition-all duration-300 cursor-pointer group hover:shadow-[var(--shadow-card)] ${getBorderClass()} ${
        outOfStock ? 'opacity-60 grayscale' : 'hover:scale-[1.02]'
      }`}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-brand-grey-light">
        {product.IMAGE_URL && !imageError ? (
          <img
            src={product.IMAGE_URL}
            alt={product.TITLE || "Product image"}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              outOfStock ? 'grayscale' : ''
            }`}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {outOfStock && (
            <Badge variant="destructive" className="font-medium">
              Out of Stock
            </Badge>
          )}
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
        
        {/* External Link Button */}
        {(product.URL || product.LINK) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExternalLinkClick}
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {product.TITLE || "Product Name Not Available"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${outOfStock ? 'text-muted-foreground' : 'text-primary'}`}>
              {product.PRICE || "Price N/A"}
            </span>
            {product.AMOUNT && (
              <Badge variant="secondary" className="bg-brand-teal-light text-primary font-medium">
                <Package className="h-3 w-3 mr-1" />
                {product.AMOUNT}
              </Badge>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-2">
            {product.PROTEIN_SERVING && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Protein per serving:</span>
                <span className="font-medium text-foreground">
                  {product.PROTEIN_SERVING}
                </span>
              </div>
            )}
            
            {product.FLAVOUR && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Flavor:</span>
                <span className="font-medium text-foreground">
                  {product.FLAVOUR}
                </span>
              </div>
            )}
          </div>

          {/* Click hint */}
          {(product.URL || product.LINK) && !outOfStock && (
            <div className="text-xs text-muted-foreground text-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Click to view product details
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}