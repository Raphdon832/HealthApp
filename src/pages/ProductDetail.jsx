import { MapPin, Clock, Phone, ArrowLeft } from 'lucide-react';
import { addToCart } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import DirectionsIcon from '@/icons/react/DirectionsIcon';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function ProductDetail({ product, pharmacy }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!product) return <LoadingSkeleton lines={5} className="my-8" />;

  const price = Number(product.price || 0);

  // Optional: gate by auth, as in your original
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">Please sign in to continue</div>
        <button
          className="rounded-full bg-sky-600 text-white px-6 py-2 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate('/auth/landing')}
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page container */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 lg:px-12 xl:px-0">
        {/* Sticky back button */}
        <div className="pt-6 sticky top-0 z-20 bg-white/80 backdrop-blur-md pb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-[90px] h-[34px] font-poppins font-extralight tracking-tight text-[14px] flex items-center justify-center rounded-full bg-white border border-zinc-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
        </div>

        {/* Hero image */}
        <div className="mt-6 flex items-center justify-center">
          <div className="relative w-full" style={{ height: '260px' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="h-44 md:h-56 lg:h-64 object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grey details sheet */}
      <div className="mt-8 bg-gray-50 rounded-t-3xl border-t border-zinc-100 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 lg:px-12 xl:px-0 pt-6 pb-36">
          {/* Title & price */}
          <div className="flex items-start justify-between">
            <h1 className="text-[19px] leading-none font-poppins tracking-tighter">{product.name}</h1>
            <div className="text-[17px] font-poppins font-light text-zinc-500">₦{price.toLocaleString()}</div>
          </div>

          {/* Pharmacy link */}
          <div className="mt-1">
            <button
              onClick={() => navigate(`/vendor/${pharmacy?.id || product.pharmacyId}`)}
              className="text-sky-600 underline font-poppins text-[15px] font-light"
            >
              {pharmacy?.name}
            </button>
          </div>

          {/* Address + Directions */}
          <div className="mt-1 flex items-center text-zinc-600 text-[13px] font-poppins font-light gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{pharmacy?.address}</span>
            </div>
            {pharmacy?.address && (
              <button
                className="flex items-center gap-1.5 text-sky-600 text-[13px] font-poppins font-light px-2 py-1 rounded-full hover:bg-sky-50 transition flex-shrink-0"
                onClick={() => {
                  const query = encodeURIComponent(pharmacy.address);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                }}
              >
                <DirectionsIcon className="h-3 w-3 text-sky-600" /> Get Directions
              </button>
            )}
          </div>

          {/* ETA */}
          <div className="mt-0 flex items-center gap-2 text-zinc-600 text-[13px] font-poppins font-light">
            <Clock className="h-3 w-3" /> {pharmacy?.etaMins || 25} mins to {pharmacy?.name}
          </div>

          {/* Description */}
          <div className="mt-9">
            <div className="text-[15px] font-poppins tracking-tighter text-zinc-800">Product Description</div>
            <p className="mt-1 text-zinc-600 leading-7 font-poppins text-[14px] font-light">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA bar (floats above tab bar) */}
      <div className="fixed left-0 right-0 bottom-24 z-30">
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 lg:px-12 xl:px-0">
          <div className="flex gap-4">
            <button
              onClick={async () => {
                if (!user) return alert('Please sign in');
                if (!product.id) return alert('Product unavailable. Please try again.');
                try { await addToCart(user.uid, product.id, 1); } catch { alert('Failed to add to cart.'); }
              }}
              className="flex-1 h-[30px] rounded-full bg-sky-600 text-white text-[12px] font-poppins font-light shadow-sm active:scale-[0.99]"
            >
              Add to Cart
            </button>
            <a
              href={`tel:${pharmacy?.phone || ''}`}
              className="flex-1 h-[30px] rounded-full border border-zinc-400 text-[12px] font-poppins font-light flex items-center justify-center gap-2 text-zinc-800 bg-white active:scale-[0.99]"
            >
              <Phone className="h-3 w-3" /> Call to Order
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
