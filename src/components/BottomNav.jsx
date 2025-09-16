import HomeIcon from '../icons/react/HomeIcon';
import OrdersIcon from '../icons/react/OrdersIcon';
import MessagesIcon from '../icons/react/MessagesIcon';
import CartIcon from '../icons/react/CartIcon';
import ProfileIcon from '../icons/react/ProfileIcon';
import DashboardIcon from '../icons/react/DashboardIcon';
import { useAuth } from '@/lib/auth';

export default function BottomNav({ tab, setTab, cartCount = 0, unreadMessages = 0 }) {
  const { profile } = useAuth();
  const isPharmacy = profile && profile.role === 'pharmacy';
  const items = [
    isPharmacy
      ? { key: '/', label: 'Dashboard', icon: DashboardIcon }
      : { key: '/', label: 'Home', icon: HomeIcon },
    { key: '/orders', label: 'Orders', icon: OrdersIcon },
    { key: '/messages', label: 'Messages', icon: MessagesIcon },
    // Only show Cart if not pharmacy
    ...(!isPharmacy ? [{ key: '/cart', label: 'Cart', icon: CartIcon }] : []),
    { key: '/profile', label: 'Profile', icon: ProfileIcon },
  ];
  return (
    <div className="fixed bottom-3 left-0 right-0 flex justify-center" aria-hidden={false}>
      <nav
        role="navigation"
        aria-label="Bottom navigation"
        className="liquid-bottom-nav mx-auto max-w-md px-6 py-3"
      >
        {/* Use gap-based layout with fixed-size cells so icons are spaced evenly and not cramped */}
        <div className="flex items-center justify-center gap-[-1] px-2">
          {items.map((it) => {
            const isActive = tab === it.key;
            const IconComponent = it.icon;
            const iconProps = { color: isActive ? '#36A5FF' : 'black' };
            const isCart = it.key === '/cart';
            const isMessages = it.key === '/messages';
            return (
              <div key={it.key} className="flex-none">
                <button
                  onClick={() => setTab(it.key)}
                  aria-label={it.label}
                  aria-pressed={isActive}
                  className={`relative flex flex-col items-center text-xs min-w-[64px] md:min-w-[72px] px-3 py-2 focus:outline-none ${isActive ? 'text-sky-600' : 'text-zinc-500'}`}
                >
                  <IconComponent {...iconProps} className="h-6 w-6 mb-1" />
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold border-2 border-white shadow">
                      {cartCount}
                    </span>
                  )}
                  {isMessages && unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold border-2 border-white shadow">
                      {unreadMessages}
                    </span>
                  )}
                  <span className="font-medium truncate max-w-[72px] block text-center">{it.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}