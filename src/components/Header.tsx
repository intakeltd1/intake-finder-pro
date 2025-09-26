import { useState, useEffect } from 'react';
import { Clock, Info } from 'lucide-react';

export function Header() {
  return null; // Removed - content moved to main header in Index.tsx
}

export function StickyTimer() {
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    const updateTimer = () => {
      // Calculate time since page load (simulating data refresh time)
      const now = Date.now();
      const diff = now - startTime;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setLastUpdated(`${hours}h${minutes}m ago`);
      } else if (minutes > 0) {
        setLastUpdated(`${minutes}m${seconds}s ago`);
      } else {
        setLastUpdated(`${seconds}s ago`);
      }
    };

    updateTimer();
    // Update every second for real-time display
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-primary-foreground/20">
      <div className="container mx-auto px-4 py-1.5">
        <div className="flex items-center justify-center space-x-2 text-primary-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Prices Updated {lastUpdated}</span>
        </div>
      </div>
    </div>
  );
}