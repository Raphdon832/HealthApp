import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '@/lib/language';

// PharmAI Icon Component
const PharmAIIcon = ({ className = "w-8 h-8" }) => (
  <img 
    src="/PharmAIIcon.svg" 
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
      @keyframes aiChatRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes aiChatGradientBorder {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
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
      .ai-chat-rotate {
        animation: aiChatRotate 20s linear infinite;
      }
      .ai-chat-gradient-border {
        background: linear-gradient(45deg, #0ea5e9, #3b82f6, #6366f1, #8b5cf6, #06b6d4, #0ea5e9);
        background-size: 400% 400%;
        animation: aiChatGradientBorder 4s ease infinite;
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

  // Don't show on AI chat page itself
  if (location.pathname === '/ai-chat') {
    return null;
  }

  return (
    <button
      ref={buttonRef}
      onClick={() => navigate('/ai-chat')}
      className="fixed bottom-44 right-4 z-50 w-14 h-14 rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500 hover:scale-110"
      aria-label={t('ai_chat', 'AI Chat')}
    >
      {/* Gradient border container */}
      <div className="relative w-full h-full p-0.5 rounded-full ai-chat-gradient-border">
        {/* Rotating background SVG */}
        <div className="relative w-full h-full bg-white/0 rounded-full">
          <img
            src="/PharmBG.svg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover ai-chat-rotate"
          />
          
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-black/0" />
          
          {/* Icon container */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            <PharmAIIcon className="w-8 h-8 transition-all duration-300 group-hover:scale-110 drop-shadow-lg" />
          </div>
        </div>
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
