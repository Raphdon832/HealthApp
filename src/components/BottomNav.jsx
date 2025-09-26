import React, { useEffect } from 'react';
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

  return (
    <div className="fixed bottom-3 left-0 right-0 flex justify-center z-50" aria-hidden={false}>
      <nav
        role="navigation"
        aria-label="Bottom navigation"
        className="liquid-bottom-nav mx-auto max-w-md px-6 py-3 bg-white/95 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-700"
      >
        {/* Use gap-based layout with fixed-size cells so icons are spaced evenly and not cramped */}
        <div className="flex items-center justify-center gap-[-1] px-2">
          {items.map((it) => {
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
                  onClick={() => setTab(it.key)}
                  aria-label={it.label}
                  aria-pressed={isActive}
                  className={`relative flex flex-col items-center text-xs min-w-[64px] md:min-w-[72px] px-3 py-2 focus:outline-none transition-all duration-200 ${
                    isActive 
                      ? 'text-sky-600 dark:text-sky-400 transform scale-105' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {/* Faint blue round background for active icons with smooth transition */}
                  <div 
                    className={`absolute top-1 w-12 h-9 bg-sky-400 rounded-[10px] transition-all duration-300 ${
                      isActive ? 'opacity-10 scale-100' : 'opacity-0 scale-90'
                    }`} 
                  />
                  
                  <div className="relative z-10 transition-transform duration-200 hover:scale-110">
                    <IconComponent {...iconProps} className="h-6 w-6 mb-1" />
                  </div>
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0 z-50 bg-sky-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold border-2 border-white shadow animate-bounceIn transition-all duration-200 hover:scale-110">
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
                          <span role="status" aria-live="polite" aria-atomic="true" className="absolute top-0 right-5 z-50 bg-sky-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold border-2 border-white shadow animate-bounceIn transition-all duration-200 hover:scale-110">
                            {displayUnread}
                          </span>
                        );
                      } catch (err) {
                        console.error('[BottomNav] Error rendering messages badge', err, { unreadMessages });
                        
                      }
                    })()
                  )}
                  <span className={`truncate max-w-[72px] block text-center text-[14px] ${
                    isActive ? 'font-bold' : 'font-normal'
                  }`}>{it.label}</span>
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