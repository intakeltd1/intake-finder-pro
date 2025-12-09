import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Package, Trophy, Scale, Sparkles, TrendingUp, PiggyBank, Percent, LineChart } from "lucide-react";
import { useComparison } from "@/hooks/useComparison";
import { useValueBenchmarks } from "@/hooks/useValueBenchmarks";
import { incrementClickCount, numFromPrice } from "@/utils/productUtils";
import { calculateIntakeValueRating, getValueRatingColor, getValueRatingLabel } from "@/utils/valueRating";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
            <span><strong>Non-biased clarity:</strong> Intake isn't affiliated with any brand — just unbiased data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span><strong>Fair scoring:</strong> All products scored 5.0-10.0 — no product is marked as "bad"</span>
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

// Helper to calculate derived values
function calculateDerivedValues(product: any) {
  const price = numFromPrice(product.PRICE);
  const servings = parseInt(String(product.SERVINGS || '0').replace(/\D/g, '')) || 0;
  const proteinPerServing = parseFloat(String(product.PROTEIN_SERVING || '0')) || 0;
  const rrp = numFromPrice(product.RRP);
  
  // Price per serving
  const pricePerServing = servings > 0 && price < Infinity ? (price / servings) : null;
  
  // Protein per £1
  const proteinPerPound = proteinPerServing > 0 && price < Infinity && servings > 0 
    ? ((proteinPerServing * servings) / price) 
    : null;
  
  // Servings per £1
  const servingsPerPound = servings > 0 && price < Infinity ? (servings / price) : null;
  
  // Discount percentage
  const discountPercent = rrp < Infinity && price < Infinity && rrp > price 
    ? Math.round(((rrp - price) / rrp) * 100) 
    : null;

  return {
    pricePerServing,
    proteinPerPound,
    servingsPerPound,
    discountPercent,
  };
}

// Format a value or return "—" if null/unavailable
function formatValue(value: any, suffix = '', prefix = ''): string {
  if (value === null || value === undefined || value === '' || value === 'See Website') {
    return '—';
  }
  return `${prefix}${value}${suffix}`;
}

export function ComparisonModal() {
  const { 
    comparisonProducts, 
    removeFromComparison, 
    clearComparison, 
    showComparison, 
    setShowComparison 
  } = useComparison();
  const { benchmarks, rankings } = useValueBenchmarks();

  const handleProductClick = (product: any) => {
    const url = product.URL || product.LINK;
    if (url) {
      incrementClickCount(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const hasProducts = comparisonProducts.length > 0;

  // Define comparison rows with labels
  const comparisonRows = [
    { 
      label: 'Price', 
      getValue: (p: any) => formatValue(p.PRICE),
      highlight: true 
    },
    { 
      label: 'RRP', 
      getValue: (p: any) => formatValue(p.RRP),
    },
    { 
      label: 'Discount', 
      getValue: (p: any) => {
        const { discountPercent } = calculateDerivedValues(p);
        return discountPercent ? `${discountPercent}% off` : '—';
      },
      highlight: true,
      highlightColor: 'text-green-500'
    },
    { 
      label: 'Amount', 
      getValue: (p: any) => formatValue(p.AMOUNT),
    },
    { 
      label: 'Servings', 
      getValue: (p: any) => formatValue(String(p.SERVINGS || '').trim()),
    },
    { 
      label: 'Price/Serving', 
      getValue: (p: any) => {
        const { pricePerServing } = calculateDerivedValues(p);
        return pricePerServing ? `£${pricePerServing.toFixed(2)}` : '—';
      },
    },
    { 
      label: 'Protein/Serving', 
      getValue: (p: any) => formatValue(p.PROTEIN_SERVING, 'g'),
    },
    { 
      label: 'Protein/100g', 
      getValue: (p: any) => formatValue(p.PROTEIN_100G, 'g'),
    },
    { 
      label: 'Protein per £1', 
      getValue: (p: any) => {
        const { proteinPerPound } = calculateDerivedValues(p);
        return proteinPerPound ? `${proteinPerPound.toFixed(1)}g` : '—';
      },
      highlight: true,
      highlightColor: 'text-lime-500'
    },
    { 
      label: 'Servings per £1', 
      getValue: (p: any) => {
        const { servingsPerPound } = calculateDerivedValues(p);
        return servingsPerPound ? servingsPerPound.toFixed(2) : '—';
      },
      highlight: true,
      highlightColor: 'text-amber-500'
    },
    { 
      label: 'Flavour', 
      getValue: (p: any) => formatValue(p.FLAVOUR),
    },
    { 
      label: 'Stock Status', 
      getValue: (p: any) => {
        const status = p.OUT_OF_STOCK || p.STOCK_STATUS;
        if (!status || status === 'See Website') return '—';
        const isInStock = status.toLowerCase().includes('in stock') || status.toLowerCase().includes('instock');
        return isInStock ? 'In Stock' : 'Out of Stock';
      },
      getClassName: (p: any) => {
        const status = p.OUT_OF_STOCK || p.STOCK_STATUS;
        if (!status || status === 'See Website') return '';
        const isInStock = status.toLowerCase().includes('in stock') || status.toLowerCase().includes('instock');
        return isInStock ? 'text-green-500' : 'text-destructive';
      }
    },
  ];

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
                  <span className="text-muted-foreground"> = Protein/£ + Servings/£ + Discount consideration</span>
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
                          key={product.URL || product.LINK} 
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
                            <span className="text-xs font-medium line-clamp-2 text-center leading-tight">
                              {product.TITLE || "Product"}
                            </span>
                            {/* Remove button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromComparison(product.URL || product.LINK || '')}
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
                    <TableRow className="bg-gradient-to-r from-violet-500/5 to-purple-600/5">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-purple-500" />
                          Intake Value
                        </div>
                      </TableCell>
                      {comparisonProducts.map((product) => {
                        const rating = calculateIntakeValueRating(product, benchmarks || undefined, undefined, rankings || undefined);
                        return (
                          <TableCell key={product.URL || product.LINK} className="text-center">
                            {rating ? (
                              <div className="space-y-1">
                                <span className={`font-bold text-lg bg-gradient-to-r ${getValueRatingColor(rating)} bg-clip-text text-transparent`}>
                                  {rating}/10
                                </span>
                                <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden mx-auto max-w-[100px]">
                                  <div 
                                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getValueRatingColor(rating)} rounded-full`}
                                    style={{ width: `${(rating / 10) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {getValueRatingLabel(rating)}
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
                              key={product.URL || product.LINK} 
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
                        <TableCell key={product.URL || product.LINK} className="text-center">
                          <div className="w-full max-w-[160px] mx-auto">
                            <PriceHistoryChart 
                              productUrl={product.URL || product.LINK || ''} 
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
                        <TableCell key={product.URL || product.LINK} className="text-center">
                          {(product.URL || product.LINK) && (
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
