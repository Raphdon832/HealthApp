import React, { useEffect, useState } from 'react';
import { AIChat } from '@/pages/AIChat';
import { useAiChatOverlay } from '@/lib/aiChatOverlayContext';

export default function AIChatOverlay() {
  const { isOpen, close } = useAiChatOverlay();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen || !isDesktop) {
    return null;
  }

  return <AIChat onClose={close} />;
}
