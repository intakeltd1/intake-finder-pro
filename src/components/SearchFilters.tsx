import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, SortDesc, RotateCcw } from "lucide-react";

interface SearchFiltersProps {
  query: string;
  setQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  quantityFilter: string;
  setQuantityFilter: (filter: string) => void;
  productTypeFilter: string;
  setProductTypeFilter: (filter: string) => void;
  resultCount: number;
}

export function SearchFilters({
  query,
  setQuery,
  sortBy,
  setSortBy,
  quantityFilter,
  setQuantityFilter,
  productTypeFilter,
  setProductTypeFilter,
  resultCount,
}: SearchFiltersProps) {
  const isFiltered = query.trim() !== '' || sortBy !== 'value' || quantityFilter !== 'all' || productTypeFilter !== 'all';

  const handleReset = () => {
    setQuery('');
    setSortBy('value');
    setQuantityFilter('all');
    setProductTypeFilter('all');
  };

  return (
    <Card className="bg-background/20 backdrop-blur-md border-2 border-white/20 text-foreground p-2 md:p-3 shadow-lg">
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-white/70" />
          <Input
            type="text"
            placeholder="Search products, flavours..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 bg-background/20 border-white/30 text-foreground placeholder:text-white/70 focus:bg-background/30 focus:border-white/50 h-7 text-xs"
          />
        </div>

        {/* Filters Row - Responsive Grid */}
        <div className="flex flex-col gap-2">
          {/* Dropdowns Container */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
            {/* Product Type Filter */}
            <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
              <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 h-7 text-xs w-full min-w-0">
                <SelectValue placeholder="Product Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg z-50">
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="whey">Whey Protein</SelectItem>
                <SelectItem value="vegan">Vegan Protein</SelectItem>
                <SelectItem value="clear">Clear Protein</SelectItem>
                <SelectItem value="diet">Diet Products</SelectItem>
                <SelectItem value="mass">Mass Gainers</SelectItem>
                <SelectItem value="samples">Samples</SelectItem>
              </SelectContent>
            </Select>

            {/* Quantity Filter */}
            <Select value={quantityFilter} onValueChange={setQuantityFilter}>
              <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 h-7 text-xs w-full min-w-0">
                <SelectValue placeholder="Quantity" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg z-50">
                <SelectItem value="all">All Quantities</SelectItem>
                <SelectItem value="<1kg">Less than 1kg</SelectItem>
                <SelectItem value="1-2kg">1-2kg</SelectItem>
                <SelectItem value="2-3kg">2-3kg</SelectItem>
                <SelectItem value="3-5kg">3-5kg</SelectItem>
                <SelectItem value=">5kg">More than 5kg</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 h-7 text-xs w-full min-w-0">
                <div className="flex items-center gap-1 truncate">
                  <SortDesc className="h-3 w-3 shrink-0 text-white/70" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg z-50">
                <SelectItem value="value">Best Value</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="protein">Protein per Serving</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count & Reset - Always visible */}
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                disabled={!isFiltered}
                className={`h-7 px-2 text-xs bg-background/20 border-white/30 text-foreground hover:bg-background/30 hover:border-white/50 shrink-0 transition-opacity ${
                  !isFiltered ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <div className="text-xs font-medium bg-background/20 backdrop-blur-sm border border-white/30 px-2 py-1.5 rounded-md text-foreground whitespace-nowrap ml-auto">
                {resultCount} products
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}