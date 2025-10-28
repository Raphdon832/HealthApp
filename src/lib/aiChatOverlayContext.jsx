import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AiChatOverlayContext = createContext(undefined);

export function AiChatOverlayProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [isOpen, open, close, toggle]
  );

  return (
    <AiChatOverlayContext.Provider value={value}>
      {children}
    </AiChatOverlayContext.Provider>
  );
}

export function useAiChatOverlay() {
  const context = useContext(AiChatOverlayContext);

  if (!context) {
    throw new Error('useAiChatOverlay must be used within an AiChatOverlayProvider');
  }

  return context;
}
