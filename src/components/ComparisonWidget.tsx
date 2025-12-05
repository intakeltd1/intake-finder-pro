import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Eye, Info, Sparkles } from "lucide-react";
import { useComparison } from "@/hooks/useComparison";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ComparisonWidget() {
  const { comparisonProducts, setShowComparison } = useComparison();
  
  const hasProducts = comparisonProducts.length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setShowComparison(true)}
              className={`relative shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full group hover:scale-105 ${
                hasProducts 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground p-4' 
                  : 'bg-gradient-to-br from-violet-500/90 to-purple-600/90 hover:from-violet-500 hover:to-purple-600 text-white p-3'
              }`}
              size="lg"
            >
              <Scale className={`transition-transform group-hover:rotate-12 ${hasProducts ? 'h-6 w-6 mr-2' : 'h-5 w-5'}`} />
              {hasProducts ? (
                <>
                  <span className="font-medium">Compare</span>
                  <Badge 
                    variant="secondary" 
                    className="ml-2 bg-white/20 text-primary-foreground border-0 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110"
                  >
                    {comparisonProducts.length}
                  </Badge>
                </>
              ) : (
                <Info className="h-4 w-4 ml-1 opacity-80" />
              )}
              
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 ${
                hasProducts 
                  ? 'bg-primary/20 group-hover:bg-primary/30' 
                  : 'bg-purple-500/30 group-hover:bg-purple-500/40'
              }`} />
              
              {/* Preview thumbnails - only when has products */}
              {hasProducts && (
                <div className="absolute -top-2 -left-2 flex -space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                  {comparisonProducts.slice(0, 3).map((product, index) => (
                    <div
                      key={product.URL || product.LINK || index}
                      className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/40 flex items-center justify-center overflow-hidden backdrop-blur-sm"
                      style={{ 
                        zIndex: 10 - index,
                        animation: `scale-in 0.3s ease-out ${index * 0.1}s backwards`
                      }}
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
              )}

              {/* Sparkle animation for empty state */}
              {!hasProducts && (
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
              )}
            </Button>
          </TooltipTrigger>
          {!hasProducts && (
            <TooltipContent side="left" className="max-w-xs bg-card border-border">
              <p className="font-medium text-sm">Compare Products</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click to learn how our value algorithm works
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
