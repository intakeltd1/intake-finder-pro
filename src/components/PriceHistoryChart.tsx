import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, TrendingUp, Minus, Loader2, AlertCircle } from 'lucide-react';
import { usePriceHistory } from '@/hooks/usePriceHistory';

interface PriceHistoryChartProps {
  productUrl: string;
  compact?: boolean;
}

export function PriceHistoryChart({ productUrl, compact = false }: PriceHistoryChartProps) {
  const { data, isLoading, error } = usePriceHistory(productUrl);

  const chartData = useMemo(() => {
    if (!data?.history) return [];
    
    return data.history.map((record) => ({
      date: new Date(record.recorded_date).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      }),
      price: Number(record.price),
      fullDate: record.recorded_date,
    }));
  }, [data?.history]);

  const stats = data?.stats;

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'h-24' : 'h-40'} bg-muted/30 rounded-lg`}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className={`flex flex-col items-center justify-center ${compact ? 'h-24' : 'h-40'} bg-muted/30 rounded-lg`}>
        <AlertCircle className="h-5 w-5 text-muted-foreground mb-1" />
        <span className="text-xs text-muted-foreground">Price history unavailable</span>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center ${compact ? 'h-24' : 'h-40'} bg-muted/30 rounded-lg`}>
        <span className="text-xs text-muted-foreground">No price data yet</span>
        <span className="text-xs text-muted-foreground/70">Check back tomorrow</span>
      </div>
    );
  }

  // Determine trend color
  const trendColor = stats?.change 
    ? stats.change < -1 
      ? 'text-green-500' 
      : stats.change > 1 
        ? 'text-red-500' 
        : 'text-muted-foreground'
    : 'text-muted-foreground';

  const lineColor = stats?.change 
    ? stats.change < -1 
      ? 'hsl(var(--chart-2))' // green
      : stats.change > 1 
        ? 'hsl(var(--destructive))' // red
        : 'hsl(var(--primary))'
    : 'hsl(var(--primary))';

  const TrendIcon = stats?.change 
    ? stats.change < -1 
      ? TrendingDown 
      : stats.change > 1 
        ? TrendingUp 
        : Minus
    : Minus;

  return (
    <div className={`${compact ? '' : 'space-y-3'}`}>
      {/* Stats Header */}
      {!compact && stats && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">30-day trend:</span>
            <span className={`flex items-center gap-1 font-medium ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              {Math.abs(stats.change).toFixed(1)}%
            </span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Low: <span className="text-green-500 font-medium">£{stats.min.toFixed(2)}</span></span>
            <span>High: <span className="text-red-500 font-medium">£{stats.max.toFixed(2)}</span></span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={compact ? 'h-20' : 'h-32'}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `£${value}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-sm font-medium">£{Number(payload[0].value).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {stats && (
              <ReferenceLine 
                y={stats.average} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
              />
            )}
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: lineColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Badges */}
      {!compact && stats && (
        <div className="flex gap-2">
          {stats.isLowest && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
              🔥 Lowest in 30 days
            </span>
          )}
          {stats.change < -5 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
              📉 Price dropped {Math.abs(stats.change).toFixed(0)}%
            </span>
          )}
          {stats.change > 10 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
              ⚠️ Price rising
            </span>
          )}
        </div>
      )}
    </div>
  );
}
