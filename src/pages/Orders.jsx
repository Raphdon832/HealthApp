import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';

const ORDER_STATUSES = ['pending', 'processing', 'fulfilled', 'cancelled'];

export default function Orders() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({}); // Track expanded state per order
  const [revealedNumbers, setRevealedNumbers] = useState({}); // Track revealed phone numbers per order
  const [modalOrder, setModalOrder] = useState(null);
  const [modalOrderProducts, setModalOrderProducts] = useState([]);
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

  const handleStatusChange = async (orderId, newStatus) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => (o.status || 'pending') === statusFilter);

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Fetch product details for modal
  useEffect(() => {
    async function fetchProducts() {
      if (!modalOrder || !modalOrder.items) return setModalOrderProducts([]);
      // Get all product IDs in the order
      const ids = modalOrder.items.map(i => i.productId);
      // Fetch all product docs in parallel
      const proms = ids.map(id => getDoc(doc(db, 'products', id)));
      const snaps = await Promise.all(proms);
      setModalOrderProducts(snaps.map(s => s.exists() ? { id: s.id, ...s.data() } : null));
    }
    fetchProducts();
  }, [modalOrder]);

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
      {/* Filters */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          className={`px-3 py-1 rounded-full border text-[12px] font-light ${statusFilter==='all' ? 'bg-sky-600 text-white border-sky-600' : 'border-zinc-300 text-zinc-600'}`}
          onClick={()=>setStatusFilter('all')}
        >All</button>
        {ORDER_STATUSES.map(s => (
          <button
            key={s}
            className={`px-3 py-1 rounded-full border text-[12px] font-light ${statusFilter===s ? 'bg-sky-600 text-white border-sky-600' : 'border-zinc-300 text-zinc-600'}`}
            onClick={()=>setStatusFilter(s)}
          >{s.charAt(0).toUpperCase()+s.slice(1)}</button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-zinc-400 text-sm">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-zinc-500 font-extralight text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px]">No orders yet.</div>
        ) : (
          filteredOrders.map(o => {
            const items = o.items || [];
            const isExpanded = expandedOrders[o.id];
            const showSeeMore = items.length > 4;
            const visibleItems = isExpanded ? items : items.slice(0, 4);
            const phone = o.customerPhone || o.customer_phone || o.phone || '';
            const isRevealed = revealedNumbers[o.id];
            return (
              <div key={o.id} className="relative rounded-[10px] border border-gray-200 p-4 flex flex-col gap-2 cursor-pointer hover:bg-sky-50 transition" onClick={() => setModalOrder(o)}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-light text-[14px] sm:text-[15px] md:text-[18px] lg:text-[22px]">Order #{o.id.slice(0,6)}</div>
                    <div className="text-gray-500 text-[11px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-light">{o.createdAt?.toDate?.().toLocaleString?.()||''}</div>
                  </div>
                  <div className="text-[14px] sm:text-[15px] md:text-[18px] lg:text-[22px] font-medium">₦{Number(o.total).toLocaleString()}</div>
                </div>
                {/* Pharmacy view: show customer info, items, status, and actions */}
                {profile.role === 'pharmacy' && (
                  <div className="mt-2">
                    <div className="text-[13px] text-zinc-500 font-light mb-1 flex items-center gap-2">
                      Customer: {o.customerName || o.customerId || o.customer_id || 'N/A'}
                    </div>
                    <div className="text-[12px] text-zinc-400 font-light mb-2">{o.customerEmail || ''}</div>
                    <div className="text-[13px] text-zinc-700 font-medium mb-1">Items:</div>
                    <ul className="ml-2 list-disc text-[13px] text-zinc-700">
                      {visibleItems.map((item, idx) => (
                        <li key={idx}>
                          <span>{item.name || item.productId}</span>
                          <span> x{item.qty || item.quantity || 1}</span>
                        </li>
                      ))}
                    </ul>
                    {showSeeMore && (
                      <button
                        className="text-sky-600 text-xs mt-1 ml-2 font-medium hover:underline focus:outline-none"
                        onClick={() => toggleExpand(o.id)}
                      >
                        {isExpanded ? 'See less' : `See more (${items.length - 4} more)`}
                      </button>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[12px] text-zinc-500">Status:</span>
                      <select
                        className="border rounded px-2 py-1 text-[12px]"
                        value={o.status || 'pending'}
                        onChange={e => handleStatusChange(o.id, e.target.value)}
                      >
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                      {phone && !isRevealed && (
                        <button
                          className="ml-2 px-3 py-1 rounded-full bg-sky-600 text-white text-[12px] font-light"
                          onClick={() => setRevealedNumbers(prev => ({ ...prev, [o.id]: true }))}
                        >Reveal Number</button>
                      )}
                      {phone && isRevealed && (
                        <span className="ml-2 text-[13px] text-zinc-700 font-medium">{phone}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* Modal for order details */}
      <Modal open={!!modalOrder} onClose={() => setModalOrder(null)}>
        {modalOrder && (
          <div>
            <div className="text-lg font-medium mb-2">Order #{modalOrder.id.slice(0, 6)}</div>
            <div className="text-zinc-500 text-xs mb-4">{modalOrder.createdAt?.toDate?.().toLocaleString?.()||''}</div>
            <div className="mb-2 text-[15px] font-medium">Items:</div>
            <ul className="mb-4 space-y-2">
              {modalOrder.items.map((item, idx) => {
                const prod = modalOrderProducts[idx];
                return (
                  <li key={idx} className="flex items-center gap-3">
                    {prod && prod.image && <img src={prod.image} alt={prod.name} className="h-10 w-10 object-cover rounded-lg border" />}
                    <div className="flex-1">
                      <div className="font-poppins font-medium text-[14px]">{prod ? prod.name : item.productId}</div>
                      <div className="text-zinc-500 text-xs">Qty: {item.qty || item.quantity || 1}</div>
                    </div>
                    <div className="text-[14px] font-medium text-sky-600">₦{Number(item.price || prod?.price || 0).toLocaleString()}</div>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between items-center border-t pt-3 mt-2">
              <div className="text-[15px] font-medium">Total:</div>
              <div className="text-[15px] font-bold text-sky-700">₦{Number(modalOrder.total).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-xs text-zinc-400">Status: {modalOrder.status || 'pending'}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}