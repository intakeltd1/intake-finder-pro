import { createContext, useContext, ReactNode } from 'react';
import { DatasetBenchmarks, ScoreRange, ProductRankings } from '@/utils/valueRating';

interface ValueBenchmarksContextType {
  benchmarks: DatasetBenchmarks | null;
  scoreRange: ScoreRange | null;
  rankings: ProductRankings | null;
}

const ValueBenchmarksContext = createContext<ValueBenchmarksContextType>({ 
  benchmarks: null, 
  scoreRange: null,
  rankings: null
});

export function ValueBenchmarksProvider({ 
  children, 
  benchmarks,
  scoreRange,
  rankings
}: { 
  children: ReactNode; 
  benchmarks: DatasetBenchmarks | null;
  scoreRange: ScoreRange | null;
  rankings: ProductRankings | null;
}) {
  return (
    <ValueBenchmarksContext.Provider value={{ benchmarks, scoreRange, rankings }}>
      {children}
    </ValueBenchmarksContext.Provider>
  );
}

export function useValueBenchmarks() {
  return useContext(ValueBenchmarksContext);
}
