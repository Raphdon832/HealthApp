import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) return;
    setLoading(true);
    let q;
    if (profile.role === 'pharmacy') {
      q = query(collection(db, 'orders'), where('pharmacyId', '==', user.uid), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'orders'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'));
    }
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user, profile]);

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
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md pb-2 pt-4 -mx-4 sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0">
        <div className="text-[28px] sm:text-[35px] md:text-[42px] lg:text-[48px] font-light font-poppins">Orders</div>
      </div>
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-zinc-400 text-sm">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-zinc-500 font-extralight text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px]">No orders yet.</div>
        ) : (
          orders.map(o => (
            <div key={o.id} className="rounded-[10px] border border-gray-200 p-4 flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-light text-[14px] sm:text-[15px] md:text-[18px] lg:text-[22px]">Order #{o.id.slice(0,6)}</div>
                  <div className="text-gray-500 text-[11px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-light">{o.createdAt?.toDate?.().toLocaleString?.()||''}</div>
                </div>
                <div className="text-[14px] sm:text-[15px] md:text-[18px] lg:text-[22px] font-medium">₦{Number(o.total).toLocaleString()}</div>
              </div>
              {/* Pharmacy view: show customer info and items */}
              {profile.role === 'pharmacy' && (
                <div className="mt-2">
                  <div className="text-[13px] text-zinc-500 font-light mb-1">Customer: {o.customerName || o.customerId || o.customer_id || 'N/A'}</div>
                  <div className="text-[12px] text-zinc-400 font-light mb-2">{o.customerEmail || ''}</div>
                  <div className="text-[13px] text-zinc-700 font-medium mb-1">Items:</div>
                  <ul className="ml-2 list-disc text-[13px] text-zinc-700">
                    {(o.items||[]).map((item, idx) => (
                      <li key={idx}>{item.name || item.productId} x{item.qty || item.quantity || 1}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}