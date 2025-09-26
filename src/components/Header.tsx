import { useState, useEffect } from 'react';
import { Clock, Info } from 'lucide-react';

export function Header() {
  return null; // Removed - content moved to main header in Index.tsx
}

export function StickyTimer({ lastUpdatedISO }: { lastUpdatedISO?: string }) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const getDiffLabel = () => {
      const base = lastUpdatedISO ? new Date(lastUpdatedISO).getTime() : Date.now();
      const now = Date.now();
      const diff = Math.max(0, now - base);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ${hours}h ago`;
      if (hours > 0) return `${hours}h ${minutes}m ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return "Just now";
    };

    const updateTimer = () => setLabel(getDiffLabel());
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [lastUpdatedISO]);

  return (
    <div className="sticky top-0 z-50 bg-background/70 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-center space-x-2 text-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-medium text-sm">Prices updated {label}</span>
        </div>
      </div>
    </div>
  );
}