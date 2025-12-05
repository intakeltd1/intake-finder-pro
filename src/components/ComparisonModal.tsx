import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, Package, Trophy } from "lucide-react";
import { useComparison } from "@/hooks/useComparison";
import { useValueBenchmarks } from "@/hooks/useValueBenchmarks";
import { numFromPrice, numFromProtein, incrementClickCount } from "@/utils/productUtils";
import { calculateIntakeValueRating, getValueRatingColor, getValueRatingLabel } from "@/utils/valueRating";

export function ComparisonModal() {
  const { 
    comparisonProducts, 
    removeFromComparison, 
    clearComparison, 
    showComparison, 
    setShowComparison 
  } = useComparison();
  const { benchmarks, scoreRange } = useValueBenchmarks();

  const handleProductClick = (product: any) => {
    const url = product.URL || product.LINK;
    if (url) {
      incrementClickCount(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={showComparison} onOpenChange={setShowComparison}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Product Comparison</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearComparison}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {comparisonProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products to compare. Add products using the + button on product cards.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {comparisonProducts.map((product) => (
                <div
                  key={product.URL || product.LINK}
                  className="border rounded-lg p-4 space-y-4 relative group hover:shadow-md transition-shadow"
                >
                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromComparison(product.URL || product.LINK || '')}
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Product Image */}
                  <div className="aspect-square bg-muted rounded-md overflow-hidden">
                    {product.IMAGE_URL ? (
                      <img
                        src={product.IMAGE_URL}
                        alt={product.TITLE || "Product"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {product.TITLE || "Product Name Not Available"}
                    </h3>

                    {/* Comparison Data */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium text-primary">
                          {product.PRICE || "N/A"}
                        </span>
                      </div>
                      
                      {product.AMOUNT && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <Badge variant="secondary" className="text-xs">
                            {product.AMOUNT}
                          </Badge>
                        </div>
                      )}
                      
                      {product.PROTEIN_SERVING && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Protein/serving:</span>
                          <span className="font-medium">{product.PROTEIN_SERVING}</span>
                        </div>
                      )}
                      
                      {product.FLAVOUR && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Flavour:</span>
                          <span className="font-medium">{product.FLAVOUR}</span>
                        </div>
                      )}

                      {/* Intake Value Rating */}
                      <div className="pt-2 border-t border-border/30">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                            <Trophy className="h-3 w-3" />
                            Intake Value:
                          </span>
                          {(() => {
                            const rating = calculateIntakeValueRating(product, benchmarks || undefined, scoreRange || undefined);
                            return rating ? (
                              <span className={`font-bold text-sm bg-gradient-to-r ${getValueRatingColor(rating)} bg-clip-text text-transparent`}>
                                {rating}/10
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            );
                          })()}
                        </div>
                        {(() => {
                          const rating = calculateIntakeValueRating(product, benchmarks || undefined, scoreRange || undefined);
                          if (rating) {
                            return (
                              <>
                                <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
                                  <div 
                                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getValueRatingColor(rating)} rounded-full transition-all duration-500`}
                                    style={{ width: `${(rating / 10) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground/70 mt-1 text-right">
                                  {getValueRatingLabel(rating)}
                                </p>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* View Product Button */}
                    {(product.URL || product.LINK) && (
                      <Button
                        onClick={() => handleProductClick(product)}
                        className="w-full"
                        size="sm"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View Product
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}