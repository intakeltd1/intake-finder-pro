import { createContext, useContext, ReactNode } from 'react';
import { DatasetBenchmarks } from '@/utils/valueRating';

interface ValueBenchmarksContextType {
  benchmarks: DatasetBenchmarks | null;
}

const ValueBenchmarksContext = createContext<ValueBenchmarksContextType>({ benchmarks: null });

export function ValueBenchmarksProvider({ 
  children, 
  benchmarks 
}: { 
  children: ReactNode; 
  benchmarks: DatasetBenchmarks | null;
}) {
  return (
    <ValueBenchmarksContext.Provider value={{ benchmarks }}>
      {children}
    </ValueBenchmarksContext.Provider>
  );
}

export function useValueBenchmarks() {
  return useContext(ValueBenchmarksContext);
}
