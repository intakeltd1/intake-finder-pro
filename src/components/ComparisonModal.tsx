import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, Package, Trophy, Scale, Sparkles, TrendingUp, PiggyBank, Percent } from "lucide-react";
import { useComparison } from "@/hooks/useComparison";
import { useValueBenchmarks } from "@/hooks/useValueBenchmarks";
import { incrementClickCount } from "@/utils/productUtils";
import { calculateIntakeValueRating, getValueRatingColor, getValueRatingLabel } from "@/utils/valueRating";

function AlgorithmExplanation() {
  return (
    <div className="space-y-6 py-4">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-purple-500/30">
          <Scale className="h-8 w-8 text-purple-500" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
          Intake Value Algorithm
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Our transparent algorithm helps you find the best value protein products, 
          calculated fresh daily from real market data.
        </p>
      </div>

      {/* How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-lime-500/10 to-green-500/10 border border-lime-500/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-lime-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-lime-500" />
            </div>
            <span className="font-semibold text-sm">48.5%</span>
          </div>
          <h4 className="font-medium text-sm">Protein per £1</h4>
          <p className="text-xs text-muted-foreground">
            How much protein you get for every pound spent. More protein per pound = better value.
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-amber-500" />
            </div>
            <span className="font-semibold text-sm">48.5%</span>
          </div>
          <h4 className="font-medium text-sm">Servings per £1</h4>
          <p className="text-xs text-muted-foreground">
            Number of servings relative to price. More servings per pound = better value.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Percent className="h-4 w-4 text-purple-500" />
            </div>
            <span className="font-semibold text-sm">3%</span>
          </div>
          <h4 className="font-medium text-sm">Discount Factor</h4>
          <p className="text-xs text-muted-foreground">
            Current discount vs RRP. Minimal weight ensures value isn't inflated by sales tactics.
          </p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h4 className="font-medium text-sm">Why Trust Our Ratings?</h4>
        </div>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span><strong>Dynamic benchmarking:</strong> Scores are recalculated daily against the entire market</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span><strong>Brand-neutral:</strong> All products scored 5.0-10.0 — no product is marked as "bad"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span><strong>Transparent weighting:</strong> Value metrics (97%) outweigh promotional discounts (3%)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span><strong>Data-driven:</strong> Only products with verified specs rank highest</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Add products to compare by clicking the <span className="font-medium text-primary">+</span> button on any product card
        </p>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/70">
          <Trophy className="h-3 w-3" />
          <span>Best product of the day scores 10/10</span>
        </div>
      </div>
    </div>
  );
}

function ValueScoreBreakdown({ rating }: { rating: number }) {
  return (
    <div className="pt-2 border-t border-border/30">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
          <Trophy className="h-3 w-3" />
          Intake Value:
        </span>
        <span className={`font-bold text-sm bg-gradient-to-r ${getValueRatingColor(rating)} bg-clip-text text-transparent`}>
          {rating}/10
        </span>
      </div>
      <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
        <div 
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getValueRatingColor(rating)} rounded-full transition-all duration-500`}
          style={{ width: `${(rating / 10) * 100}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground/70 mt-1 text-right">
        {getValueRatingLabel(rating)}
      </p>
    </div>
  );
}

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

  const hasProducts = comparisonProducts.length > 0;

  return (
    <Dialog open={showComparison} onOpenChange={setShowComparison}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-500" />
              {hasProducts ? 'Product Comparison' : 'How Value Ratings Work'}
            </DialogTitle>
            {hasProducts && (
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
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {!hasProducts ? (
            <AlgorithmExplanation />
          ) : (
            <div className="space-y-4">
              {/* Algorithm summary banner */}
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-xs">
                  <span className="font-medium">Intake Value</span>
                  <span className="text-muted-foreground"> = 48.5% Protein/£ + 48.5% Servings/£ + 3% Discount</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {comparisonProducts.map((product) => {
                  const rating = calculateIntakeValueRating(product, benchmarks || undefined, scoreRange || undefined);
                  
                  return (
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
                          {rating && <ValueScoreBreakdown rating={rating} />}
                          {!rating && (
                            <div className="pt-2 border-t border-border/30">
                              <span className="text-xs text-muted-foreground">Value rating unavailable</span>
                            </div>
                          )}
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
