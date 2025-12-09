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
      className={`h-8 w-8 flex items-center justify-center rounded-full border-2 bg-background/90 backdrop-blur-sm ${
        isFalling ? 'border-green-500' : 'border-red-500'
      } ${className}`}
      title={isFalling ? 'Price falling' : 'Price rising'}
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Chart line */}
        {isFalling ? (
          // Falling trend - line going down left to right
          <path
            d="M4 6 L10 10 L16 14"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // Rising trend - line going up left to right
          <path
            d="M4 14 L10 10 L16 6"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Arrow indicator */}
        {isFalling ? (
          // Down arrow at the end
          <path
            d="M13 11 L16 14 L13 17"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : (
          // Up arrow at the end
          <path
            d="M13 9 L16 6 L13 3"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}
