import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import HomeIcon from '../icons/react/HomeIcon';
import OrdersIcon from '../icons/react/OrdersIcon';
import MessagesIcon from '../icons/react/MessagesIcon';
import CartIcon from '../icons/react/CartIcon';
import ProfileIcon from '../icons/react/ProfileIcon';
import DashboardIcon from '../icons/react/DashboardIcon';
import AIChatIcon from '../icons/react/AIChatIcon';
import PharmAIIcon from '../icons/react/PharmAIIcon';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/language';
import { useSettings, SETTINGS_KEYS } from '@/lib/settings';

function getCompactPositionFromWindow() {
  const defaultPosition = { left: '2rem', bottom: '2rem' };
  if (typeof window === 'undefined' || !window.matchMedia) {
    return defaultPosition;
  }

  if (window.matchMedia('(min-width: 1280px)').matches) {
    return { left: '18rem', bottom: '2rem' }; // xl:left-72
  }
  if (window.matchMedia('(min-width: 1024px)').matches) {
    return { left: '16rem', bottom: '2rem' }; // lg:left-64
  }
  if (window.matchMedia('(min-width: 768px)').matches) {
    return { left: '4rem', bottom: '2rem' }; // md:left-16
  }

  return defaultPosition; // base left-8
}

export default function BottomNav({ tab, setTab, cartCount = 0, unreadMessages = 0, ordersCount = 0 }) {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { getSetting } = useSettings();
  const isPharmacy = profile && profile.role === 'pharmacy';
  const [activeIndicatorStyle, setActiveIndicatorStyle] = useState({ left: 0, opacity: 0 });
  const navRef = useRef(null);
  const buttonRefs = useRef({});
  const previousBoundsRef = useRef(null);
  const [compactPosition, setCompactPosition] = useState(() => getCompactPositionFromWindow());
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  
  // Check if AI chat should be shown in navbar based on settings
  const showAIChatInNav = getSetting(SETTINGS_KEYS.AI_CHAT_IN_NAVBAR);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => setIsDesktop(event.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handleChange);
    } else {
      mq.addListener(handleChange);
    }
    setIsDesktop(mq.matches);
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handleChange);
      } else {
        mq.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => {
      const next = getCompactPositionFromWindow();
      setCompactPosition((prev) =>
        prev.left === next.left && prev.bottom === next.bottom ? prev : next
      );
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const items = [
    isPharmacy
      ? { key: '/', label: t('dashboard', 'Dashboard'), icon: DashboardIcon }
      : { key: '/', label: t('home', 'Home'), icon: HomeIcon },
    { key: '/orders', label: t('orders', 'Orders'), icon: OrdersIcon },
    { key: '/messages', label: t('messages', 'Messages'), icon: MessagesIcon },
    // Only show Cart if not pharmacy
    ...(!isPharmacy ? [{ key: '/cart', label: t('cart', 'Cart'), icon: CartIcon }] : []),
    // Show AI Chat in nav if floating button is disabled
    ...(showAIChatInNav ? [{ key: '/ai-chat', label: t('ai_chat', 'PharmAI'), icon: PharmAIIcon }] : []),
    { key: '/profile', label: t('profile', 'Profile'), icon: ProfileIcon },
  ];

  // Clamp large unread counts for badge display and make it a string
  const displayUnread = unreadMessages > 99 ? '99+' : String(unreadMessages || '');
  const isMessagesActive = tab === '/messages';
  const isCompactDesktopMessages = isDesktop && isMessagesActive;

  useLayoutEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    const nextRect = navEl.getBoundingClientRect();
    const prevRect = previousBoundsRef.current;

    if (prevRect) {
      const deltaX = prevRect.left - nextRect.left;
      const deltaY = prevRect.top - nextRect.top;

      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        navEl.style.transition = 'none';
        navEl.style.willChange = 'transform';
        navEl.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;

        requestAnimationFrame(() => {
          navEl.style.transition = '';
          navEl.style.transform = '';
          navEl.style.willChange = '';
        });
      }
    }

    previousBoundsRef.current = nextRect;
  }, [compactPosition, isCompactDesktopMessages]);
  
  const updateActiveIndicator = () => {
    const activeIndex = items.findIndex(item => item.key === tab);
    const activeButton = buttonRefs.current[tab];
    const navContainer = navRef.current;
    
    if (activeButton && navContainer && activeIndex !== -1) {
      const navRect = navContainer.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const indicatorHalfWidth = indicatorStyles.halfWidth;
      const left = buttonRect.left - navRect.left + (buttonRect.width / 2) - indicatorHalfWidth;
      
      setActiveIndicatorStyle({
        left: `${left}px`,
        opacity: 1,
      });
    } else {
      setActiveIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }
  };

  // Update indicator position when tab changes or items change
  useEffect(() => {
    // Use requestAnimationFrame for immediate, smooth updates
    requestAnimationFrame(() => {
      updateActiveIndicator();
    });
  }, [tab, items, isCompactDesktopMessages]);

  // Handle window resize with throttling
  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        requestAnimationFrame(updateActiveIndicator);
      }, 100);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Dev debug: log props and profile to help trace why badge may not be showing.
  useEffect(() => {
    try {
      console.debug('[BottomNav] props', { tab, cartCount, unreadMessages, ordersCount, displayUnread, profile });
    } catch (e) {
      console.error('[BottomNav] debug log failed', e);
    }
  }, [tab, cartCount, unreadMessages, ordersCount, displayUnread, profile]);

  // Show a tiny debug overlay when URL includes ?debugBottomNav=1
  const showDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugBottomNav') === '1';
  const navEase = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const wrapperStyle = isCompactDesktopMessages
    ? {
        bottom: compactPosition.bottom,
        left: compactPosition.left,
        transform: 'translate3d(0, 0, 0)',
        transition: `bottom 420ms ${navEase}, left 420ms ${navEase}, transform 420ms ${navEase}`,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0px)'
      }
    : {
        bottom: '1rem', // bottom-4
        left: '50%',
        transform: 'translate3d(-50%, 0, 0)',
        transition: `bottom 420ms ${navEase}, left 420ms ${navEase}, transform 420ms ${navEase}`,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0px)'
      };
  const wrapperClassName = `fixed z-50 flex items-end`;
  const navClassName = [
    'liquid-bottom-nav relative isolate overflow-hidden pointer-events-auto transform-gpu transition-[box-shadow,transform] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    // Glass background + blur/saturation + subtle border/ring
    'backdrop-blur-lg backdrop-saturate-200 bg-white/25 dark:bg-zinc-900/35 border border-white/25 dark:border-white/10 ring-1 ring-inset ring-white/10',
    isCompactDesktopMessages
      ? 'max-w-[320px] min-w-[240px] px-4 py-2.5 rounded-full shadow-[0_25px_60px_-30px_rgba(2,6,23,0.55)]'
      : 'max-w-[95vw] min-w-[280px] sm:max-w-md lg:max-w-lg px-6 sm:px-6 py-3.5 rounded-full shadow-[0_30px_80px_-40px_rgba(2,6,23,0.55)]'
  ].join(' ');
  const buttonSizeClasses = isCompactDesktopMessages
    ? 'min-w-[48px] px-1 py-2.5'
    : 'min-w-[56px] sm:min-w-[64px] md:min-w-[72px] px-1 sm:px-2 py-3';
  const iconSizeClasses = isCompactDesktopMessages
    ? 'h-6 w-6 mb-1.5'
    : 'h-7 w-7 sm:h-7 sm:w-7 mb-2 sm:mb-2';
  const labelSizeClasses = isCompactDesktopMessages
    ? 'text-[10px]'
    : 'text-[10px] sm:text-[12px]';
  const labelMaxWidthClasses = isCompactDesktopMessages
    ? 'max-w-[52px]'
    : 'max-w-[56px] sm:max-w-[72px]';
  const indicatorStyles = isCompactDesktopMessages
    ? {
        bottom: '4.2rem',
        width: '2.35rem',
        height: '0.45rem',
        borderRadius: '9999px',
        halfWidth: 2.35 * 16 * 0.5,
      }
    : {
        bottom: '5.6rem',
        width: '2.75rem',
        height: '0.5rem',
        borderRadius: '9999px',
        halfWidth: 2.75 * 16 * 0.5,
      };
  const indicatorBottom = indicatorStyles.bottom;
  const indicatorWidth = indicatorStyles.width;

  return (
    <div className={wrapperClassName} style={wrapperStyle} aria-hidden={false}>
      <nav
        ref={navRef}
        role="navigation"
        aria-label="Bottom navigation"
        className={navClassName}
        style={{
          // Ensure consistent rendering across mobile browsers
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          KhtmlUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          // Force hardware acceleration for smooth performance
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
        }}
      >
        {/* Glass overlays */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
        >
          {/* top gloss */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 via-white/10 to-transparent" />
          {/* edge highlight */}
          <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20" />
          {/* subtle noise texture */}
          <div
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
            style={{
              backgroundImage:
                'url("data:image/svg+xml;utf8,\
<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'>\
<filter id=\'n\'>\
  <feTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'2\' stitchTiles=\'stitch\'/>\
  <feColorMatrix type=\'saturate\' values=\'0\'/>\
  <feComponentTransfer>\
    <feFuncA type=\'linear\' slope=\'0.05\'/>\
  </feComponentTransfer>\
  <feBlend mode=\'overlay\' in2=\'SourceGraphic\'/>\
 </filter>\
 <rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\' opacity=\'0.7\'/>\
</svg>")',
              backgroundSize: '120px 120px'
            }}
          />
        </div>

        {/* Animated active indicator */}
        <div
          className="absolute rounded-full will-change-transform"
          style={{
            left: activeIndicatorStyle.left,
            opacity: activeIndicatorStyle.opacity,
            transition: `left 260ms ${navEase}, width 320ms ${navEase}, bottom 320ms ${navEase}, opacity 180ms ease-out`,
            transform: `scale(${activeIndicatorStyle.opacity})`,
            boxShadow: '0 8px 22px rgba(2, 132, 199, 0.25), 0 0 24px rgba(59, 130, 246, 0.35)',
            bottom: indicatorBottom,
            width: indicatorWidth,
            height: indicatorStyles.height,
            borderRadius: indicatorStyles.borderRadius,
            background: 'linear-gradient(90deg, rgba(14, 165, 233, 0.9) 0%, rgba(59, 130, 246, 0.8) 50%, rgba(14, 165, 233, 0.9) 100%)',
            backdropFilter: 'blur(8px) saturate(160%)'
          }}
        />
        
        {/* Use gap-based layout with fixed-size cells so icons are spaced evenly and not cramped */}
        <div className="flex items-center justify-center gap-[-1] px-2">
          {items.map((it, index) => {
            const isActive = tab === it.key;
            const IconComponent = it.icon;
            // Make icon color theme-aware - active stays blue, inactive follows theme
            const iconProps = { 
              color: isActive 
                ? '#36A5FF' 
                : document.documentElement.classList.contains('dark') 
                  ? '#ffffff' 
                  : '#6b7280'
            };
            const isCart = it.key === '/cart';
            const isMessages = it.key === '/messages';
            const isOrders = it.key === '/orders';
            return (
              <div key={it.key} className="flex-none">
                <button
                  ref={el => buttonRefs.current[it.key] = el}
                  onClick={() => setTab(it.key)}
                  aria-label={it.label}
                  aria-pressed={isActive}
                  className={`relative flex flex-col items-center text-xs ${buttonSizeClasses} focus:outline-none transition-all duration-150 ease-out will-change-transform ${
                    isActive 
                      ? 'text-sky-600 dark:text-sky-400 transform scale-[1.04]' 
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="relative z-10 transition-transform duration-150 ease-out will-change-transform hover:scale-110">
                    <IconComponent {...iconProps} className={`${iconSizeClasses} transition-all duration-150 ease-out ${
                      isActive ? 'drop-shadow-lg' : ''
                    }`} />
                  </div>
                  
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 z-50 bg-sky-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold border-2 border-white shadow animate-bounceIn transition-all duration-200 hover:scale-110">
                      {cartCount}
                    </span>
                  )}

                  {/* Orders badge for pharmacy users */}
                  {isOrders && isPharmacy && ordersCount > 0 && (
                    <span className="absolute -top-0.5 -right-0 z-50 bg-orange-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold border-2 border-white shadow animate-bounceIn transition-all duration-200 hover:scale-110">
                      {ordersCount > 99 ? '99+' : ordersCount}
                    </span>
                  )}

                  {/* Messages badge with runtime error handling to surface issues in console */}
                  {isMessages && unreadMessages > 0 && (
                    (() => {
                      try {
                        return (
                          <span role="status" aria-live="polite" aria-atomic="true" className="absolute top-0 right-2 z-50 bg-sky-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold border-2 border-white shadow animate-bounceIn transition-all duration-200 hover:scale-110">
                            {displayUnread}
                          </span>
                        );
                      } catch (err) {
                        console.error('[BottomNav] Error rendering messages badge', err, { unreadMessages });
                        return null;
                      }
                    })()
                  )}
                  
                  <span
                    className={`truncate ${labelMaxWidthClasses} block text-center ${labelSizeClasses} transition-all duration-150 ease-out ${
                      isActive ? 'font-bold' : 'font-normal'
                    }`}
                  >
                    {it.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Dev overlay to quickly see raw unread value when debugging */}
      {showDebug && (
        <div className="fixed bottom-20 right-4 z-60 bg-black/80 text-white text-xs px-3 py-1 rounded">UnreadRaw: {String(unreadMessages)}</div>
      )}
    </div>
  );
}
