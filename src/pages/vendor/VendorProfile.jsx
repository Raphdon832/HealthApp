import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, MessageCircle, ArrowLeft } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { listenProducts, getOrCreateThread } from '@/lib/db';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';

export default function VendorProfile() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchVendor() {
      const snap = await getDoc(doc(db, 'pharmacies', id));
      setVendor(snap.data());
    }
    fetchVendor();
    return listenProducts(setProducts, id);
  }, [id]);

  const handleMessageVendor = async () => {
    if (!user) {
      alert('Please log in to message vendors.');
      return;
    }
    try {
      // Create or get existing thread with the vendor
      await getOrCreateThread({ vendorId: id, customerId: user.uid, role: 'customer' });
      // Navigate directly to the chat thread
      navigate(`/chat/${id}`);
    } catch (err) {
      console.error('Error starting chat thread:', err);
      alert('Could not start chat thread.');
    }
  };

  if (!vendor) return <div className="p-8 text-center">Loading vendor...</div>;

  return (
    <div className="min-h-screen bg-white w-full max-w-md mx-auto pb-28">
      {/* Fixed header with back button and vendor profile text */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium hover:bg-gray-100 active:scale-95 transition-all duration-150"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <div className="text-lg font-medium text-center text-gray-800">Vendor Profile</div>
        </div>
      </div>

      {/* Scrollable content with top padding to account for fixed header */}
      <div className="px-5 pt-20">
        <div className="text-4xl font-bold text-sky-600 mb-2">{vendor.name}</div>
        <div className="text-zinc-500 mb-2">{vendor.email}</div>
        <div className="flex items-center gap-2 text-zinc-500 mb-2"><MapPin className="h-4 w-4"/> {vendor.address}</div>
        <div className="flex items-center gap-2 text-zinc-500 mb-2"><Clock className="h-4 w-4"/> {vendor.etaMins || 25} mins to {vendor.name}</div>
        <div className="flex items-center gap-2 text-zinc-500 mb-6"><Phone className="h-4 w-4"/> {vendor.phone}</div>
        <button
          onClick={handleMessageVendor}
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
    </div>
  );
}
