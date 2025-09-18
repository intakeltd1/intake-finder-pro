import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Eye } from "lucide-react";
import { useComparison } from "@/hooks/useComparison";

export function ComparisonWidget() {
  const { comparisonProducts, setShowComparison } = useComparison();
  
  if (comparisonProducts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <Button
        onClick={() => setShowComparison(true)}
        className="relative bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-full p-4 group"
        size="lg"
      >
        <Scale className="h-6 w-6 mr-2" />
        <span className="font-medium">Compare</span>
        <Badge 
          variant="secondary" 
          className="ml-2 bg-white/20 text-primary-foreground border-0 group-hover:bg-white/30 transition-colors"
        >
          {comparisonProducts.length}
        </Badge>
        
        {/* Preview thumbnails */}
        <div className="absolute -top-2 -left-2 flex -space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {comparisonProducts.slice(0, 3).map((product, index) => (
            <div
              key={product.URL || product.LINK || index}
              className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/40 flex items-center justify-center overflow-hidden"
              style={{ zIndex: 10 - index }}
            >
              {product.IMAGE_URL ? (
                <img
                  src={product.IMAGE_URL}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Eye className="h-3 w-3 text-white" />
              )}
            </div>
          ))}
        </div>
      </Button>
    </div>
  );
}