import { useState, useEffect } from 'react';
import { Clock, Info } from 'lucide-react';

export function Header() {
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
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-primary-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Prices Updated {lastUpdated}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-primary-foreground/80">
            <Info className="h-3 w-3" />
            <span className="text-xs">
              All images, prices and assets are owned by the product originators, linked to each product tile - Intake does not own any of the assets displayed, and all credit goes to the information & image originator. Intake acts as an advertiser for the displayed products. Intake may make a commission on purchases of products referenced here.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}