import HomeIcon from '../icons/react/HomeIcon';
import OrdersIcon from '../icons/react/OrdersIcon';
import MessagesIcon from '../icons/react/MessagesIcon';
import CartIcon from '../icons/react/CartIcon';
import ProfileIcon from '../icons/react/ProfileIcon';

export default function BottomNav({ tab, setTab, cartCount = 0 }) {
  const items = [
    { key: '/', label: 'Home', icon: HomeIcon },
    { key: '/orders', label: 'Orders', icon: OrdersIcon },
    { key: '/messages', label: 'Messages', icon: MessagesIcon },
    { key: '/cart', label: 'Cart', icon: CartIcon },
    { key: '/profile', label: 'Profile', icon: ProfileIcon },
  ];
  return (
    <div className="fixed bottom-3 left-0 right-0 flex justify-center">
      <div
        className="mx-auto max-w-md px-6 py-3 shadow-sm flex-1"
        style={{
          borderRadius: '40px',
          border: '0.86px solid rgba(54, 165, 255, 0.25)',
          background: 'rgba(255,255,255,0.09)',
          backdropFilter: 'blur(16.3px)',
        }}
      >
        <div className="flex items-center justify-between">
          {items.map((it) => {
            const isActive = tab === it.key;
            const IconComponent = it.icon;
            const iconProps = { color: isActive ? '#36A5FF' : 'black' };
            const isCart = it.key === '/cart';
            return (
              <button key={it.key} onClick={() => setTab(it.key)} className={`relative flex flex-col items-center text-xs ${isActive ? 'text-sky-600' : 'text-zinc-500'}`}>
                <IconComponent {...iconProps} className="h-6 w-6 mb-1" />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 font-bold border-2 border-white shadow">
                    {cartCount}
                  </span>
                )}
                <span className="font-medium">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}