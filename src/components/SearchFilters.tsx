import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, SortDesc } from "lucide-react";

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
            className="pl-8 bg-background/20 border-white/30 text-foreground placeholder:text-white/70 focus:bg-background/30 focus:border-white/50 h-6 text-xs"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
            {/* Product Type Filter */}
            <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
              <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 min-w-[120px] h-6 text-xs">
                <SelectValue placeholder="Product Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg z-50">
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="whey">Whey Protein</SelectItem>
                <SelectItem value="vegan">Vegan Protein</SelectItem>
                <SelectItem value="clear">Clear Protein</SelectItem>
                <SelectItem value="diet">Diet Products</SelectItem>
                <SelectItem value="mass">Mass Gainers</SelectItem>
              </SelectContent>
            </Select>

            {/* Quantity Filter */}
            <Select value={quantityFilter} onValueChange={setQuantityFilter}>
              <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 min-w-[110px] h-6 text-xs">
                <SelectValue placeholder="Quantity" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg z-50">
                <SelectItem value="all">All quantities</SelectItem>
                <SelectItem value="<1kg">Less than 1kg</SelectItem>
                <SelectItem value="1-2kg">1-2kg</SelectItem>
                <SelectItem value="2-3kg">2-3kg</SelectItem>
                <SelectItem value="3-5kg">3-5kg</SelectItem>
                <SelectItem value=">5kg">More than 5kg</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options - Moved to right side */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 min-w-[140px] h-6 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg z-50">
                <SelectItem value="value">Best Value (Protein/Price)</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="protein">Protein per Serving</SelectItem>
               </SelectContent>
              </Select>
              <SortDesc className="h-3 w-3 text-white/70" />
            </div>

            {/* Results Count */}
            <div className="text-xs font-medium bg-background/20 backdrop-blur-sm border border-white/30 px-2 py-1 rounded-md text-foreground whitespace-nowrap">
              {resultCount} products
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}