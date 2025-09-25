import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { removeFromCart, placeOrder } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@/icons/react/DeleteIcon";
import ProductAvatar from "@/components/ProductAvatar";

// Fixed Header Component
const FixedHeader = ({ title, itemCount }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex mt-8 items-center justify-between">
          <h1 className="text-[28px] sm:text-[35px] md:text-[42px] lg:text-[48px] font-light font-poppins">{title}</h1>
          
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "cart"));
    return onSnapshot(q, async (snap) => {
      const rows = await Promise.all(
        snap.docs.map(async (d) => {
          const item = d.data();
          const p = await getDoc(doc(db, "products", item.productId));
          return { id: d.id, ...item, product: { id: p.id, ...p.data() } };
        })
      );
      setItems(rows);
    });
  }, [user]);

  const total = useMemo(
    () => items.reduce((s, i) => s + (i.product?.price + 0.0 || 0) * i.qty, 0),
    [items]
  );

  const groupItems = () => {
    const map = new Map();
    for (const i of items) {
      const pid = i.product?.id;
      if (!pid) continue;
      if (map.has(pid)) {
        const existing = map.get(pid);
        map.set(pid, {
          ...existing,
          qty: existing.qty + i.qty,
          ids: [...(existing.ids || [existing.id]), i.id],
        });
      } else {
        map.set(pid, { ...i, ids: [i.id] });
      }
    }
    return Array.from(map.values());
  };

  const checkout = async () => {
    if (!user || !items.length) return;
    const first = items[0];
    const pharmacyId = first.product?.pharmacyId;
    const cartItems = groupItems();
    const orderStatus = await placeOrder({
      customerId: user.uid,
      pharmacyId,
      items: cartItems.map((i) => ({
        productId: i.productId,
        quantity: i.qty,
        price: i.product.price,
        pharmacyId: i.product.pharmacyId,
      })),
      total,
      email: user.email,
    });
    console.log(`OrderStatus: ${orderStatus}`);
    if (orderStatus === false) {
      alert("Payment Failed");
      return;
    }
    for (const i of items) await removeFromCart(user.uid, i.id);
    alert("Checkout successful");
  };

  // Harmonize duplicate items by productId
  const harmonizedItems = useMemo(() => {
    const map = new Map();
    for (const i of items) {
      const pid = i.product?.id;
      if (!pid) continue;
      if (map.has(pid)) {
        const existing = map.get(pid);
        map.set(pid, {
          ...existing,
          qty: existing.qty + i.qty,
          ids: [...(existing.ids || [existing.id]), i.id],
        });
      } else {
        map.set(pid, { ...i, ids: [i.id] });
      }
    }
    return Array.from(map.values());
  }, [items]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">
          Please sign in to continue
        </div>
        <button
          className="rounded-full bg-sky-600 text-white px-8 py-3 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate("/auth/landing")}
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  if (user && items.length === 0) {
    // Instead of a skeleton, show a lightweight empty state message
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-zinc-500 font-extralight text-[14px]">
          Your cart is empty.
        </div>
      </div>
    );
  }

  return (
    <>
      <FixedHeader title="Cart" itemCount={items.length} />
      <div className="pt-24 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen flex flex-col">
        <div className="mt-10 grid grid-cols-2 gap-3">
        {harmonizedItems.map((i, index) => (
          <div key={i.product?.id} className="relative rounded-xl border border-zinc-200 p-2 flex flex-col items-center gap-2 min-w-0 card-interactive animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
            {/* Remove icon button at top right */}
            <button
              onClick={() => i.ids.forEach(id => removeFromCart(user.uid, id))}
              className="absolute top-2 right-2 z-10 p-0.5 rounded-full hover:scale-110 transition-all duration-200 hover:bg-red-50 icon-interactive"
              aria-label="Remove"
            >
              <DeleteIcon className="w-5 h-5 text-red-500" />
            </button>
            <ProductAvatar
              name={i.product?.name}
              image={i.product?.image}
              category={i.product?.category}
              size={35}
              roundedClass="rounded-xl"
            />
            <div className="flex-1 w-full text-center">
              <div className="font-semibold text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] truncate">
                {i.product?.name}
              </div>
              <div className="text-zinc-500 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px]">
                ₦{Number(i.product?.price || 0).toLocaleString()}
              </div>
            </div>
            {/* Quantity selector */}
            <div className="flex items-center gap-2 mt-1">
              <button
                className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center text-[18px] font-light disabled:opacity-40 btn-interactive transition-all duration-200 hover:border-sky-500 hover:text-sky-600"
                onClick={async () => {
                  if (i.qty > 1) {
                    // Remove one instance (by id)
                    await removeFromCart(user.uid, i.ids[0]);
                  }
                }}
                disabled={i.qty <= 1}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="text-[13px] font-poppins w-6 text-center font-medium">{i.qty}</span>
              <button
                className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center text-[18px] font-light btn-interactive transition-all duration-200 hover:border-sky-500 hover:text-sky-600"
                onClick={async () => {
                  // Add one more of this product
                  if (i.product?.id) {
                    const { addToCart } = await import("@/lib/db");
                    await addToCart(user.uid, i.product.id, 1);
                  }
                }}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        ))}
        {harmonizedItems.length === 0 && (
          <div className="text-zinc-500 font-extralight text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] col-span-2">
            Your cart is empty.
          </div>
        )}
      </div>
      {harmonizedItems.length > 0 && (
        <div className="mt-6 rounded-xl border border-sky-400 p-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-[13px] sm:text-[15px] md:text-[18px] lg:text-[22px] font-regular">
            <span>Total</span>
            <span className="font-semibold text-[12px] sm:text-[15px]">
              ₦{Number(total).toLocaleString()}
            </span>
          </div>
          <button
            onClick={checkout}
            className="mt-4 w-full rounded-full border bg-sky-400 text-white py-2 text-[12px] sm:text-[14px] lg:text-[16px] font-light"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
      </div>
    </>
  );
}
