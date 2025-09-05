import { useEffect, useState } from 'react';
import { listenOrders } from '@/lib/db';
import { useAuth } from '@/lib/auth';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => { if (user) return listenOrders(user.uid, setOrders); }, [user]);

  return (
    <div className="pt-10 pb-28 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 lg:px-12 xl:px-0 w-full min-h-screen flex flex-col">
      <div className="text-[35px] md:text-[42px] lg:text-[48px] font-light font-poppins">Orders</div>
      <div className="mt-6 space-y-4">
        {orders.map(o => (
          <div key={o.id} className="rounded-[10px] border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <div className="font-light text-[15px] md:text-[18px] lg:text-[22px]">Order #{o.id.slice(0,6)}</div>
              <div className="text-gray-500 text-[12px] md:text-[14px] lg:text-[16px] font-light">{o.createdAt?.toDate?.().toLocaleString?.()||''}</div>
            </div>
            <div className="text-[15px] md:text-[18px] lg:text-[22px] font-medium">₦{Number(o.total).toLocaleString()}</div>
          </div>
        ))}
        {orders.length===0 && <div className="text-zinc-500 font-extralight text-[14px] md:text-[16px] lg:text-[18px]">No orders yet.</div>}
      </div>
    </div>
  );
}