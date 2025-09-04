import { useEffect, useState } from 'react';
import { listenOrders } from '@/lib/db';
import { useAuth } from '@/lib/auth';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => { if (user) return listenOrders(user.uid, setOrders); }, [user]);

  return (
    <div className="pt-10 pb-28 max-w-md mx-auto px-5">
      <div className="text-[35px] font-light font-poppins">Orders</div>
      <div className="mt-6 space-y-4">
        {orders.map(o => (
          <div key={o.id} className="rounded-[10px] border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <div className="font-light text-[15px]">Order #{o.id.slice(0,6)}</div>
              <div className="text-gray-500 text-[12px] font-light">{o.createdAt?.toDate?.().toLocaleString?.()||''}</div>
            </div>
            <div className="text-[15px] font-medium">₦{Number(o.total).toLocaleString()}</div>
          </div>
        ))}
        {orders.length===0 && <div className="text-zinc-500 font-extralight">No orders yet.</div>}
      </div>
    </div>
  );
}