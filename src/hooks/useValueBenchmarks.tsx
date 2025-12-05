import { createContext, useContext, ReactNode } from 'react';
import { DatasetBenchmarks, ScoreRange } from '@/utils/valueRating';

interface ValueBenchmarksContextType {
  benchmarks: DatasetBenchmarks | null;
  scoreRange: ScoreRange | null;
}

const ValueBenchmarksContext = createContext<ValueBenchmarksContextType>({ 
  benchmarks: null, 
  scoreRange: null 
});

export function ValueBenchmarksProvider({ 
  children, 
  benchmarks,
  scoreRange
}: { 
  children: ReactNode; 
  benchmarks: DatasetBenchmarks | null;
  scoreRange: ScoreRange | null;
}) {
  return (
    <ValueBenchmarksContext.Provider value={{ benchmarks, scoreRange }}>
      {children}
    </ValueBenchmarksContext.Provider>
  );
}

export function useValueBenchmarks() {
  return useContext(ValueBenchmarksContext);
}
