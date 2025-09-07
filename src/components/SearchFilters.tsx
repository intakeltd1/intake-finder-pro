import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, Filter, SortAsc } from "lucide-react";

interface SearchFiltersProps {
  query: string;
  setQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  quantityFilter: string;
  setQuantityFilter: (filter: string) => void;
  resultCount: number;
}

export function SearchFilters({
  query,
  setQuery,
  sortBy,
  setSortBy,
  quantityFilter,
  setQuantityFilter,
  resultCount,
}: SearchFiltersProps) {
  return (
    <Card className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground p-6 border-0">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
          <Input
            type="text"
            placeholder="Search products, flavors, brands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/40"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Filters:
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Quantity Filter */}
            <Select value={quantityFilter} onValueChange={setQuantityFilter}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/40 min-w-[150px]">
                <SelectValue placeholder="All quantities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All quantities</SelectItem>
                <SelectItem value="<1kg">Less than 1kg</SelectItem>
                <SelectItem value="1-2kg">1-2kg</SelectItem>
                <SelectItem value="2-3kg">2-3kg</SelectItem>
                <SelectItem value="3-5kg">3-5kg</SelectItem>
                <SelectItem value=">5kg">More than 5kg</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/40 min-w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Order</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="protein">Protein per Serving</SelectItem>
                  <SelectItem value="brand">Brand Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm font-medium bg-white/10 px-3 py-2 rounded-md">
            {resultCount} products
          </div>
        </div>
      </div>
    </Card>
  );
}