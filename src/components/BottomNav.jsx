import { Home as HomeIcon, Package, MessageSquare, ShoppingCart, User } from 'lucide-react';

export default function BottomNav({ tab, setTab }) {
  const items = [
    { key: '/', label: 'Home', icon: HomeIcon },
    { key: '/orders', label: 'Orders', icon: Package },
    { key: '/messages', label: 'Messages', icon: MessageSquare },
    { key: '/cart', label: 'Cart', icon: ShoppingCart },
    { key: '/profile', label: 'Profile', icon: User },
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
          {items.map((it) => (
            <button key={it.key} onClick={() => setTab(it.key)} className={`flex flex-col items-center text-xs ${tab===it.key?'text-sky-600':'text-zinc-500'}`}>
              <it.icon className={`h-6 w-6 mb-1 ${tab===it.key?'stroke-[2.5]':'opacity-70'}`} />
              <span className="font-medium">{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}