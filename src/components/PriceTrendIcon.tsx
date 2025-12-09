import { PriceTrend } from '@/hooks/usePriceTrend';

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
  if (!trend) return null;

  const isFalling = trend === 'falling';
  const color = isFalling ? '#22c55e' : '#ef4444'; // green-500 / red-500
  
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      title={isFalling ? 'Price falling' : 'Price rising'}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Background circle */}
        <circle 
          cx="10" 
          cy="10" 
          r="9" 
          fill="hsl(var(--background))" 
          stroke={color}
          strokeWidth="1.5"
          opacity="0.95"
        />
        
        {/* Chart line */}
        {isFalling ? (
          // Falling trend - line going down left to right
          <path
            d="M5 7 L10 10 L15 13"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // Rising trend - line going up left to right
          <path
            d="M5 13 L10 10 L15 7"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Arrow indicator */}
        {isFalling ? (
          // Down arrow at the end
          <path
            d="M13 11 L15 13 L13 15"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : (
          // Up arrow at the end
          <path
            d="M13 9 L15 7 L13 5"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}
