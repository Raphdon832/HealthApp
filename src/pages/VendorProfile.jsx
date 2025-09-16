import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, MessageCircle, ArrowLeft } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { listenProducts, getOrCreateThread } from '@/lib/db'; // ⬅︎ use new helper
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function VendorProfile() {
  const { id } = useParams();                  // pharmacyId (vendorId)
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [showAll, setShowAll] = useState(false);
  // treat vertical (portrait) screens as mobile layout to avoid spillover on tall devices (e.g. iPad portrait)
  const [isPortrait, setIsPortrait] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(orientation: portrait)');
    const onChange = (e) => setIsPortrait(e.matches);
    setIsPortrait(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  const useMobileLayout = isPortrait;
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

  if (!vendor) return <LoadingSkeleton lines={4} className="my-8" />;

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

  // PDF report generation (table format)
  const handleDownloadReport = async () => {
    if (!vendor) return;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(18);
    doc.text('Pharmacy Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    // Vendor Info Table
    autoTable(doc, {
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Pharmacy', vendor.name || ''],
        ['Email', vendor.email || ''],
        ['Address', vendor.address || ''],
        ['Phone', vendor.phone || ''],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 144, 255] },
      styles: { fontSize: 11 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Products Table
    if (products.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Product Name', 'Category', 'Stock', 'SKU', 'Price']],
        body: products.map((p) => [
          p.name,
          p.category,
          p.stock,
          p.sku,
          `₦${Number(p.price).toLocaleString()}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 144, 255] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Orders Table (fetch orders for this vendor)
    let orders = [];
    try {
      // Example: fetch orders from Firestore (adjust as needed)
      // const q = query(collection(db, 'orders'), where('pharmacyId', '==', id));
      // const snap = await getDocs(q);
      // orders = snap.docs.map(doc => doc.data());
    } catch (e) {}
    if (orders.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Order ID', 'Customer', 'Status', 'Date', 'Products']],
        body: orders.map((order) => [
          order.id || '',
          order.customerName || '',
          order.status || '',
          order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '',
          (order.items || []).map(item => `${item.name} (x${item.quantity})`).join(', ')
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 144, 255] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      });
    }

    doc.save(`${vendor.name || 'pharmacy'}-report.pdf`);
  };

  // Small avatar component for products: shows image when valid, otherwise a letter avatar
  const ProductAvatar = ({ name, image }) => {
    const [errored, setErrored] = useState(false);
    const initial = name?.charAt(0)?.toUpperCase() || '?';
    if (!image || errored) {
      return (
        <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-100">
          <span className="text-[20px] font-poppins font-light text-sky-600">{initial}</span>
        </div>
      );
    }
    return (
      <img
        src={image}
        alt={name}
        className="h-16 w-16 object-cover rounded-2xl border border-zinc-100"
        onError={() => setErrored(true)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white/80 backdrop-blur-md w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 pt-8 pb-28">
      {/* Sticky header with back button and title */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md pb-2 pt-4 -mx-4 sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-[72px] h-[25px] font-poppins font-extralight tracking-tight text-[14px] flex items-center justify-center rounded-full bg-white border border-zinc-300 mr-1"
        >
          <ArrowLeft className="h-3 w-3 mr-0" /> Back
        </button>
        <div className="-ml-1 text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none">Vendor&nbsp;Profile</div>
      </div>

      {/* Central responsive area: on mobile stacked (vendor then products), on md+ grid with products (left) and vendor details + message (right) */}
      <div className="w-full mx-auto mt-6">
        <div className={`flex flex-col ${!useMobileLayout ? 'md:grid md:grid-cols-3' : ''} gap-6`}>

          {/* PRODUCTS: mobile order 2, md+ order 2 (right column spanning 2 cols) */}
          <div className={`order-2 ${!useMobileLayout ? 'md:order-2 md:col-span-2' : ''}`}>
            {/* Products header (moved out of scrollable area) - sticky and aligned with vendor aside on md+ */}
            <div className={`border border-zinc-200 rounded-2xl bg-white shadow-sm p-4 mb-4 flex items-center justify-between ${!useMobileLayout ? 'md:sticky md:top-20 md:bg-white/90 md:backdrop-blur-sm md:z-20' : ''}`}>
              <div>
                <div className="text-[18px] font-poppins font-medium">Products by<br/>{vendor.name}</div>
                <div className="text-zinc-500 text-[13px] font-poppins font-light">{products.length} items</div>
              </div>
              <div>
                {products.length > 3 && !showAll && (
                  <button
                    className="text-sky-600 text-[12px] font-poppins font-light px-3 py-1 rounded-full hover:bg-sky-50 transition"
                    onClick={() => setShowAll(true)}
                  >
                    See more
                  </button>
                )}

                {products.length > 3 && showAll && (
                  <button
                    className="text-sky-600 text-[13px] font-poppins font-light px-3 py-1 rounded-full hover:bg-sky-50 transition"
                    onClick={() => setShowAll(false)}
                  >
                    See less
                  </button>
                )}
              </div>
            </div>

            <div className={`${!useMobileLayout ? 'md:max-h-[calc(100vh-12rem)] md:overflow-y-auto md:pr-4' : ''}`}>
              <div className="space-y-3 px-0">
                {(showAll ? products : products.slice(0, 3)).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-zinc-200 p-3 flex items-center gap-3 bg-white shadow-sm cursor-pointer hover:bg-sky-50 transition overflow-hidden"
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="flex-shrink-0">
                      <ProductAvatar name={p.name} image={p.image} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-poppins font-medium text-[15px] tracking-tight mb-1 truncate" title={p.name}>{p.name}</div>
                      <div className="text-zinc-500 text-[12px] font-poppins font-light truncate" title={`${p.category} • Stock: ${p.stock} • SKU: ${p.sku}`}>
                        {p.category} • Stock: {p.stock} • SKU: {p.sku}
                      </div>
                    </div>
                    <div className="text-[15px] font-poppins font-medium text-sky-600 ml-3 flex-shrink-0">₦{Number(p.price).toLocaleString()}</div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="text-zinc-500 text-[13px] font-poppins font-light">No products yet.</div>
                )}

                
              </div>
            </div>
          </div>

          {/* VENDOR DETAILS + MESSAGE: mobile order 1 (shown above products), md+ order 1 (left column) */}
          <aside className={`order-1 ${!useMobileLayout ? 'md:order-1 md:col-span-1 md:self-start md:sticky md:top-20' : ''}`}>
            <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-5 mb-4 w-full flex flex-col items-start">
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

            {/* Message button: visible on all screens inside the aside so mobile shows it under vendor details and md+ keeps it on the right */}
            <div className="w-full mb-4">
              <button
                onClick={handleMessageVendor}
                className="w-full rounded-full bg-sky-600 text-white h-[37px] text-[12px] font-poppins font-light flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" /> Message Vendor
              </button>
            </div>
          </aside>

        </div>
      </div>

    </div>
  );
}
