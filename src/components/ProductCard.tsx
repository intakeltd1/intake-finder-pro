import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Package } from "lucide-react";

interface Product {
  TITLE?: string;
  COMPANY?: string;
  PRICE?: string;
  AMOUNT?: string;
  PROTEIN_SERVING?: string;
  FLAVOUR?: string;
  LINK?: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const openLink = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-[var(--shadow-card)] border-brand-grey/20 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
            {product.TITLE || "Product Name Not Available"}
          </CardTitle>
          {product.LINK && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openLink(product.LINK)}
              className="shrink-0 h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          {product.COMPANY || "Brand Not Available"}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
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
        </div>
      </CardContent>
    </Card>
  );
}