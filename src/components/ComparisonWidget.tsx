import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Eye, Info, ArrowUp } from "lucide-react";
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in flex flex-col gap-2 items-end">
      {/* Return to Top Button - Aligned with right edge of comparison widget */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={scrollToTop}
              size="sm"
              className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-2 border-white/30 text-foreground hover:bg-background hover:scale-110 transition-all duration-200 shadow-lg mr-[7px]"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-card border-border">
            <p className="text-xs">Back to top</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Comparison Widget */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              {/* Slow pulsing ring animation */}
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                hasProducts ? 'bg-primary' : 'bg-purple-500'
              }`} style={{ animationDuration: '4s' }} />
              
              {/* Outer glow ring - slower pulse */}
              <div className={`absolute -inset-1 rounded-full blur-sm ${
                hasProducts 
                  ? 'bg-gradient-to-r from-primary via-primary/80 to-primary' 
                  : 'bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500'
              }`} style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              
              <Button
                onClick={() => setShowComparison(true)}
                className={`relative shadow-2xl hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all duration-300 rounded-full group hover:scale-110 border-2 ${
                  hasProducts 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground p-4 border-primary-foreground/20' 
                    : 'bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white p-4 border-white/30'
                }`}
                size="lg"
              >
                <Scale className={`transition-transform group-hover:rotate-12 ${hasProducts ? 'h-6 w-6 mr-2' : 'h-6 w-6'}`} />
                {hasProducts ? (
                  <>
                    <span className="font-semibold">Compare</span>
                    <Badge 
                      variant="secondary" 
                      className="ml-2 bg-white/25 text-primary-foreground border-0 group-hover:bg-white/40 transition-all duration-300 group-hover:scale-110 font-bold"
                    >
                      {comparisonProducts.length}
                    </Badge>
                  </>
                ) : (
                  <Info className="h-4 w-4 ml-1 opacity-90" />
                )}
                
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
              </Button>
            </div>
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
