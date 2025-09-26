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
    <Card className="bg-background/20 backdrop-blur-md border-2 border-white/20 text-foreground p-3 shadow-lg">
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
          <Input
            type="text"
            placeholder="Search products, flavours..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-background/20 border-white/30 text-foreground placeholder:text-white/70 focus:bg-background/30 focus:border-white/50 h-8"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Product Type Filter */}
            <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
              <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 min-w-[160px] h-8">
                <SelectValue placeholder="Select Product Type" />
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
              <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 min-w-[150px] h-8">
                <SelectValue placeholder="All quantities" />
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

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <SortDesc className="h-4 w-4 text-white/70" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background/20 border-white/30 text-foreground focus:bg-background/30 focus:border-white/50 min-w-[200px] h-8">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-lg z-50">
                <SelectItem value="default">Default Order</SelectItem>
                <SelectItem value="randomize">Randomize Order</SelectItem>
                <SelectItem value="value">Best Value (Protein/Price)</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="protein">Protein per Serving</SelectItem>
                <SelectItem value="brand">Brand Name</SelectItem>
               </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm font-medium bg-background/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-md text-foreground">
            {resultCount} products
          </div>
        </div>
      </div>
    </Card>
  );
}