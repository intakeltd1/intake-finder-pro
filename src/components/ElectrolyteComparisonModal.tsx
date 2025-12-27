import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, ExternalLink, Scale, Droplets, Zap, DollarSign, TrendingDown, Award } from "lucide-react";
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
import { toTitleCase } from "@/utils/textFormatting";

interface ElectrolyteComparisonModalProps {
  isSubscription: boolean;
  benchmarks: ElectrolyteBenchmarks | null;
  rankings: ElectrolyteRankings | null;
}

// Algorithm explanation component
function AlgorithmExplanation() {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-2">
          <Scale className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold">Electrolyte Intake Value Algorithm</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Our algorithm evaluates electrolyte supplements based on multiple factors to help you find the best value.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold">Cost per Serving</h4>
              <p className="text-xs text-muted-foreground">35% weight</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Lower cost per serving = higher score. We compare the price divided by number of servings.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Droplets className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold">Electrolyte Content</h4>
              <p className="text-xs text-muted-foreground">30% weight</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Total Na + K + Mg per serving. Higher electrolyte content = higher score.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold">Discount from RRP</h4>
              <p className="text-xs text-muted-foreground">20% weight</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Products with bigger discounts from RRP score higher. Great for bargain hunters.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h4 className="font-semibold">Servings per Pack</h4>
              <p className="text-xs text-muted-foreground">15% weight</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            More servings per pack = higher score. Better for long-term value.
          </p>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Add up to 4 products to compare them side-by-side!</p>
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
    sodium: product.SODIUM_MG,
    potassium: product.POTASSIUM_MG,
    magnesium: product.MAGNESIUM_MG,
  };
}

function formatValue(value: any, suffix = '', prefix = '') {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return `${prefix}${value.toFixed(2)}${suffix}`;
  }
  return `${prefix}${value}${suffix}`;
}

export function ElectrolyteComparisonModal({ isSubscription, benchmarks, rankings }: ElectrolyteComparisonModalProps) {
  const { comparisonProducts, removeFromComparison, clearComparison, showComparison, setShowComparison } = useElectrolyteComparison();

  const handleProductClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={showComparison} onOpenChange={setShowComparison}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              {comparisonProducts.length > 0 
                ? `Comparing ${comparisonProducts.length} Electrolyte Product${comparisonProducts.length > 1 ? 's' : ''}`
                : 'Electrolyte Value Algorithm'
              }
            </DialogTitle>
            {comparisonProducts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearComparison}>
                Clear All
              </Button>
            )}
          </div>
        </DialogHeader>

        {comparisonProducts.length === 0 ? (
          <AlgorithmExplanation />
        ) : (
          <div className="space-y-6">
            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Attribute</TableHead>
                    {comparisonProducts.map((product) => (
                      <TableHead key={getProductKey(product)} className="min-w-[180px]">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                            onClick={() => removeFromComparison(getProductKey(product))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="pr-6">
                            <p className="font-semibold text-xs line-clamp-2">
                              {toTitleCase(product.TITLE || 'Unknown')}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{product.FLAVOUR}</p>
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Price */}
                  <TableRow>
                    <TableCell className="font-medium">Price</TableCell>
                    {comparisonProducts.map((product) => {
                      const { price, discountPercent } = calculateDerivedValues(product, isSubscription);
                      return (
                        <TableCell key={getProductKey(product)}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                              {formatValue(price, '', '£')}
                            </span>
                            {discountPercent && discountPercent > 0 && (
                              <Badge className="bg-green-500/20 text-green-600 text-[10px]">
                                -{discountPercent}%
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Price per Serving */}
                  <TableRow>
                    <TableCell className="font-medium">Price/Serving</TableCell>
                    {comparisonProducts.map((product) => {
                      const { pricePerServing } = calculateDerivedValues(product, isSubscription);
                      return (
                        <TableCell key={getProductKey(product)}>
                          {formatValue(pricePerServing, '', '£')}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Servings */}
                  <TableRow>
                    <TableCell className="font-medium">Servings</TableCell>
                    {comparisonProducts.map((product) => (
                      <TableCell key={getProductKey(product)}>
                        {product.SERVINGS || '—'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Sodium */}
                  <TableRow>
                    <TableCell className="font-medium">Sodium</TableCell>
                    {comparisonProducts.map((product) => (
                      <TableCell key={getProductKey(product)}>
                        {product.SODIUM_MG ? `${Math.round(product.SODIUM_MG)}mg` : '—'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Potassium */}
                  <TableRow>
                    <TableCell className="font-medium">Potassium</TableCell>
                    {comparisonProducts.map((product) => (
                      <TableCell key={getProductKey(product)}>
                        {product.POTASSIUM_MG ? `${Math.round(product.POTASSIUM_MG)}mg` : '—'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Magnesium */}
                  <TableRow>
                    <TableCell className="font-medium">Magnesium</TableCell>
                    {comparisonProducts.map((product) => (
                      <TableCell key={getProductKey(product)}>
                        {product.MAGNESIUM_MG ? `${Math.round(product.MAGNESIUM_MG)}mg` : '—'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Total Electrolytes */}
                  <TableRow>
                    <TableCell className="font-medium">Total Electrolytes</TableCell>
                    {comparisonProducts.map((product) => {
                      const { totalElectrolytes } = calculateDerivedValues(product, isSubscription);
                      return (
                        <TableCell key={getProductKey(product)}>
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                            {totalElectrolytes > 0 ? `${Math.round(totalElectrolytes)}mg` : '—'}
                          </Badge>
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Electrolytes per £1 */}
                  <TableRow>
                    <TableCell className="font-medium">Electrolytes/£1</TableCell>
                    {comparisonProducts.map((product) => {
                      const { electrolytesPerPound } = calculateDerivedValues(product, isSubscription);
                      return (
                        <TableCell key={getProductKey(product)}>
                          {electrolytesPerPound ? `${Math.round(electrolytesPerPound)}mg` : '—'}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Subscription Amount (if subscription mode) */}
                  {isSubscription && (
                    <TableRow>
                      <TableCell className="font-medium">Servings/Week</TableCell>
                      {comparisonProducts.map((product) => (
                        <TableCell key={getProductKey(product)}>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-primary" />
                            <span>{product.SUB_AMOUNT || '—'}</span>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  {/* Intake Value Rating */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-amber-500" />
                        Intake Value
                      </div>
                    </TableCell>
                    {comparisonProducts.map((product) => {
                      const valueRating = benchmarks && rankings
                        ? calculateElectrolyteValueRating(product, benchmarks, rankings, isSubscription)
                        : null;
                      return (
                        <TableCell key={getProductKey(product)}>
                          {valueRating ? (
                            <div className="space-y-1">
                              <span className={`text-lg font-bold bg-gradient-to-r ${getElectrolyteValueRatingColor(valueRating)} bg-clip-text text-transparent`}>
                                {valueRating}
                              </span>
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                {getElectrolyteValueRatingLabel(valueRating)}
                              </Badge>
                            </div>
                          ) : '—'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Price History Charts */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                30-Day Price History
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {comparisonProducts.map((product) => (
                  <div key={getProductKey(product)} className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-2 line-clamp-1">
                      {toTitleCase(product.TITLE || 'Unknown')}
                    </p>
                    <PriceHistoryChart productUrl={product.PAGE_URL || ''} compact />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {comparisonProducts.map((product) => (
                <Button
                  key={getProductKey(product)}
                  variant="outline"
                  size="sm"
                  onClick={() => handleProductClick(product.PAGE_URL)}
                  className="gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View {toTitleCase((product.TITLE || 'Product').substring(0, 20))}...
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
