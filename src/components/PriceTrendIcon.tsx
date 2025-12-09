import { PriceTrend } from '@/hooks/usePriceTrend';
import { useState } from 'react';

interface PriceTrendIconProps {
  trend: PriceTrend;
  className?: string;
}

/**
 * Displays a mini line chart icon indicating price trend direction.
 * Green downward line for falling prices (good for consumers).
 * Red upward line for rising prices (warning).
 */
export function PriceTrendIcon({ trend, className = '' }: PriceTrendIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!trend) return null;

  const isFalling = trend === 'falling';
  const hoverColor = isFalling ? '#22c55e' : '#ef4444'; // green-500 / red-500
  const defaultColor = '#ffffff'; // white
  const currentColor = isHovered ? hoverColor : defaultColor;
  
  return (
    <div 
      className={`h-8 w-8 flex items-center justify-center rounded-full border-2 bg-background/80 backdrop-blur-sm transition-all duration-300 cursor-default ${
        isHovered 
          ? (isFalling ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10')
          : 'border-white/60'
      } ${className}`}
      title={isFalling ? 'Price falling' : 'Price rising'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-300"
      >
        {/* Chart line */}
        {isFalling ? (
          // Falling trend - line going down left to right
          <path
            d="M4 6 L10 10 L16 14"
            stroke={currentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        ) : (
          // Rising trend - line going up left to right
          <path
            d="M4 14 L10 10 L16 6"
            stroke={currentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}
        
        {/* Arrow indicator */}
        {isFalling ? (
          // Down arrow at the end
          <path
            d="M13 11 L16 14 L13 17"
            stroke={currentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="transition-all duration-300"
          />
        ) : (
          // Up arrow at the end
          <path
            d="M13 9 L16 6 L13 3"
            stroke={currentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="transition-all duration-300"
          />
        )}
      </svg>
    </div>
  );
}
