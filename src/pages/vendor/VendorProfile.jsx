import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, MessageCircle } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { listenProducts } from '@/lib/db';
import { db } from '@/lib/firebase';

export default function VendorProfile() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchVendor() {
      const snap = await getDoc(doc(db, 'pharmacies', id));
      setVendor(snap.data());
    }
    fetchVendor();
    return listenProducts(setProducts, id);
  }, [id]);

  if (!vendor) return <div className="p-8 text-center">Loading vendor...</div>;

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto px-5 pt-10 pb-28">
      <div className="text-4xl font-bold text-sky-600 mb-2">{vendor.name}</div>
      <div className="text-zinc-500 mb-2">{vendor.email}</div>
      <div className="flex items-center gap-2 text-zinc-500 mb-2"><MapPin className="h-4 w-4"/> {vendor.address}</div>
      <div className="flex items-center gap-2 text-zinc-500 mb-2"><Clock className="h-4 w-4"/> {vendor.etaMins || 25} mins to {vendor.name}</div>
      <div className="flex items-center gap-2 text-zinc-500 mb-6"><Phone className="h-4 w-4"/> {vendor.phone}</div>
      <button
        onClick={() => navigate(`/messages?vendor=${id}`)}
        className="w-full rounded-full bg-sky-600 text-white py-4 text-lg font-semibold flex items-center justify-center gap-2 mb-8"
      >
        <MessageCircle className="h-5 w-5"/> Message Vendor
      </button>
      <div className="text-2xl font-semibold mb-4">Products by {vendor.name}</div>
      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="rounded-3xl border border-zinc-200 p-3 flex items-center gap-3">
            <img src={p.image} className="h-16 w-16 object-cover rounded-2xl"/>
            <div className="flex-1">
              <div className="font-semibold">{p.name}</div>
              <div className="text-zinc-500 text-sm">{p.category} • Stock: {p.stock} • SKU: {p.sku}</div>
            </div>
            <div className="text-lg font-semibold mr-2">₦{Number(p.price).toLocaleString()}</div>
          </div>
        ))}
        {products.length===0 && <div className="text-zinc-500">No products yet.</div>}
      </div>
    </div>
  );
}
