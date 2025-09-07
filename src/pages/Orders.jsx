import { useEffect, useState } from 'react';
import { listenOrders } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { if (user) return listenOrders(user.uid, setOrders); }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">Please sign in to continue</div>
        <button
          className="rounded-full bg-sky-600 text-white px-8 py-3 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate('/auth/landing')}
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="pt-10 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen flex flex-col">
      <div className="text-[28px] sm:text-[35px] md:text-[42px] lg:text-[48px] font-light font-poppins">Orders</div>
      <div className="mt-6 space-y-4">
        {orders.map(o => (
          <div key={o.id} className="rounded-[10px] border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <div className="font-light text-[14px] sm:text-[15px] md:text-[18px] lg:text-[22px]">Order #{o.id.slice(0,6)}</div>
              <div className="text-gray-500 text-[11px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-light">{o.createdAt?.toDate?.().toLocaleString?.()||''}</div>
            </div>
            <div className="text-[14px] sm:text-[15px] md:text-[18px] lg:text-[22px] font-medium">₦{Number(o.total).toLocaleString()}</div>
          </div>
        ))}
        {orders.length===0 && <div className="text-zinc-500 font-extralight text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px]">No orders yet.</div>}
      </div>
    </div>
  );
}