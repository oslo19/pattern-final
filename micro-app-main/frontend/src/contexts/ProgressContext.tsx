import React, { createContext, useContext, useState } from 'react';

interface ProgressContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ProgressContext = createContext<ProgressContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {}
});

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ProgressContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext); 
