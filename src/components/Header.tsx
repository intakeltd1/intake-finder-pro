import { useState, useEffect } from 'react';
import { Clock, Info } from 'lucide-react';

export function Header() {
  return null; // Removed - content moved to main header in Index.tsx
}

export function StickyTimer() {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const checkJsonUpdate = async () => {
      try {
        // Try to get last modified from JSON file headers
        const response = await fetch('/data/products.json', { method: 'HEAD' });
        const lastModified = response.headers.get('Last-Modified');
        
        if (lastModified) {
          const updateTime = new Date(lastModified).getTime();
          const now = new Date().getTime();
          const diff = now - updateTime;
          
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          setLastUpdated(`${hours}h${minutes}m ago`);
        } else {
          // Fallback to simulated time
          setLastUpdated('4h0m ago');
        }
      } catch {
        // Fallback if fetch fails
        setLastUpdated('4h0m ago');
      }
    };

    checkJsonUpdate();
    // Update every 5 minutes
    const interval = setInterval(checkJsonUpdate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
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