import React, { useEffect, useState, useRef } from 'react';
import HomeIcon from '../icons/react/HomeIcon';
import OrdersIcon from '../icons/react/OrdersIcon';
import MessagesIcon from '../icons/react/MessagesIcon';
import CartIcon from '../icons/react/CartIcon';
import ProfileIcon from '../icons/react/ProfileIcon';
import DashboardIcon from '../icons/react/DashboardIcon';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/language';

export default function BottomNav({ tab, setTab, cartCount = 0, unreadMessages = 0, ordersCount = 0 }) {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const isPharmacy = profile && profile.role === 'pharmacy';
  const [activeIndicatorStyle, setActiveIndicatorStyle] = useState({ left: 0, opacity: 0 });
  const navRef = useRef(null);
  const buttonRefs = useRef({});
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  
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
  
  const items = [
    isPharmacy
      ? { key: '/', label: t('dashboard', 'Dashboard'), icon: DashboardIcon }
      : { key: '/', label: t('home', 'Home'), icon: HomeIcon },
    { key: '/orders', label: t('orders', 'Orders'), icon: OrdersIcon },
    { key: '/messages', label: t('messages', 'Messages'), icon: MessagesIcon },
    // Only show Cart if not pharmacy
    ...(!isPharmacy ? [{ key: '/cart', label: t('cart', 'Cart'), icon: CartIcon }] : []),
    { key: '/profile', label: t('profile', 'Profile'), icon: ProfileIcon },
  ];

  // Clamp large unread counts for badge display and make it a string
  const displayUnread = unreadMessages > 99 ? '99+' : String(unreadMessages || '');
  const isMessagesActive = tab === '/messages';
  const isCompactDesktopMessages = isDesktop && isMessagesActive;
  
  const updateActiveIndicator = () => {
    const activeIndex = items.findIndex(item => item.key === tab);
    const activeButton = buttonRefs.current[tab];
    const navContainer = navRef.current;
    
    if (activeButton && navContainer && activeIndex !== -1) {
      const navRect = navContainer.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const indicatorHalfWidth = isCompactDesktopMessages ? 18 : 20;
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
  const wrapperClassName = isCompactDesktopMessages
    ? 'fixed bottom-6 left-6 md:left-12 lg:left-64 xl:left-80 flex justify-start z-50 px-0'
    : 'fixed bottom-3 left-0 right-0 flex justify-center z-50 px-3 sm:px-4';
  const navClassName = [
    'liquid-bottom-nav bg-white/95 dark:bg-gray-900/40 backdrop-blur-md relative border',
    isCompactDesktopMessages
      ? 'max-w-[320px] min-w-[240px] px-4 py-2.5 rounded-2xl border-sky-200 dark:border-sky-300/60 shadow-lg'
      : 'max-w-[95vw] min-w-[280px] sm:max-w-md lg:max-w-lg px-6 sm:px-5 py-3 border-sky-300 dark:border-sky-300'
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
  const indicatorBottom = isCompactDesktopMessages ? '4.6rem' : '5.8rem';
  const indicatorWidth = isCompactDesktopMessages ? '2.25rem' : '2.5rem';

  return (
    <div className={wrapperClassName} aria-hidden={false}>
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
        {/* Animated active indicator */}
        <div
          className="absolute h-2 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full shadow-lg will-change-transform"
          style={{
            left: activeIndicatorStyle.left,
            opacity: activeIndicatorStyle.opacity,
            transition: 'left 0.25s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.15s ease-out',
            transform: `scale(${activeIndicatorStyle.opacity})`,
            boxShadow: '0 2px 8px rgba(56, 165, 255, 0.4), 0 0 16px rgba(56, 165, 255, 0.2)',
            bottom: indicatorBottom,
            width: indicatorWidth,
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
                      ? 'text-sky-600 dark:text-sky-400 transform scale-105' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
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
