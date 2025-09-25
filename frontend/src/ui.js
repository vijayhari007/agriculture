import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext({ enableAnimations: true, setEnableAnimations: () => {} });

export const UIProvider = ({ children }) => {
  const [enableAnimations, setEnableAnimations] = useState(() => {
    try {
      const saved = localStorage.getItem('enable_animations');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try { localStorage.setItem('enable_animations', String(enableAnimations)); } catch {}
  }, [enableAnimations]);

  const value = useMemo(() => ({ enableAnimations, setEnableAnimations }), [enableAnimations]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => useContext(UIContext);
