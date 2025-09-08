import { useState, useEffect } from 'react';
import { Clock, Info } from 'lucide-react';

export function Header() {
  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Supplement Price Comparison</h1>
          <p className="text-lg text-muted-foreground">Find the best protein powder deals in the UK</p>
          
          <div className="flex items-center justify-center space-x-1 text-muted-foreground text-xs max-w-4xl mx-auto">
            <Info className="h-3 w-3 flex-shrink-0" />
            <span>
              All images, prices and assets are owned by the product originators, linked to each product tile - Intake does not own any of the assets displayed, and all credit goes to the information & image originator. Intake acts as an advertiser for the displayed products. Intake may make a commission on purchases of products referenced here.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StickyTimer() {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Calculate time since last update (simulated - in real app this would come from your data source)
    const updateTime = new Date().getTime() - (4 * 60 * 60 * 1000); // 4 hours ago for demo
    const now = new Date().getTime();
    const diff = now - updateTime;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    setLastUpdated(`${hours}h${minutes}m ago`);
  }, []);

  return (
    <div className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-primary-foreground/20">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center space-x-2 text-primary-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Prices Updated {lastUpdated}</span>
        </div>
      </div>
    </div>
  );
}