import { MapPin, Clock, Phone, ArrowLeft } from 'lucide-react';
import { addToCart } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import DirectionsIcon from '@/icons/react/DirectionsIcon';

export default function ProductDetail({ product, pharmacy }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!product) return null;
  return (
    <div className="min-h-screen bg-white/80 backdrop-blur-md">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 lg:px-12 xl:px-0">
        <div className="pt-6 sticky top-0 z-20 bg-white/80 backdrop-blur-md pb-2">
          <button onClick={() => navigate(-1)} className="w-[78px] h-[27px] font-poppins font-extralight tracking-tight text-[14px] md:text-[16px] flex items-center justify-center rounded-full bg-white border border-zinc-300">
            <ArrowLeft className="h-3 w-3 mr-1"/> Back
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center">
          <div className="relative w-full" style={{height: '260px', paddingBottom: '60px'}}>
            <div className="absolute inset-0 top-0 w-full h-full bg-white rounded-2xl border-zinc-100 flex items-center justify-center">
              <img src={product.image} alt={product.name} className="h-48 md:h-56 lg:h-64 object-contain mx-auto" />
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <div className="text-[19px] md:text-[24px] lg:text-[28px] font-poppins font-regular tracking-tighter leading-tight">{product.name}</div>
          <div className="text-[17px] md:text-[20px] lg:text-[24px] font-poppins font-light text-gray-400">₦{Number(product.price).toLocaleString()}</div>
        </div>
        <div className="mt-2 font-medium">
          <button onClick={() => navigate(`/vendor/${pharmacy?.id || product.pharmacyId}`)} className="text-sky-600 underline font-poppins text-[15px] md:text-[18px] lg:text-[22px] font-light">{pharmacy?.name}</button>
        </div>
        <div className="mt-1 flex items-center text-zinc-500 text-[13px] md:text-[15px] lg:text-[17px] font-poppins font-light">
          <div className="flex items-center gap-2 flex-1">
            <MapPin className="h-3 w-3"/> {pharmacy?.address}
          </div>
          {pharmacy?.address && (
            <div className="flex-shrink-0 ml-auto">
              <button
                className="flex items-center gap-1 text-sky-600 text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-light px-2 py-1 rounded-full hover:bg-sky-50 transition"
                onClick={() => {
                  const query = encodeURIComponent(pharmacy.address);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                }}
              >
                <DirectionsIcon className="h-3 w-3 text-sky-600" /> Get directions
              </button>
            </div>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-zinc-500 text-[13px] md:text-[15px] lg:text-[17px] font-poppins font-light"><Clock className="h-3 w-3"/> {pharmacy?.etaMins || 25} mins to {pharmacy?.name}</div>

        <div className="mt-5">
          <div className="text-[15px] md:text-[18px] lg:text-[22px] font-poppins font-regular tracking-tighter ">Product Description</div>
          <div className="mt-1" />
          <p className="text-zinc-600 leading-7 font-poppins text-[13px] md:text-[15px] lg:text-[17px] font-light">{product.description}</p>
          <div className="mb-20" />
        </div>

        <div className="h-5" />
      </div>
      <div className="fixed bottom-24 left-0 right-0 z-30">
        <div className="max-w-md mx-auto px-5">
          <div className="flex gap-3">
            <button onClick={()=> user? addToCart(user.uid, product.id, 1): alert('Please sign in')} className="flex-1 rounded-full bg-sky-600 text-white h-[30px] py-0 text-[11px] font-poppins font-light">Add to Cart</button>
            <a href={`tel:${pharmacy?.phone||''}`} className="flex-1 rounded-full border border-zinc-300 h-[30px] py-0 text-[11px] font-poppins font-light flex items-center justify-center gap-2 text-zinc-700 bg-white"><Phone className="h-3 w-3"/> Call to Order</a>
          </div>
        </div>
      </div>
    </div>
  );
}