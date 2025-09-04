import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { removeFromCart, placeOrder } from '@/lib/db';
import { useAuth } from '@/lib/auth';

export default function Cart() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'cart'));
    return onSnapshot(q, async (snap) => {
      const rows = await Promise.all(snap.docs.map(async d => {
        const item = d.data();
        const p = await getDoc(doc(db, 'products', item.productId));
        return { id: d.id, ...item, product: { id: p.id, ...p.data() } };
      }));
      setItems(rows);
    });
  }, [user]);

  const total = useMemo(() => items.reduce((s, i) => s + (i.product?.price||0) * i.qty, 0), [items]);

  const checkout = async () => {
    if (!user || !items.length) return;
    const first = items[0];
    const pharmacyId = first.product.pharmacyId; // simple single‑vendor demo
    await placeOrder({ customerId: user.uid, pharmacyId, items: items.map(i=>({ productId: i.productId, qty: i.qty })), total });
    for (const i of items) await removeFromCart(user.uid, i.id);
    alert('Checkout successful');
  };

  return (
    <div className="pt-10 pb-28 max-w-md mx-auto px-5">
      <div className="text-[35px] font-light font-poppins">Cart</div>
      <div className="mt-6 space-y-4">
        {items.map((i) => (
          <div key={i.id} className="rounded-[15px] border border-zinc-200 p-3 flex items-center gap-3">
            <img src={i.product?.image} className="h-16 w-16 object-cover rounded-2xl"/>
            <div className="flex-1">
              <div className="font-semibold text-[14px]">{i.product?.name}</div>
              <div className="text-zinc-500 text-[12px]">₦{Number(i.product?.price||0).toLocaleString()}</div>
            </div>
            <button onClick={()=>removeFromCart(user.uid, i.id)} className="rounded-xl border p-2 text-[#fd9292] text-[10px]">Remove</button>
          </div>
        ))}
        {items.length===0 && <div className="text-zinc-500 font-extralight text-[14px]">Your cart is empty.</div>}
      </div>
      {items.length>0 && (
        <div className="mt-6 rounded-[15px] border border-sky-400 p-4">
          <div className="flex items-center justify-between text-[15px] font-regular">
            <span>Total</span>
            <span className="font-semibold text[13px]">₦{Number(total).toLocaleString()}</span>
          </div>
          <button onClick={checkout} className="mt-4 w-full rounded-full border bg-sky-400 text-white py-2 text-[10px] font-light">Proceed to Checkout</button>
        </div>
      )}
    </div>
  );
}