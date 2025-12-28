import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Package, Trophy, Scale, Sparkles, TrendingUp, PiggyBank, Droplets, LineChart, Zap } from "lucide-react";
import { useElectrolyteComparison, getProductKey } from "@/hooks/useElectrolyteComparison";
import { 
  ElectrolyteProduct,
  getActivePrice,
  calculateElectrolyteValueRating,
  getElectrolyteValueRatingColor,
  getElectrolyteValueRatingLabel,
  ElectrolyteBenchmarks,
  ElectrolyteRankings
} from "@/utils/electrolyteValueRating";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { toTitleCase, formatFlavour } from "@/utils/textFormatting";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ElectrolyteComparisonModalProps {
  isSubscription: boolean;
  benchmarks: ElectrolyteBenchmarks | null;
  rankings: ElectrolyteRankings | null;
}

// Algorithm explanation component - matching protein style
function AlgorithmExplanation() {
  return (
    <div className="space-y-6 py-4">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30">
          <Scale className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
          Electrolyte Value Algorithm
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Our transparent algorithm helps you find the best value electrolyte supplements, 
          calculated fresh daily from real market data.
        </p>
      </div>

      {/* How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <h4 className="font-medium text-sm">Cost per Serving</h4>
          <p className="text-xs text-muted-foreground">
            Lower cost per serving = better value. Price divided by number of servings.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <h4 className="font-medium text-sm">Electrolyte Content</h4>
          <p className="text-xs text-muted-foreground">
            Total Na + K + Mg per serving. Higher electrolyte content = higher score.
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <h4 className="font-medium text-sm">Discount Factor</h4>
          <p className="text-xs text-muted-foreground">
            Current discount vs RRP. Products with bigger discounts score higher.
          </p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <h4 className="font-medium text-sm">Why Trust Our Ratings?</h4>
        </div>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Dynamic benchmarking:</strong> Scores are recalculated daily against the entire market</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Non-biased clarity:</strong> Intake isn't affiliated with any brand — just unbiased data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
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

// Calculate derived values for comparison
function calculateDerivedValues(product: ElectrolyteProduct, isSubscription: boolean) {
  const price = getActivePrice(product, isSubscription);
  const servingsRaw = product.SERVINGS;
  const servings = typeof servingsRaw === 'number' ? servingsRaw : (typeof servingsRaw === 'string' ? parseFloat(servingsRaw) : 0);
  const totalElectrolytes = (product.SODIUM_MG ?? 0) + (product.POTASSIUM_MG ?? 0) + (product.MAGNESIUM_MG ?? 0);
  
  const pricePerServing = price && servings > 0 ? price / servings : null;
  const electrolytesPerPound = price && totalElectrolytes > 0 ? totalElectrolytes / price : null;
  const rrpNum = typeof product.RRP_NUM === 'number' ? product.RRP_NUM : null;
  const discountPercent = price && rrpNum && rrpNum > price
    ? Math.round(((rrpNum - price) / rrpNum) * 100)
    : null;

  return {
    price,
    servings,
    totalElectrolytes,
    pricePerServing,
    electrolytesPerPound,
    discountPercent,
    rrp: rrpNum,
    sodium: product.SODIUM_MG,
    potassium: product.POTASSIUM_MG,
    magnesium: product.MAGNESIUM_MG,
  };
}

function formatValue(value: any, suffix = '', prefix = ''): string {
  if (value === null || value === undefined || value === '') return '—';
  return `${prefix}${value}${suffix}`;
}

export function ElectrolyteComparisonModal({ isSubscription, benchmarks, rankings }: ElectrolyteComparisonModalProps) {
  const { comparisonProducts, removeFromComparison, clearComparison, showComparison, setShowComparison } = useElectrolyteComparison();

  const handleProductClick = (product: ElectrolyteProduct) => {
    if (product.PAGE_URL) {
      window.open(product.PAGE_URL, '_blank', 'noopener,noreferrer');
    }
  };

  const hasProducts = comparisonProducts.length > 0;

  // Define comparison rows with labels - matching protein structure
  const comparisonRows = [
    { 
      label: 'Price', 
      getValue: (p: ElectrolyteProduct) => {
        const { price } = calculateDerivedValues(p, isSubscription);
        return price ? `£${price.toFixed(2)}` : '—';
      },
      highlight: true 
    },
    { 
      label: 'RRP', 
      getValue: (p: ElectrolyteProduct) => {
        const { rrp } = calculateDerivedValues(p, isSubscription);
        return rrp ? `£${rrp.toFixed(2)}` : '—';
      },
    },
    { 
      label: 'Discount', 
      getValue: (p: ElectrolyteProduct) => {
        const { discountPercent } = calculateDerivedValues(p, isSubscription);
        return discountPercent ? `${discountPercent}% off` : '—';
      },
      highlight: true,
      highlightColor: 'text-green-500'
    },
    { 
      label: 'Servings', 
      getValue: (p: ElectrolyteProduct) => formatValue(p.SERVINGS),
    },
    { 
      label: 'Price/Serving', 
      getValue: (p: ElectrolyteProduct) => {
        const { pricePerServing } = calculateDerivedValues(p, isSubscription);
        return pricePerServing ? `£${pricePerServing.toFixed(2)}` : '—';
      },
    },
    { 
      label: 'Sodium', 
      getValue: (p: ElectrolyteProduct) => p.SODIUM_MG ? `${Math.round(p.SODIUM_MG)}mg` : '—',
    },
    { 
      label: 'Potassium', 
      getValue: (p: ElectrolyteProduct) => p.POTASSIUM_MG ? `${Math.round(p.POTASSIUM_MG)}mg` : '—',
    },
    { 
      label: 'Magnesium', 
      getValue: (p: ElectrolyteProduct) => p.MAGNESIUM_MG ? `${Math.round(p.MAGNESIUM_MG)}mg` : '—',
    },
    { 
      label: 'Total Electrolytes', 
      getValue: (p: ElectrolyteProduct) => {
        const { totalElectrolytes } = calculateDerivedValues(p, isSubscription);
        return totalElectrolytes > 0 ? `${Math.round(totalElectrolytes)}mg` : '—';
      },
      highlight: true,
      highlightColor: 'text-blue-500'
    },
    { 
      label: 'Flavour', 
      getValue: (p: ElectrolyteProduct) => formatFlavour(p.FLAVOUR) || '—',
    },
    ...(isSubscription ? [{
      label: 'Servings/Week',
      getValue: (p: ElectrolyteProduct) => p.SUB_AMOUNT || '—',
    }] : []),
    { 
      label: 'Stock Status', 
      getValue: (p: ElectrolyteProduct) => {
        if (p.IN_STOCK === false) return 'Out of Stock';
        if (p.IN_STOCK === true) return 'In Stock';
        return '—';
      },
      getClassName: (p: ElectrolyteProduct) => {
        if (p.IN_STOCK === false) return 'text-destructive';
        if (p.IN_STOCK === true) return 'text-green-500';
        return '';
      }
    },
  ];

  return (
    <Dialog open={showComparison} onOpenChange={setShowComparison}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
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
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-600/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs">
                  <span className="font-medium">Intake Value</span>
                  <span className="text-muted-foreground"> = Electrolytes/£ + Cost/Serving + Discount consideration</span>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[140px] font-semibold">Attribute</TableHead>
                      {comparisonProducts.map((product) => (
                        <TableHead 
                          key={getProductKey(product)} 
                          className="min-w-[180px] text-center"
                        >
                          <div className="flex flex-col items-center gap-2 py-2">
                            {/* Product Image */}
                            <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                              {product.IMAGE_URL ? (
                                <img
                                  src={product.IMAGE_URL}
                                  alt={product.TITLE || "Product"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            {/* Product Title */}
                            <span className="text-xs font-heading font-medium line-clamp-2 text-center leading-tight">
                              {toTitleCase(product.TITLE) || "Product"}
                            </span>
                            {/* Remove button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromComparison(getProductKey(product))}
                              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Intake Value Rating Row */}
                    <TableRow className="bg-gradient-to-r from-blue-500/5 to-cyan-600/5">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-blue-500" />
                          Intake Value
                        </div>
                      </TableCell>
                      {comparisonProducts.map((product) => {
                        const rating = benchmarks && rankings
                          ? calculateElectrolyteValueRating(product, benchmarks, rankings, isSubscription)
                          : null;
                        return (
                          <TableCell key={getProductKey(product)} className="text-center">
                            {rating ? (
                              <div className="space-y-1">
                                <span className={`font-bold text-lg bg-gradient-to-r ${getElectrolyteValueRatingColor(rating)} bg-clip-text text-transparent`}>
                                  {rating}/10
                                </span>
                                <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden mx-auto max-w-[100px]">
                                  <div 
                                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getElectrolyteValueRatingColor(rating)} rounded-full`}
                                    style={{ width: `${(rating / 10) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {getElectrolyteValueRatingLabel(rating)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Data Rows */}
                    {comparisonRows.map((row, index) => (
                      <TableRow key={row.label} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                        <TableCell className="font-medium text-sm text-muted-foreground">
                          {row.label}
                        </TableCell>
                        {comparisonProducts.map((product) => {
                          const value = row.getValue(product);
                          const customClass = row.getClassName ? row.getClassName(product) : '';
                          const highlightClass = row.highlight && value !== '—' 
                            ? (row.highlightColor || 'font-semibold') 
                            : '';
                          return (
                            <TableCell 
                              key={getProductKey(product)} 
                              className={`text-center text-sm ${highlightClass} ${customClass}`}
                            >
                              {value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}

                    {/* Price History Row */}
                    <TableRow>
                      <TableCell className="font-medium text-sm text-muted-foreground align-top pt-4">
                        <div className="flex items-center gap-1.5">
                          <LineChart className="h-3.5 w-3.5" />
                          30-Day Price
                        </div>
                      </TableCell>
                      {comparisonProducts.map((product) => (
                        <TableCell key={getProductKey(product)} className="text-center">
                          <div className="w-full max-w-[160px] mx-auto">
                            <PriceHistoryChart 
                              productUrl={product.PAGE_URL || ''} 
                              compact 
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Action Row */}
                    <TableRow>
                      <TableCell className="font-medium text-sm text-muted-foreground">
                        Action
                      </TableCell>
                      {comparisonProducts.map((product) => (
                        <TableCell key={getProductKey(product)} className="text-center">
                          {product.PAGE_URL && (
                            <Button
                              onClick={() => handleProductClick(product)}
                              size="sm"
                              className="w-full max-w-[140px]"
                            >
                              <ExternalLink className="h-3 w-3 mr-1.5" />
                              View Product
                            </Button>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
