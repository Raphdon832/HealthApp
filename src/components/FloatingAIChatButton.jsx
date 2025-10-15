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
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(0, -6px, 0); }
      }
      @keyframes aiChatPulseRing {
        0% { transform: scale(0.85); opacity: 0.28; }
        60% { transform: scale(1.25); opacity: 0; }
        100% { transform: scale(1.45); opacity: 0; }
      }
      @keyframes aiChatGlow {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(1.08); }
      }
      .ai-chat-float {
        animation: aiChatFloat 6s ease-in-out infinite;
      }
      .ai-chat-soft-glow {
        animation: aiChatGlow 5.8s ease-in-out infinite;
      }
      .ai-chat-pulse-ring {
        animation: aiChatPulseRing 3.8s ease-out infinite;
      }
    `;
    document.head.appendChild(styleEl);
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
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`fixed z-50 w-14 h-14 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${
        isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'
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
        <span
          className={`absolute inset-0 rounded-full bg-sky-300/35 blur-xl pointer-events-none transition-opacity duration-500 ${
            isDragging ? 'opacity-0' : 'opacity-70 group-hover:opacity-90 ai-chat-soft-glow'
          }`}
        />
        {!isDragging && (
          <>
            <span className="ai-chat-pulse-ring absolute inset-0 rounded-full border border-sky-300/45 pointer-events-none" />
            <span
              className="ai-chat-pulse-ring absolute inset-0 rounded-full border border-sky-300/25 pointer-events-none"
              style={{ animationDelay: '1.6s' }}
            />
          </>
        )}
        <PharmAIIcon className="w-10 h-10 relative z-10 transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {t('ai_chat', 'AI Chat')}
      </div>
    </button>
  );
}
