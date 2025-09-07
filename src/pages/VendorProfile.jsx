import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, MessageCircle, ArrowLeft } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { listenProducts, getOrCreateThread } from '@/lib/db'; // ⬅︎ use new helper
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';

export default function VendorProfile() {
  const { id } = useParams();                  // pharmacyId (vendorId)
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();         // need role to enforce “customer-only”

  useEffect(() => {
    async function fetchVendor() {
      const snap = await getDoc(doc(db, 'pharmacies', id));
      setVendor(snap.data());
    }
    fetchVendor();
    return listenProducts(setProducts, id);
  }, [id]);

  if (!vendor) return <div className="p-8 text-center">Loading vendor...</div>;

  const handleMessageVendor = async () => {
    // must be signed in
    if (!user || !user.uid) {
      navigate('/auth/landing');
      return;
    }
    // only customers can initiate
    if (profile?.role !== 'customer') {
      alert('Only customers can start a chat with a pharmacy.');
      return;
    }
    try {
      await getOrCreateThread({ vendorId: id, customerId: user.uid, role: 'customer' });
      // Go to Messages. (Optional: pass state to auto-open this vendor.)
      navigate('/messages');
      // navigate('/messages', { state: { openVendorId: id } });
    } catch (err) {
      console.error(err);
      alert('Could not start chat thread.');
    }
  };

  

  return (
    <div className="min-h-screen bg-white/80 backdrop-blur-md w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 pt-8 pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md pb-2 pt-4 -mx-4 sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0">
        <div className="text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none">Vendor<br/>Profile</div>
      </div>
      <button
        onClick={() => navigate(-1)}
        className="w-[78px] h-[27px] font-poppins font-extralight tracking-tight text-[14px] flex items-center justify-center rounded-full bg-white border border-zinc-300 mb-4"
      >
        <ArrowLeft className="h-3 w-3 mr-1" /> Back
      </button>

      <div className="text-[25px] font-poppins font-light tracking-tight mb-4">Vendor Profile</div>

      <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-5 mb-6 w-full flex flex-col items-start">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-2">
          <span className="text-[32px] font-poppins font-light text-sky-600">{vendor.name?.charAt(0)}</span>
        </div>
        <div className="text-[22px] font-poppins font-medium tracking-tight text-sky-600 mb-1">{vendor.name}</div>
        <div className="text-zinc-500 text-[13px] font-poppins font-light mb-1">{vendor.email}</div>
        <div className="flex items-center gap-2 text-zinc-500 text-[13px] font-poppins font-light mb-1">
          <MapPin className="h-3 w-3" /> {vendor.address}
        </div>
        <div className="flex items-center gap-2 text-zinc-500 text-[13px] font-poppins font-light mb-1">
          <Clock className="h-3 w-3" /> {vendor.etaMins || 25} mins to {vendor.name}
        </div>
        <div className="flex items-center gap-2 text-zinc-500 text-[13px] font-poppins font-light">
          <Phone className="h-3 w-3" /> {vendor.phone}
        </div>
      </div>

      <button
        onClick={handleMessageVendor}
        className="w-full rounded-full bg-sky-600 text-white h-[37px] text-[12px] font-poppins font-light flex items-center justify-center gap-2 mb-8"
      >
        <MessageCircle className="h-4 w-4" /> Message Vendor
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className="text-[17px] font-poppins font-medium">Products by {vendor.name}</div>
        {products.length > 3 && !showAll && (
          <button
            className="text-sky-600 text-[13px] font-poppins font-light px-3 py-1 rounded-full hover:bg-sky-50 transition"
            onClick={() => setShowAll(true)}
          >
            See more
          </button>
        )}
      </div>

      <div className="space-y-3">
        {(showAll ? products : products.slice(0, 3)).map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-zinc-200 p-3 flex items-center gap-3 bg-white shadow-sm cursor-pointer hover:bg-sky-50 transition"
            onClick={() => navigate(`/product/${p.id}`)}
          >
            <img src={p.image} className="h-16 w-16 object-cover rounded-2xl border border-zinc-100" />
            <div className="flex-1">
              <div className="font-poppins font-medium text-[15px] tracking-tight mb-1">{p.name}</div>
              <div className="text-zinc-500 text-[12px] font-poppins font-light">
                {p.category} • Stock: {p.stock} • SKU: {p.sku}
              </div>
            </div>
            <div className="text-[15px] font-poppins font-medium text-sky-600">₦{Number(p.price).toLocaleString()}</div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-zinc-500 text-[13px] font-poppins font-light">No products yet.</div>
        )}
      </div>

      {products.length > 3 && showAll && (
        <div className="flex justify-end mt-2">
          <button
            className="text-sky-600 text-[13px] font-poppins font-light px-3 py-1 rounded-full hover:bg-sky-50 transition"
            onClick={() => setShowAll(false)}
          >
            See less
          </button>
        </div>
      )}
    </div>
  );
}
