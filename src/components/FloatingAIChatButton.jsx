import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '@/lib/language';

// PharmAI Icon Component
const PharmAIIcon = ({ className = "w-8 h-8" }) => (
  <img 
    src="/PharmAI.svg" 
    alt="PharmAI" 
    className={className}
  />
);

export default function FloatingAIChatButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const buttonRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  
  // Default position - higher up to avoid bottom navbar
  const defaultPosition = { x: window.innerWidth - 80, y: window.innerHeight - 160 };

  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragOccurredRef = useRef(false);

  useEffect(() => {
    const styleId = 'ai-chat-floating-animations';
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      @keyframes aiChatFloat {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        25% { transform: translate3d(0, -8px, 0) rotate(1deg); }
        50% { transform: translate3d(0, -4px, 0) rotate(0deg); }
        75% { transform: translate3d(0, -8px, 0) rotate(-1deg); }
      }
      @keyframes aiChatPulseRing {
        0% { transform: scale(0.8); opacity: 0.6; }
        50% { transform: scale(1.2); opacity: 0.3; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes aiChatGlow {
        0%, 100% { opacity: 0.3; transform: scale(1); filter: blur(8px); }
        50% { opacity: 0.6; transform: scale(1.1); filter: blur(12px); }
      }
      @keyframes aiChatShimmer {
        0% { transform: translateX(-100%) skewX(-12deg); }
        100% { transform: translateX(200%) skewX(-12deg); }
      }
      .ai-chat-float {
        animation: aiChatFloat 8s ease-in-out infinite;
      }
      .ai-chat-soft-glow {
        animation: aiChatGlow 6s ease-in-out infinite;
      }
      .ai-chat-pulse-ring {
        animation: aiChatPulseRing 4s ease-out infinite;
      }
      .ai-chat-shimmer {
        animation: aiChatShimmer 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleEl);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('aiButtonPosition');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        console.warn('Failed to parse saved AI button position');
      }
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('aiButtonPosition', JSON.stringify(position));
  }, [position]);

  // Don't show on AI chat page itself
  if (location.pathname === '/ai-chat') {
    return null;
  }

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragOccurredRef.current = false;
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    if (!isMobile) return;
    
    dragOccurredRef.current = true;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep button within viewport bounds
    const maxX = window.innerWidth - 56; // button width
    const maxY = window.innerHeight - 56; // button height
    const minX = 0;
    const minY = 0;
    
    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    if (!dragOccurredRef.current) {
      navigate('/ai-chat');
    }
  };

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging && isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, isMobile]);
  const isTouchDragging = useRef(false);

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    isTouchDragging.current = true;
    dragOccurredRef.current = false;
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isTouchDragging.current || !isMobile) return;

    const touch = e.touches[0];
    dragOccurredRef.current = true;

    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;
    const minX = 0;
    const minY = 0;

    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsDragging(false);
    isTouchDragging.current = false;
  };

  useEffect(() => {
    if (isDragging && isMobile) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart, isMobile]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`fixed z-50 w-16 h-16 rounded-2xl backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(14,116,144,0.4),0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_16px_48px_-12px_rgba(14,116,144,0.6),0_0_0_1px_rgba(255,255,255,0.2)] active:shadow-[0_4px_16px_-4px_rgba(14,116,144,0.8),0_0_0_1px_rgba(255,255,255,0.3)] transition-all duration-500 flex items-center justify-center overflow-hidden group cursor-pointer border border-white/20 ${
        isMobile
          ? isDragging
            ? 'cursor-grabbing scale-110 shadow-[0_20px_60px_-12px_rgba(14,116,144,0.8)]'
            : 'cursor-grab hover:scale-105'
          : 'hover:scale-110'
      }`}
      style={{
        left: position.x,
        top: position.y,
        userSelect: 'none'
      }}
      aria-label={t('ai_chat', 'AI Chat')}
    >
      <div
        className={`relative flex items-center justify-center w-full h-full ${
          isDragging ? '' : 'ai-chat-float'
        }`}
      >
        {/* Background gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 via-blue-500/15 to-indigo-600/20 rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-300/10 via-transparent to-purple-400/10 rounded-2xl" />
        
        {/* Animated glow effect */}
        {!isDragging && (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400/30 to-blue-600/20 rounded-2xl ai-chat-soft-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}

        {/* Pulse rings */}
        {!isDragging && (
          <>
            <div className="ai-chat-pulse-ring absolute inset-0 rounded-2xl border-2 border-sky-300/40" />
            <div 
              className="ai-chat-pulse-ring absolute inset-0 rounded-2xl border border-blue-400/30"
              style={{ animationDelay: '2s' }}
            />
            <div 
              className="ai-chat-pulse-ring absolute inset-0 rounded-2xl border border-cyan-300/20"
              style={{ animationDelay: '4s' }}
            />
          </>
        )}

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl ai-chat-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Main background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-sky-400/10 to-blue-500/15 rounded-2xl backdrop-blur-sm" />

        {/* Icon container */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <PharmAIIcon className="w-8 h-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 drop-shadow-lg" />
        </div>

        {/* Subtle inner highlight */}
        <div className="absolute inset-1 bg-gradient-to-br from-white/10 to-transparent rounded-xl pointer-events-none" />
      </div>

      {/* Enhanced tooltip */}
      <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl text-white text-xs px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-white/20 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full animate-pulse" />
          <span className="font-medium">{t('ai_chat', 'AI Chat')}</span>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95" />
      </div>
    </button>
  );
}
